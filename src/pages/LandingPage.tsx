import React from 'react';
import { Shield, Code, Zap, CheckCircle, ArrowRight, Github, Twitter, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SmartAudit AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/auth"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/auth"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-8">
            <Zap className="h-4 w-4 mr-2" />
            Powered by Advanced AI Technology
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Secure Your Smart Contracts with
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI-Powered Auditing</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Get comprehensive security audits for your smart contracts in seconds. Our AI analyzes vulnerabilities, 
            provides detailed findings, and offers expert remediation guidance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/auth"
              className="group bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold text-lg flex items-center shadow-lg hover:shadow-xl"
            >
              Start Free Audit
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="text-gray-600 hover:text-gray-900 px-8 py-4 rounded-xl border border-gray-300 hover:border-gray-400 transition-colors font-semibold text-lg">
              View Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              No Credit Card Required
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Instant Results
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Enterprise Grade Security
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SmartAudit AI?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced AI technology meets smart contract security expertise
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
              <div className="bg-blue-100 p-3 rounded-xl w-fit mb-6 group-hover:bg-blue-200 transition-colors">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Comprehensive Analysis</h3>
              <p className="text-gray-600 leading-relaxed">
                Detect vulnerabilities, CVEs, and business logic flaws with our advanced AI that understands smart contract patterns and security best practices.
              </p>
            </div>

            <div className="group p-8 rounded-2xl border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all duration-200">
              <div className="bg-purple-100 p-3 rounded-xl w-fit mb-6 group-hover:bg-purple-200 transition-colors">
                <Code className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Language Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Support for Solidity, Vyper, Rust (Solana), Cairo, and more. Upload multiple files or paste code directly for instant analysis.
              </p>
            </div>

            <div className="group p-8 rounded-2xl border border-gray-200 hover:border-green-200 hover:shadow-lg transition-all duration-200">
              <div className="bg-green-100 p-3 rounded-xl w-fit mb-6 group-hover:bg-green-200 transition-colors">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Actionable Remediation</h3>
              <p className="text-gray-600 leading-relaxed">
                Get detailed fix recommendations, proof-of-concept exploits, and security best practices to secure your smart contracts effectively.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Secure Your Smart Contracts?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of developers who trust SmartAudit AI for their smart contract security needs.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg shadow-lg"
          >
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="bg-blue-600 p-2 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">SmartAudit AI</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SmartAudit AI. All rights reserved. Powered by Shipable AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}