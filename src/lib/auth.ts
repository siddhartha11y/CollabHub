import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  // Temporarily disable Prisma adapter to fix Google OAuth
  // adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
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
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
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
    async signIn({ user, account, profile }) {
      try {
        if (!user.email) return false

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          // Create new user
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "",
              image: user.image || null,
              emailVerified: new Date(),
            },
          })
        } else {
          // Update existing user's name and image if they changed
          await prisma.user.update({
            where: { email: user.email },
            data: {
              name: user.name || existingUser.name,
              image: user.image || existingUser.image,
            },
          })
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
          session.user.image = token.picture as string | null
        }
        return session
      } catch (error) {
        console.error("Session callback error:", error)
        return session
      }
    },
    async jwt({ token, user, account }) {
      try {
        // Initial sign in
        if (user) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          })

          if (dbUser) {
            return {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              picture: dbUser.image,
            }
          }
        }

        // Return previous token if user is not available
        if (!token.email) return token

        const dbUser = await prisma.user.findFirst({
          where: {
            email: token.email,
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        })

        if (!dbUser) {
          return token
        }

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          picture: dbUser.image,
        }
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