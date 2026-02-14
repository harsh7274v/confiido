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
    <div className="w-full min-h-screen" style={{ backgroundColor: '#fff0f3', fontFamily: "'Rubik', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header and Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 pt-4">
          {/* Left Side - Header and Support Boxes */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-wide" style={{ color: '#4A4458' }}>
                Contact Us
              </h1>
            </div>
            <p className="text-base text-gray-600 mb-6 min-h-[3rem]" style={{ fontFamily: "'Rubik', sans-serif" }}>
              {displayText}
              <span className="animate-pulse">|</span>
            </p>

            {/* Support Boxes */}
            <div className="space-y-4">
              {/* Email Support Box */}
              <div className="rounded-3xl p-5 shadow-sm transition-all duration-300 hover:shadow-md group" style={{ backgroundColor: '#f4acb7' }}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-white/20 transition-colors">
                    <Mail className="h-6 w-6 text-gray-800" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1" style={{ color: '#000000' }}>Email Support</h3>
                    <p className="text-sm font-medium mb-3 opacity-80" style={{ color: '#000000' }}>Get detailed responses within 24 hours</p>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/30" style={{ color: '#000000' }}>confiido.io+support@gmail.com</span>
                      <button className="px-4 py-2 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 hover:scale-105" style={{ backgroundColor: '#3a3a3a' }}>
                        Send Email
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Support Box */}
              <div className="rounded-3xl p-5 shadow-sm transition-all duration-300 hover:shadow-md group" style={{ backgroundColor: '#f4acb7' }}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-white/20 transition-colors">
                    <MessageSquare className="h-6 w-6 text-gray-800" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1" style={{ color: '#000000' }}>WhatsApp Support</h3>
                    <p className="text-sm font-medium mb-3 opacity-80" style={{ color: '#000000' }}>Quick responses for urgent matters</p>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/30" style={{ color: '#000000' }}>+91 98765 43210</span>
                      <button className="px-4 py-2 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 hover:scale-105" style={{ backgroundColor: '#3a3a3a' }}>
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
          <div className="rounded-4xl shadow-lg p-6 sm:p-8" style={{ backgroundColor: '#fadde1' }}>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2" style={{ color: '#000000' }}>Send us a Message</h2>
              <p className="text-sm opacity-80" style={{ color: '#000000' }}>Fill out the form below and we&apos;ll get back to you as soon as possible.</p>
            </div>

            {isSubmitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-center">
                      <div className="h-5 w-5 text-red-600 mr-2">⚠</div>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-bold mb-2 ml-1" style={{ color: '#4A4458' }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border-transparent rounded-2xl focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all text-sm font-medium shadow-sm"
                        style={{ backgroundColor: 'white', color: '#000000' }}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-bold mb-2 ml-1" style={{ color: '#4A4458' }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border-transparent rounded-2xl focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all text-sm font-medium shadow-sm ${formData.email && !isValidEmailForSupport(formData.email)
                            ? 'ring-2 ring-red-400'
                            : ''
                          }`}
                        style={{ backgroundColor: 'white', color: '#000000' }}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-bold mb-2 ml-1" style={{ color: '#4A4458' }}>
                      Subject
                    </label>
                    <div className="relative">
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border-transparent rounded-2xl focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all text-sm font-medium shadow-sm appearance-none cursor-pointer"
                        style={{ backgroundColor: 'white', color: '#000000' }}
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="technical">Technical Support</option>
                        <option value="billing">Billing & Payments</option>
                        <option value="partnership">Partnership</option>
                        <option value="feedback">Feedback</option>
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-bold mb-2 ml-1" style={{ color: '#4A4458' }}>
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border-transparent rounded-2xl focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all resize-none text-sm font-medium shadow-sm"
                      style={{ backgroundColor: 'white', color: '#000000' }}
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !isValidEmailForSupport(formData.email)}
                    className="w-full text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg"
                    style={{ backgroundColor: '#3a3a3a' }}
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
