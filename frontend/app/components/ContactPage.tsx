"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MessageCircle, 
  MessageSquare,
  Send, 
  CheckCircle,
  Clock,
  MapPin,
  Users,
  Star,
  ArrowRight
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [displayText, setDisplayText] = useState('');
  
  const fullText = "We're here to help! Reach out to us through any of our support channels or send us a message.";

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const isValidEmailForSupport = (email: string): boolean => {
    const trimmed = (email || '').trim().toLowerCase();
    if (!trimmed.includes('@')) return false;
    const dotCount = (trimmed.match(/\./g) || []).length;
    if (dotCount > 2) return false;
    const allowedDomains = ['gmail.com', 'outlook.com', 'icloud.com', 'hotmail.com'];
    const domain = trimmed.split('@')[1] || '';
    if (!allowedDomains.includes(domain)) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!isValidEmailForSupport(formData.email)) {
      setError('Please enter a valid email address ending with gmail.com, outlook.com, icloud.com, or hotmail.com');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          subject: formData.subject,
          query: `Name: ${formData.name}\n\nMessage:\n${formData.message}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      if (data.ok) {
        setIsSubmitted(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({ name: '', email: '', subject: '', message: '' });
        }, 3000);
      } else {
        throw new Error('Failed to send message');
      }
      
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setError('There was an error sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportChannels = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get detailed responses within 24 hours',
      contact: 'support@lumina.com',
      action: 'Send Email',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Support',
      description: 'Quick responses for urgent matters',
      contact: '+91 98765 43210',
      action: 'Chat on WhatsApp',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    }
  ];

  const features = [
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round the clock assistance for your needs'
    },
    {
      icon: Users,
      title: 'Expert Team',
      description: 'Experienced professionals ready to help'
    },
    {
      icon: Star,
      title: 'Premium Service',
      description: 'Top-notch customer experience guaranteed'
    }
  ];

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header and Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12 pt-12">
          {/* Left Side - Header and Support Boxes */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg shadow-lg" style={{ background: '#5E936C' }}>
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                Contact Us
              </h1>
            </div>
            <style jsx>{`
              @keyframes shimmer {
                0% {
                  background-position: -200% 0;
                }
                100% {
                  background-position: 200% 0;
                }
              }
              .animate-shimmer {
                animation: shimmer 3s ease-in-out infinite;
              }
            `}</style>
            <p className="text-base text-gray-600 mb-6 min-h-[3rem]">
              {displayText}
              <span className="animate-pulse">|</span>
            </p>

            {/* Support Boxes */}
            <div className="space-y-3">
              {/* Email Support Box */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-600 transition-colors">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Email Support</h3>
                    <p className="text-sm text-gray-600 mb-2">Get detailed responses within 24 hours</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">confiido.io+support@gmail.com</span>
                      <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1">
                        Send Email
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Support Box */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-600 transition-colors">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">WhatsApp Support</h3>
                    <p className="text-sm text-gray-600 mb-2">Quick responses for urgent matters</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">+91 98765 43210</span>
                      <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1">
                        Chat on WhatsApp
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-lg">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Send us a Message</h2>
              <p className="text-sm text-gray-600">Fill out the form below and we&apos;ll get back to you as soon as possible.</p>
            </div>

            {isSubmitted ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <div className="h-5 w-5 text-red-600 mr-2">⚠</div>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors text-sm"
                      style={{ '--tw-ring-color': '#5E936C' } as React.CSSProperties}
                      onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #5E936C'}
                      onBlur={(e) => e.target.style.boxShadow = ''}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors text-sm ${
                        formData.email && !isValidEmailForSupport(formData.email)
                          ? 'border-red-400'
                          : 'border-gray-300'
                      }`}
                      onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #5E936C'}
                      onBlur={(e) => e.target.style.boxShadow = ''}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors text-sm"
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #5E936C'}
                    onBlur={(e) => e.target.style.boxShadow = ''}
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing & Payments</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors resize-none text-sm"
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #5E936C'}
                    onBlur={(e) => e.target.style.boxShadow = ''}
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !isValidEmailForSupport(formData.email)}
                  className="w-full text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm"
                  style={{ backgroundColor: '#5E936C' }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting && isValidEmailForSupport(formData.email)) {
                      e.currentTarget.style.backgroundColor = '#4A7556';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting && isValidEmailForSupport(formData.email)) {
                      e.currentTarget.style.backgroundColor = '#5E936C';
                    }
                  }}
                >
                  {isSubmitting ? (
                    'Sending Message...'
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
