import React, { useState, useEffect } from 'react';
import { Shield, Code, Zap, CheckCircle, ArrowRight, Github, Twitter, Mail, Star, Users, Clock, Award, TrendingUp, FileText, AlertTriangle, Eye, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { number: '50,000+', label: 'Contracts Audited', icon: FileText },
    { number: '99.9%', label: 'Accuracy Rate', icon: Award },
    { number: '2.5M+', label: 'Vulnerabilities Found', icon: AlertTriangle },
    { number: '15 sec', label: 'Average Audit Time', icon: Clock }
  ];

  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'Lead Developer at DeFiProtocol',
      content: 'SmartAudit AI caught critical vulnerabilities that our team missed. Saved us from a potential $2M exploit.',
      rating: 5
    },
    {
      name: 'Sarah Martinez',
      role: 'Security Engineer at BlockChain Inc',
      content: 'The most comprehensive audit tool I\'ve used. The AI explanations are incredibly detailed and actionable.',
      rating: 5
    },
    {
      name: 'David Kim',
      role: 'Founder of CryptoStartup',
      content: 'From deployment to audit in under a minute. This tool is a game-changer for rapid development cycles.',
      rating: 5
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Advanced Threat Detection',
      description: 'AI-powered analysis identifies complex vulnerabilities, reentrancy attacks, and business logic flaws that traditional tools miss.',
      color: 'blue'
    },
    {
      icon: Zap,
      title: 'Lightning Fast Results',
      description: 'Get comprehensive audit reports in seconds, not weeks. Perfect for CI/CD integration and rapid development.',
      color: 'purple'
    },
    {
      icon: Code,
      title: 'Multi-Chain Support',
      description: 'Supports Ethereum, Polygon, BSC, Solana, and 15+ other blockchains. One tool for all your audit needs.',
      color: 'green'
    },
    {
      icon: TrendingUp,
      title: 'Continuous Learning',
      description: 'Our AI model is trained on the latest exploit patterns and security research, staying ahead of emerging threats.',
      color: 'orange'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share audit reports, track remediation progress, and collaborate with your team in real-time.',
      color: 'pink'
    },
    {
      icon: Eye,
      title: 'Detailed Insights',
      description: 'Get proof-of-concept exploits, gas optimization tips, and best practice recommendations with every audit.',
      color: 'indigo'
    }
  ];

  const colorClasses = {
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600', hover: 'group-hover:bg-blue-200' },
    purple: { bg: 'bg-purple-100', icon: 'text-purple-600', hover: 'group-hover:bg-purple-200' },
    green: { bg: 'bg-green-100', icon: 'text-green-600', hover: 'group-hover:bg-green-200' },
    orange: { bg: 'bg-orange-100', icon: 'text-orange-600', hover: 'group-hover:bg-orange-200' },
    pink: { bg: 'bg-pink-100', icon: 'text-pink-600', hover: 'group-hover:bg-pink-200' },
    indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600', hover: 'group-hover:bg-indigo-200' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              SmartAudit AI
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <button className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Pricing
            </button>
            <button className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Documentation
            </button>
            <Link
              to="/auth"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/auth"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className={`max-w-6xl mx-auto text-center relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Trust Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium mb-8 border border-blue-200/50 shadow-sm">
            <Award className="h-4 w-4 mr-2" />
            Trusted by 10,000+ developers worldwide
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Secure Your Smart Contracts with
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block mt-2">
              AI-Powered Precision
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Get enterprise-grade security audits in seconds. Our advanced AI detects vulnerabilities, 
            provides detailed remediation, and helps you ship secure code faster than ever.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <Link
              to="/auth"
              className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-bold text-lg flex items-center shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
            >
              Start Free Audit
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="group flex items-center text-gray-700 hover:text-gray-900 px-10 py-5 rounded-2xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 font-bold text-lg bg-white/50 backdrop-blur-sm">
              <Play className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 group-hover:border-blue-200">
                  <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Top Teams Choose
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> SmartAudit AI</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Advanced AI technology meets enterprise-grade security expertise to deliver unmatched audit quality
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 rounded-3xl border border-gray-200 hover:border-blue-200 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-gray-50/50 hover:from-white hover:to-blue-50/30">
                <div className={`${colorClasses[feature.color].bg} ${colorClasses[feature.color].hover} p-4 rounded-2xl w-fit mb-6 transition-colors shadow-lg`}>
                  <feature.icon className={`h-8 w-8 ${colorClasses[feature.color].icon}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-900 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-24 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Loved by Developers
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Worldwide</span>
            </h2>
            <p className="text-xl text-gray-600">See what security experts are saying about SmartAudit AI</p>
          </div>

          <div className="relative">
            <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-200/50 text-center max-w-4xl mx-auto">
              <div className="flex justify-center mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-2xl text-gray-700 mb-8 leading-relaxed italic">
                "{testimonials[currentTestimonial].content}"
              </blockquote>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {testimonials[currentTestimonial].name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900 text-lg">{testimonials[currentTestimonial].name}</div>
                  <div className="text-gray-600">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </div>

            {/* Testimonial Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'bg-blue-600 w-8' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Ready to Secure Your
            <span className="block">Smart Contracts?</span>
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of developers who trust SmartAudit AI for enterprise-grade security audits. 
            Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/auth"
              className="group bg-white text-blue-600 px-10 py-5 rounded-2xl hover:bg-gray-50 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 flex items-center"
            >
              Start Free Trial
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="text-white/90 text-sm">
              ✓ No credit card required  ✓ 5 free audits  ✓ Full feature access
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">SmartAudit AI</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
                The world's most advanced AI-powered smart contract security auditing platform. 
                Trusted by leading DeFi protocols and blockchain companies.
              </p>
              <div className="flex items-center space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 mb-4 md:mb-0">
              &copy; 2025 SmartAudit AI. All rights reserved. Powered by advanced AI technology.
            </p>
            <div className="flex items-center space-x-6 text-gray-400 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}