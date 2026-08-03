'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";

export default function LandingNavbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const nav = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Mentors", to: "/mentors" },
    { label: "How it works", to: "/#how" },
    { label: "Stories", to: "/#stories" },
  ];

  const handleLogout = async () => {
    await logout();
    nav.push("/");
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 inset-x-0 z-50 px-4 md:px-8 pt-4"
    >
      <div
        className={`mx-auto max-w-6xl flex items-center justify-between rounded-full px-5 md:px-6 py-3 transition-all duration-500 ${
          scrolled ? "glass" : "bg-transparent border border-transparent"
        }`}
      >
        <Link href="/" data-testid="nav-logo" className="flex items-center gap-2">
          <span
            className="grid place-items-center w-9 h-9 rounded-full text-[#F4F1EA] font-display font-bold"
            style={{ background: "var(--brand)" }}
          >
            C
          </span>
          <span className="font-display font-bold text-lg tracking-tight text-[#121C14]">
            Confiido
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.to}
              data-testid={`nav-${l.label.split(" ")[0].toLowerCase()}`}
              className="font-body text-sm text-[#3A463C] hover:text-[#3E5F44] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <button
                data-testid="nav-dashboard-btn"
                onClick={() => nav.push("/dashboard")}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[#F4F1EA] transition-all active:scale-95 hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                <LayoutDashboard size={16} /> Dashboard
              </button>
              <button
                data-testid="nav-logout-btn"
                onClick={handleLogout}
                className="grid place-items-center w-9 h-9 rounded-full neo neo-hover text-[#3E5F44]"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth"
                data-testid="nav-login-link"
                className="font-body text-sm text-[#3A463C] hover:text-[#3E5F44]"
              >
                Log in
              </Link>
              <Link
                href="/auth?mode=signup"
                data-testid="nav-signup-btn"
                className="rounded-full px-5 py-2 text-sm font-medium text-[#F4F1EA] transition-all active:scale-95 hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-[#121C14]"
          onClick={() => setOpen(!open)}
          data-testid="nav-mobile-toggle"
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden mx-auto max-w-6xl mt-2 glass rounded-3xl p-5 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.to}
              onClick={() => setOpen(false)}
              className="font-body text-[#3A463C]"
            >
              {l.label}
            </a>
          ))}
          {user ? (
            <button
              onClick={() => {
                setOpen(false);
                nav.push("/dashboard");
              }}
              className="rounded-full px-4 py-2 text-sm text-[#F4F1EA]"
              style={{ background: "var(--brand)" }}
            >
              Dashboard
            </button>
          ) : (
            <Link
              href="/auth?mode=signup"
              onClick={() => setOpen(false)}
              className="rounded-full px-4 py-2 text-sm text-[#F4F1EA] text-center"
              style={{ background: "var(--brand)" }}
            >
              Get started
            </Link>
          )}
        </div>
      )}
    </motion.header>
  );
}
