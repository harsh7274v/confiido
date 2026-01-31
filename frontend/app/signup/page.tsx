'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleSignInButton } from '../components/AuthComponents';
import { MoonLoader } from 'react-spinners';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const router = useRouter();
  const { user, loading, redirecting: authRedirecting } = useAuth();
  
  // All useState hooks MUST be declared before any conditional returns
  const [selectedCategory, setSelectedCategory] = useState<'student' | 'professional'>('student');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // OTP verification states
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    // Don't check if we're already redirecting (after successful signup)
    if (redirecting || authRedirecting) {
      return;
    }

    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const sessionTimestamp = localStorage.getItem('sessionTimestamp');
      
      // Check if session is expired
      if (token && sessionTimestamp) {
        const sessionTime = parseInt(sessionTimestamp);
        const currentTime = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        // If session expired, clear it
        if ((currentTime - sessionTime) > twentyFourHours) {
          console.log('❌ Session expired on signup page, clearing...');
          localStorage.removeItem('token');
          localStorage.removeItem('sessionTimestamp');
          localStorage.removeItem('userRole');
          return;
        }
      }
      
      // If user is already authenticated, redirect to dashboard
      if (user || token) {
        console.log('User already logged in, redirecting to dashboard');
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'expert') {
          router.replace('/mentor/dashboard');
        } else {
          router.replace('/dashboard');
        }
      }
    };

    // Only check when loading is complete
    if (!loading) {
      checkAuth();
    }
  }, [user, loading, router, redirecting, authRedirecting]);

  // Timer countdown effect
  useEffect(() => {
    if (otpSent && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpSent, timeLeft]);

  // Show loading while checking authentication
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <MoonLoader color="#000000" size={60} />
      </div>
    );
  }

  const handleOtpInputChange = (index: number, value: string) => {
    if (value && !/^[0-9]$/.test(value)) return; // only digits
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    // auto-focus next
    const nextIndex = value ? index + 1 : index - 1;
    const id = nextIndex >= 0 && nextIndex < 6 ? `otp-${nextIndex}` : undefined;
    if (id) {
      const el = document.getElementById(id) as HTMLInputElement | null;
      el?.focus();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!isValidEmailForSupport(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!isPasswordValid) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (!isConfirmPasswordValid) {
      setError('Passwords do not match');
      return false;
    }
    
    if (!formData.agreeToTerms) {
      setError('You must agree to the Terms of Service');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('Verification code sent to your email!');
    
    // Immediately show OTP screen
    setOtpSent(true);
    setTimeLeft(300); // Reset timer to 5 minutes
    setCanResend(false);

    try {
      const requestData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        userType: selectedCategory
      };

      // Send OTP for verification instead of directly registering
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/auth/send-signup-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        // If error, go back to signup form
        setOtpSent(false);
        throw new Error(data.error || data.errors?.[0]?.msg || 'Failed to send verification code');
      }
      
    } catch (error: any) {
      setOtpSent(false);
      setSuccess('');
      setError(error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    
    setOtpLoading(true);
    setError('');
    
    try {
      const requestData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        userType: selectedCategory,
        otp: otp
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/auth/verify-signup-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.errors?.[0]?.msg || 'Invalid verification code');
      }

      // Store token and session timestamp for 24-hour validity
      if (data.data?.token) {
        const timestamp = Date.now().toString();
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('sessionTimestamp', timestamp);
        console.log('✅ Signup successful, session set for 24 hours');
        console.log('🔐 Token stored:', data.data.token.substring(0, 20) + '...');
        console.log('⏰ Session timestamp:', timestamp);
        
        // Verify token was stored correctly
        const storedToken = localStorage.getItem('token');
        const storedTimestamp = localStorage.getItem('sessionTimestamp');
        if (!storedToken || !storedTimestamp) {
          console.error('❌ ERROR: Token or timestamp not stored correctly!');
          throw new Error('Failed to store authentication token');
        }
        console.log('✅ Verified: Token and timestamp stored correctly');
      }
      
      // Store user role
      if (data.data?.user?.role) {
        localStorage.setItem('userRole', data.data.user.role);
        console.log('👤 User role stored:', data.data.user.role);
      }

      setSuccess('Account created successfully! Redirecting...');
      setRedirecting(true);
      
      // Store a flag to indicate we just signed up (prevents AuthContext from clearing token)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('justSignedUp', 'true');
        console.log('🏷️ Set justSignedUp flag in sessionStorage');
      }
      
      // Small delay to ensure localStorage is persisted before redirect
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify token is still there before redirecting
      const verifyToken = localStorage.getItem('token');
      const verifyTimestamp = localStorage.getItem('sessionTimestamp');
      if (!verifyToken || !verifyTimestamp) {
        console.error('❌ ERROR: Token or timestamp lost before redirect!', {
          hasToken: !!verifyToken,
          hasTimestamp: !!verifyTimestamp
        });
        setError('Authentication error. Please try logging in.');
        setRedirecting(false);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('justSignedUp');
        }
        return;
      }
      
      console.log('✅ Token verified before redirect:', {
        tokenLength: verifyToken.length,
        timestamp: verifyTimestamp
      });
      
      // Use window.location for a hard redirect to ensure clean state
      // This ensures localStorage is fully persisted before navigation
      const userRole = data.data?.user?.role;
      console.log('➡️ Redirecting to dashboard, role:', userRole);
      
      // Use setTimeout to ensure all state updates complete
      setTimeout(() => {
        if (userRole === 'expert') {
          window.location.href = '/mentor/dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      }, 100);
      
    } catch (error: any) {
      setError(error.message || 'Invalid verification code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const resendOTP = async () => {
    setOtpLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const requestData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        userType: selectedCategory
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/auth/send-signup-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification code');
      }

      setSuccess('Verification code resent!');
      setTimeLeft(300);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      
    } catch (error: any) {
      setError(error.message || 'Failed to resend verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const isPasswordValid = formData.password.length >= 8;
  const isConfirmPasswordValid = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', backgroundColor: '#F3E8DF' }}>
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="max-w-7xl w-full">
        {/* Two Column Layout - Always show */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Side - Branding */}
          <div className="text-left space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 transition-colors">
              <img 
                src="/icons/icon-96x96.png" 
                alt="Confiido Logo" 
                className="h-12 w-12 object-contain"
              />
              <span className="text-3xl font-bold text-black italic uppercase" style={{ fontFamily: "'BespokeStencil-BoldItalic', sans-serif" }}>Confiido</span>
            </Link>
            <p className="text-lg text-gray-700" style={{ fontFamily: "'Rubik', sans-serif" }}>
              Join thousands of professionals and start your mentorship journey
            </p>
          </div>

          {/* Right Side - Form or OTP */}
          <div className="space-y-6">
              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-black rounded-full px-6 py-3 inline-flex items-center gap-2 shadow-md">
                  <CheckCircle className="h-5 w-5 text-white" />
                  <p className="text-sm text-white font-medium">Verification code sent</p>
                </div>
              )}

              {/* Signup Form */}
              {!otpSent && !redirecting && (
              <div className="bg-transparent rounded-xl p-8">
            {/* Category Selection */}
            <div className="mb-6">
              <div className="inline-flex rounded-full p-0.5" style={{ backgroundColor: '#948979' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('student')}
                  className={`px-6 py-1.5 text-sm rounded-full font-medium transition-all duration-300 ${
                    selectedCategory === 'student'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('professional')}
                  className={`px-6 py-1.5 text-sm rounded-full font-medium transition-all duration-300 ${
                    selectedCategory === 'professional'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Working Professional
                </button>
              </div>
            </div>

            {/* Create Account Heading */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Rubik', sans-serif" }}>
                Create Account
              </h2>
            </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>Account Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    suppressHydrationWarning
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    suppressHydrationWarning
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                suppressHydrationWarning
                aria-invalid={!!formData.email && !isValidEmailForSupport(formData.email)}
                className={`w-full px-4 py-2 bg-white border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.email && !isValidEmailForSupport(formData.email) ? 'border-red-400' : 'border-gray-300'
                }`}
              />
            </div>

            {/* Password Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent pr-10 text-gray-900 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {formData.password && (
                  <div className={`mt-2 text-sm ${isPasswordValid ? 'text-green-600' : 'text-red-600'}`}>
                    {isPasswordValid ? (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Password meets requirements
                      </div>
                    ) : (
                      'Password must be at least 8 characters long'
                    )}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent pr-10 text-gray-900 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <div className={`mt-2 text-sm ${isConfirmPasswordValid ? 'text-green-600' : 'text-red-600'}`}>
                    {isConfirmPasswordValid ? (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Passwords match
                      </div>
                    ) : (
                      'Passwords do not match'
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-gray-600 hover:text-gray-800">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-gray-600 hover:text-gray-800">
                    Privacy Policy
                  </Link>
                  *
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isPasswordValid || !isConfirmPasswordValid || isSubmitting || !formData.agreeToTerms || !isValidEmailForSupport(formData.email)}
              className="w-full text-white py-3 px-6 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center"
              style={{ backgroundColor: '#948979' }}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500" style={{ backgroundColor: '#F3E8DF' }}>or</span>
              </div>
            </div>
          </div>

          {/* Google Sign In Button */}
          <GoogleSignInButton />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-gray-600 hover:text-gray-800 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
              )}

              {/* OTP Verification Section - Shows in right column */}
              {otpSent && !redirecting && (
                <div className="bg-transparent rounded-xl p-8">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Rubik', sans-serif" }}>
                      Verify Your Email
                    </h2>
                    <p className="text-sm text-gray-600 mt-2">
                      We sent a verification code to <strong>{formData.email}</strong>
                    </p>
                  </div>

                  <form onSubmit={verifyOTP} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Enter 6-digit code
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {[0, 1, 2, 3, 4, 5].map(i => (
                          <input
                            key={i}
                            id={`otp-${i}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={otpDigits[i]}
                            onChange={(e) => handleOtpInputChange(i, e.target.value)}
                            disabled={otpLoading}
                            className="text-center text-lg font-semibold border border-gray-300 rounded-lg py-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full text-white py-3 rounded-full hover:opacity-90 transition-all font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#948979' }}
                      disabled={otpLoading || timeLeft === 0 || otpDigits.join('').length !== 6}
                    >
                      {otpLoading ? 'Verifying...' : 'Verify & Create Account'}
                    </button>

                    {/* Resend Button */}
                    {canResend && (
                      <button
                        type="button"
                        onClick={resendOTP}
                        className="w-full text-gray-600 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                        disabled={otpLoading}
                      >
                        Resend Verification Code
                      </button>
                    )}

                    {/* Back Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpDigits(['', '', '', '', '', '']);
                        setError('');
                        setSuccess('');
                        setTimeLeft(300);
                        setCanResend(false);
                      }}
                      className="w-full text-gray-600 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                      disabled={otpLoading}
                    >
                      Back to Sign Up
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

        {/* Redirecting Spinner */}
        {(redirecting || authRedirecting) && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
            <MoonLoader color="#000000" size={60} />
          </div>
        )}
      </div>
    </div>
  );
} 