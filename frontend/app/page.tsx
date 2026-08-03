'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Star, Mic, Crown, Briefcase, Sparkles, Quote } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import LandingNavbar from "./components/LandingNavbar";
import LandingFooter from "./components/LandingFooter";
import useLenis from "./hooks/useLenis";
import api from "./lib/api";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const ICONS: Record<string, React.ElementType> = {
  mic: Mic,
  crown: Crown,
  briefcase: Briefcase,
  sparkles: Sparkles,
};

interface Category {
  slug: string;
  name: string;
  icon: string;
  image: string;
  desc: string;
  mentors: number;
}

interface Review {
  text: string;
  name: string;
  role: string;
  avatar: string;
}

interface Stats {
  mentors: number;
  sessions: number;
  rating: number;
  countries: number;
}

function RevealLine({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <span className="reveal-mask">
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function Section({
  children,
  className = "",
  id,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: EASE }}
      className={className}
      style={style}
    >
      {children}
    </motion.section>
  );
}

export default function Landing() {
  useLenis(true);
  const [cats, setCats] = useState<Category[]>([
    {
      slug: "public-speaking",
      name: "Public Speaking",
      icon: "mic",
      desc: "Command any room with presence, clarity and unshakeable confidence.",
      mentors: 12,
      image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80",
    },
    {
      slug: "storytelling",
      name: "Storytelling",
      icon: "sparkles",
      desc: "Craft narratives that move, persuade and linger long after you stop speaking.",
      mentors: 8,
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    },
    {
      slug: "interview-mastery",
      name: "Interview Mastery",
      icon: "briefcase",
      desc: "Walk into every interview ready to impress — and walk out with the offer.",
      mentors: 10,
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80",
    },
    {
      slug: "leadership",
      name: "Leadership Voice",
      icon: "crown",
      desc: "Develop the executive presence and gravitas that great leaders radiate.",
      mentors: 6,
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
    },
  ]);
  const [reviews, setReviews] = useState<Review[]>([
    {
      text: "My TEDx talk got a standing ovation. Three months ago I could barely get through a sentence without stumbling. Confiido completely changed the game for me.",
      name: "Priya Sharma",
      role: "TEDx Speaker · Mumbai",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      text: "I landed my dream job at a top MNC after two sessions on interview confidence. The coach broke down every answer structure so simply. Worth every rupee.",
      name: "Arjun Mehta",
      role: "Software Engineer · Bangalore",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      text: "As a startup founder, I used to dread investor pitches. Now I walk in knowing exactly how to tell our story. Closed our seed round two weeks after my first session.",
      name: "Nidhi Kapoor",
      role: "Founder, Leaflet · Delhi",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    {
      text: "Executive presence isn't something you're born with — it's a skill. My coach helped me find my voice in boardroom meetings. My team noticed within a week.",
      name: "Rohan Verma",
      role: "VP Product · Hyderabad",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    },
  ]);
  const [stats, setStats] = useState<Stats>({
    mentors: 6,
    sessions: 12480,
    rating: 4.9,
    countries: 32,
  });
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const blobY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const imgY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  useEffect(() => {
    api.get("/categories").then((r) => { if (r.data?.length) setCats(r.data); }).catch(() => {});
    api.get("/reviews").then((r) => { if (r.data?.length) setReviews(r.data); }).catch(() => {});
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);


  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/contact", { ...contact, subject: "Landing enquiry" });
      setSent(true);
      setContact({ name: "", email: "", message: "" });
    } catch {
      /* ignore */
    }
  };

  const faqs = [
    {
      q: "How do the sessions actually work?",
      a: "Pick a mentor, choose a slot, and confirm. You'll instantly get a Google Meet link for a focused 1-on-1 video session.",
    },
    {
      q: "What does a session cost?",
      a: "Sessions start at ₹750. Each mentor sets their own rate based on experience — clearly shown on their profile before you book.",
    },
    {
      q: "Can I get matched to the right coach?",
      a: "Yes. Browse by category — Public Speaking, Leadership, Interview Mastery, Storytelling — and read verified reviews to find your fit.",
    },
    {
      q: "What if I need to reschedule?",
      a: "You can manage every booking from your dashboard, including upcoming sessions, transactions and payments.",
    },
  ];

  return (
    <div className="relative overflow-x-hidden">
      <LandingNavbar />

      {/* HERO */}
      <div
        ref={heroRef}
        className="relative min-h-[100vh] flex items-center pt-28 pb-16 px-6 md:px-12"
      >
        <motion.div
          style={{ y: blobY }}
          className="absolute inset-0 pointer-events-none"
        >
          <div
            className="blob w-[420px] h-[420px] top-[8%] -left-20 animate-floaty"
            style={{ background: "#8FB996" }}
          />
          <div
            className="blob w-[320px] h-[320px] top-[45%] right-[8%] animate-floaty"
            style={{ background: "#D9A17C", animationDelay: "1.5s" }}
          />
          <div
            className="blob w-[260px] h-[260px] bottom-[6%] left-[30%] animate-floaty"
            style={{ background: "#B9C7B7", animationDelay: "3s" }}
          />
        </motion.div>

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 items-center w-full">
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-body text-xs tracking-[0.25em] uppercase font-bold text-[#3E5F44] mb-6"
            >
              Mentor booking · for speakers &amp; leaders
            </motion.p>
            <h1 className="font-editorial text-5xl sm:text-6xl lg:text-[5.4rem] leading-[0.92] tracking-tight text-[#121C14]">
              <RevealLine delay={0.1}>Speak with</RevealLine>
              <RevealLine delay={0.22}>
                <span className="italic" style={{ color: "var(--brand)" }}>
                  confidence,
                </span>
              </RevealLine>
              <RevealLine delay={0.34}>lead with clarity.</RevealLine>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
              className="font-body text-base md:text-lg text-[#5C6B60] mt-7 max-w-lg leading-relaxed"
            >
              Book world-class communication coaches for private 1-on-1 sessions.
              Find your voice, own the room, and grow — one conversation at a time.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.8, ease: EASE }}
              className="flex flex-wrap items-center gap-4 mt-9"
            >
              <Link
                href="/mentors"
                data-testid="hero-cta-button"
                className="group flex items-center gap-2 rounded-full px-7 py-4 text-[#F4F1EA] font-medium transition-all active:scale-95 hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                Find your mentor
                <ArrowUpRight
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
              <a
                href="#how"
                className="rounded-full px-7 py-4 font-medium neo neo-hover text-[#3E5F44]"
              >
                How it works
              </a>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="flex items-center gap-8 mt-12"
            >
              {[
                [stats.sessions.toLocaleString() + "+", "Sessions booked"],
                [stats.rating, "Avg. rating"],
                [stats.countries + "+", "Countries"],
              ].map(([n, l]) => (
                <div key={String(l)}>
                  <div className="font-display font-bold text-2xl text-[#121C14]">
                    {n}
                  </div>
                  <div className="font-body text-xs text-[#5C6B60] tracking-wide">
                    {l}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div style={{ y: imgY }} className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: -2 }}
              transition={{ delay: 0.5, duration: 1, ease: EASE }}
              className="relative rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white"
            >
              <img
                src="https://images.unsplash.com/photo-1582896911227-c966f6e7fb93?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwzfHxjb25maWRlbnQlMjBwcm9mZXNzaW9uYWwlMjBzcGVha2luZyUyMHBvcnRyYWl0fGVufDB8fHx8MTc4NTc5MzE0Nnww&ixlib=rb-4.1.0&q=85"
                alt="Confident speaker"
                className="w-full h-[440px] object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8, ease: EASE }}
              className="absolute -bottom-6 -left-6 glass rounded-2xl px-5 py-4 flex items-center gap-3"
            >
              <div
                className="grid place-items-center w-11 h-11 rounded-full"
                style={{ background: "var(--brand)" }}
              >
                <Star size={18} className="text-[#F4F1EA] fill-[#F4F1EA]" />
              </div>
              <div>
                <div className="font-display font-bold text-[#121C14]">
                  Top-rated coaches
                </div>
                <div className="font-body text-xs text-[#5C6B60]">
                  Verified · 4.9 average
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* MARQUEE */}
      <div
        className="py-6 border-y border-[#3E5F44]/12 overflow-hidden"
        style={{ background: "#EFEBE1" }}
      >
        <div className="flex w-max animate-marquee">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex items-center">
              {[
                "Public Speaking",
                "Executive Presence",
                "Interview Mastery",
                "Storytelling",
                "Vocal Delivery",
                "Confidence",
              ].map((t) => (
                <span
                  key={t + k}
                  className="font-editorial italic text-3xl md:text-4xl text-[#3E5F44] px-8 whitespace-nowrap"
                >
                  {t}{" "}
                  <span className="text-[#D97757] not-italic">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <Section
        id="categories"
        className="px-6 md:px-12 py-24 md:py-32 max-w-6xl mx-auto"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="font-body text-xs tracking-[0.25em] uppercase font-bold text-[#3E5F44] mb-3">
              Explore mentors
            </p>
            <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight text-[#121C14] max-w-xl leading-[1.02]">
              Coaching for every kind of conversation.
            </h2>
          </div>
          <Link
            href="/mentors"
            className="font-body text-sm text-[#3E5F44] flex items-center gap-1 hover:gap-2 transition-all"
          >
            Browse all <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-5 auto-rows-[220px]">
          {cats.map((c, i) => {
            const Icon = ICONS[c.icon] || Sparkles;
            const big = i === 0 || i === 3;
            return (
              <Link
                href={`/mentors?category=${encodeURIComponent(c.name)}`}
                key={c.slug}
                data-testid={`category-card-${c.slug}`}
                className={`group relative rounded-3xl overflow-hidden ${
                  big ? "md:col-span-4" : "md:col-span-2"
                }`}
              >
                <img
                  src={c.image}
                  alt={c.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(18,28,20,0.1) 0%, rgba(18,28,20,0.82) 100%)",
                  }}
                />
                <div className="relative h-full p-6 flex flex-col justify-between">
                  <div className="grid place-items-center w-11 h-11 rounded-full glass-dark">
                    <Icon size={20} className="text-[#F4F1EA]" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-2xl text-white">
                      {c.name}
                    </h3>
                    <p className="font-body text-sm text-white/80 mt-1 max-w-sm">
                      {c.desc}
                    </p>
                    <span className="font-body text-xs text-white/70 mt-3 inline-block">
                      {c.mentors} mentors available
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section
        id="how"
        className="px-6 md:px-12 py-24 md:py-32 text-[#E7ECE6]"
      >
        <div
          style={{ background: "var(--brand)" }}
          className="max-w-6xl mx-auto rounded-[2.5rem] p-10 md:p-16 text-[#F4F1EA]"
        >
          <p className="font-body text-xs tracking-[0.25em] uppercase font-bold text-[#B9C7B7] mb-4">
            Get started in 3 steps
          </p>
          <h2 className="font-editorial text-4xl md:text-6xl leading-[1] mb-14 max-w-2xl">
            A simple path from nervous to natural.
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              [
                "01",
                "Book your session",
                "Pick a mentor whose style fits you and choose a slot that works around your schedule.",
              ],
              [
                "02",
                "Secure with easy payment",
                "Confirm in seconds from your wallet. Transparent pricing, no surprises.",
              ],
              [
                "03",
                "Join on Google Meet",
                "Hop on a focused 1-on-1 video call and start growing, session after session.",
              ],
            ].map(([n, t, d]) => (
              <div key={n} className="border-t border-white/25 pt-6">
                <div className="font-editorial text-5xl text-[#B9C7B7] mb-4">
                  {n}
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{t}</h3>
                <p className="font-body text-sm text-[#D6DED2] leading-relaxed">
                  {d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* REVIEWS */}
      <Section
        id="stories"
        className="px-6 md:px-12 py-24 md:py-32 max-w-6xl mx-auto"
      >
        <p className="font-body text-xs tracking-[0.25em] uppercase font-bold text-[#3E5F44] mb-3">
          Success stories
        </p>
        <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight text-[#121C14] mb-14 max-w-2xl leading-[1.02]">
          What our students say after showing up.
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE, delay: i * 0.08 }}
              data-testid={`review-card-${i}`}
              className="neo neo-hover rounded-3xl p-6 flex flex-col"
            >
              <Quote size={26} className="text-[#D97757] mb-4" />
              <p className="font-body text-[15px] text-[#2A3A2D] leading-relaxed flex-1">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#E8EBE8]">
                <img
                  src={r.avatar}
                  alt={r.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-display font-semibold text-sm text-[#121C14]">
                    {r.name}
                  </div>
                  <div className="font-body text-xs text-[#5C6B60]">{r.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* FAQ + CONTACT */}
      <Section className="px-6 md:px-12 pb-28 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
        <div>
          <p className="font-body text-xs tracking-[0.25em] uppercase font-bold text-[#3E5F44] mb-3">
            FAQ
          </p>
          <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight text-[#121C14] mb-8">
            Questions, answered.
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-[#3E5F44]/15"
              >
                <AccordionTrigger
                  data-testid={`faq-${i}`}
                  className="font-display font-semibold text-left text-[#121C14] hover:text-[#3E5F44] hover:no-underline"
                >
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="font-body text-[#5C6B60] text-[15px] leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="glass rounded-[2rem] p-8 md:p-10 self-start">
          <h3 className="font-display font-bold text-2xl text-[#121C14] mb-2">
            Still curious? Say hello.
          </h3>
          <p className="font-body text-sm text-[#5C6B60] mb-6">
            Tell us your goal and we&apos;ll point you to the right coach.
          </p>
          {sent ? (
            <div
              className="neo rounded-2xl p-6 text-center"
              data-testid="contact-success"
            >
              <p className="font-display font-semibold text-[#3E5F44]">
                Thanks! We&apos;ll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={submitContact} className="space-y-4">
              <input
                required
                data-testid="contact-name"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                placeholder="Your name"
                className="w-full neo-inset rounded-xl px-4 py-3 font-body text-sm outline-none focus:ring-2 ring-[#3E5F44]/30 bg-transparent"
              />
              <input
                required
                type="email"
                data-testid="contact-email"
                value={contact.email}
                onChange={(e) =>
                  setContact({ ...contact, email: e.target.value })
                }
                placeholder="Email address"
                className="w-full neo-inset rounded-xl px-4 py-3 font-body text-sm outline-none focus:ring-2 ring-[#3E5F44]/30 bg-transparent"
              />
              <textarea
                required
                rows={4}
                data-testid="contact-message"
                value={contact.message}
                onChange={(e) =>
                  setContact({ ...contact, message: e.target.value })
                }
                placeholder="What would you like to improve?"
                className="w-full neo-inset rounded-xl px-4 py-3 font-body text-sm outline-none focus:ring-2 ring-[#3E5F44]/30 bg-transparent resize-none"
              />
              <button
                type="submit"
                data-testid="contact-submit"
                className="w-full rounded-xl py-3.5 text-[#F4F1EA] font-medium transition-all active:scale-[0.98] hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                Send message
              </button>
            </form>
          )}
        </div>
      </Section>

      <LandingFooter />
    </div>
  );
}
