'use client';

import { ArrowRight, Star, Users, Clock, Shield, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonialSlide, setCurrentTestimonialSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isTestimonialPaused, setIsTestimonialPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'student' | 'professional'>('student');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Check screen size for mobile optimization
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isTestimonialPaused) {
      const timer = setInterval(() => {
        setCurrentTestimonialSlide((prev) => (prev + 0.05) % 12);
      }, 150); // Much slower and smoother movement

      return () => clearInterval(timer);
    }
  }, [isTestimonialPaused]);
  const experts = [
    {
      id: 1,
      name: "Animesh Pandit",
      title: "Senior Consultant",
      company: "Sanofi",
      expertise: "Product Strategy, Go-to-Market",
      rating: 4.9,
      reviews: 127,
      price: "Rs500",
      duration: "30 min",
      avatar: "SC",
      verified: true
    },
    // {
    //   id: 2,
    //   name: "Ajatika Singh",
    //   title: "Tech Startup Advisor",
    //   company: "Microsoft",
    //   expertise: "Startup Growth, Fundraising",
    //   rating: 4.8,
    //   reviews: 89,
    //   price: "$200",
    //   duration: "45 min",
    //   avatar: "MR",
    //   verified: true
    // },
    // {
    //   id: 3,
    //   name: "Dr. Emily Watson",
    //   title: "Career Development Coach",
    //   company: "Self-employed",
    //   expertise: "Career Transition, Leadership",
    //   rating: 4.9,
    //   reviews: 156,
    //   price: "$120",
    //   duration: "30 min",
    //   avatar: "EW",
    //   verified: true
    // },
    // {
    //   id: 4,
    //   name: "Alex Kumar",
    //   title: "Digital Marketing Expert",
    //   company: "Meta",
    //   expertise: "Growth Marketing, SEO",
    //   rating: 4.7,
    //   reviews: 203,
    //   price: "$100",
    //   duration: "30 min",
    //   avatar: "AK",
    //   verified: true
    // },
    // {
    //   id: 5,
    //   name: "Lisa Wang",
    //   title: "UX Designer",
    //   company: "Apple",
    //   expertise: "UI/UX Design, User Research",
    //   rating: 4.6,
    //   reviews: 78,
    //   price: "$180",
    //   duration: "60 min",
    //   avatar: "LW",
    //   verified: true
    // },
    // {
    //   id: 6,
    //   name: "David Kim",
    //   title: "Financial Advisor",
    //   company: "Morgan Stanley",
    //   expertise: "Investment Planning, Retirement",
    //   rating: 4.9,
    //   reviews: 203,
    //   price: "$250",
    //   duration: "90 min",
    //   avatar: "DK",
    //   verified: true
    // }
  ];

  const testimonials = [
    {
      name: "Rahul Vansh",
      avatar: "RV",
      content: "Before joining, I wasn't that confident about interviews for AI based roles, though I did have good enough understanding of concepts but 'what I don't know' was stopping me to apply for such roles. Ma'am made it realised that it's an iterative process, I'll learn to tackle my loopholes by actually giving interviews.",
      mentor: {
        name: "Pooja Palod",
        title: "Machine learning engineer, Uber",
        avatar: "PP"
      }
    },
    {
      name: "Pradeep M",
      avatar: "PM",
      content: "Just wanted to say a big thank you for your insightful guidance. Your clear advice on improving my data analyst skills was exactly what I needed. I appreciate your genuine interest in my growth, and I'm excited to start working on your suggestions.",
      mentor: {
        name: "Tajamul Khan",
        title: "Advanced Data Scientist, Eastman",
        avatar: "TK"
      }
    },
    {
      name: "Sarah Johnson",
      avatar: "SJ",
      content: "The mentorship program exceeded my expectations. The personalized guidance helped me transition from a junior developer to a team lead within 6 months. The structured approach and regular feedback sessions were invaluable.",
      mentor: {
        name: "Alex Chen",
        title: "Senior Software Engineer, Google",
        avatar: "AC"
      }
    },
    {
      name: "Michael Rodriguez",
      avatar: "MR",
      content: "Working with my mentor transformed my approach to product management. The weekly sessions and practical frameworks helped me secure a senior PM role at a Fortune 500 company. Couldn't have done it without this guidance.",
      mentor: {
        name: "Emily Zhang",
        title: "Senior Product Manager, Meta",
        avatar: "EZ"
      }
    },
    {
      name: "Jessica Lee",
      avatar: "JL",
      content: "The marketing strategies and growth hacking techniques I learned through mentoring sessions directly led to a 300% increase in our startup's user acquisition. The ROI on this investment was incredible.",
      mentor: {
        name: "David Park",
        title: "Growth Marketing Lead, Spotify",
        avatar: "DP"
      }
    },
    {
      name: "Ahmed Hassan",
      avatar: "AH",
      content: "As someone transitioning into cybersecurity, the hands-on guidance and industry insights were game-changing. My mentor helped me land my dream job at a top security firm within 4 months of starting our sessions.",
      mentor: {
        name: "Lisa Thompson",
        title: "Cybersecurity Director, Microsoft",
        avatar: "LT"
      }
    }
  ];

  const categories = [
    "Career Guidance", "Public Speaking", "Debate", "Mentorship", "Others"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">XXXXX</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#mentors" className="text-gray-700 hover:text-blue-600 transition-colors">
                Explore Mentors
              </Link>
              {/* <Link href="#mentors" className="text-gray-700 hover:text-blue-600 transition-colors">
                AI Mentors
              </Link> */}
              <Link href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">
                Success Stories
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-700 hover:text-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 px-3 py-2 rounded-lg hover:bg-blue-50">
                Login
              </Link>
              <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-6xl font-bold tracking-tight sm:text-7xl mb-6">
              <span className="text-gray-900">Speak Confidently</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Lead Confidently</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              1-on-1 coaching and self-placed courses to build unshakable public speaking skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/signup" className="bg-gray-900 text-white px-8 py-4 text-lg font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                Book a Free Trial
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 mb-8">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                <span>No Payment Required</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                <span>Verified Mentors Only</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                <span>Reschedule Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Your Mentors Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              ✨ Meet Our Coaches
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Learn From <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Real Experts</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get to know our speaking coaches through their personal stories and see how they can help you
            </p>
          </div>
          
          {/* Mentors Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Mentor 1 - Megha Upadhyay */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face" 
                    alt="Sarah Chen" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Megha Upadhyay</h3>
                <p className="text-blue-600 font-medium mb-1">Public Speaking Coach</p>
                <p className="text-gray-500 text-sm mb-4">4+ years experience • ABP News Alumni</p>
                
                {/* Video Introduction */}
                <div className="w-full mb-6">
                  <div className="bg-gray-100 rounded-xl p-6 border-2 border-dashed border-gray-300">
                    <div className="flex flex-col items-center text-gray-500">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l8-5-8-5z"/>
                        </svg>
                      </div>
                      <p className="text-sm font-medium">Watch Megha's Introduction</p>
                      <p className="text-xs text-gray-400 mt-1">2 min video</p>
                      <button className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Play Video
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Bio */}
              <div className="space-y-4 text-left">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-700 text-sm leading-relaxed italic">
                    "I used to be uncomfortable speaking in public. Now I help students/professional find their authentic voice and speak with confidence."
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">What I can help you with:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Overcoming speaking anxiety</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Building executive presence</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Presentation skills for work</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span> Rs 500/session</span>
                      4.9 (127 reviews)
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
                    Book Megha
                  </button>
                </div>
              </div>
            </div>

            {/* Mentor 2 - Marcus Rodriguez */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" 
                    alt="Marcus Rodriguez" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-emerald-100"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Marcus Rodriguez</h3>
                <p className="text-emerald-600 font-medium mb-1">Leadership Communication Expert</p>
                <p className="text-gray-500 text-sm mb-4">15+ years experience • Microsoft Alumni</p>
                
                {/* Video Introduction */}
                <div className="w-full mb-6">
                  <div className="bg-gray-100 rounded-xl p-6 border-2 border-dashed border-gray-300">
                    <div className="flex flex-col items-center text-gray-500">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l8-5-8-5z"/>
                        </svg>
                      </div>
                      <p className="text-sm font-medium">Watch Marcus's Introduction</p>
                      <p className="text-xs text-gray-400 mt-1">3 min video</p>
                      <button className="mt-3 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
                        Play Video
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Bio */}
              <div className="space-y-4 text-left">
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-gray-700 text-sm leading-relaxed italic">
                    "Leadership is about inspiring others through clear, confident communication. Let me show you how."
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">What I can help you with:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Leadership communication</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Team meeting confidence</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Executive storytelling</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      4.8 (203 reviews)
                    </span>
                    <span>$200/session</span>
                  </div>
                  <button className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
                    Book Marcus
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started in 3 Easy Steps Section */}
      <section id="mentors" className="py-16 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get Started in 3 Easy Steps</h2>
            <p className="text-xl text-gray-600">Follow these three simple steps to begin your speaking transformation journey</p>
          </div>
          
          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Book Your Session</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Choose your preferred coach and schedule a personalized 1-on-1 session at a time that works best for you.
              </p>
              <Link href="/search" className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Book Session <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Make Payment</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Secure your session with our easy payment process. Multiple payment options available for your convenience.
              </p>
              <Link href="/signup" className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Make Payment <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Join via Google Meet</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Connect with your mentor seamlessly through Google Meet for your personalized coaching session.
              </p>
              <Link href="/dashboard" className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Join Session <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Love & Praise by The Mentees Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Love & Praise by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">The Mentees</span></h2>
            <p className="text-xl text-gray-600">Get inspired by the real-life experiences of our students and their journey to success with Confiido.</p>
          </div>

          {/* Black Frame Container for Continuous Scrolling */}
          <div className="relative max-w-7xl mx-auto">
            <div 
              className="bg-gray-900 p-4 sm:p-8 rounded-3xl overflow-hidden shadow-2xl"
              onMouseEnter={() => setIsTestimonialPaused(true)}
              onMouseLeave={() => setIsTestimonialPaused(false)}
            >
              {/* Continuous Scrolling Animation */}
              <div 
                className="flex"
                style={{ 
                  transform: `translateX(-${isMobile ? (currentTestimonialSlide * 16.67) : (currentTestimonialSlide * 8.33)}%)`,
                  width: '200%', // Double width to accommodate seamless loop
                  transition: 'transform 0.15s ease-out' // Smooth micro-transitions between updates
                }}
              >
                {/* First set of testimonials */}
                {testimonials.map((testimonial, slideIndex) => (
                  <div key={slideIndex} className="w-2/3 sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 flex-shrink-0 px-2 sm:px-4">
                    <div className="bg-white rounded-xl p-2 sm:p-6 shadow-lg border border-gray-100 h-64 sm:h-80 transform transition-all duration-300 hover:scale-105">
                      {/* User Avatar and Name */}
                      <div className="flex items-start space-x-2 mb-3">
                        <div className="w-6 sm:w-10 h-6 sm:h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-base font-bold text-gray-900">{testimonial.name}</h4>
                        </div>
                      </div>

                      {/* Testimonial Content */}
                      <div className="mb-3 sm:mb-6 flex-1">
                        <p className="text-gray-700 text-xs sm:text-sm leading-relaxed line-clamp-3">
                          {testimonial.content.length > 80 
                            ? `${testimonial.content.substring(0, 80)}...` 
                            : testimonial.content}
                        </p>
                      </div>

                      {/* Mentor Information */}
                      <div className="border-t border-gray-100 pt-2 sm:pt-4 mt-auto">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <div className="w-4 sm:w-8 h-4 sm:h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {testimonial.mentor.avatar}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900">{testimonial.mentor.name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-20 sm:max-w-none">{testimonial.mentor.title}</p>
                            </div>
                          </div>
                          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-1 sm:px-2 py-1 rounded-full">
                            Mentor
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Duplicate testimonials for seamless loop */}
                {testimonials.map((testimonial, slideIndex) => (
                  <div key={`duplicate-${slideIndex}`} className="w-2/3 sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 flex-shrink-0 px-2 sm:px-4">
                    <div className="bg-white rounded-xl p-2 sm:p-6 shadow-lg border border-gray-100 h-64 sm:h-80 transform transition-all duration-300 hover:scale-105">
                      {/* User Avatar and Name */}
                      <div className="flex items-start space-x-2 mb-3">
                        <div className="w-6 sm:w-10 h-6 sm:h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-base font-bold text-gray-900">{testimonial.name}</h4>
                        </div>
                      </div>

                      {/* Testimonial Content */}
                      <div className="mb-3 sm:mb-6 flex-1">
                        <p className="text-gray-700 text-xs sm:text-sm leading-relaxed line-clamp-3">
                          {testimonial.content.length > 80 
                            ? `${testimonial.content.substring(0, 80)}...` 
                            : testimonial.content}
                        </p>
                      </div>

                      {/* Mentor Information */}
                      <div className="border-t border-gray-100 pt-2 sm:pt-4 mt-auto">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <div className="w-4 sm:w-8 h-4 sm:h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {testimonial.mentor.avatar}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900">{testimonial.mentor.name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-20 sm:max-w-none">{testimonial.mentor.title}</p>
                            </div>
                          </div>
                          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-1 sm:px-2 py-1 rounded-full">
                            Mentor
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Who This is For Section */}
      <section className="py-12 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium mb-3">
              🎯 Perfect Match
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Who This is <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">For</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Help yourself identify if our coaching is the perfect fit for your journey
            </p>
            
            {/* Category Toggle Buttons */}
            <div className="flex justify-center mb-8">
              <button
                onClick={() => setSelectedCategory('student')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 mr-1 ${
                  selectedCategory === 'student'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
                }`}
              >
                For Students
              </button>
              <button
                onClick={() => setSelectedCategory('professional')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ml-1 ${
                  selectedCategory === 'professional'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
                }`}
              >
                For Professionals
              </button>
            </div>

            <p className="text-base text-blue-600 font-semibold">
              Confido is designed for those who want their voice to inspire, influence and impact.
            </p>
          </div>

          {/* Student Category Content */}
          {selectedCategory === 'student' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {/* Card 1 - School Students */}
              <div className="bg-white p-5 rounded-xl border border-green-200 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">School Students</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Students participating in debates</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Class representatives and student leaders</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Young minds building early skills</span>
                  </li>
                </ul>
              </div>

              {/* Card 2 - College Students */}
              <div className="bg-white p-5 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">College Students</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Students preparing for presentations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Campus leaders and organization heads</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Job seekers preparing for interviews</span>
                  </li>
                </ul>
              </div>

              {/* Card 3 - Students with Stage Fear */}
              <div className="bg-white p-5 rounded-xl border border-orange-200 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">Students with Stage Fear</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Those nervous before speaking publicly</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Students avoiding speaking opportunities</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Anyone ready to overcome anxiety</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Professional Category Content */}
          {selectedCategory === 'professional' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {/* Card 1 - Working Professionals */}
              <div className="bg-white p-5 rounded-xl border border-teal-200 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <ArrowRight className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">Working Professionals</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Professionals seeking career advancement</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Team leaders and managers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Anyone wanting confident communication</span>
                  </li>
                </ul>
              </div>

              {/* Card 2 - Aspiring Professionals */}
              <div className="bg-white p-5 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">Aspiring Professionals</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Recent graduates entering the workforce</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Career changers seeking new opportunities</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Entrepreneurs building their personal brand</span>
                  </li>
                </ul>
              </div>

              {/* Card 3 - Executive Leaders */}
              <div className="bg-white p-5 rounded-xl border border-indigo-200 hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">Executive Leaders</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>C-suite executives and directors</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Public speakers and thought leaders</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Industry experts sharing knowledge</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mb-3">
              ❓ Questions & Answers
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Questions</span>
            </h2>
            <p className="text-lg text-gray-600">
              Get answers to the most common questions about our coaching sessions
            </p>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 - Can I get refund? */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <button 
                onClick={() => toggleFaq(0)}
                className="w-full p-6 text-left hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">?</span>
                    </div>
                    Can I get a refund?
                  </h3>
                  {openFaq === 0 ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>
              {openFaq === 0 && (
                <div className="px-6 pb-6">
                  <p className="text-gray-700 leading-relaxed ml-11">
                    We truly value your trust in booking a session with us. Since each session is personalized and time is reserved exclusively for you, all bookings are non-refundable.
                    However, if you’re unable to attend, we’ll be happy to help you reschedule (subject to availability).
                  </p>
                </div>
              )}
            </div>

            {/* FAQ 2 - Are sessions online? */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <button 
                onClick={() => toggleFaq(1)}
                className="w-full p-6 text-left hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">?</span>
                    </div>
                    Are sessions conducted online?
                  </h3>
                  {openFaq === 1 ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>
              {openFaq === 1 && (
                <div className="px-6 pb-6">
                  <p className="text-gray-700 leading-relaxed ml-11">
                    Yes, all our coaching sessions are conducted online via Google Meet. This allows you to learn from 
                    the comfort of your own space and gives us access to top coaches worldwide. You'll receive a meeting 
                    link before your session, and all you need is a stable internet connection and a device with a camera.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ 3 - What language will sessions be in? */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <button 
                onClick={() => toggleFaq(2)}
                className="w-full p-6 text-left hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">?</span>
                    </div>
                    What language will the sessions be in?
                  </h3>
                  {openFaq === 2 ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>
              {openFaq === 2 && (
                <div className="px-6 pb-6">
                  <p className="text-gray-700 leading-relaxed ml-11">
                    Our mentors are fluent in both English and Hindi.
                    The language of the session will be based entirely on your comfort and preference, so you can learn in the way that feels most natural to you.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ 4 - Will this help if I'm introvert? */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <button 
                onClick={() => toggleFaq(3)}
                className="w-full p-6 text-left hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">?</span>
                    </div>
                    Will this help me if I'm an introvert?
                  </h3>
                  {openFaq === 3 ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>
              {openFaq === 3 && (
                <div className="px-6 pb-6">
                  <p className="text-gray-700 leading-relaxed ml-11">
                    Absolutely! Our coaching is especially beneficial for introverts. We understand that introverts often 
                    have unique challenges with public speaking, and our mentors are specially trained to work with different 
                    personality types. We focus on building confidence gradually, leveraging your natural strengths, and 
                    providing strategies that work specifically for introverted communicators.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* FAQ CTA */}
          <div className="text-center mt-10">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Link href="/contact" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
              Contact Support <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to supercharge your career?</h2>
          <p className="text-xl text-white/90 mb-8">Join thousands of professionals who have accelerated their careers with mentorship</p>
          <div className="flex justify-center">
            <Link href="/signup" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Book a Free Trial
            </Link>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">XXXXXX</h3>
              <p className="text-gray-400">Connecting ambitious professionals with industry experts for career acceleration.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms Of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Mentees</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/search" className="hover:text-white transition-colors">Find Mentors</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Mentors</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/become-expert" className="hover:text-white transition-colors">Become a Mentor</Link></li>
                <li><Link href="/resources" className="hover:text-white transition-colors">Resources</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">©2025 XXXXX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
