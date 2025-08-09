'use client';

import { useState, useEffect } from 'react';
import { Star, Clock, MessageCircle, Video, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ExpertProfile({ params }: { params: Promise<{ id: string }> }) {
  const [expertId, setExpertId] = useState<string>('');

  useEffect(() => {
    params.then(({ id }) => setExpertId(id));
  }, [params]);

  // Mock expert data - in a real app, this would come from an API
  const expert = {
    id: expertId,
    name: "Sarah Chen",
    title: "Product Strategy Consultant",
    bio: "I help startups and scale-ups build successful product strategies. With 8+ years of experience in product management at companies like Google and Stripe, I've helped over 50 companies launch and scale their products.",
    expertise: ["Product Strategy", "Go-to-Market", "User Research", "Product-Market Fit"],
    rating: 4.9,
    reviews: 127,
    totalSessions: 450,
    responseTime: "2 hours",
    price: "$150",
    duration: "30 min",
    verified: true,
    avatar: "/avatars/sarah.jpg",
    location: "San Francisco, CA",
    languages: ["English", "Mandarin"],
    availability: [
      { day: "Monday", slots: ["9:00 AM", "2:00 PM", "7:00 PM"] },
      { day: "Tuesday", slots: ["10:00 AM", "3:00 PM", "8:00 PM"] },
      { day: "Wednesday", slots: ["9:00 AM", "1:00 PM", "6:00 PM"] },
      { day: "Thursday", slots: ["11:00 AM", "4:00 PM", "7:00 PM"] },
      { day: "Friday", slots: ["9:00 AM", "2:00 PM"] },
    ]
  };

  const reviews = [
    {
      id: 1,
      name: "Alex Johnson",
      rating: 5,
      comment: "Sarah provided incredible insights into our product strategy. Her experience at Google really showed through in her recommendations.",
      date: "2024-01-15"
    },
    {
      id: 2,
      name: "Maria Rodriguez",
      rating: 5,
      comment: "Very knowledgeable and practical advice. Helped me understand how to approach our go-to-market strategy.",
      date: "2024-01-10"
    },
    {
      id: 3,
      name: "David Kim",
      rating: 4,
      comment: "Great session! Sarah asked the right questions to understand our business and provided actionable next steps.",
      date: "2024-01-05"
    }
  ];

  const services = [
    {
      id: 1,
      title: "Product Strategy Review",
      description: "Comprehensive review of your product strategy with actionable recommendations",
      duration: "30 min",
      price: "$150"
    },
    {
      id: 2,
      title: "Go-to-Market Planning",
      description: "Help you develop a solid go-to-market strategy for your product",
      duration: "45 min",
      price: "$200"
    },
    {
      id: 3,
      title: "User Research Consultation",
      description: "Guide you through effective user research methods and analysis",
      duration: "30 min",
      price: "$150"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                Sign In
              </Link>
              <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Expert Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {expert.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold text-slate-900">{expert.name}</h1>
                    {expert.verified && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-lg text-slate-600 mb-2">{expert.title}</p>
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span>{expert.rating}</span>
                      <span className="ml-1">({expert.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center">
                      <Video className="h-4 w-4 mr-1" />
                      <span>{expert.totalSessions} sessions</span>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span>Responds in {expert.responseTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">About</h2>
              <p className="text-slate-600 leading-relaxed">{expert.bio}</p>
            </div>

            {/* Expertise */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Areas of Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {expert.expertise.map((skill) => (
                  <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Reviews</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-slate-200 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-900">{review.name}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-slate-500">{review.date}</span>
                    </div>
                    <p className="text-slate-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Booking Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sticky top-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Book a Session</h3>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-1">{service.title}</h4>
                    <p className="text-sm text-slate-600 mb-3">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{service.duration}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-slate-900">{service.price}</div>
                      </div>
                    </div>
                    <Link href={`/book/${expert.id}?service=${service.id}`} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center block mt-3">
                      Book Session
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Expert Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Expert Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <span className="text-slate-500 w-20">Location:</span>
                  <span className="text-slate-900">{expert.location}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-slate-500 w-20">Languages:</span>
                  <span className="text-slate-900">{expert.languages.join(', ')}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-slate-500 w-20">Response:</span>
                  <span className="text-slate-900">{expert.responseTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 