import Link from "next/link";
import { Instagram, Linkedin, Twitter } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer
      className="relative overflow-hidden text-[#E7ECE6]"
      style={{ background: "var(--brand-hover)" }}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-[#F4F1EA] text-[#3E5F44] font-display font-bold">
                C
              </span>
              <span className="font-display font-bold text-xl">Confiido</span>
            </div>
            <p className="font-editorial text-2xl md:text-3xl leading-tight max-w-md text-[#F4F1EA]">
              Speak with confidence, lead with clarity.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm tracking-widest uppercase text-[#B9C7B7]">
              Explore
            </h4>
            <ul className="space-y-2 font-body text-sm text-[#D6DED2]">
              <li>
                <Link href="/mentors" className="hover:text-white transition-colors">
                  Find a mentor
                </Link>
              </li>
              <li>
                <a href="/#how" className="hover:text-white transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="/#stories" className="hover:text-white transition-colors">
                  Success stories
                </a>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition-colors">
                  Get started
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-4 text-sm tracking-widest uppercase text-[#B9C7B7]">
              Connect
            </h4>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid place-items-center w-10 h-10 rounded-full glass-dark hover:bg-white/20 transition-colors"
                  aria-label="social"
                >
                  <Icon size={18} className="text-[#F4F1EA]" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-14 pt-6 border-t border-white/15 flex flex-col md:flex-row justify-between gap-3 text-sm text-[#B9C7B7]">
          <span>© {new Date().getFullYear()} Confiido. Crafted with care.</span>
          <span>Sessions from ₹750 · Delivered on Google Meet</span>
        </div>
      </div>
    </footer>
  );
}
