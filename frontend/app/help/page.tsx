'use client';
import { useState } from 'react';
import { HelpCircle, Search, MessageCircle, Mail, Phone, ChevronDown, ChevronRight, BookOpen, Shield, CreditCard, Users, Settings, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const categories = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Learn how to set up your account and start using Lumina',
      icon: BookOpen,
      color: 'blue'
    },
    {
      id: 'bookings',
      name: 'Bookings & Sessions',
      description: 'Everything about booking sessions and managing appointments',
      icon: Calendar,
      color: 'green'
    },
    {
      id: 'payments',
      name: 'Payments & Billing',
      description: 'Payment methods, billing, and financial information',
      icon: CreditCard,
      color: 'purple'
    },
    {
      id: 'account',
      name: 'Account & Profile',
      description: 'Managing your profile and account settings',
      icon: Settings,
      color: 'orange'
    },
    {
      id: 'safety',
      name: 'Safety & Security',
      description: 'Platform safety, privacy, and security measures',
      icon: Shield,
      color: 'red'
    },
    {
      id: 'expert',
      name: 'For Experts',
      description: 'Resources and guides for expert users',
      icon: Users,
      color: 'indigo'
    }
  ];

  const faqs = [
    {
      id: 1,
      question: 'How do I book a session with an expert?',
      answer: 'To book a session, browse our expert directory, select an expert you\'d like to work with, choose a service and time slot, and complete the booking process. You\'ll receive a confirmation email with session details.',
      category: 'bookings'
    },
    {
      id: 2,
      question: 'What payment methods are accepted?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, and bank transfers. All payments are processed securely through our payment partners.',
      category: 'payments'
    },
    {
      id: 3,
      question: 'How do I become an expert on Lumina?',
      answer: 'To become an expert, click on "Become an Expert" in the navigation, fill out the application form with your professional information, and submit for review. Our team will review your application within 2-3 business days.',
      category: 'expert'
    },
    {
      id: 4,
      question: 'Can I cancel or reschedule a session?',
      answer: 'Yes, you can cancel or reschedule sessions up to 24 hours before the scheduled time. Cancellations within 24 hours may be subject to our cancellation policy. Check the expert\'s specific cancellation terms.',
      category: 'bookings'
    },
    {
      id: 5,
      question: 'How do I update my payment information?',
      answer: 'You can update your payment information in your account settings. Go to Profile > Payment Methods to add, edit, or remove payment methods.',
      category: 'payments'
    },
    {
      id: 6,
      question: 'Is my personal information secure?',
      answer: 'Yes, we take security seriously. All personal and payment information is encrypted and stored securely. We never share your personal information with third parties without your consent.',
      category: 'safety'
    },
    {
      id: 7,
      question: 'How do I contact customer support?',
      answer: 'You can contact our support team through the contact form on this page, via email at support@lumina.com, or by calling our support line. We typically respond within 24 hours.',
      category: 'account'
    },
    {
      id: 8,
      question: 'What happens if I have technical issues during a session?',
      answer: 'If you experience technical issues during a session, try refreshing your browser or reconnecting to the call. If problems persist, contact our support team immediately for assistance.',
      category: 'bookings'
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Lumina
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/profile" className="text-slate-600 hover:text-slate-900">
                Profile
              </Link>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">How can we help?</h1>
          <p className="text-xl text-slate-600 mb-8">Find answers to common questions and get the support you need.</p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search for help articles, FAQs, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  category.color === 'blue' ? 'bg-blue-100' :
                  category.color === 'green' ? 'bg-green-100' :
                  category.color === 'purple' ? 'bg-purple-100' :
                  category.color === 'orange' ? 'bg-orange-100' :
                  category.color === 'red' ? 'bg-red-100' :
                  'bg-indigo-100'
                }`}>
                  <category.icon className={`h-6 w-6 ${
                    category.color === 'blue' ? 'text-blue-600' :
                    category.color === 'green' ? 'text-green-600' :
                    category.color === 'purple' ? 'text-purple-600' :
                    category.color === 'orange' ? 'text-orange-600' :
                    category.color === 'red' ? 'text-red-600' :
                    'text-indigo-600'
                  }`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{category.name}</h3>
                <p className="text-slate-600">{category.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Frequently Asked Questions</h2>
          <div className="bg-white rounded-lg shadow-sm">
            {filteredFaqs.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className="p-6">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <h3 className="text-lg font-medium text-slate-900 pr-4">{faq.question}</h3>
                      {expandedFaq === faq.id ? (
                        <ChevronDown className="h-5 w-5 text-slate-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-500 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="mt-4 text-slate-600">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No results found</h3>
                <p className="text-slate-600">Try adjusting your search terms or browse our categories above.</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Still need help?</h2>
            <p className="text-slate-600">Our support team is here to help you with any questions or issues.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Live Chat</h3>
              <p className="text-sm text-slate-600 mb-4">Get instant help from our support team</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Start Chat
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Email Support</h3>
              <p className="text-sm text-slate-600 mb-4">Send us a detailed message</p>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Send Email
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Phone Support</h3>
              <p className="text-sm text-slate-600 mb-4">Call us during business hours</p>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                Call Now
              </button>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Help Center</h3>
              <p className="text-slate-600 mb-4">Browse our comprehensive help articles and tutorials.</p>
              <Link href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Visit Help Center →
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Community Forum</h3>
              <p className="text-slate-600 mb-4">Connect with other users and share experiences.</p>
              <Link href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                Join Community →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 