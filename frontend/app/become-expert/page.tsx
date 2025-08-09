'use client';

import { useState } from 'react';
import { ArrowLeft, CheckCircle, Star, Users, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';

export default function BecomeExpert() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    title: '',
    bio: '',
    expertise: '',
    experience: '',
    hourlyRate: '',
    linkedin: '',
    website: ''
  });

  const benefits = [
    {
      icon: DollarSign,
      title: "Monetize Your Expertise",
      description: "Earn money by sharing your knowledge and experience with others"
    },
    {
      icon: Users,
      title: "Build Your Network",
      description: "Connect with professionals and expand your reach globally"
    },
    {
      icon: Star,
      title: "Flexible Schedule",
      description: "Work on your own terms and set your own availability"
    },
    {
      icon: Clock,
      title: "Grow Your Brand",
      description: "Establish yourself as a thought leader in your industry"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-gray-300 hover:text-white">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-300 hover:text-white">
                Sign In
              </Link>
              <Link href="/signup" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Benefits */}
          <div>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                Become an Expert
              </h1>
              <p className="text-lg text-gray-300">
                Share your expertise, help others grow, and earn money doing what you love. 
                Join our community of verified professionals.
              </p>
            </div>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-900/20 rounded-lg flex items-center justify-center border border-red-800">
                    <benefit.icon className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-300">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">
                Why Choose Lumina?
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  Verified expert profiles with detailed reviews
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  Secure payment processing and reliable scheduling
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  Dedicated support team to help you succeed
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  Marketing tools to promote your services
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Application Form */}
          <div>
            <div className="bg-gray-900 rounded-lg shadow-sm p-8 border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-6">
                Apply to Become an Expert
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                    Professional Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Product Strategy Consultant"
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="expertise" className="block text-sm font-medium text-white mb-2">
                    Areas of Expertise *
                  </label>
                  <input
                    type="text"
                    id="expertise"
                    name="expertise"
                    value={formData.expertise}
                    onChange={handleInputChange}
                    placeholder="e.g., Product Strategy, Go-to-Market, User Research"
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-white mb-2">
                    Years of Experience *
                  </label>
                  <input
                    type="text"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g., 8+ years in product management"
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="hourlyRate" className="block text-sm font-medium text-white mb-2">
                    Hourly Rate (USD) *
                  </label>
                  <input
                    type="number"
                    id="hourlyRate"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    placeholder="e.g., 150"
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-white mb-2">
                    Professional Bio *
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Tell us about your background, experience, and what you can help others with..."
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="linkedin" className="block text-sm font-medium text-white mb-2">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      id="linkedin"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-white mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-medium text-white mb-2">What happens next?</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• We&apos;ll review your application within 2-3 business days</li>
                    <li>• If approved, we&apos;ll help you set up your expert profile</li>
                    <li>• You&apos;ll receive training on how to maximize your success</li>
                    <li>• Start booking sessions and earning money!</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Submit Application
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 