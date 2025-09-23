'use client';

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useClerk, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import {
  MessageCircle,
  Phone,
  BarChart3,
  Shield,
  Users,
  Star,
  CheckCircle,
  ArrowRight,
  Zap,
  Lock,
  TrendingUp,
  Award,
} from "lucide-react"

export default function HomePage() {
  const { openSignIn } = useClerk()
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const handleSignIn = () => {
    if (isSignedIn) {
      // If already signed in, redirect to dashboard
      router.push('/dashboard')
    } else {
      // Open sign-in popup with redirect to dashboard
      openSignIn({
        forceRedirectUrl: '/dashboard',
        signUpForceRedirectUrl: '/dashboard',
        fallbackRedirectUrl: '/dashboard',
        signUpFallbackRedirectUrl: '/dashboard',
      })
    }
  }

  const handleStartTrial = () => {
    if (isSignedIn) {
      // If already signed in, redirect to dashboard
      router.push('/dashboard')
    } else {
      // Open sign-in popup with redirect to dashboard
      openSignIn({
        forceRedirectUrl: '/dashboard',
        signUpForceRedirectUrl: '/dashboard',
        fallbackRedirectUrl: '/dashboard',
        signUpFallbackRedirectUrl: '/dashboard',
      })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">Fin.<span className="text-green-600">AI</span></span>
          </div>
          <div className="flex items-center space-x-8">
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-green-600 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-green-600 transition-colors">
                Pricing
              </a>
              <a href="#reviews" className="text-gray-600 hover:text-green-600 transition-colors">
                Reviews
              </a>
              <a href="#faq" className="text-gray-600 hover:text-green-600 transition-colors">
                FAQ
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              {!isSignedIn && (
                <Button 
                  variant="ghost" 
                  className="text-gray-700 hover:text-green-600"
                  onClick={handleSignIn}
                >
                  Sign In
                </Button>
              )}
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleStartTrial}
              >
                {isSignedIn ? 'Go to Dashboard' : 'Start Free Trial'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <Users className="w-4 h-4 mr-2" />
            Trusted by 50,000+ users worldwide
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            Transform Your Financial Future with <span className="text-green-600">AI-Powered Insights</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto text-pretty">
            Chat or call with our AI to make smarter financial decisions. Get instant answers to complex financial
            questions from investment planning to mortgage advice.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
              onClick={handleStartTrial}
            >
              {isSignedIn ? 'Go to Dashboard' : 'Start Free Trial'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              Bank-level Security
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600" />
              Privacy-first Approach
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-green-600" />
              SEC Compliant
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">$2.3B+</div>
              <div className="text-sm text-gray-600">Assets Analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">50K+</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
              <div className="text-sm text-gray-600">Satisfaction Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600">AI Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">AI-Powered Financial Intelligence</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of financial planning with our advanced AI technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 transition-all duration-300 bg-white group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-600 transition-colors">
                  <MessageCircle className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Chat Interface</h3>
                <p className="text-gray-600 mb-6">
                  Ask complex financial questions in plain English and get instant, personalized answers from our AI.
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Natural language processing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Context-aware responses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Multi-language support
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 transition-all duration-300 bg-white group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-600 transition-colors">
                  <Phone className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Voice AI Integration</h3>
                <p className="text-gray-600 mb-6">
                  Call for instant financial consultations anytime, anywhere with our voice-enabled AI assistant.
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Voice recognition technology
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Real-time conversations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Call recording & transcripts
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 transition-all duration-300 bg-white group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-600 transition-colors">
                  <BarChart3 className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Personalized Insights</h3>
                <p className="text-gray-600 mb-6">
                  Get personalized recommendations based on your real financial data and goals.
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Real-time portfolio analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Risk assessment tools
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Goal tracking & alerts
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in minutes with our simple process</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Connect Securely",
                desc: "Link your financial accounts with bank-level encryption",
                icon: <Shield className="w-6 h-6" />,
              },
              {
                step: "2",
                title: "Ask Questions",
                desc: "Chat or call with any financial question",
                icon: <MessageCircle className="w-6 h-6" />,
              },
              {
                step: "3",
                title: "AI Analysis",
                desc: "Our AI processes your data in real-time",
                icon: <Zap className="w-6 h-6" />,
              },
              {
                step: "4",
                title: "Get Insights",
                desc: "Receive personalized recommendations instantly",
                icon: <TrendingUp className="w-6 h-6" />,
              },
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-green-200 -translate-x-1/2 z-0"></div>
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your financial goals</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-200 hover:border-green-300 transition-colors">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">Free</div>
                  <p className="text-gray-600 text-sm">Perfect for getting started</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">5 AI consultations/month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Basic portfolio analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Email support</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-transparent" 
                  variant="outline"
                  onClick={handleStartTrial}
                >
                  {isSignedIn ? 'Go to Dashboard' : 'Get Started Free'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500 relative shadow-xl">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-600 text-white">Most Popular</Badge>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Professional</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    $29<span className="text-lg text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600 text-sm">For serious investors</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Unlimited AI consultations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Advanced portfolio analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Voice AI consultations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleStartTrial}
                >
                  {isSignedIn ? 'Go to Dashboard' : 'Start Free Trial'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-green-300 transition-colors">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    $99<span className="text-lg text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600 text-sm">For financial professionals</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Everything in Professional</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">White-label solutions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">API access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Dedicated support</span>
                  </li>
                </ul>
                <Button className="w-full bg-transparent" variant="outline">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed Reviews Section */}
      <section id="reviews" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600">Real stories from people who transformed their finances</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-gray-600 ml-2">4.9/5 from 2,847 reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "First-time Home Buyer",
                location: "Austin, TX",
                content:
                  "FinAI helped me understand mortgage options and saved me $15,000 on my home purchase. The voice consultations were incredibly helpful when I was stressed about the process!",
                rating: 5,
                savings: "$15,000 saved",
              },
              {
                name: "Michael Chen",
                role: "Investment Portfolio Manager",
                location: "San Francisco, CA",
                content:
                  "The personalized investment insights have improved my portfolio performance by 23%. The AI understands complex financial scenarios better than most human advisors I've worked with.",
                rating: 5,
                savings: "23% portfolio growth",
              },
              {
                name: "Emily Rodriguez",
                role: "Small Business Owner",
                location: "Miami, FL",
                content:
                  "From tax planning to cash flow management, FinAI has become my go-to financial advisor. It's like having a CFO available 24/7 for a fraction of the cost.",
                rating: 5,
                savings: "40 hours/month saved",
              },
              {
                name: "David Kim",
                role: "Retirement Planner",
                location: "Seattle, WA",
                content:
                  "I was behind on retirement savings at 45. FinAI created a personalized catch-up strategy that put me back on track. The peace of mind is invaluable.",
                rating: 5,
                savings: "Retirement secured",
              },
              {
                name: "Lisa Thompson",
                role: "College Parent",
                location: "Boston, MA",
                content:
                  "Planning for my daughter's college expenses seemed impossible. FinAI showed me investment strategies that will cover her full tuition. Amazing!",
                rating: 5,
                savings: "$120,000 college fund",
              },
              {
                name: "Robert Martinez",
                role: "Debt Consolidation",
                location: "Phoenix, AZ",
                content:
                  "I had $45K in credit card debt. FinAI's debt consolidation strategy helped me pay it off 3 years early and save thousands in interest.",
                rating: 5,
                savings: "$12,000 interest saved",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="border-0 bg-white hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">
                      {testimonial.savings}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-4 italic text-sm leading-relaxed">&quot;{testimonial.content}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
                      <div className="text-xs text-gray-500">{testimonial.role}</div>
                      <div className="text-xs text-gray-400">{testimonial.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about FinAI</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border border-gray-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                How secure is my financial data?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 text-sm leading-relaxed pt-2">
                We use bank-level 256-bit encryption and are SOC 2 Type II certified. Your data is never stored
                permanently and all connections use read-only access. We are also SEC compliant and regularly audited by
                third-party security firms.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-gray-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                What types of financial questions can the AI answer?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 text-sm leading-relaxed pt-2">
                Our AI can help with investment planning, retirement strategies, mortgage advice, debt consolidation,
                tax optimization, insurance planning, budgeting, and more. It is trained on comprehensive financial data
                and regulations.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-gray-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                How accurate are the AI recommendations?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 text-sm leading-relaxed pt-2">
                Our AI has a 94% accuracy rate in financial projections and recommendations. However, we always
                recommend consulting with a human financial advisor for major financial decisions. The AI serves as a
                powerful tool to inform your decisions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-gray-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                Can I cancel my subscription anytime?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 text-sm leading-relaxed pt-2">
                Yes, you can cancel your subscription at any time with no cancellation fees. Your access will continue
                until the end of your current billing period, and you can always restart your subscription later.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-gray-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                Do you support international users?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 text-sm leading-relaxed pt-2">
                Currently, we support users in the US, Canada, UK, and Australia. We are working on expanding to more
                countries. Our AI can handle multiple currencies and international investment products.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border border-gray-200 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                How does the voice AI feature work?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 text-sm leading-relaxed pt-2">
                You can call our dedicated number anytime to speak with our AI. The conversation is transcribed in
                real-time, and ll receive a summary via email. Voice calls are included in Professional and
                Enterprise plans.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Financial Future?</h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join 50,000+ users who are making smarter financial decisions with AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg"
              onClick={handleStartTrial}
            >
              {isSignedIn ? 'Go to Dashboard' : 'Start Free Trial'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg bg-transparent"
            >
              Schedule Demo
            </Button>
          </div>
          <p className="text-green-100 text-sm">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xl font-bold text-gray-100">Fin.<span className="text-green-600">AI</span></span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                AI-powered financial insights for smarter decisions. Transform your financial future with personalized
                recommendations.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  SOC 2 Certified
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  SEC Compliant
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; 2024 FinAI. All rights reserved.</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <span>Made with ❤️ for better financial futures</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}