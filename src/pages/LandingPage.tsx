import React, { useState, useEffect } from 'react';
import { Shield, Code, Zap, CheckCircle, ArrowRight, Github, Twitter, Mail, Star, Users, Clock, Award, TrendingUp, FileText, AlertTriangle, Eye, Play, Search, Filter, Calendar, ExternalLink, Heart, MessageSquare, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { number: '$5.2M+', label: 'Funds Protected', icon: Shield },
    { number: '50,000+', label: 'Contracts Audited', icon: FileText },
    { number: '99.9%', label: 'Accuracy Rate', icon: Award },
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

  // Mock audit data similar to LISA's community scans
  const recentAudits = [
    {
      id: 1,
      title: 'DeFi Lending Protocol Security Audit',
      severity: 'Critical',
      type: 'Reentrancy',
      blockchain: 'Ethereum',
      findings: 12,
      date: '2025-01-30 14:30:15',
      author: 'SmartAudit AI',
      likes: 24,
      comments: 8,
      bookmarks: 15
    },
    {
      id: 2,
      title: 'NFT Marketplace Contract Scan',
      severity: 'High',
      type: 'Access Control',
      blockchain: 'Polygon',
      findings: 8,
      date: '2025-01-30 12:45:22',
      author: 'SmartAudit AI',
      likes: 18,
      comments: 5,
      bookmarks: 12
    },
    {
      id: 3,
      title: 'Token Swap Module Analysis',
      severity: 'Medium',
      type: 'Logic Error',
      blockchain: 'BSC',
      findings: 5,
      date: '2025-01-30 11:20:08',
      author: 'SmartAudit AI',
      likes: 15,
      comments: 3,
      bookmarks: 8
    },
    {
      id: 4,
      title: 'Staking Contract Vulnerability Assessment',
      severity: 'High',
      type: 'Overflow',
      blockchain: 'Arbitrum',
      findings: 9,
      date: '2025-01-30 09:15:33',
      author: 'SmartAudit AI',
      likes: 21,
      comments: 7,
      bookmarks: 18
    },
    {
      id: 5,
      title: 'Cross-Chain Bridge Security Review',
      severity: 'Critical',
      type: 'Bridge Exploit',
      blockchain: 'Ethereum',
      findings: 15,
      date: '2025-01-29 16:22:41',
      author: 'SmartAudit AI',
      likes: 32,
      comments: 12,
      bookmarks: 25
    },
    {
      id: 6,
      title: 'Governance Token Contract Audit',
      severity: 'Low',
      type: 'Gas Optimization',
      blockchain: 'Optimism',
      findings: 3,
      date: '2025-01-29 14:18:19',
      author: 'SmartAudit AI',
      likes: 9,
      comments: 2,
      bookmarks: 5
    }
  ];

  const severityConfig = {
    Critical: { color: 'bg-red-500', textColor: 'text-red-400', bgColor: 'bg-red-500/10' },
    High: { color: 'bg-orange-500', textColor: 'text-orange-400', bgColor: 'bg-orange-500/10' },
    Medium: { color: 'bg-yellow-500', textColor: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
    Low: { color: 'bg-blue-500', textColor: 'text-blue-400', bgColor: 'bg-blue-500/10' }
  };

  const blockchainColors = {
    Ethereum: 'bg-blue-500/20 text-blue-300',
    Polygon: 'bg-purple-500/20 text-purple-300',
    BSC: 'bg-yellow-500/20 text-yellow-300',
    Arbitrum: 'bg-blue-400/20 text-blue-300',
    Optimism: 'bg-red-500/20 text-red-300'
  };

  const filters = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const filteredAudits = selectedFilter === 'All' 
    ? recentAudits 
    : recentAudits.filter(audit => audit.severity === selectedFilter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-center text-sm">
        <span className="font-medium">🚀 SmartAudit AI v2.0 Extension now available - secure your code without leaving your IDE!</span>
        <button className="ml-4 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-medium transition-colors">
          View Details
        </button>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SmartAudit AI
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <button className="text-gray-300 hover:text-white font-medium transition-colors">
                Scans
              </button>
              <button className="text-gray-300 hover:text-white font-medium transition-colors">
                Community
              </button>
              <button className="text-gray-300 hover:text-white font-medium transition-colors">
                Documentation
              </button>
              <button className="text-gray-300 hover:text-white font-medium transition-colors">
                Pricing
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/20 px-2 py-1 rounded text-xs text-gray-300">
                ⌘K
              </kbd>
            </div>
            <Link
              to="/auth"
              className="text-gray-300 hover:text-white font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/auth"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2.5 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            Defend Your <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">dApps & Tokens</span>
          </h1>
          
          <div className="flex items-center justify-center mb-8">
            <span className="text-gray-300 mr-2">Total funds that could have been saved by SmartAudit AI:</span>
            <span className="text-2xl font-bold text-green-400">${stats[0].number}</span>
            <ArrowRight className="h-5 w-5 text-green-400 ml-2" />
          </div>
          
          {/* Main Input Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Public</span>
                </div>
              </div>
              
              <textarea
                placeholder="Enter your smart contract code, contract address or GitHub repository"
                className="w-full bg-transparent border-none outline-none resize-none text-white placeholder-gray-400 text-lg leading-relaxed min-h-[120px]"
              />
              
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center text-sm text-gray-400">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  AI may not always be accurate, please be cautious and verify
                </div>
                <div className="flex items-center space-x-3">
                  <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors font-medium">
                    Upload Code
                  </button>
                  <Link
                    to="/auth"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Start Analysis
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group-hover:bg-black/30">
                  <stat.icon className="h-8 w-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                  <div className="text-gray-400 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Audits Section */}
      <section className="px-6 py-24 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              From the Community
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Real-time security audits powered by our AI engine, protecting the DeFi ecosystem
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center bg-black/30 backdrop-blur-md rounded-xl p-1 border border-white/10">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedFilter === filter
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredAudits.map((audit) => (
              <div
                key={audit.id}
                className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-black/50 transition-all duration-300 group cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-400">{formatDate(audit.date)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityConfig[audit.severity].bgColor} ${severityConfig[audit.severity].textColor}`}>
                      {audit.severity}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${blockchainColors[audit.blockchain]}`}>
                      {audit.blockchain}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  {audit.title}
                </h3>

                {/* Details */}
                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-400">
                  <span className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {audit.type}
                  </span>
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {audit.findings} findings
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <button className="flex items-center space-x-1 hover:text-white transition-colors">
                      <Heart className="h-4 w-4" />
                      <span>{audit.likes}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-white transition-colors">
                      <MessageSquare className="h-4 w-4" />
                      <span>{audit.comments}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-white transition-colors">
                      <Bookmark className="h-4 w-4" />
                      <span>{audit.bookmarks}</span>
                    </button>
                  </div>
                  <button className="text-blue-400 hover:text-blue-300 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          <div className="text-center">
            <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl transition-colors font-medium border border-white/20 hover:border-white/30">
              More Public Scans
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Ready to Secure Your
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Smart Contracts?</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of developers who trust SmartAudit AI for enterprise-grade security audits. 
            Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/auth"
              className="group bg-gradient-to-r from-blue-500 to-purple-500 text-white px-10 py-5 rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 flex items-center"
            >
              Start Free Trial
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="text-gray-300 text-sm">
              ✓ No credit card required  ✓ 5 free audits  ✓ Full feature access
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-md text-white px-6 py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">SmartAudit AI</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
                The world's most advanced AI-powered smart contract security auditing platform. 
                Trusted by leading DeFi protocols and blockchain companies.
              </p>
              <div className="flex items-center space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
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
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 mb-4 md:mb-0 flex items-center">
              &copy; 2025 SmartAudit AI is built by Scamlist AI with <Heart className="h-4 w-4 mx-1 text-red-500" />
            </p>
            <div className="flex items-center space-x-6 text-gray-400 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">X / Twitter</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
              <a href="#" className="hover:text-white transition-colors">Telegram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}