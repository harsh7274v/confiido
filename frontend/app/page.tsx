'use client';

import { ArrowRight, Star, Users, Clock, Shield, Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Play, MessageCircle, X, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VideoSpinner from './components/ui/VideoSpinner';
import '/public/WEB/css/clash-grotesk.css';
import '/public/web1/css/bespoke-stencil.css';
import '/public/web1/css/clash-display.css';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonialSlide, setCurrentTestimonialSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isTestimonialPaused, setIsTestimonialPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'student' | 'professional'>('student');
  const [showSpinner, setShowSpinner] = useState(false);
  const [currentMentorIndex, setCurrentMentorIndex] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
  const [faqButtonColors, setFaqButtonColors] = useState<{ [key: number]: string }>({});
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatbotStep, setChatbotStep] = useState<'email' | 'subject' | 'query'>('email');
  const [chatbotData, setChatbotData] = useState({
    email: '',
    subject: '',
    query: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  // Generate random light background colors for testimonials
  const getRandomBackgroundColor = (index: number) => {
    const colors = [
      'bg-pink-50',
      'bg-blue-50', 
      'bg-green-50',
      'bg-yellow-50',
      'bg-purple-50',
      'bg-indigo-50',
      'bg-cyan-50',
      'bg-emerald-50',
      'bg-orange-50',
      'bg-rose-50',
      'bg-sky-50',
      'bg-lime-50'
    ];
    return colors[index % colors.length];
  };

  // Generate random light shadow colors for testimonials
  const getRandomShadowColor = (index: number) => {
    const colors = [
      'shadow-pink-200',
      'shadow-blue-200', 
      'shadow-green-200',
      'shadow-yellow-200',
      'shadow-purple-200',
      'shadow-indigo-200',
      'shadow-cyan-200',
      'shadow-emerald-200',
      'shadow-orange-200',
      'shadow-rose-200',
      'shadow-sky-200',
      'shadow-lime-200'
    ];
    return colors[index % colors.length];
  };

  const handleLoginClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.preventDefault();
    setShowSpinner(true);
    router.push('/login');
  };

  const handleSignupClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.preventDefault();
    setShowSpinner(true);
    router.push('/signup');
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleFaqHover = (index: number, isHovering: boolean) => {
    if (isHovering && openFaq !== index) {
      // Generate a random color for hover state
      const colors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-pink-100', 'bg-yellow-100', 'bg-indigo-100'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setFaqButtonColors(prev => ({ ...prev, [index]: randomColor }));
    } else if (!isHovering && openFaq !== index) {
      // Reset to default color when not hovering and not open
      setFaqButtonColors(prev => ({ ...prev, [index]: 'bg-gray-50' }));
    }
  };

  const handleFaqClick = (index: number) => {
    if (openFaq === index) {
      // Closing the FAQ, reset to default color
      setFaqButtonColors(prev => ({ ...prev, [index]: 'bg-gray-50' }));
    } else {
      // Opening the FAQ, set a random color
      const colors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-pink-100', 'bg-yellow-100', 'bg-indigo-100'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setFaqButtonColors(prev => ({ ...prev, [index]: randomColor }));
    }
    toggleFaq(index);
  };

  const nextMentor = () => {
    setCurrentMentorIndex((prev) => (prev + 1) % mentors.length);
    setPlayingVideo(null); // Stop any playing video when switching mentors
  };

  const prevMentor = () => {
    setCurrentMentorIndex((prev) => (prev - 1 + mentors.length) % mentors.length);
    setPlayingVideo(null); // Stop any playing video when switching mentors
  };

  const toggleVideo = (mentorId: number) => {
    setPlayingVideo(playingVideo === mentorId ? null : mentorId);
  };

  const scrollToMentors = () => {
    const mentorsSection = document.getElementById('mentors-section');
    if (mentorsSection) {
      mentorsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTestimonials = () => {
    const testimonialsSection = document.getElementById('testimonials-section');
    if (testimonialsSection) {
      testimonialsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openChatbot = () => {
    setIsChatbotOpen(true);
    setChatbotStep('email');
    setChatbotData({ email: '', subject: '', query: '' });
    setIsSubmitted(false);
  };

  const closeChatbot = () => {
    setIsChatbotOpen(false);
    setChatbotStep('email');
    setChatbotData({ email: '', subject: '', query: '' });
    setIsSubmitted(false);
  };

  const handleChatbotInput = (value: string) => {
    setChatbotData(prev => ({
      ...prev,
      [chatbotStep]: value
    }));
  };

  const nextChatbotStep = () => {
    if (chatbotStep === 'email') {
      setChatbotStep('subject');
    } else if (chatbotStep === 'subject') {
      setChatbotStep('query');
    }
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

  const submitSupportRequest = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: chatbotData.email,
          subject: chatbotData.subject,
          query: chatbotData.query,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send support request');
      }

      const data = await response.json();
      if (data.ok) {
        setIsSubmitted(true);
      } else {
        throw new Error('Failed to send support request');
      }
      
    } catch (error) {
      console.error('Error submitting support request:', error);
      // Optionally show inline error UI in future
    } finally {
      setIsSubmitting(false);
    }
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
  const mentors = [
    {
      id: 1,
      name: "Megha Upadhyay",
      title: "Public Speaking Coach",
      company: "ABP News Alumni",
      experience: "4+ years experience",
      rating: 4.9,
      reviews: 127,
      price: "Rs 500/session",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual video URL
      videoDuration: "2 min video",
      quote: "I used to be uncomfortable speaking in public. Now I help students/professional find their authentic voice and speak with confidence.",
      skills: [
        "Overcoming speaking anxiety",
        "Building executive presence", 
        "Presentation skills for work"
      ],
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=400&fit=crop&crop=face"
    },
    {
      id: 2,
      name: "Marcus Rodriguez",
      title: "Leadership Communication Expert",
      company: "Microsoft Alumni",
      experience: "15+ years experience",
      rating: 4.8,
      reviews: 203,
      price: "$200/session",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual video URL
      videoDuration: "3 min video",
      quote: "Leadership is about inspiring others through clear, confident communication. Let me show you how.",
      skills: [
        "Leadership communication",
        "Team meeting confidence",
        "Executive storytelling"
      ],
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=400&fit=crop&crop=face"
    }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 overflow-x-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {showSpinner && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
          <VideoSpinner size="2xl" />
        </div>
      )}
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="/icons/icon-96x96.png" 
                alt="Confiido Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
              />
              <h1 className="text-lg sm:text-2xl font-bold text-black italic uppercase" style={{ fontFamily: "'BespokeStencil-BoldItalic', sans-serif" }}>Confiido</h1>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={scrollToMentors} 
                className="relative group px-4 py-2 text-gray-700 hover:text-gray-900 transition-all duration-300 font-medium"
                style={{ fontFamily: "'Rubik', sans-serif" }}
              >
                <span className="relative z-10">Explore Mentors</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-gray-600 to-gray-800 group-hover:w-full transition-all duration-300"></div>
              </button>
              <button 
                onClick={scrollToTestimonials} 
                className="relative group px-4 py-2 text-gray-700 hover:text-gray-900 transition-all duration-300 font-medium"
                style={{ fontFamily: "'Rubik', sans-serif" }}
              >
                <span className="relative z-10">Success Stories</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-gray-600 to-gray-800 group-hover:w-full transition-all duration-300"></div>
              </button>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/login" className="text-gray-700 hover:text-gray-900 transition-all duration-300 ease-in-out transform hover:scale-105 px-2 py-1 sm:px-4 sm:py-2 rounded-lg border-2 border-gray-300 hover:border-gray-600 hover:bg-gray-50 text-sm sm:text-base" onClick={handleLoginClick}>
                Login
              </Link>
              <Link href="/signup" className="bg-gradient-to-r from-gray-600 to-gray-800 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg hover:from-gray-700 hover:to-gray-900 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg border border-gray-500 text-sm sm:text-base" onClick={handleSignupClick}>
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight sm:text-7xl mb-4 sm:mb-6">
              <span className="text-gray-900 uppercase" style={{ fontFamily: "'ClashDisplay-Bold', sans-serif" }}>Speak Confidently</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-800 uppercase" style={{ fontFamily: "'ClashDisplay-Semibold', sans-serif" }}>Lead Confidently</span>
            </h1>
            <p className="text-base sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto">
              1-on-1 coaching and self-placed courses to build unshakable public speaking skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-12">
              <Link href="/signup" className="bg-gray-800 text-white px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold rounded-lg hover:bg-gray-900 transition-colors" onClick={handleSignupClick}>
                Book a Free Trial
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
              <div className="flex items-center">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
                <span>No Payment Required</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
                <span>Verified Mentors Only</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
                <span>Reschedule Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Your Mentors Section */}
      <section id="mentors-section" className="py-8 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm font-medium mb-4">
              ✨ Meet Our Coaches
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: "'Rubik', sans-serif" }}>
              Learn From <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-800">Real Experts</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get to know our speaking coaches through their personal stories and see how they can help you
            </p>
          </div>
          
          {/* Mentor Carousel */}
          <div className="relative max-w-5xl mx-auto">
            {/* Navigation Arrows */}
            <button
              onClick={prevMentor}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            
            <button
              onClick={nextMentor}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>

            {/* Mentor Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                {/* Left Side - Photo/Video Area */}
                <div className="lg:w-1/2 relative">
                  {playingVideo === mentors[currentMentorIndex].id ? (
                    <div className="w-full h-80 lg:h-[500px]">
                      <iframe
                        src={mentors[currentMentorIndex].videoUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`${mentors[currentMentorIndex].name} Introduction Video`}
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-80 lg:h-[500px]">
                      <img 
                        src={mentors[currentMentorIndex].image}
                        alt={mentors[currentMentorIndex].name}
                        className="w-full h-full object-cover"
                      />
                      {/* Video Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                        <button
                          onClick={() => toggleVideo(mentors[currentMentorIndex].id)}
                          className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-300 transform hover:scale-110 shadow-lg"
                        >
                          <Play className="w-8 h-8 text-gray-800 ml-1" />
                        </button>
                      </div>
                      {/* Video Duration Badge */}
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                        {mentors[currentMentorIndex].videoDuration}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side - Mentor Details */}
                <div className="lg:w-1/2 p-8 flex flex-col justify-between">
                  <div>
                    {/* Mentor Info */}
                    <div className="mb-6">
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">
                        {mentors[currentMentorIndex].name}
                      </h3>
                      <p className="text-gray-600 font-semibold text-lg mb-1">
                        {mentors[currentMentorIndex].title}
                      </p>
                      <p className="text-gray-500 text-sm mb-4">
                        {mentors[currentMentorIndex].experience} • {mentors[currentMentorIndex].company}
                      </p>
                    </div>

                    {/* Quote */}
                    <div className="bg-gray-100 p-4 rounded-lg mb-6">
                      <p className="text-gray-700 text-sm leading-relaxed italic">
                        &quot;{mentors[currentMentorIndex].quote}&quot;
                      </p>
                    </div>

                    {/* Skills */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">What I can help you with:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        {mentors[currentMentorIndex].skills.map((skill, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Section - Rating and Price */}
                  <div className="flex items-center justify-center pt-6 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        {mentors[currentMentorIndex].rating} ({mentors[currentMentorIndex].reviews} reviews)
                      </span>
                      <span className="font-semibold text-gray-900">
                        {mentors[currentMentorIndex].price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {mentors.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMentorIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentMentorIndex ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Get Started in 3 Easy Steps Section */}
      <section id="mentors" className="py-16 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>Get Started in 3 Easy Steps</h2>
            <p className="text-xl text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>Follow these three simple steps to begin your speaking transformation journey</p>
          </div>
          
          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 - Red */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg shadow-gray-300">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>Book Your Session</h3>
              <p className="text-gray-600 mb-6 leading-relaxed" style={{ fontFamily: "'Rubik', sans-serif" }}>
                Choose your preferred coach and schedule a personalized 1-on-1 session at a time that works best for you.
              </p>
            </div>

            {/* Step 2 - Gray */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg shadow-gray-300">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>Make Payment</h3>
              <p className="text-gray-600 mb-6 leading-relaxed" style={{ fontFamily: "'Rubik', sans-serif" }}>
                Secure your session with our easy payment process. Multiple payment options available for your convenience.
              </p>
            </div>

            {/* Step 3 - Gray */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg shadow-gray-300">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>Join via Google Meet</h3>
              <p className="text-gray-600 mb-6 leading-relaxed" style={{ fontFamily: "'Rubik', sans-serif" }}>
                Connect with your mentor seamlessly through Google Meet for your personalized coaching session.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Love & Praise by The Mentees Section */}
      <section id="testimonials-section" className="py-16 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>Love & Praise by <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-800">The Mentees</span></h2>
            <p className="text-xl text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>Get inspired by the real-life experiences of our students and their journey to success with Confiido.</p>
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
                    <div className={`${getRandomBackgroundColor(slideIndex)} rounded-xl p-2 sm:p-6 shadow-lg ${getRandomShadowColor(slideIndex)} border border-gray-100 h-64 sm:h-80 transform transition-all duration-300 hover:scale-105`}>
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
                          <span className="text-xs text-gray-600 font-medium bg-gray-100 px-1 sm:px-2 py-1 rounded-full">
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
                    <div className={`${getRandomBackgroundColor(slideIndex)} rounded-xl p-2 sm:p-6 shadow-lg ${getRandomShadowColor(slideIndex)} border border-gray-100 h-64 sm:h-80 transform transition-all duration-300 hover:scale-105`}>
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
                          <span className="text-xs text-gray-600 font-medium bg-gray-100 px-1 sm:px-2 py-1 rounded-full">
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
      <section className="py-12 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-medium mb-3">
              🎯 Perfect Match
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Rubik', sans-serif" }}>
              Who This is <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-800">For</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6" style={{ fontFamily: "'Rubik', sans-serif" }}>
              Help yourself identify if our coaching is the perfect fit for your journey
            </p>
            
            {/* Category Toggle Buttons */}
            <div className="flex justify-center mb-8">
              <button
                onClick={() => setSelectedCategory('student')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 mr-1 ${
                  selectedCategory === 'student'
                    ? 'bg-gradient-to-r from-gray-600 to-gray-800 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
                }`}
              >
                For Students
              </button>
              <button
                onClick={() => setSelectedCategory('professional')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ml-1 ${
                  selectedCategory === 'professional'
                    ? 'bg-gradient-to-r from-gray-600 to-gray-800 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
                }`}
              >
                For Professionals
              </button>
            </div>

            <p className="text-base text-gray-600 font-semibold" style={{ fontFamily: "'Rubik', sans-serif" }}>
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
      <section className="py-16 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-medium mb-3">
              ❓ Questions & Answers
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Rubik', sans-serif" }}>
              Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-800">Questions</span>
            </h2>
            <p className="text-lg text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>
              Get answers to the most common questions about our coaching sessions
            </p>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 - Can I get refund? */}
            <div className={`${faqButtonColors[0] || 'bg-gray-50'} rounded-xl border border-gray-200 overflow-hidden transition-colors duration-300`}>
              <button 
                onClick={() => handleFaqClick(0)}
                onMouseEnter={() => handleFaqHover(0, true)}
                onMouseLeave={() => handleFaqHover(0, false)}
                className="w-full p-6 text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
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
            <div className={`${faqButtonColors[1] || 'bg-gray-50'} rounded-xl border border-gray-200 overflow-hidden transition-colors duration-300`}>
              <button 
                onClick={() => handleFaqClick(1)}
                onMouseEnter={() => handleFaqHover(1, true)}
                onMouseLeave={() => handleFaqHover(1, false)}
                className="w-full p-6 text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
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
            <div className={`${faqButtonColors[2] || 'bg-gray-50'} rounded-xl border border-gray-200 overflow-hidden transition-colors duration-300`}>
              <button 
                onClick={() => handleFaqClick(2)}
                onMouseEnter={() => handleFaqHover(2, true)}
                onMouseLeave={() => handleFaqHover(2, false)}
                className="w-full p-6 text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
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
            <div className={`${faqButtonColors[3] || 'bg-gray-50'} rounded-xl border border-gray-200 overflow-hidden transition-colors duration-300`}>
              <button 
                onClick={() => handleFaqClick(3)}
                onMouseEnter={() => handleFaqHover(3, true)}
                onMouseLeave={() => handleFaqHover(3, false)}
                className="w-full p-6 text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">?</span>
                    </div>
                    Will this help me if I&apos;m an introvert?
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
            <button onClick={openChatbot} className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-800 text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-900 transition-all duration-300">
              Contact Support <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-gray-600 to-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>Ready to supercharge your career?</h2>
          <p className="text-xl text-white/90 mb-8" style={{ fontFamily: "'Rubik', sans-serif" }}>Join thousands of professionals who have accelerated their careers with mentorship</p>
          <div className="flex justify-center">
            <Link href="/signup" className="bg-white text-gray-800 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors" onClick={handleSignupClick}>
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
              <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>Confiido</h3>
              <p className="text-gray-400" style={{ fontFamily: "'Rubik', sans-serif" }}>Connecting ambitious professionals with industry experts for career acceleration.</p>
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
            <p className="text-gray-400">©2025 Confiido. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Support Button */}
      {!isChatbotOpen && (
        <button
          onClick={openChatbot}
          className="fixed bottom-4 right-4 z-40 w-14 h-14 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chatbot */}
      {isChatbotOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] h-[600px]">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
            {/* Chatbot Header */}
            <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-semibold">Support Chat</h3>
              </div>
              <button
                onClick={closeChatbot}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Welcome Message */}
            <div className="p-4 text-center border-b border-gray-100">
              <h4 className="text-lg font-semibold text-gray-800">Welcome to Confiido</h4>
              <p className="text-sm text-gray-600 mt-1">How can we help you today?</p>
            </div>

            {/* Chatbot Content */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Progress Indicator */}
              <div className="flex space-x-2">
                {['email', 'subject', 'query'].map((step, index) => (
                  <div
                    key={step}
                    className={`w-8 h-2 rounded-full ${
                      index <= ['email', 'subject', 'query'].indexOf(chatbotStep)
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Chat Messages / Success */}
              {!isSubmitted ? (
              <div className="space-y-3">
                {/* Bot Message */}
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-gray-700">
                      {chatbotStep === 'email' && "Hi! I'm here to help. What's your email address?"}
                      {chatbotStep === 'subject' && "Great! What's the subject of your inquiry?"}
                      {chatbotStep === 'query' && "Perfect! Please describe your query in detail."}
                    </p>
                  </div>
                </div>

                {/* User Input */}
                <div className="flex items-start space-x-2 justify-end">
                  <div className="bg-blue-600 text-white rounded-lg p-3 max-w-xs">
                    <p className="text-sm">
                      {chatbotStep === 'email' && (chatbotData.email || 'Entering email...')}
                      {chatbotStep === 'subject' && (chatbotData.subject || 'Entering subject...')}
                      {chatbotStep === 'query' && (chatbotData.query || 'Entering query...')}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-600">U</span>
                  </div>
                </div>
              </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-10">
                  <div className="relative">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                    <div className="absolute inset-0 rounded-full border-4 border-green-300 animate-ping" />
                  </div>
                  <h5 className="mt-4 text-lg font-semibold text-gray-800">Your response has been submitted</h5>
                  <p className="text-sm text-gray-600 mt-1 text-center">We will get back to you at {chatbotData.email}</p>
                </div>
              )}

            </div>

            {/* Input / Actions - Fixed at bottom */}
            <div className="p-4 border-t border-gray-100 space-y-3">
              {isSubmitted ? (
                <button
                  onClick={closeChatbot}
                  className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              ) : (<>
              {chatbotStep === 'email' && (
                <>
                  <input
                    type="email"
                    value={chatbotData.email}
                    onChange={(e) => handleChatbotInput(e.target.value)}
                    placeholder="Enter your email address"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      chatbotData.email && !isValidEmailForSupport(chatbotData.email)
                        ? 'border-red-400'
                        : 'border-gray-300'
                    }`}
                    autoFocus
                  />
                  {/* Helper message intentionally hidden; validation still enforced via disabled Next button */}
                </>
              )}
              
              {chatbotStep === 'subject' && (
                <input
                  type="text"
                  value={chatbotData.subject}
                  onChange={(e) => handleChatbotInput(e.target.value)}
                  placeholder="Enter the subject of your inquiry"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              )}
              
              {chatbotStep === 'query' && (
                <textarea
                  value={chatbotData.query}
                  onChange={(e) => handleChatbotInput(e.target.value)}
                  placeholder="Describe your query in detail..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  autoFocus
                />
              )}

              {/* Action Buttons */}
               <div className="flex space-x-2">
                 {chatbotStep !== 'query' ? (
                  <button
                    onClick={nextChatbotStep}
                     disabled={! (chatbotData as any)[chatbotStep] || (chatbotStep === 'email' && !isValidEmailForSupport(chatbotData.email))}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={submitSupportRequest}
                    disabled={!chatbotData.query || isSubmitting}
                    className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <video autoPlay loop muted playsInline className="w-6 h-6 object-contain" style={{ pointerEvents: 'none' }}>
                          <source src="/spinner.webm" type="video/webm" />
                        </video>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              </>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
