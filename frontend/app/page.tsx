'use client';

import { ArrowRight, Star, Users, Clock, Shield, Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Play, MessageCircle, X, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Testimonials from './components/ui/testimonials';
import { HeroGeometric } from './components/ui/shape-landing-hero';
import { MoonLoader } from 'react-spinners';
import { useAuth } from './contexts/AuthContext';
import '/public/WEB/css/clash-grotesk.css';
import '/public/web1/css/bespoke-stencil.css';
import '/public/web1/css/clash-display.css';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "./components/ui/resizable-navbar";

// Spinner component - Defined outside to prevent re-renders
const CenterSpinner = memo(() => (
  <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(255, 255, 255, 0.7)' }}>
    <MoonLoader color="#000000" size={60} />
  </div>
));
CenterSpinner.displayName = 'CenterSpinner';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonialSlide, setCurrentTestimonialSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isTestimonialPaused, setIsTestimonialPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'student' | 'professional'>('student');
  const [currentMentorIndex, setCurrentMentorIndex] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
  const [faqButtonColors, setFaqButtonColors] = useState<{ [key: number]: string }>({});
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatbotStep, setChatbotStep] = useState<'email' | 'subject' | 'query'>('email');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [chatbotData, setChatbotData] = useState({
    email: '',
    subject: '',
    query: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  // Auto-redirect logged-in users to dashboard
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      
      // If user is already authenticated, redirect to dashboard
      if (user || token) {
        console.log('User already logged in, redirecting to dashboard from home page');
        router.push('/dashboard');
      }
    };

    // Only check when loading is complete
    if (!loading) {
      checkAuth();
    }
  }, [user, loading, router]);

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
    setIsLoginLoading(true);
    // Simulate loading time for better UX
    setTimeout(() => {
      router.push('/login');
    }, 1000);
  };

  const handleSignupClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.preventDefault();
    setIsSignupLoading(true);
    // Simulate loading time for better UX
    setTimeout(() => {
      router.push('/signup');
    }, 1000);
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
    const testimonialsSection = document.getElementById('success-stories');
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
      title: "Journalist",
      company: "Ex-ABP News, IIMC Alumni",
      experience: "4+ years experience",
      rating: 4.9,
      reviews: 127,
      price: "Rs 750/session",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual video URL
      videoDuration: "2 min video",
      quote: "I started on Confiido to help students/professional find their authentic voice and speak with confidence.",
      skills: [
        "Overcoming speaking anxiety", 
        "Confident on-camera communication",
        "Voice modulation and tone control",
        "Structuring impactful speeches",
        "Storytelling for influence",
        "Interview performance coaching",
        "Handling stage fright and impromptu speaking"
      ],
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=400&fit=crop&crop=face"
    },
    {
      id: 2,
      name: "Ajatika Singh",
      title: "Journalist",
      company: "ABP News",
      experience: "8+ years experience",
      rating: 4.8,
      reviews: 203,
      price: "Rs 750/session",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual video URL
      videoDuration: "3 min video",
      quote: "Leadership is about inspiring others through clear, confident communication. Let me show you how.",
      skills: [
        "Leadership communication",
          "Impromptu speaking and Q&A mastery",
          "Crafting memorable introductions",
          "Non-verbal communication and body language",
          "Persuasive storytelling for impact",
          "Structuring complex ideas simply"
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
      content: "Before joining, I wasn't that confident about interviews for on-camera roles, though I did have good enough understanding of concepts but 'what I don't know' was stopping me to apply for such roles. Ma'am made it realised that it's an iterative process, I'll learn to tackle my loopholes by actually giving interviews.",
      mentor: {
        name: "Megha Updadhyay",
        title: "Ex-ABP News",
        avatar: "MU"
      }
    },
    {
      name: "Pradeep M",
      avatar: "PM",
      content: "Just wanted to say a big thank you for your insightful guidance. Your clear advice on improving my speaking and writing skills was exactly what I needed. I appreciate your genuine interest in my growth, and I'm excited to start working on your suggestions.",
      mentor: {
        name: "Ajatika Singh",
        title: "ABP News",
        avatar: "AS"
      }
    },
    {
      name: "Kirti Sharma",
      avatar: "KS",
      content: "Happy to talk to you!! I loved the way she was clearing my doubts related to my career. She is frank, loving and motivating person. I recommend everyone to take advice from her as she is very genuine and realistic in nature.",
      mentor: {
        name: "Megha Updadhyay",
        title: "Ex-ABP News",
        avatar: "MU"
      }
    },
    {
      name: "Abhijeet Pathak",
      avatar: "AP",
      content: "I recently had a conversation with a Megha Didi who guided me regarding my career and shared valuable advice. she patiently answered all my questions and motivated me to work hard and stay focused. The guidance I received has given me clarity and confidence to move forward in life, not just in my career but in every field. I am truly grateful for their time and support. Thank so much didi for being such a positive influence.🙏🏻❤️I am always grateful to you.",
      mentor: {
        name: "Megha Upadhyay",
        title: "Ex-ABP News",
        avatar: "MU"
      }
    },
    {
      name: "Harjeet Kaur",
      avatar: "HK",
      content: "The call is really worth it. And very helpful. I could say she is the best person to guide in the caarer.",
      mentor: {
        name: "Ajatika Singh",
        title: "ABP News",
        avatar: "AS"
      }
    },
    {
      name: "Arvind",
      avatar: "AR",
      content: "It was nice talking to Megha. She patiently clarified each and every doubt I had. Thank you, Megha.",
      mentor: {
        name: "Megha Upadhyay",
        title: "Ex-ABP News",
        avatar: "MU"
      }
    },
    {
      name: "Shruti Suman",
      avatar: "SS",
      content: "The session was extremely wonderful! Being a fresher it always seems to be hard or almost impossible to get in touch with the people who are already on a good note or position. It was truly grateful of maam , the way she thought and explained me the things in such a friendly and easy manner that made me comfortable to express and put on my points and queries freely , along with that she really helped me overcome finding a solution for me. Thanks to her! I would really suggest the students to have a session with her , you will really be amazed and happy finding it very helpful.",
      mentor: {
        name: "Megha Upadhyay",
        title: "Ex-ABP News",
        avatar: "MU"
      }
    },
    {
      name: "Sunny Shukla",
      avatar: "SS",
      content: "It was nice talking to Ajatika Ma'am. She patiently clarified each and every doubt I had. Thank you ma'am.",
      mentor: {
        name: "Ajatika Singh",
        title: "ABP News",
        avatar: "AS"
      }
    }
  ];

  const categories = [
    "Career Guidance", "Public Speaking", "Debate", "Mentorship", "Others"
  ];

  const navItems = [
    {
      name: "Explore Mentors",
      link: "#mentors",
      onClick: scrollToMentors
    },
    {
      name: "Success Stories",
      link: "#testimonials",
      onClick: scrollToTestimonials
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden relative safe-area-main" style={{ backgroundColor: '#B6CEB4', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* Simple, performant background pattern - removed for clean look */}
      
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Navigation */}
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-3">
            <NavbarButton variant="secondary" href="/login" onClick={handleLoginClick}>
              Login
            </NavbarButton>
            <NavbarButton variant="primary" href="/signup" onClick={handleSignupClick}>
              Sign Up
            </NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <button
                key={`mobile-link-${idx}`}
                onClick={() => {
                  item.onClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left text-white/90 hover:text-white py-3 px-4 rounded-lg hover:bg-white/10 transition-colors duration-200"
                style={{ fontFamily: "'Rubik', sans-serif" }}
              >
                {item.name}
              </button>
            ))}
            <div className="flex w-full flex-col gap-3 pt-4 border-t border-white/10">
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLoginClick({} as any);
                }}
                variant="secondary"
                className="w-full justify-center"
                href="/login"
              >
                Login
              </NavbarButton>
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignupClick({} as any);
                }}
                variant="primary"
                className="w-full justify-center"
                href="/signup"
              >
                Sign Up
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Hero Section */}
      <HeroGeometric 
        title1="Speak with Confidence"
        title2="Lead with Clarity"
        description="Master the art of speaking with 1-on-1 coaching and self-paced learning. Build your confidence. Become unforgettable."
        buttonText="Book your Session"
        onButtonClick={() => {
          setIsSignupLoading(true);
          setTimeout(() => {
            router.push('/signup');
          }, 1000);
        }}
      />

      {/* Meet Your Mentors Section */}
      <section id="mentors-section" className="py-8 bg-white/60 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm font-medium mb-4">
                ✨ Meet Our Coaches
              </div>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl font-bold text-gray-900 mb-6" 
              style={{ fontFamily: "'Rubik', sans-serif" }}
            >
              Learn From <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-800">Real Experts</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Get to know our speaking coaches through their personal stories and see how they can help you
            </motion.p>
          </div>
          
          {/* Mentor Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative max-w-5xl mx-auto"
          >
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
              <div className="flex flex-col lg:flex-row lg:h-[500px]">
                {/* Left Side - Photo/Video Area */}
                <div className="lg:w-1/2 relative">
                  {playingVideo === mentors[currentMentorIndex].id ? (
                    <div className="w-full h-80 lg:h-full">
                      <iframe
                        src={mentors[currentMentorIndex].videoUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`${mentors[currentMentorIndex].name} Introduction Video`}
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-80 lg:h-full">
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
                <div className="lg:w-1/2 p-8 flex flex-col">
                  <div className="flex-1 overflow-y-auto">
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
                            <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                            <span>{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Section - Rating and Price */}
                  <div className="flex items-center justify-center pt-6 border-t border-gray-100 flex-shrink-0">
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
          </motion.div>
        </div>
      </section>

      {/* Get Started in 3 Easy Steps Section */}
      <section id="mentors" className="py-8 md:py-16 bg-white/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4" 
              style={{ fontFamily: "'Rubik', sans-serif" }}
            >
              Get Started in 3 Easy Steps
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-base md:text-xl text-gray-600 px-4" 
              style={{ fontFamily: "'Rubik', sans-serif" }}
            >
              Follow these three simple steps to begin your speaking transformation journey
            </motion.p>
          </div>
          
          {/* 4 Cards in One Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {/* Card 1 - Number 3 with Steps and Arrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              whileHover={{ 
                scale: 1.05, 
                rotate: [0, -2, 2, 0],
                transition: { duration: 0.3 }
              }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
              className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl md:rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform min-h-[200px] md:min-h-auto"
            >
              <motion.div 
                className="text-5xl md:text-8xl font-bold text-white mb-2 md:mb-4"
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                3
              </motion.div>
              <motion.div 
                className="text-xl md:text-2xl font-semibold text-white mb-4 md:mb-6" 
                style={{ fontFamily: "'Rubik', sans-serif" }}
                whileHover={{ letterSpacing: "0.1em" }}
                transition={{ duration: 0.3 }}
              >
                Steps
              </motion.div>
              <motion.div 
                className="text-white text-2xl md:text-4xl"
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                →
              </motion.div>
            </motion.div>

            {/* Card 2 - Step 1: Book Your Session */}
            <motion.div
              initial={{ opacity: 0, x: -50, y: 30 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              whileHover={{ 
                scale: 1.05, 
                y: -10,
                transition: { duration: 0.3 }
              }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 100 }}
              className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl md:rounded-2xl p-5 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-red-200 cursor-pointer transform hover:border-red-300"
            >
              <motion.div 
                className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl font-bold mb-4 md:mb-6 shadow-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                1
              </motion.div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>
                Book Your Session
              </h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed" style={{ fontFamily: "'Rubik', sans-serif" }}>
                Choose your preferred coach and schedule a personalized 1-on-1 session at a time that works best for you.
              </p>
            </motion.div>

            {/* Card 3 - Step 2: Make Payment */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.05, 
                y: -10,
                transition: { duration: 0.3 }
              }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6, type: "spring", stiffness: 100 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl md:rounded-2xl p-5 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-blue-200 cursor-pointer transform hover:border-blue-300"
            >
              <motion.div 
                className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl font-bold mb-4 md:mb-6 shadow-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                2
              </motion.div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>
                Make Payment
              </h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed" style={{ fontFamily: "'Rubik', sans-serif" }}>
                Secure your session with our easy payment process. Multiple payment options available for your convenience.
              </p>
            </motion.div>

            {/* Card 4 - Step 3: Join via Google Meet */}
            <motion.div
              initial={{ opacity: 0, x: 50, y: 30 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              whileHover={{ 
                scale: 1.05, 
                y: -10,
                transition: { duration: 0.3 }
              }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.7, type: "spring", stiffness: 100 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl md:rounded-2xl p-5 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-green-200 cursor-pointer transform hover:border-green-300"
            >
              <motion.div 
                className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl font-bold mb-4 md:mb-6 shadow-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                3
              </motion.div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>
                Join via Google Meet
              </h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed" style={{ fontFamily: "'Rubik', sans-serif" }}>
                Connect with your mentor seamlessly through Google Meet for your personalized coaching session.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* New Testimonials Section */}
      <Testimonials />



      {/* Who This is For Section */}
      <section className="py-8 md:py-12 bg-white/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-6 md:mb-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-medium mb-2 md:mb-3">
                🎯 Perfect Match
              </div>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3" 
              style={{ fontFamily: "'Rubik', sans-serif" }}
            >
              Who This is <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-800">For</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-4 md:mb-6" 
              style={{ fontFamily: "'Rubik', sans-serif" }}
            >
              Help yourself identify if our coaching is the perfect fit for your journey
            </motion.p>
            
            <p className="text-sm md:text-base text-gray-600 font-semibold mb-6 md:mb-10" style={{ fontFamily: "'Rubik', sans-serif" }}>
              Confido is designed for those who want their voice to inspire, influence and impact.
            </p>
          </div>

          {/* 4 Cards Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {/* Card 1 - Toggle Card with Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              whileHover={{ 
                scale: 1.05, 
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 100 }}
              className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg hover:shadow-2xl relative overflow-hidden cursor-pointer transform-gpu"
              style={{ perspective: "1000px" }}
            >
              <motion.div 
                className="text-center mb-3 md:mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6" style={{ fontFamily: "'Rubik', sans-serif" }}>
                  {selectedCategory === 'student' ? 'Student' : 'Professional'}
                </h3>
              </motion.div>

              {/* Image Container */}
              <motion.div 
                key={selectedCategory}
                initial={{ opacity: 0, scale: 0.8, rotateX: 90 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
                className="relative w-full h-32 md:h-48 mb-4 md:mb-6 rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-md"
              >
                {selectedCategory === 'student' ? (
                  <motion.div 
                    className="text-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div 
                      className="text-4xl md:text-6xl mb-2"
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      🎓
                    </motion.div>
                    <p className="text-xs md:text-sm font-semibold text-gray-700">Student Life</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="text-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div 
                      className="text-4xl md:text-6xl mb-2"
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      💼
                    </motion.div>
                    <p className="text-xs md:text-sm font-semibold text-gray-700">Professional</p>
                  </motion.div>
                )}
              </motion.div>

              {/* Switch Button */}
              <div className="flex justify-center">
                <motion.button
                  onClick={() => setSelectedCategory(selectedCategory === 'student' ? 'professional' : 'student')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative inline-flex h-10 w-20 md:h-12 md:w-24 items-center rounded-full bg-gradient-to-r from-gray-600 to-gray-800 transition-all duration-300 hover:shadow-lg focus:outline-none"
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 700, damping: 30 }}
                    className={`inline-block h-8 w-8 md:h-10 md:w-10 transform rounded-full bg-white shadow-lg transition ${
                      selectedCategory === 'professional' ? 'translate-x-10 md:translate-x-12' : 'translate-x-1'
                    }`}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    {selectedCategory === 'student' ? 'S' : 'P'}
                  </span>
                </motion.button>
              </div>
            </motion.div>

            {/* Cards 2, 3, 4 - Content Cards */}
            {selectedCategory === 'student' ? (
              <>
                {/* Card 2 - School Students */}
                <motion.div
                  key="school-students"
                  initial={{ opacity: 0, x: -50, rotateY: -20 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: -50, rotateY: -20 }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -10,
                    boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)",
                    transition: { duration: 0.3 }
                  }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 100 }}
                  className="bg-white p-5 md:p-6 rounded-xl md:rounded-2xl border-2 border-green-200 shadow-lg hover:border-green-400 transition-all duration-300 cursor-pointer transform-gpu"
                >
                  <motion.div 
                    className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-md"
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Star className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </motion.div>
                  <motion.h3 
                    className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4" 
                    style={{ fontFamily: "'Rubik', sans-serif" }}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    School Students
                  </motion.h3>
                  <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-700">
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Students participating in debates</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Class representatives and student leaders</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Young minds building early skills</span>
                    </motion.li>
                  </ul>
                </motion.div>

                {/* Card 3 - College Students */}
                <motion.div
                  key="college-students"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -10,
                    boxShadow: "0 20px 40px rgba(168, 85, 247, 0.3)",
                    transition: { duration: 0.3 }
                  }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 100 }}
                  className="bg-white p-5 md:p-6 rounded-xl md:rounded-2xl border-2 border-purple-200 shadow-lg hover:border-purple-400 transition-all duration-300 cursor-pointer transform-gpu"
                >
                  <motion.div 
                    className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-md"
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Calendar className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </motion.div>
                  <motion.h3 
                    className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4" 
                    style={{ fontFamily: "'Rubik', sans-serif" }}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    College Students
                  </motion.h3>
                  <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-700">
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Students preparing for presentations</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Campus leaders and organization heads</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Job seekers preparing for interviews</span>
                    </motion.li>
                  </ul>
                </motion.div>

                {/* Card 4 - Students with Stage Fear */}
                <motion.div
                  key="stage-fear"
                  initial={{ opacity: 0, x: 50, rotateY: 20 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: 50, rotateY: 20 }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -10,
                    boxShadow: "0 20px 40px rgba(249, 115, 22, 0.3)",
                    transition: { duration: 0.3 }
                  }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 100 }}
                  className="bg-white p-5 md:p-6 rounded-xl md:rounded-2xl border-2 border-orange-200 shadow-lg hover:border-orange-400 transition-all duration-300 cursor-pointer transform-gpu"
                >
                  <motion.div 
                    className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-md"
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Shield className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </motion.div>
                  <motion.h3 
                    className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4" 
                    style={{ fontFamily: "'Rubik', sans-serif" }}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    Students with Stage Fear
                  </motion.h3>
                  <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-700">
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-orange-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Those nervous before speaking publicly</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-orange-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Students avoiding speaking opportunities</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-orange-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Anyone ready to overcome anxiety</span>
                    </motion.li>
                  </ul>
                </motion.div>
              </>
            ) : (
              <>
                {/* Card 2 - Working Professionals */}
                <motion.div
                  key="working-professionals"
                  initial={{ opacity: 0, x: -50, rotateY: -20 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: -50, rotateY: -20 }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -10,
                    boxShadow: "0 20px 40px rgba(20, 184, 166, 0.3)",
                    transition: { duration: 0.3 }
                  }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 100 }}
                  className="bg-white p-5 md:p-6 rounded-xl md:rounded-2xl border-2 border-teal-200 shadow-lg hover:border-teal-400 transition-all duration-300 cursor-pointer transform-gpu"
                >
                  <motion.div 
                    className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-md"
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                  >
                    <ArrowRight className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </motion.div>
                  <motion.h3 
                    className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4" 
                    style={{ fontFamily: "'Rubik', sans-serif" }}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    Working Professionals
                  </motion.h3>
                  <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-700">
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-teal-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Professionals seeking career advancement</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-teal-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Team leaders and managers</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-teal-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Anyone wanting confident communication</span>
                    </motion.li>
                  </ul>
                </motion.div>

                {/* Card 3 - Aspiring Professionals */}
                <motion.div
                  key="aspiring-professionals"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -10,
                    boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)",
                    transition: { duration: 0.3 }
                  }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 100 }}
                  className="bg-white p-5 md:p-6 rounded-xl md:rounded-2xl border-2 border-blue-200 shadow-lg hover:border-blue-400 transition-all duration-300 cursor-pointer transform-gpu"
                >
                  <motion.div 
                    className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-md"
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Users className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </motion.div>
                  <motion.h3 
                    className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4" 
                    style={{ fontFamily: "'Rubik', sans-serif" }}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    Aspiring Professionals
                  </motion.h3>
                  <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-700">
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Recent graduates entering the workforce</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Career changers seeking new opportunities</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Entrepreneurs building their personal brand</span>
                    </motion.li>
                  </ul>
                </motion.div>

                {/* Card 4 - Executive Leaders */}
                <motion.div
                  key="executive-leaders"
                  initial={{ opacity: 0, x: 50, rotateY: 20 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: 50, rotateY: 20 }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -10,
                    boxShadow: "0 20px 40px rgba(99, 102, 241, 0.3)",
                    transition: { duration: 0.3 }
                  }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 100 }}
                  className="bg-white p-5 md:p-6 rounded-xl md:rounded-2xl border-2 border-indigo-200 shadow-lg hover:border-indigo-400 transition-all duration-300 cursor-pointer transform-gpu"
                >
                  <motion.div 
                    className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-md"
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Shield className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </motion.div>
                  <motion.h3 
                    className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4" 
                    style={{ fontFamily: "'Rubik', sans-serif" }}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    Executive Leaders
                  </motion.h3>
                  <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-700">
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>C-suite executives and directors</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Public speakers and thought leaders</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                      <span>Industry experts sharing knowledge</span>
                    </motion.li>
                  </ul>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-black">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold text-white mb-3" 
              style={{ fontFamily: "'Rubik', sans-serif" }}
            >
              Frequently asked questions
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-base text-gray-400" 
              style={{ fontFamily: "'Rubik', sans-serif" }}
            >
              Hopefully we can answer all your questions here.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-6"
          >
            {/* FAQ 1 - How do I get started? */}
            <div>
              <button 
                onClick={() => handleFaqClick(0)}
                className="w-full p-5 text-left transition-colors duration-200 focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-normal text-white">
                    How do I get started?
                  </h3>
                  <motion.div
                    animate={{ rotate: openFaq === 0 ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence initial={false}>
                {openFaq === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ transformOrigin: 'top' }}
                    className="px-5 pb-5 bg-gray-800 rounded-lg mt-2"
                  >
                    <p className="text-gray-300 leading-relaxed pt-4">
                      Simply sign up and follow the onboarding process.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FAQ 2 - What payment methods do you accept? */}
            <div>
              <button 
                onClick={() => handleFaqClick(1)}
                className="w-full p-5 text-left transition-colors duration-200 focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-normal text-white">
                    What payment methods do you accept?
                  </h3>
                  <motion.div
                    animate={{ rotate: openFaq === 1 ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence initial={false}>
                {openFaq === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ transformOrigin: 'top' }}
                    className="px-5 pb-5 bg-gray-800 rounded-lg mt-2"
                  >
                    <p className="text-gray-300 leading-relaxed pt-4">
                      We accept payments through Razorpay, including UPI, credit cards, debit cards, net banking, and wallets.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FAQ 3 - What is the refund policy? */}
            <div>
              <button 
                onClick={() => handleFaqClick(2)}
                className="w-full p-5 text-left transition-colors duration-200 focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-normal text-white">
                    What is the refund policy?
                  </h3>
                  <motion.div
                    animate={{ rotate: openFaq === 2 ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence initial={false}>
                {openFaq === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ transformOrigin: 'top' }}
                    className="px-5 pb-5 bg-gray-800 rounded-lg mt-2"
                  >
                    <p className="text-gray-300 leading-relaxed pt-4">
                      We truly value your trust in booking a session with us. Since each session is personalized and time is reserved exclusively for you, all bookings are non-refundable. However, if you're unable to attend, we'll be happy to help you reschedule (subject to availability).
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FAQ 4 - Are sessions online? */}
            <div>
              <button 
                onClick={() => handleFaqClick(3)}
                className="w-full p-5 text-left transition-colors duration-200 focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-normal text-white">
                    Are sessions conducted online?
                  </h3>
                  <motion.div
                    animate={{ rotate: openFaq === 3 ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence initial={false}>
                {openFaq === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ transformOrigin: 'top' }}
                    className="px-5 pb-5 bg-gray-800 rounded-lg mt-2"
                  >
                    <p className="text-gray-300 leading-relaxed pt-4">
                      Yes, all our coaching sessions are conducted online via Google Meet. This allows you to learn from the comfort of your own space and gives us access to top coaches worldwide. You'll receive a meeting link before your session, and all you need is a stable internet connection and a device with a camera.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* FAQ CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mt-10"
          >
            <p className="text-gray-400 mb-4">Still have questions?</p>
            <button onClick={openChatbot} className="inline-flex items-center px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all duration-300">
              Contact Support <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            {/* Brand Section */}
            <div className="max-w-md">
              <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>Confiido</h3>
              <p className="text-gray-400" style={{ fontFamily: "'Rubik', sans-serif" }}>Connecting ambitious professionals with industry experts for career acceleration.</p>
            </div>
            
            {/* Company Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => setIsAboutOpen(true)} className="hover:text-white transition-colors text-left">About</button></li>
                <li><button onClick={() => setIsContactOpen(true)} className="hover:text-white transition-colors text-left">Contact Us</button></li>
                <li><button onClick={() => setIsTermsOpen(true)} className="hover:text-white transition-colors text-left">Terms Of Service</button></li>
                <li><button onClick={() => setIsPrivacyOpen(true)} className="hover:text-white transition-colors text-left">Privacy</button></li>
              </ul>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">©2025 Confiido. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Center Loading Spinner */}
      {(isLoginLoading || isSignupLoading) && <CenterSpinner />}

      {/* Floating Support Button */}
      {!isChatbotOpen && (
        <motion.button
          onClick={openChatbot}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-gradient-to-br from-gray-700 via-gray-800 to-black text-white rounded-full shadow-2xl hover:shadow-gray-900/50 transition-all duration-300 flex items-center justify-center border border-gray-600"
        >
          <MessageCircle className="w-7 h-7" />
        </motion.button>
      )}

      {/* Chatbot */}
      {isChatbotOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[650px]"
        >
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl shadow-2xl border border-gray-800 overflow-hidden h-full flex flex-col backdrop-blur-xl">
            {/* Chatbot Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white p-5 flex items-center justify-between border-b border-gray-800"
            >
              <div className="flex items-center space-x-3">
                <motion.div 
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-lg"
                >
                  <MessageCircle className="w-5 h-5" />
                </motion.div>
                <div>
                  <h3 className="font-bold text-lg" style={{ fontFamily: "'Rubik', sans-serif" }}>Support Chat</h3>
                  <p className="text-xs text-gray-400">We're here to help</p>
                </div>
              </div>
              <motion.button
                onClick={closeChatbot}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {/* Welcome Message */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-5 text-center border-b border-gray-800 bg-gradient-to-b from-gray-900 to-black"
            >
              <h4 className="text-xl font-bold text-white" style={{ fontFamily: "'Rubik', sans-serif" }}>Welcome to Confiido</h4>
              <p className="text-sm text-gray-400 mt-2">How can we assist you today?</p>
            </motion.div>

            {/* Chatbot Content */}
            <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-black/40 backdrop-blur-sm">
              {/* Progress Indicator */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex space-x-2 mb-6"
              >
                {['email', 'subject', 'query'].map((step, index) => (
                  <motion.div
                    key={step}
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      index <= ['email', 'subject', 'query'].indexOf(chatbotStep)
                        ? 'bg-gradient-to-r from-gray-600 to-gray-800 shadow-lg shadow-gray-800/50'
                        : 'bg-gray-800'
                    }`}
                  />
                ))}
              </motion.div>

              {/* Chat Messages / Success */}
              {!isSubmitted ? (
              <div className="space-y-4">
                {/* Bot Message */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-start space-x-3"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center shadow-lg border border-gray-700 flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-gray-300" />
                  </div>
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl rounded-tl-none p-4 max-w-xs shadow-xl border border-gray-700"
                  >
                    <p className="text-sm text-gray-200">
                      {chatbotStep === 'email' && "Hi! 👋 I'm here to help. What's your email address?"}
                      {chatbotStep === 'subject' && "Great! 📧 What's the subject of your inquiry?"}
                      {chatbotStep === 'query' && "Perfect! ✍️ Please describe your query in detail."}
                    </p>
                  </motion.div>
                </motion.div>

                {/* User Input Preview */}
                {(chatbotData as any)[chatbotStep] && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start space-x-3 justify-end"
                  >
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="bg-gradient-to-br from-gray-600 to-gray-800 text-white rounded-2xl rounded-tr-none p-4 max-w-xs shadow-xl"
                    >
                      <p className="text-sm break-words">
                        {(chatbotData as any)[chatbotStep]}
                      </p>
                    </motion.div>
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center shadow-lg border border-gray-700 flex-shrink-0">
                      <span className="text-sm font-bold text-gray-300">You</span>
                    </div>
                  </motion.div>
                )}
              </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex flex-col items-center justify-center h-full py-10"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="relative"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircle className="w-20 h-20 text-green-500" />
                    </motion.div>
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border-4 border-green-500"
                    />
                  </motion.div>
                  <motion.h5 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 text-xl font-bold text-white"
                    style={{ fontFamily: "'Rubik', sans-serif" }}
                  >
                    Successfully Submitted! ✨
                  </motion.h5>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-gray-400 mt-2 text-center px-4"
                  >
                    We'll get back to you at <span className="text-gray-300 font-semibold">{chatbotData.email}</span>
                  </motion.p>
                </motion.div>
              )}

            </div>

            {/* Input / Actions - Fixed at bottom */}
            <div className="p-5 border-t border-gray-800 bg-gradient-to-b from-gray-900 to-black space-y-3">
              {isSubmitted ? (
                <motion.button
                  onClick={closeChatbot}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white py-3 px-4 rounded-xl hover:from-gray-600 hover:to-gray-800 transition-all duration-300 font-semibold shadow-lg"
                  style={{ fontFamily: "'Rubik', sans-serif" }}
                >
                  Close Chat
                </motion.button>
              ) : (<>
              {chatbotStep === 'email' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <input
                    type="email"
                    value={chatbotData.email}
                    onChange={(e) => handleChatbotInput(e.target.value)}
                    placeholder="Enter your email address"
                    className={`w-full p-4 bg-gray-800/50 border rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-300 ${
                      chatbotData.email && !isValidEmailForSupport(chatbotData.email)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-700'
                    }`}
                    style={{ fontFamily: "'Rubik', sans-serif" }}
                    autoFocus
                  />
                </motion.div>
              )}
              
              {chatbotStep === 'subject' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <input
                    type="text"
                    value={chatbotData.subject}
                    onChange={(e) => handleChatbotInput(e.target.value)}
                    placeholder="Enter the subject of your inquiry"
                    className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-300"
                    style={{ fontFamily: "'Rubik', sans-serif" }}
                    autoFocus
                  />
                </motion.div>
              )}
              
              {chatbotStep === 'query' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <textarea
                    value={chatbotData.query}
                    onChange={(e) => handleChatbotInput(e.target.value)}
                    placeholder="Describe your query in detail..."
                    rows={3}
                    className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent resize-none text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-300"
                    style={{ fontFamily: "'Rubik', sans-serif" }}
                    autoFocus
                  />
                </motion.div>
              )}

              {/* Action Buttons */}
               <div className="flex space-x-2">
                 {chatbotStep !== 'query' ? (
                  <motion.button
                    onClick={nextChatbotStep}
                    disabled={! (chatbotData as any)[chatbotStep] || (chatbotStep === 'email' && !isValidEmailForSupport(chatbotData.email))}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-800 text-white py-3 px-4 rounded-xl hover:from-gray-500 hover:to-gray-700 disabled:from-gray-800 disabled:to-gray-900 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 font-semibold shadow-lg"
                    style={{ fontFamily: "'Rubik', sans-serif" }}
                  >
                    Next →
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={submitSupportRequest}
                    disabled={!chatbotData.query || isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-900 text-white py-3 px-4 rounded-xl hover:from-gray-600 hover:to-gray-800 disabled:from-gray-800 disabled:to-gray-900 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 flex items-center justify-center space-x-2 font-semibold shadow-lg"
                    style={{ fontFamily: "'Rubik', sans-serif" }}
                  >
                    {isSubmitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Request</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>
              </>)}
            </div>
          </div>
        </motion.div>
      )}

      {/* About Modal */}
      <AnimatePresence>
        {isAboutOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setIsAboutOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center z-10">
                <h2 className="text-3xl font-bold text-gray-900">About Confiido</h2>
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="px-8 py-6 text-gray-700 space-y-6">
                <section>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h3>
                  <p className="text-lg leading-relaxed">
                    Confiido is dedicated to connecting ambitious professionals with industry experts for career acceleration. We believe that personalized mentorship is the key to unlocking your full potential and achieving your career goals.
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">What We Do</h3>
                  <p className="mb-4">
                    We provide a platform where professionals can connect with experienced mentors across various industries. Our services include:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>One-on-One Mentorship Sessions:</strong> Personalized guidance from industry experts</li>
                    <li><strong>Career Guidance:</strong> Strategic advice for career transitions and growth</li>
                    <li><strong>Skill Development:</strong> Learn from the best in your field</li>
                    <li><strong>Networking Opportunities:</strong> Connect with professionals in your industry</li>
                    <li><strong>Online Convenience:</strong> All sessions conducted via Google Meet</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Approach</h3>
                  <p className="mb-4">
                    At Confiido, we understand that every professional's journey is unique. That's why we offer:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Curated Mentors:</strong> Carefully selected experts with proven track records</li>
                    <li><strong>Flexible Scheduling:</strong> Book sessions that fit your busy schedule</li>
                    <li><strong>Personalized Matching:</strong> Find mentors who align with your goals</li>
                    <li><strong>Secure Platform:</strong> Safe and professional environment for learning</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Why Choose Confiido?</h3>
                  <div className="space-y-3">
                    <p>
                      <strong>Expert Mentors:</strong> Our mentors are industry leaders with years of experience and a passion for helping others succeed.
                    </p>
                    <p>
                      <strong>Proven Results:</strong> Our mentees have achieved career breakthroughs, landed dream jobs, and accelerated their professional growth.
                    </p>
                    <p>
                      <strong>Convenient & Accessible:</strong> All sessions are conducted online, making professional mentorship accessible from anywhere.
                    </p>
                    <p>
                      <strong>Supportive Community:</strong> Join a network of ambitious professionals committed to continuous growth and learning.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Vision</h3>
                  <p className="text-lg leading-relaxed">
                    We envision a world where professional growth is accessible to everyone, regardless of location or background. Through meaningful mentorship connections, we're building a community of professionals who support each other's success and contribute to a more knowledgeable, skilled workforce.
                  </p>
                </section>

                <section className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Get Started Today</h3>
                  <p className="mb-4">
                    Ready to take your career to the next level? Browse our mentors, book a session, and start your journey toward professional excellence.
                  </p>
                  <button 
                    onClick={() => {
                      setIsAboutOpen(false);
                      window.location.href = '/search';
                    }}
                    className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold"
                  >
                    Find Your Mentor
                  </button>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Us Modal */}
      <AnimatePresence>
        {isContactOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setIsContactOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl max-w-2xl w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center rounded-t-2xl">
                <h2 className="text-3xl font-bold text-gray-900">Contact Us</h2>
                <button
                  onClick={() => setIsContactOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="px-8 py-8 text-center space-y-6">
                <div className="flex justify-center mb-6">
                  <div className="bg-black rounded-full p-4">
                    <MessageCircle className="w-12 h-12 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-semibold text-gray-900">Get in Touch</h3>
                <p className="text-gray-600 text-lg">
                  Have questions or need support? We're here to help!
                </p>
                
                <div className="bg-gray-50 p-6 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">Email us at:</p>
                  <a 
                    href="mailto:confiido.io+support@gmail.com"
                    className="text-2xl font-semibold text-black hover:text-gray-700 transition-colors break-all"
                  >
                    confiido.io+support@gmail.com
                  </a>
                </div>

                <div className="pt-4">
                  <p className="text-gray-600 mb-4">Or use our support chatbot for instant assistance</p>
                  <button
                    onClick={() => {
                      setIsContactOpen(false);
                      openChatbot();
                    }}
                    className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold inline-flex items-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Open Support Chat
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {isTermsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setIsTermsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center z-10">
                <h2 className="text-3xl font-bold text-gray-900">Terms of Service</h2>
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="px-8 py-6 text-gray-700 space-y-6">
                <p className="text-sm text-gray-500">Last updated: November 11, 2025</p>
                
                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h3>
                  <p>By accessing and using Confiido's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Service Description</h3>
                  <p>Confiido provides a platform connecting ambitious professionals with industry experts for career mentorship and coaching. Our services include online mentoring sessions, career guidance, and professional development resources.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">3. User Responsibilities</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You must provide accurate and complete information during registration</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>You must be at least 18 years old to use our services</li>
                    <li>You agree to use the platform in a professional and respectful manner</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Booking and Payment</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All bookings are subject to mentor availability</li>
                    <li>Payment must be completed before the session is confirmed</li>
                    <li>All payments are processed securely through Razorpay</li>
                    <li>Sessions are non-refundable once booked</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Cancellation and Rescheduling</h3>
                  <p>While bookings are non-refundable, we understand that circumstances may change. You may request to reschedule your session subject to mentor availability. Please contact support for rescheduling requests.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h3>
                  <p>All content on Confiido, including text, graphics, logos, and software, is the property of Confiido and is protected by copyright and intellectual property laws.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Limitation of Liability</h3>
                  <p>Confiido acts as a platform connecting mentees with mentors. We do not guarantee specific outcomes from mentoring sessions. The mentors are independent professionals, and Confiido is not responsible for the content or quality of individual sessions.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">8. Privacy and Data Protection</h3>
                  <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">9. Modifications to Terms</h3>
                  <p>Confiido reserves the right to modify these terms at any time. We will notify users of any significant changes. Continued use of the service after modifications constitutes acceptance of the updated terms.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Information</h3>
                  <p>If you have any questions about these Terms of Service, please contact us through our support system.</p>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setIsPrivacyOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center z-10">
                <h2 className="text-3xl font-bold text-gray-900">Privacy Policy</h2>
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="px-8 py-6 text-gray-700 space-y-6">
                <p className="text-sm text-gray-500">Last updated: November 11, 2025</p>
                
                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h3>
                  <p>Confiido ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h3>
                  <h4 className="font-semibold mt-4 mb-2">Personal Information:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Name, email address, and contact information</li>
                    <li>Profile information and professional background</li>
                    <li>Payment information (processed securely through Razorpay)</li>
                    <li>Session booking details and preferences</li>
                  </ul>
                  
                  <h4 className="font-semibold mt-4 mb-2">Automatically Collected Information:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>IP address and browser information</li>
                    <li>Device information and operating system</li>
                    <li>Usage data and analytics</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>To provide and maintain our services</li>
                    <li>To process your bookings and payments</li>
                    <li>To communicate with you about your account and sessions</li>
                    <li>To improve our platform and user experience</li>
                    <li>To send promotional communications (with your consent)</li>
                    <li>To detect and prevent fraud and ensure platform security</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Information Sharing</h3>
                  <p className="mb-3">We do not sell your personal information. We may share your information with:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Mentors:</strong> Necessary information to facilitate your sessions</li>
                    <li><strong>Service Providers:</strong> Payment processors, hosting services, and analytics providers</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h3>
                  <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies and Tracking</h3>
                  <p>We use cookies and similar tracking technologies to enhance your experience. You can control cookie settings through your browser preferences.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access and review your personal information</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of your account and data</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Export your data in a portable format</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">8. Data Retention</h3>
                  <p>We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account at any time.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">9. Third-Party Links</h3>
                  <p>Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">10. Children's Privacy</h3>
                  <p>Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">11. Changes to Privacy Policy</h3>
                  <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by email or through a notice on our platform.</p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">12. Contact Us</h3>
                  <p>If you have any questions about this Privacy Policy or our data practices, please contact us through our support system.</p>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
