"use client";

import React from "react"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { loginAction } from "./actions";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await loginAction(email, password);
      
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Redirect on successful login
      router.push("/");
      router.refresh();
    } catch (error) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative hidden overflow-hidden bg-sidebar lg:block">
        <Image
          src="/placeholder-logo.png"
          alt="First Pack brand"
          fill
          priority
          sizes="55vw"
          className="object-contain p-16  opacity-100"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sidebar via-sidebar/70 to-transparent p-10 text-sidebar-foreground">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-lg bg-white p-3">
            <Image
              src="/fpIcon.png"
              alt="First Pack icon"
              width={72}
              height={72}
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="max-w-xl text-4xl font-bold">First Pack Asset Management</h1>
          <p className="mt-3 max-w-lg text-sm text-sidebar-foreground/80">
            Asset control for all FP branches.
          </p>
        </div>
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Image
              src="/fpIcon.png"
              alt="First Pack"
              width={56}
              height={56}
              className="h-12 w-12 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            First Pack Asset Management
          </h1>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@firstpack.co.zw"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {"Don't have an account? "}
              </span>
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Request access
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to First Pack{"'"}s terms and conditions.
        </p>
      </div>
      </div>
    </div>
  );
}
