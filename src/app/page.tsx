"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Mail,
  BarChart3,
  Zap,
  Shield,
  Users,
  ArrowRight,
  Check,
  Star,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Lead Discovery",
    description: "Find verified business emails from any company domain. Multi-provider enrichment for maximum coverage.",
  },
  {
    icon: Mail,
    title: "Smart Sequences",
    description: "Build automated email sequences with personalization. Auto-pause on reply detection.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track opens, clicks, and replies. Know exactly what's working and optimize your outreach.",
  },
  {
    icon: Shield,
    title: "Email Verification",
    description: "Verify emails before sending. Reduce bounces and protect your sender reputation.",
  },
  {
    icon: Zap,
    title: "AI-Powered",
    description: "Let AI write your cold emails. Generate personalized messages that convert.",
  },
  {
    icon: Users,
    title: "Team Ready",
    description: "Collaborate with your team. Share templates, contacts, and campaigns.",
  },
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: ["100 contacts", "200 emails/month", "50 enrichments", "Basic analytics"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    description: "For solo founders",
    features: ["1,000 contacts", "3,000 emails/month", "500 enrichments", "Email sequences", "Priority support"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Growth",
    price: "$49",
    period: "/month",
    description: "For growing teams",
    features: ["10,000 contacts", "15,000 emails/month", "2,000 enrichments", "3 team seats", "API access", "Custom domain"],
    cta: "Start Free Trial",
    popular: false,
  },
];

const testimonials = [
  {
    quote: "LaunchPilot helped us book 47 meetings in our first month. The ROI is insane.",
    author: "Sarah Chen",
    role: "Founder, TechStartup",
    avatar: "SC",
  },
  {
    quote: "Finally, an outreach tool that doesn't cost $200/month. Perfect for bootstrapped founders.",
    author: "Mike Johnson",
    role: "Solo Founder",
    avatar: "MJ",
  },
  {
    quote: "The email verification saved us from destroying our domain reputation. Worth every penny.",
    author: "Priya Sharma",
    role: "Head of Growth, SaaS Co",
    avatar: "PS",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">LaunchPilot</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-slate-600 hover:text-slate-900">Features</Link>
            <Link href="#pricing" className="text-sm text-slate-600 hover:text-slate-900">Pricing</Link>
            <Link href="#testimonials" className="text-sm text-slate-600 hover:text-slate-900">Testimonials</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-4">
          <Sparkles className="h-3 w-3 mr-1" />
          Now with AI-powered email writing
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
          Find leads. Verify emails.
          <br />Close deals.
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
          The all-in-one lead generation and outreach platform for startups. 
          Find verified emails, build sequences, and track results — all for less than your coffee budget.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline">
            Watch Demo
          </Button>
        </div>
        <p className="text-sm text-slate-500 mt-4">
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </section>

      {/* Social Proof */}
      <section className="border-y bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-slate-500 mb-6">Trusted by 500+ startups and growing teams</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {["YC Startups", "Indie Hackers", "ProductHunt #1", "500+ Users"].map((text) => (
              <span key={text} className="text-lg font-semibold text-slate-400">{text}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to close more deals</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Stop juggling multiple tools. LaunchPilot combines lead finding, verification, outreach, and analytics in one simple platform.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="border-slate-200 hover:border-slate-300 transition-colors">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mb-2">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              No hidden fees. No enterprise sales calls. Just pick a plan and start closing deals.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative ${plan.popular ? 'border-blue-600 shadow-lg scale-105' : 'border-slate-200'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-slate-500">{plan.period}</span>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup">
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Testimonials</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by founders worldwide</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.author} className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-medium text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{testimonial.author}</p>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to supercharge your outreach?
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-8">
            Join 500+ startups using LaunchPilot to find leads and close deals faster.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="gap-2">
              Start Your Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">LaunchPilot</span>
              </div>
              <p className="text-sm text-slate-500">
                The affordable lead generation platform for startups.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#pricing">Pricing</Link></li>
                <li><Link href="/changelog">Changelog</Link></li>
                <li><Link href="/roadmap">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/docs">Documentation</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/templates">Email Templates</Link></li>
                <li><Link href="/api">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-slate-500">
            © 2026 LaunchPilot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
