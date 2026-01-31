'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleSignInButton } from '../components/AuthComponents';
import { MoonLoader } from 'react-spinners';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const router = useRouter();
  const { user, loading, redirecting: authRedirecting } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [loginStep, setLoginStep] = useState<'email' | 'password'>('email');
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);

  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
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
          console.log('❌ Session expired on login page, clearing...');
          localStorage.removeItem('token');
          localStorage.removeItem('sessionTimestamp');
          localStorage.removeItem('userRole');
          return;
        }
      }
      
      // If user is already authenticated with valid session, redirect to dashboard
      if ((user || token) && sessionTimestamp) {
        console.log('✅ User already logged in with valid session, redirecting to dashboard');
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'expert') {
          router.push('/mentor/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    };

    // Only check when loading is complete
    if (!loading) {
      checkAuth();
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <MoonLoader color="#000000" size={60} />
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Move to password step
    setLoginStep('password');
    setError('');
  };

  const handleBackToEmail = () => {
    setLoginStep('email');
    setError('');
    setIsOtpMode(false);
    setOtpSent(false);
    setOtpDigits(['', '', '', '', '', '']);
    setIsForgotMode(false);
    setForgotLoading(false);
    setResetCode('');
    setNewPassword('');
  };

  const sendOtp = async () => {
    // Validate email first
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setError('');
      setOtpLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';
      const res = await fetch(`${apiUrl}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to send OTP');
      }
      setOtpSent(true);
      setIsOtpMode(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

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

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpMode) return;
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';
      const res = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.data?.token) {
        throw new Error(data?.error || 'Invalid code');
      }
      
      // Store token and session timestamp for 24-hour validity
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('sessionTimestamp', Date.now().toString());
      
      // Store user role
      if (data.data.user?.role) {
        localStorage.setItem('userRole', data.data.user.role);
      }
      
      console.log('✅ OTP verified, session set for 24 hours');
      setRedirecting(true);
      
      const userRole = data.data.user?.role;
      if (userRole === 'expert') {
        router.push('/mentor/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (e: any) {
      setError(e?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    // We operate in the password step
    if (loginStep !== 'password') {
      setLoginStep('password');
    }
    // Validate email first
    if (!formData.email) {
      setError('Please enter your email first');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email');
      return;
    }
    try {
      setError('');
      setForgotLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to send reset code');
      }
      // Enter forgot mode to show code + new password inputs
      setIsForgotMode(true);
      // In development, backend returns resetToken; optionally prefill for convenience
      if (data?.data?.resetToken) {
        // Do not auto-fill; user can paste from email. Keep it empty for UX.
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to start password reset');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isForgotMode) return;
    // Validate code
    const code = resetCode.trim();
    if (!/^[0-9]{6}$/.test(code)) {
      setError('Enter the 6-digit numeric reset code');
      return;
    }
    // Validate new password: min 8, at least one special character
    const specialRegex = /[^A-Za-z0-9]/;
    if (newPassword.length < 8 || !specialRegex.test(newPassword)) {
      setError('Password must be at least 8 characters and include a special character');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';
      const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: code, password: newPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        const msg = data?.error || (Array.isArray(data?.errors) ? data.errors.map((e: any) => e.msg).join(', ') : '') || 'Password reset failed';
        throw new Error(msg);
      }
      // After successful reset, switch back to normal sign-in
      setIsForgotMode(false);
      setNewPassword('');
      setResetCode('');
      setError('');
      alert('Password changed successfully. Please sign in with your new password.');
    } catch (err: any) {
      setError(err?.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.errors?.[0]?.msg || 'Login failed');
      }

      // Store token and session timestamp for 24-hour validity
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('sessionTimestamp', Date.now().toString());
        console.log('✅ Login successful, session set for 24 hours');
      }
      
      // Store user role
      if (data.data.user?.role) {
        localStorage.setItem('userRole', data.data.user.role);
      }

      // Show redirecting spinner
      setRedirecting(true);

      // Check user role and redirect accordingly
      const userRole = data.data.user?.role;
      if (userRole === "expert") {
        router.push("/mentor/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', backgroundColor: '#F3E8DF' }}>
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {(redirecting || authRedirecting) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
          <MoonLoader color="#000000" size={60} />
        </div>
      )}
      <div className="max-w-7xl w-full">
        {/* Two Column Layout */}
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>
              Welcome back
            </h2>
            <p className="text-lg text-gray-700" style={{ fontFamily: "'Rubik', sans-serif" }}>
              Sign in to your account to continue your learning journey
            </p>
          </div>

          {/* Right Side - Login Form */}
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          
            <div className="bg-transparent rounded-xl p-8">
          {!redirecting && (
            <>
              {loginStep === 'email' ? (
                <form onSubmit={handleEmailSubmit} className="space-y-6">
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
                      suppressHydrationWarning
                      className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full text-white py-3 px-6 rounded-full hover:opacity-90 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    style={{ backgroundColor: '#948979' }}
                  >
                    {isLoading ? (
                      'Checking...'
                    ) : (
                      'Continue'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={isForgotMode ? handleResetPasswordSubmit : (isOtpMode ? handleVerifyOtpSubmit : handleSubmit)} className="space-y-6">
                  {/* Back button */}
                  <div className="flex items-center mb-4">
                    <button
                      type="button"
                      onClick={handleBackToEmail}
                      className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      <span className="text-sm">Change email</span>
                    </button>
                  </div>

                  {/* Display email */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600">Signing in as:</p>
                    <p className="font-medium text-gray-900">{formData.email}</p>
                  </div>

                  {isForgotMode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enter reset code</label>
                        <input
                          type="text"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          placeholder="Paste the code from your email"
                          className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Create new password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 8 characters, include a special character"
                          className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Must be 8+ characters and include at least one special character.</p>
                      </div>
                    </div>
                  ) : isOtpMode ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter 6-digit code
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {[0,1,2,3,4,5].map(i => (
                          <input
                            key={i}
                            id={`otp-${i}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={otpDigits[i]}
                            onChange={(e) => handleOtpInputChange(i, e.target.value)}
                            className="text-center text-lg font-semibold border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
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
                          suppressHydrationWarning
                          className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent pr-10"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="rememberMe"
                        name="rememberMe"
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        suppressHydrationWarning
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                        Remember me
                      </label>
                    </div>
                    <div className="text-sm">
                      {!isForgotMode ? (
                        <button
                          type="button"
                          onClick={handleForgotClick}
                          className="text-gray-600 hover:text-gray-800 font-medium"
                          disabled={forgotLoading}
                        >
                          {forgotLoading ? 'Sending code...' : 'Forgot password?'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsForgotMode(false)}
                          className="text-gray-600 hover:text-gray-800 font-medium"
                        >
                          Back to password
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full text-white py-3 px-6 rounded-full hover:opacity-90 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    style={{ backgroundColor: '#948979' }}
                  >
                    {isLoading ? (
                      isForgotMode ? 'Changing...' : isOtpMode ? 'Verifying...' : 'Signing in...'
                    ) : (
                      isForgotMode ? 'Change Password' : isOtpMode ? 'Verify and Sign In' : 'Sign In'
                    )}
                  </button>

                  {/* Email Sign-in Code Option */}
                  <div className="text-center mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-4">
                      {(!isOtpMode && !isForgotMode) && (
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); sendOtp(); }}
                          disabled={otpLoading}
                          className="w-full inline-flex items-center justify-center px-4 py-3 text-white font-semibold text-sm rounded-full hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60"
                          style={{ backgroundColor: '#948979' }}
                        >
                          {otpLoading ? (
                            'Sending code...'
                          ) : (
                            'Email Sign-in code'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Google Sign In - Only show on email step */}
          {loginStep === 'email' && (
            <>
              {/* Divider */}
              <div className="mt-6 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
              </div>

              {/* Google Sign In Button */}
              <GoogleSignInButton />
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-gray-600 hover:text-gray-800 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
} 