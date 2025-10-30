"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, KeyRound, AlertCircle, CheckCircle } from "lucide-react";
import { MoonLoader } from 'react-spinners';

const OTPPage = () => {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const requestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5003";
      const res = await fetch(`${apiUrl}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5003";
      const res = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        // Save token (localStorage or cookie)
        localStorage.setItem("token", data.data.token);
        
        // Show redirecting spinner
        setRedirecting(true);
        
        // Check user role and redirect accordingly
        const userRole = data.data.user?.role;
        if (userRole === "expert") {
          router.push("/mentor/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex flex-col items-center mb-6">
          <KeyRound className="h-10 w-10 text-blue-600 mb-2" />
          <h2 className="text-2xl font-bold text-gray-900">Login with OTP</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your registered email to receive an OTP</p>
        </div>
        {!otpSent ? (
          <form onSubmit={requestOTP} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value.trim())}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
                {error.toLowerCase().includes("not found") && (
                  <Link href="/signup" className="text-blue-600 underline ml-2">Sign up</Link>
                )}
              </div>
            )}
          </form>
        ) : redirecting ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
            <MoonLoader color="#000000" size={60} />
          </div>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-5">
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            {!error && otp.length === 6 && (
              <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
                <CheckCircle className="h-4 w-4" />
                <span>OTP sent! Check your email.</span>
              </div>
            )}
          </form>
        )}
        <div className="mt-8 text-center">
          <Link href="/login" className="text-blue-600 hover:underline text-sm">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default OTPPage;
