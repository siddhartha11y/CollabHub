"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Users, Mail, Chrome, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginMode, setLoginMode] = useState<"password" | "magic">("password")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const email = watch("email")

  const onPasswordLogin = async (data: LoginForm) => {
    setIsLoading(true)
    
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: "/dashboard"
      })
      
      if (result?.error) {
        setError("root", { message: "Invalid email or password" })
      } else if (result?.ok) {
        router.push("/dashboard")
      }
    } catch (error) {
      setError("root", { message: "Something went wrong. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLinkSignIn = async () => {
    if (!email) {
      setError("email", { message: "Email is required" })
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await signIn("email", { 
        email, 
        redirect: false,
        callbackUrl: "/dashboard" 
      })
      
      if (result?.ok) {
        setEmailSent(true)
      }
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch (error) {
      console.error("Google sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent a magic link to {email}. Click the link to sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setEmailSent(false)}
            >
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">CollabHub</span>
          </Link>
          <ThemeToggle />
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue collaborating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Chrome className="h-4 w-4 mr-2" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Login Mode Toggle */}
            <div className="flex rounded-lg bg-muted p-1">
              <button
                type="button"
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  loginMode === "password"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setLoginMode("password")}
              >
                Password
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  loginMode === "magic"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setLoginMode("magic")}
              >
                Magic Link
              </button>
            </div>

            {loginMode === "password" ? (
              /* Password Login Form */
              <form onSubmit={handleSubmit(onPasswordLogin)} className="space-y-4">
                <div>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="Email address"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="relative">
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                  )}
                </div>

                {errors.root && (
                  <p className="text-sm text-red-600">{errors.root.message}</p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>

                <div className="text-center">
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </form>
            ) : (
              /* Magic Link Form */
              <div className="space-y-4">
                <div>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>
                <Button 
                  type="button" 
                  className="w-full" 
                  disabled={isLoading || !email}
                  onClick={handleMagicLinkSignIn}
                >
                  {isLoading ? "Sending..." : "Send magic link"}
                </Button>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/register" className="text-blue-600 hover:underline">
                  Create account
                </Link>
              </p>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}