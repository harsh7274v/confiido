'use client';

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5003";

/* ─── tiny helper ─── */
function OtpInput({
  digits,
  onChange,
  prefix,
}: {
  digits: string[];
  onChange: (i: number, v: string) => void;
  prefix: string;
}) {
  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`${prefix}-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => onChange(i, e.target.value)}
          className="w-11 h-12 text-center font-display font-bold text-lg neo-inset rounded-xl outline-none focus:ring-2 ring-[#3E5F44]/30 bg-transparent text-[#121C14]"
        />
      ))}
    </div>
  );
}

/* ─── inner component that reads search params ─── */
function AuthInner() {
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(
    params.get("mode") === "signup" ? "signup" : "login"
  );
  const router = useRouter();
  const { user, loading } = useAuth();

  /* shared */
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");

  /* login */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginOtp, setLoginOtp] = useState(["", "", "", "", "", ""]);
  const [loginLoading, setLoginLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  /* signup */
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupOtp, setSignupOtp] = useState(["", "", "", "", "", ""]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [done, setDone] = useState(false);

  /* redirect if already logged in */
  useEffect(() => {
    if (!loading && user) {
      const role = localStorage.getItem("userRole");
      router.replace(role === "expert" ? "/mentor/dashboard" : "/dashboard");
    }
  }, [user, loading, router]);

  /* ── OTP helper ── */
  const handleOtpChange = (
    digits: string[],
    setDigits: (d: string[]) => void,
    prefix: string
  ) =>
    (i: number, val: string) => {
      if (val && !/^[0-9]$/.test(val)) return;
      const next = [...digits];
      next[i] = val;
      setDigits(next);
      const nextIdx = val ? i + 1 : i - 1;
      if (nextIdx >= 0 && nextIdx < 6) {
        (document.getElementById(`${prefix}-${nextIdx}`) as HTMLInputElement | null)?.focus();
      }
    };

  /* ══════════════════════════════
     LOGIN FLOW
  ══════════════════════════════ */
  const sendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoginLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Failed to send OTP");
      setOtpSent(true);
      setStep("otp");
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoginLoading(false);
    }
  };

  const verifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = loginOtp.join("");
    if (otp.length !== 6) { setError("Enter the full 6-digit code"); return; }
    setError("");
    setLoginLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.data?.token)
        throw new Error(data?.error || "Invalid code");
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("sessionTimestamp", Date.now().toString());
      if (data.data.user?.role) localStorage.setItem("userRole", data.data.user.role);
      const role = data.data.user?.role;
      router.replace(role === "expert" ? "/mentor/dashboard" : "/dashboard");
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoginLoading(false);
    }
  };

  /* ══════════════════════════════
     SIGNUP FLOW
  ══════════════════════════════ */
  const sendSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSignupLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/send-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          userType: "student",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.errors?.[0]?.msg || "Failed to send OTP");
      setStep("otp");
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSignupLoading(false);
    }
  };

  const verifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = signupOtp.join("");
    if (otp.length !== 6) { setError("Enter the full 6-digit code"); return; }
    setError("");
    setVerifyLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          userType: "student",
          otp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Verification failed");
      if (data?.data?.token) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("sessionTimestamp", Date.now().toString());
        if (data.data.user?.role) localStorage.setItem("userRole", data.data.user.role);
      }
      setDone(true);
      setTimeout(() => router.replace("/dashboard"), 1500);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const switchMode = (m: "login" | "signup") => {
    setMode(m);
    setStep("form");
    setError("");
    setOtpSent(false);
    setLoginOtp(["", "", "", "", "", ""]);
    setSignupOtp(["", "", "", "", "", ""]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--sand)" }}>
        <Loader2 size={36} className="animate-spin text-[#3E5F44]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: "var(--sand)" }}>

      {/* ── Left visual panel ── */}
      <div
        className="relative hidden lg:flex flex-col overflow-hidden"
        style={{ background: "var(--brand)" }}
      >
        {/* decorative blobs */}
        <div className="blob w-[380px] h-[380px] top-10 -left-16 animate-floaty"
          style={{ background: "#8FB996", opacity: 0.5 }} />
        <div className="blob w-[300px] h-[300px] bottom-10 right-0 animate-floaty"
          style={{ background: "#D9A17C", opacity: 0.45, animationDelay: "2s" }} />

        <div className="relative flex flex-col justify-between h-full p-12 text-[#F4F1EA]">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-[#F4F1EA] text-[#3E5F44] font-display font-bold">
              C
            </span>
            <span className="font-display font-bold text-lg">Confiido</span>
          </Link>

          <div>
            <h2 className="font-editorial text-5xl leading-[1.05] mb-6">
              Your voice is waiting<br />to be heard.
            </h2>
            <p className="font-body text-[#D6DED2] max-w-md leading-relaxed">
              Join thousands of speakers and leaders who book expert coaches and
              transform how they communicate.
            </p>
          </div>

          <p className="font-body text-sm text-[#B9C7B7]">
            Sessions from ₹750 · Delivered on Google Meet
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="w-full max-w-md"
        >
          {/* Back link */}
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[#5C6B60] mb-8 hover:text-[#3E5F44] transition-colors w-fit"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>

          <AnimatePresence mode="wait">
            {/* ════════ SUCCESS ════════ */}
            {done && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <CheckCircle size={56} className="text-[#3E5F44] mx-auto mb-4" />
                <h2 className="font-display font-bold text-2xl text-[#121C14] mb-2">
                  Welcome to Confiido!
                </h2>
                <p className="font-body text-sm text-[#5C6B60]">Taking you to your dashboard…</p>
              </motion.div>
            )}

            {/* ════════ LOGIN — FORM ════════ */}
            {!done && mode === "login" && step === "form" && (
              <motion.div key="login-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: EASE }}>
                <h1 className="font-display font-bold text-3xl text-[#121C14] mb-2">
                  Welcome back
                </h1>
                <p className="font-body text-sm text-[#5C6B60] mb-8">
                  Log in to manage your sessions.
                </p>

                <form onSubmit={sendLoginOtp} className="space-y-4">
                  <div>
                    <label className="font-body text-xs font-semibold text-[#3A463C] mb-1.5 block">
                      Email address
                    </label>
                    <input
                      required
                      type="email"
                      data-testid="auth-email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full neo-inset rounded-xl px-4 py-3 font-body text-sm outline-none focus:ring-2 ring-[#3E5F44]/30 bg-transparent text-[#121C14] placeholder:text-[#9CA8A0]"
                    />
                  </div>

                  {error && (
                    <p className="text-red-600 text-xs font-body">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    data-testid="auth-submit"
                    className="w-full rounded-xl py-3.5 text-[#F4F1EA] font-medium transition-all active:scale-[0.98] hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: "var(--brand)" }}
                  >
                    {loginLoading && <Loader2 size={18} className="animate-spin" />}
                    Send verification code
                  </button>
                </form>

                <p className="font-body text-sm text-[#5C6B60] mt-6 text-center">
                  New to Confiido?{" "}
                  <button
                    data-testid="auth-toggle"
                    onClick={() => switchMode("signup")}
                    className="font-semibold text-[#3E5F44] hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              </motion.div>
            )}

            {/* ════════ LOGIN — OTP ════════ */}
            {!done && mode === "login" && step === "otp" && (
              <motion.div key="login-otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: EASE }}>
                <button
                  onClick={() => { setStep("form"); setError(""); setLoginOtp(["","","","","",""]); }}
                  className="flex items-center gap-2 text-sm text-[#5C6B60] mb-8 hover:text-[#3E5F44] transition-colors"
                >
                  <ArrowLeft size={16} /> Change email
                </button>

                <h1 className="font-display font-bold text-3xl text-[#121C14] mb-2">
                  Check your inbox
                </h1>
                <p className="font-body text-sm text-[#5C6B60] mb-8">
                  We sent a 6-digit code to <span className="font-semibold text-[#3E5F44]">{loginEmail}</span>
                </p>

                <form onSubmit={verifyLoginOtp} className="space-y-6">
                  <OtpInput
                    digits={loginOtp}
                    onChange={handleOtpChange(loginOtp, setLoginOtp, "login-otp")}
                    prefix="login-otp"
                  />

                  {error && (
                    <p className="text-red-600 text-xs font-body text-center">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full rounded-xl py-3.5 text-[#F4F1EA] font-medium transition-all active:scale-[0.98] hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: "var(--brand)" }}
                  >
                    {loginLoading && <Loader2 size={18} className="animate-spin" />}
                    Verify &amp; log in
                  </button>
                </form>

                <p className="font-body text-xs text-[#5C6B60] mt-4 text-center">
                  Didn&apos;t receive it?{" "}
                  <button onClick={sendLoginOtp} className="text-[#3E5F44] font-semibold hover:underline">
                    Resend
                  </button>
                </p>
              </motion.div>
            )}

            {/* ════════ SIGNUP — FORM ════════ */}
            {!done && mode === "signup" && step === "form" && (
              <motion.div key="signup-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: EASE }}>
                <h1 className="font-display font-bold text-3xl text-[#121C14] mb-2">
                  Create your account
                </h1>
                <p className="font-body text-sm text-[#5C6B60] mb-8">
                  Start your journey with a ₹500 welcome credit.
                </p>

                <form onSubmit={sendSignupOtp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-body text-xs font-semibold text-[#3A463C] mb-1.5 block">
                        First name
                      </label>
                      <input
                        required
                        data-testid="auth-first-name"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        placeholder="Jane"
                        className="w-full neo-inset rounded-xl px-4 py-3 font-body text-sm outline-none focus:ring-2 ring-[#3E5F44]/30 bg-transparent text-[#121C14] placeholder:text-[#9CA8A0]"
                      />
                    </div>
                    <div>
                      <label className="font-body text-xs font-semibold text-[#3A463C] mb-1.5 block">
                        Last name
                      </label>
                      <input
                        required
                        data-testid="auth-last-name"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        placeholder="Doe"
                        className="w-full neo-inset rounded-xl px-4 py-3 font-body text-sm outline-none focus:ring-2 ring-[#3E5F44]/30 bg-transparent text-[#121C14] placeholder:text-[#9CA8A0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-body text-xs font-semibold text-[#3A463C] mb-1.5 block">
                      Email
                    </label>
                    <input
                      required
                      type="email"
                      data-testid="auth-email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@email.com"
                      className="w-full neo-inset rounded-xl px-4 py-3 font-body text-sm outline-none focus:ring-2 ring-[#3E5F44]/30 bg-transparent text-[#121C14] placeholder:text-[#9CA8A0]"
                    />
                  </div>

                  <div>
                    <label className="font-body text-xs font-semibold text-[#3A463C] mb-1.5 block">
                      Password
                    </label>
                    <input
                      required
                      type="password"
                      data-testid="auth-password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min. 8 characters"
                      className="w-full neo-inset rounded-xl px-4 py-3 font-body text-sm outline-none focus:ring-2 ring-[#3E5F44]/30 bg-transparent text-[#121C14] placeholder:text-[#9CA8A0]"
                    />
                  </div>

                  <div>
                    <label className="font-body text-xs font-semibold text-[#3A463C] mb-1.5 block">
                      Confirm password
                    </label>
                    <input
                      required
                      type="password"
                      data-testid="auth-confirm-password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      className="w-full neo-inset rounded-xl px-4 py-3 font-body text-sm outline-none focus:ring-2 ring-[#3E5F44]/30 bg-transparent text-[#121C14] placeholder:text-[#9CA8A0]"
                    />
                  </div>

                  {error && (
                    <p className="text-red-600 text-xs font-body">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={signupLoading}
                    data-testid="auth-submit"
                    className="w-full rounded-xl py-3.5 text-[#F4F1EA] font-medium transition-all active:scale-[0.98] hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: "var(--brand)" }}
                  >
                    {signupLoading && <Loader2 size={18} className="animate-spin" />}
                    Create account
                  </button>
                </form>

                <p className="font-body text-sm text-[#5C6B60] mt-6 text-center">
                  Already have an account?{" "}
                  <button
                    data-testid="auth-toggle"
                    onClick={() => switchMode("login")}
                    className="font-semibold text-[#3E5F44] hover:underline"
                  >
                    Log in
                  </button>
                </p>
              </motion.div>
            )}

            {/* ════════ SIGNUP — OTP ════════ */}
            {!done && mode === "signup" && step === "otp" && (
              <motion.div key="signup-otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: EASE }}>
                <button
                  onClick={() => { setStep("form"); setError(""); setSignupOtp(["","","","","",""]); }}
                  className="flex items-center gap-2 text-sm text-[#5C6B60] mb-8 hover:text-[#3E5F44] transition-colors"
                >
                  <ArrowLeft size={16} /> Go back
                </button>

                <h1 className="font-display font-bold text-3xl text-[#121C14] mb-2">
                  Verify your email
                </h1>
                <p className="font-body text-sm text-[#5C6B60] mb-8">
                  Enter the 6-digit code sent to <span className="font-semibold text-[#3E5F44]">{form.email}</span>
                </p>

                <form onSubmit={verifySignupOtp} className="space-y-6">
                  <OtpInput
                    digits={signupOtp}
                    onChange={handleOtpChange(signupOtp, setSignupOtp, "signup-otp")}
                    prefix="signup-otp"
                  />

                  {error && (
                    <p className="text-red-600 text-xs font-body text-center">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={verifyLoading}
                    className="w-full rounded-xl py-3.5 text-[#F4F1EA] font-medium transition-all active:scale-[0.98] hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: "var(--brand)" }}
                  >
                    {verifyLoading && <Loader2 size={18} className="animate-spin" />}
                    Verify &amp; create account
                  </button>
                </form>

                <p className="font-body text-xs text-[#5C6B60] mt-4 text-center">
                  Didn&apos;t receive it?{" "}
                  <button onClick={sendSignupOtp} className="text-[#3E5F44] font-semibold hover:underline">
                    Resend
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── page export wrapped in Suspense (required for useSearchParams) ─── */
export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--sand)" }}>
        <Loader2 size={36} className="animate-spin text-[#3E5F44]" />
      </div>
    }>
      <AuthInner />
    </Suspense>
  );
}
