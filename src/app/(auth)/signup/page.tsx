"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const benefits = [
  "100 free contacts",
  "200 emails per month",
  "50 email enrichments",
  "No credit card required",
];

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("Please agree to the terms of service");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/onboarding");
    }
  };

  const handleGoogleSignup = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left side - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">LaunchPilot</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Start closing more deals today
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Join 500+ startups using LaunchPilot to find leads and grow their business.
          </p>
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-white">
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-none lg:shadow lg:border">
          <CardHeader className="text-center">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">LaunchPilot</span>
            </div>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Start your 14-day free trial</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full mb-4" onClick={handleGoogleSignup}>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-slate-500">
                or sign up with email
              </span>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="8+ characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <div className="flex items-start gap-2">
                <Checkbox 
                  id="terms" 
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm text-slate-600 leading-tight">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                </Label>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-600 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
