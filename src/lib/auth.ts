import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { generateUsernameFromEmail } from "@/lib/username"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        secure: false,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        autoLogin: { label: "Auto Login", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        // BETTER ERROR HANDLING: Different messages for different scenarios
        if (!user) {
          throw new Error("No account found with this email address. Please register first or check your email.")
        }

        // STRICT EMAIL VERIFICATION CHECK
        if (!user.emailVerified) {
          throw new Error("Please verify your email before signing in. Check your inbox for the verification link.")
        }

        // Handle auto-login (from email verification)
        if (credentials.autoLogin === "true") {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        }

        // Handle regular password login
        if (!credentials.password || !user.password) {
          throw new Error("Password is required for this account.")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error("Invalid password. Please check your password and try again.")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async signIn({ user, account, profile }) {
      try {
        if (!user.email) return false

        // ONLY auto-create users for OAuth providers (Google, etc.)
        // DO NOT auto-create for credentials provider
        if (account?.provider === "credentials") {
          // For credentials login, user MUST already exist
          // This is handled in the credentials authorize function
          return true
        }

        // Check if user exists (for OAuth providers only)
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          // Generate username from email
          const username = await generateUsernameFromEmail(user.email)
          
          // Create new user - ONLY for OAuth providers (Google, etc.)
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "",
              username: username,
              image: user.image || null,
              emailVerified: new Date(), // OAuth users are auto-verified
            },
          })
        } else {
          // EXISTING USER: DO NOT overwrite their profile data
          // Only update if they have NO name or NO image (empty profile)
          const updateData: any = {}
          
          if (!existingUser.name || existingUser.name.trim() === "") {
            updateData.name = user.name
          }
          
          if (!existingUser.image || existingUser.image.trim() === "") {
            updateData.image = user.image
          }
          
          // Only update if there's something to update
          if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
              where: { email: user.email },
              data: updateData,
            })
          }
        }

        // Handle account linking for OAuth providers
        if (account && account.provider !== "credentials") {
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          })

          if (!existingAccount) {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email },
            })

            if (dbUser) {
              await prisma.account.create({
                data: {
                  userId: dbUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              })
            }
          }
        }

        return true
      } catch (error) {
        console.error("SignIn callback error:", error)
        return false
      }
    },
    async session({ token, session }) {
      try {
        if (token) {
          session.user.id = token.id as string
          session.user.name = token.name as string | null
          session.user.email = token.email as string | null
          // Don't include image in session - fetch it separately when needed
        }
        return session
      } catch (error) {
        console.error("Session callback error:", error)
        return session
      }
    },
    async jwt({ token, user, trigger }) {
      try {
        // Initial sign in - get MINIMAL data only
        if (user) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: {
              id: true,
              name: true,
              email: true,
            },
          })

          if (dbUser) {
            return {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              // Remove image from JWT to reduce size
            }
          }
        }

        // Only refresh on update trigger
        if (trigger === "update" && token.email) {
          const dbUser = await prisma.user.findFirst({
            where: {
              email: token.email,
            },
            select: {
              id: true,
              name: true,
              email: true,
            },
          })

          if (dbUser) {
            return {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
            }
          }
        }

        return token
      } catch (error) {
        console.error("JWT callback error:", error)
        return token
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
  
  // Fix for production deployment
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, metadata) {
      console.error("NextAuth Error:", code, metadata)
    },
    warn(code) {
      console.warn("NextAuth Warning:", code)
    },
    debug(code, metadata) {
      console.log("NextAuth Debug:", code, metadata)
    },
  },
}