'use client';

import { Star, ChevronDown, ChevronLeft, ChevronRight, Play, MessageCircle, X, Send, CheckCircle } from 'lucide-react';
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'student' | 'professional'>('student');
  const [currentMentorIndex, setCurrentMentorIndex] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
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
    <div className="min-h-screen overflow-x-hidden relative safe-area-main font-satoshi" style={{ backgroundColor: '#F3E8DF', scrollbarWidth: 'none', msOverflowStyle: 'none' }} suppressHydrationWarning>
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
                style={{ fontFamily: "'Satoshi', sans-serif" }}
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
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="pt-24"
      >
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
      </motion.div>

      {/* Meet Your Mentors Section */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        id="mentors-section"
        className="py-8 bg-white/60 relative z-10"
      >
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
              style={{ fontFamily: "'Satoshi', sans-serif" }}
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
            {/* Mentor Card */}
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-40 items-start">
              {/* Left Side - Photo/Video Area */}
              <div className="lg:w-1/2 relative">
                {playingVideo === mentors[currentMentorIndex].id ? (
                  <div className="w-full h-80 lg:h-full rounded-3xl overflow-hidden shadow-xl">
                    <iframe
                      src={mentors[currentMentorIndex].videoUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`${mentors[currentMentorIndex].name} Introduction Video`}
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-80 lg:h-[500px] rounded-3xl overflow-hidden shadow-xl">
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
              <div className="lg:w-1/2 flex flex-col">
                <div className="flex-1">
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
                  <div className="mb-6">
                    <p className="text-gray-700 text-base leading-relaxed italic">
                      &quot;{mentors[currentMentorIndex].quote}&quot;
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 text-lg">What I can help you with:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {mentors[currentMentorIndex].skills.map((skill, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                          <span>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Rating and Price */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 pt-4">
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

            {/* Carousel Navigation */}
            <div className="flex justify-between items-center mt-8 gap-8">
              {/* Left Side Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={prevMentor}
                  className="w-12 h-12 rounded-full border-2 border-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>

                <div className="text-gray-900 font-medium text-lg">
                  {currentMentorIndex + 1}/{mentors.length} Mentors
                </div>

                <button
                  onClick={nextMentor}
                  className="w-12 h-12 rounded-full border-2 border-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Right Side Progress Bar */}
              <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-600 transition-all duration-500 ease-out"
                  style={{ width: `${((currentMentorIndex + 1) / mentors.length) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Get Started in 3 Easy Steps Section */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        id="mentors"
        className="py-8 md:py-16 bg-white/50 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4"
              style={{ fontFamily: "'Satoshi', sans-serif" }}
            >
              Get Started in 3 Easy Steps
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-base md:text-xl text-gray-600 px-4"
              style={{ fontFamily: "'Satoshi', sans-serif" }}
            >
              Follow these three simple steps to begin your speaking transformation journey
            </motion.p>
          </div>

          {/* Image and Steps Container */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left Side - Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-full lg:w-1/2"
            >
              <img
                src="/home.webp"
                alt="Get Started"
                className="w-full h-auto"
              />
            </motion.div>

            {/* Right Side - Steps Tube Container */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="w-full lg:w-1/2 space-y-6"
            >
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="rounded-full p-6 md:p-8 shadow-xl"
                style={{ backgroundColor: '#948979' }}
              >
                <p className="text-base md:text-lg font-semibold text-white" style={{ fontFamily: "'Satoshi', sans-serif" }}>
                  Book Your Session with Your Preferred Coach
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="rounded-full p-6 md:p-8 shadow-xl"
                style={{ backgroundColor: '#948979' }}
              >
                <p className="text-base md:text-lg font-semibold text-white" style={{ fontFamily: "'Satoshi', sans-serif" }}>
                  Secure Your Session with Easy Payment
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="rounded-full p-6 md:p-8 shadow-xl"
                style={{ backgroundColor: '#948979' }}
              >
                <p className="text-base md:text-lg font-semibold text-white" style={{ fontFamily: "'Satoshi', sans-serif" }}>
                  Join via Google Meet for Your Coaching
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* New Testimonials Section */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Testimonials />
      </motion.div>



      {/* Who This is For Section */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-8 md:py-12 bg-white/50 relative z-10"
      >
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
              style={{ fontFamily: "'Satoshi', sans-serif" }}
            >
              Who This is <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-800">For</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-4 md:mb-6"
              style={{ fontFamily: "'Satoshi', sans-serif" }}
            >
              Help yourself identify if our coaching is the perfect fit for your journey
            </motion.p>

            <p className="text-sm md:text-base text-gray-600 font-semibold mb-6 md:mb-10" style={{ fontFamily: "'Satoshi', sans-serif" }}>
              Confido is designed for those who want their voice to inspire, influence and impact.
            </p>
          </div>

          {/* Image Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative max-w-4xl mx-auto"
          >
            {/* Image Display */}
            <div className="w-full mb-8">
              <motion.img
                key={selectedCategory}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                src={selectedCategory === 'student' ? '/student.webp' : '/professional.webp'}
                alt={selectedCategory === 'student' ? 'Student' : 'Professional'}
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center gap-8">
              {/* Left Side Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedCategory('student')}
                  className="w-12 h-12 rounded-full border-2 border-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>

                <div className="text-gray-900 font-medium text-lg">
                  {selectedCategory === 'student' ? 'Student' : 'Professional'}
                </div>

                <button
                  onClick={() => setSelectedCategory('professional')}
                  className="w-12 h-12 rounded-full border-2 border-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Right Side Progress Bar */}
              <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-600 transition-all duration-500 ease-out"
                  style={{ width: selectedCategory === 'student' ? '50%' : '100%' }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-16"
        style={{ backgroundColor: '#F3E8DF' }}
      >
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold text-black mb-3"
              style={{ fontFamily: "'Satoshi', sans-serif" }}
            >
              Frequently asked questions
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-base text-gray-700"
              style={{ fontFamily: "'Satoshi', sans-serif" }}
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
            <div className="rounded-full overflow-hidden transition-all duration-300" style={{ backgroundColor: '#948979' }}>
              <button
                onClick={() => toggleFaq(0)}
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
                    <ChevronDown className="h-5 w-5 text-white flex-shrink-0 ml-4" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence initial={false}>
                {openFaq === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ transformOrigin: 'top' }}
                    className="px-5 pb-5 mt-2"
                  >
                    <p className="text-white leading-relaxed pt-4">
                      Simply sign up and follow the onboarding process.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FAQ 2 - What payment methods do you accept? */}
            <div className="rounded-full overflow-hidden transition-all duration-300" style={{ backgroundColor: '#948979' }}>
              <button
                onClick={() => toggleFaq(1)}
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
                    <ChevronDown className="h-5 w-5 text-white flex-shrink-0 ml-4" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence initial={false}>
                {openFaq === 1 && (
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ transformOrigin: 'top' }}
                    className="px-5 pb-5 mt-2"
                  >
                    <p className="text-white leading-relaxed pt-4">
                      We accept payments through Razorpay, including UPI, credit cards, debit cards, net banking, and wallets.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FAQ 3 - What is the refund policy? */}
            <div className="rounded-full overflow-hidden transition-all duration-300" style={{ backgroundColor: '#948979' }}>
              <button
                onClick={() => toggleFaq(2)}
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
                    <ChevronDown className="h-5 w-5 text-white flex-shrink-0 ml-4" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence initial={false}>
                {openFaq === 2 && (
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ transformOrigin: 'top' }}
                    className="px-5 pb-5 mt-2"
                  >
                    <p className="text-white leading-relaxed pt-4">
                      Refunds are processed according to our refund policy. Please contact support for specific cases.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ backgroundColor: '#F3E8DF' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            {/* Brand Section */}
            <div className="max-w-md">
              <h3 className="text-xl font-bold text-black mb-4" style={{ fontFamily: "'Satoshi', sans-serif" }}>Confiido</h3>
              <p className="text-gray-700" style={{ fontFamily: "'Satoshi', sans-serif" }}>Connecting ambitious professionals with industry experts for career acceleration.</p>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-black font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-700">
                <li><button onClick={() => setIsAboutOpen(true)} className="hover:text-black transition-colors text-left">About</button></li>
                <li><button onClick={() => setIsContactOpen(true)} className="hover:text-black transition-colors text-left">Contact Us</button></li>
                <li><button onClick={() => setIsTermsOpen(true)} className="hover:text-black transition-colors text-left">Terms Of Service</button></li>
                <li><button onClick={() => setIsPrivacyOpen(true)} className="hover:text-black transition-colors text-left">Privacy</button></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-300 pt-8 text-center">
            <p className="text-gray-700">©2025 Confiido. All rights reserved.</p>
          </div>
        </div>
      </motion.footer>

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
                  <h3 className="font-bold text-lg" style={{ fontFamily: "'Satoshi', sans-serif" }}>Support Chat</h3>
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
              <h4 className="text-xl font-bold text-white" style={{ fontFamily: "'Satoshi', sans-serif" }}>Welcome to Confiido</h4>
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
                    className={`h-2 rounded-full transition-all duration-500 ${index <= ['email', 'subject', 'query'].indexOf(chatbotStep)
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
                    style={{ fontFamily: "'Satoshi', sans-serif" }}
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
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
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
                      className={`w-full p-4 bg-gray-800/50 border rounded-xl focus:ring-2 focus:ring-gray-600 focus:border-transparent text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-300 ${chatbotData.email && !isValidEmailForSupport(chatbotData.email)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-700'
                        }`}
                      style={{ fontFamily: "'Satoshi', sans-serif" }}
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
                      style={{ fontFamily: "'Satoshi', sans-serif" }}
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
                      style={{ fontFamily: "'Satoshi', sans-serif" }}
                      autoFocus
                    />
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {chatbotStep !== 'query' ? (
                    <motion.button
                      onClick={nextChatbotStep}
                      disabled={!(chatbotData as any)[chatbotStep] || (chatbotStep === 'email' && !isValidEmailForSupport(chatbotData.email))}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-800 text-white py-3 px-4 rounded-xl hover:from-gray-500 hover:to-gray-700 disabled:from-gray-800 disabled:to-gray-900 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 font-semibold shadow-lg"
                      style={{ fontFamily: "'Satoshi', sans-serif" }}
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
                      style={{ fontFamily: "'Satoshi', sans-serif" }}
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
