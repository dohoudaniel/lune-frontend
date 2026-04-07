import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  ArrowRight,
  Briefcase,
  TrendingUp,
  Code,
  CheckCircle,
  Award,
  Search,
  ChevronRight,
  Star,
  Globe,
  Shield,
  Zap,
  Users,
} from "lucide-react";
import { ViewState, UserRole } from "../types";
import { motion, AnimatePresence, useAnimationFrame } from "framer-motion";
import { SEO } from "./SEO";

// ── LAZY IMAGE COMPONENT ──
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = "",
  containerClassName = "",
  priority = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true);
          if (containerRef.current) {
            observer.unobserve(containerRef.current);
          }
        }
      },
      { rootMargin: "100px" },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [priority]);

  return (
    <div ref={containerRef} className={containerClassName}>
      {!isLoaded ? (
        <div className={`${className} bg-gray-200 animate-pulse`} />
      ) : (
        <motion.img
          src={src}
          alt={alt}
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
};

interface LandingProps {
  onNavigate: (view: ViewState, role?: UserRole) => void;
}

const roles = [
  { label: "Virtual Assistant", category: "ops" },
  { label: "Customer Service", category: "ops" },
  { label: "Sales Rep", category: "sales" },
  { label: "Business Development", category: "sales" },
  { label: "E-Commerce Specialist", category: "ops" },
  { label: "Digital Marketing", category: "marketing" },
  { label: "Content Creator", category: "marketing" },
  { label: "SEO Specialist", category: "marketing" },
  { label: "Frontend Developer", category: "tech" },
  { label: "Backend Developer", category: "tech" },
  { label: "Software Engineer", category: "tech" },
  { label: "Mobile Developer", category: "tech" },
  { label: "DevOps Engineer", category: "tech" },
  { label: "DevRel", category: "tech" },
  { label: "Project Manager", category: "ops" },
  { label: "HR & Recruiting", category: "ops" },
  { label: "Executive Assistant", category: "ops" },
  { label: "Data Entry Specialist", category: "ops" },
];

const categoryDot: Record<string, string> = {
  tech: "bg-teal-500",
  ops: "bg-orange-400",
  sales: "bg-orange-400",
  marketing: "bg-purple-500",
};

const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

function MarqueePills() {
  const doubled = [...roles, ...roles];
  const ref = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const speedRef = useRef(0.6);

  useAnimationFrame(() => {
    if (!ref.current) return;
    const el = ref.current;
    const half = el.scrollWidth / 2;
    xRef.current -= speedRef.current;
    if (Math.abs(xRef.current) >= half) xRef.current = 0;
    el.style.transform = `translateX(${xRef.current}px)`;
  });

  return (
    <div className="overflow-hidden w-full" aria-hidden="true">
      <div ref={ref} className="flex gap-3 w-max py-3">
        {doubled.map((role, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-full px-4 py-1.5 text-sm font-medium text-gray-700 whitespace-nowrap select-none"
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${categoryDot[role.category]}`}
            />
            {role.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Lune",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Lune is the only platform where VAs, Customer Service reps, Sales professionals, Engineers, and every major role can prove their skills — and employers can trust every credential.",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
    },
  };

  return (
    <>
      <SEO
        title="Lune — Hire Skilled Talent. Get Verified. Get Hired."
        description="Lune is the only platform where VAs, Customer Service reps, Sales professionals, Engineers, and every major role can prove their skills — and employers can trust every credential."
        structuredData={structuredData}
      />

      {/* ── NAVBAR ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-md border-b border-cream transition-shadow duration-200 ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 focus:outline-none"
              aria-label="Lune home"
            >
              <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center flex-shrink-0">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                lune
              </span>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-7">
              <button
                onClick={() => scrollTo("roles")}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                For Candidates
              </button>
              <button
                onClick={() => scrollTo("dual-cta")}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                For Employers
              </button>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                How it Works
              </button>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => onNavigate(ViewState.LOGIN)}
                className="text-sm font-medium text-gray-700 px-4 py-2 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all"
              >
                Log In
              </button>
              <button
                onClick={() => onNavigate(ViewState.SIGNUP)}
                className="text-sm font-semibold text-white bg-black px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Get Started Free
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="md:hidden overflow-hidden border-t border-gray-100 bg-white"
            >
              <div className="px-4 py-4 flex flex-col gap-3">
                <button
                  onClick={() => {
                    scrollTo("roles");
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-medium text-gray-700 text-left py-2 hover:text-black transition-colors"
                >
                  For Candidates
                </button>
                <button
                  onClick={() => {
                    scrollTo("dual-cta");
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-medium text-gray-700 text-left py-2 hover:text-black transition-colors"
                >
                  For Employers
                </button>
                <button
                  onClick={() => {
                    scrollTo("how-it-works");
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-medium text-gray-700 text-left py-2 hover:text-black transition-colors"
                >
                  How it Works
                </button>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate(ViewState.LOGIN);
                    }}
                    className="w-full text-sm font-medium text-gray-700 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate(ViewState.SIGNUP);
                    }}
                    className="w-full text-sm font-semibold text-white bg-black px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Get Started Free
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-16">
        {/* ── HERO ── */}
        <section
          id="hero"
          className="relative bg-cream overflow-hidden min-h-[calc(100vh-4rem)] flex items-center"
        >
          {/* Background blobs */}
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #2dd4bf 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-25 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #fb923c 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 lg:pt-12 lg:pb-28 w-full">
            <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
              {/* Left — copy */}
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-6 lg:col-span-2"
              >
                <motion.div variants={fadeInUp}>
                  <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
                    <Shield size={11} /> AI-Powered Skill Verification
                  </span>
                </motion.div>

                <motion.h1
                  variants={fadeInUp}
                  className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-gray-900 leading-tight tracking-tight"
                >
                  Hire <span className="text-orange-500">Verified</span> Talent.
                  <br />
                  Get <span className="text-orange-500">Verified</span>. Get
                  Hired.
                </motion.h1>

                <motion.p
                  variants={fadeInUp}
                  className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl"
                >
                  Lune is the only platform where VAs, Customer Service reps,
                  Sales professionals, Engineers, and every major role can prove
                  their skills — and employers can trust every credential.
                </motion.p>

                <motion.div
                  variants={fadeInUp}
                  className="flex flex-wrap gap-3"
                >
                  <button
                    onClick={() => onNavigate(ViewState.SIGNUP)}
                    className="inline-flex items-center gap-2 bg-black text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm"
                  >
                    Find Talent <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => onNavigate(ViewState.SIGNUP)}
                    className="inline-flex items-center gap-2 border-2 border-orange-500 text-orange-600 font-semibold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors text-sm"
                  >
                    Get Certified Free
                  </button>
                </motion.div>

                <motion.div
                  variants={fadeInUp}
                  className="flex items-center gap-4 pt-2"
                >
                  <div className="flex -space-x-2">
                    {[
                      "bg-orange-400",
                      "bg-teal-400",
                      "bg-purple-400",
                      "bg-blue-400",
                    ].map((c, i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded-full ${c} border-2 border-white`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-800">12,000+</span>{" "}
                    professionals verified
                  </p>
                </motion.div>
              </motion.div>

              {/* Right — Hero Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative flex flex-col items-center justify-center w-full lg:col-span-3"
              >
                {/* Hero 3D Illustration with container */}
                <div className="relative w-full h-auto">
                  {/* Animated background glow */}
                  <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-gradient-to-br from-teal-300 to-orange-300 rounded-3xl blur-2xl opacity-20 pointer-events-none"
                  />

                  {/* Hero Image */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="relative rounded-2xl overflow-hidden shadow-2xl"
                  >
                    <LazyImage
                      src="/assets/landing/optimized_1.webp"
                      alt="Lune 3D illustration showcasing verified talent platform"
                      className="w-full h-auto object-cover"
                      containerClassName="w-full"
                      priority={true}
                    />
                  </motion.div>

                  {/* Decorative floating badge */}
                  <motion.div
                    animate={{ y: [0, -12, 0] }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute -bottom-1 -left-1 sm:-bottom-4 sm:-left-4 bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg border border-gray-100 p-2 sm:p-4 max-w-xs scale-50 sm:scale-75 lg:scale-90 origin-bottom-left z-10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          Verified Badge
                        </p>
                        <p className="text-xs text-gray-500">
                          Tamper-proof credentials
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating stats badge */}
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg border border-gray-100 p-1.5 sm:p-3 max-w-xs scale-50 sm:scale-75 lg:scale-90 origin-top-right z-10"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-center">
                        <p className="text-xl font-bold text-black">98%</p>
                        <p className="text-xs text-gray-500 font-medium">
                          Accuracy
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── ROLES ── */}
        <section id="roles" className="bg-white py-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3"
              >
                Built for Every Professional
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-gray-500 text-base max-w-xl mx-auto"
              >
                From non-tech to deep tech — if you have a skill, we verify it.
              </motion.p>
            </motion.div>
          </div>

          {/* Marquee pills */}
          <MarqueePills />

          {/* Role category cards */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              {[
                {
                  icon: <Briefcase size={22} />,
                  accent: "text-orange-500",
                  bg: "bg-orange-50",
                  border: "border-orange-100",
                  title: "Operations & Support",
                  desc: "VAs, Customer Service, E-Commerce Specialists, Executive Assistants, HR & Recruiting, Project Managers",
                },
                {
                  icon: <TrendingUp size={22} />,
                  accent: "text-purple-500",
                  bg: "bg-purple-50",
                  border: "border-purple-100",
                  title: "Sales & Growth",
                  desc: "SDRs, Account Executives, Business Development, Digital Marketers, Content Creators, SEO Specialists",
                },
                {
                  icon: <Code size={22} />,
                  accent: "text-teal-600",
                  bg: "bg-teal-50",
                  border: "border-teal-100",
                  title: "Tech & Engineering",
                  desc: "Frontend, Backend, Mobile, DevOps, DevRel, Software Engineers — all skill-verified with precision",
                },
              ].map((card) => (
                <motion.div
                  key={card.title}
                  variants={fadeInUp}
                  className={`rounded-2xl border ${card.border} ${card.bg} p-6 flex flex-col gap-3`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm ${card.accent}`}
                  >
                    {card.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {card.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {card.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="bg-cream py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3"
              >
                How Lune Works
              </motion.h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                {
                  step: "1",
                  icon: <Zap size={24} />,
                  title: "Take the Assessment",
                  desc: "AI-proctored tests tailored to your exact role — fair, rigorous, and trusted by employers.",
                  image: "/assets/landing/optimized_2.webp",
                },
                {
                  step: "2",
                  icon: <Award size={24} />,
                  title: "Earn Your Certificate",
                  desc: "A tamper-proof credential is added to your Skill Passport, shareable anywhere.",
                  image: "/assets/landing/optimized_3.webp",
                },
                {
                  step: "3",
                  icon: <Search size={24} />,
                  title: "Get Discovered",
                  desc: "Employers search verified talent by role, score, and skill — you rise to the top.",
                  image: "/assets/landing/optimized_4.webp",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  variants={fadeInUp}
                  className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full"
                >
                  <div className="p-6 lg:p-8 flex flex-col gap-4 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-black text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {item.step}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-700">
                        {item.icon}
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  {item.image && (
                    <div className="w-full h-56 overflow-hidden">
                      <LazyImage
                        src={item.image}
                        alt={`${item.title} - Step ${item.step}`}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                        priority={false}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* UI Mockup Showcase */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="mt-20 pt-10"
            >
              <motion.div
                variants={fadeInUp}
                className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Text Content */}
                  <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
                    <motion.span
                      variants={fadeInUp}
                      className="inline-block text-sm font-semibold text-orange-600 mb-3 w-fit"
                    >
                      ✨ Platform Features
                    </motion.span>
                    <motion.h3
                      variants={fadeInUp}
                      className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight"
                    >
                      Your Skill Dashboard
                    </motion.h3>
                    <motion.p
                      variants={fadeInUp}
                      className="text-gray-600 text-base leading-relaxed mb-6"
                    >
                      Track your verified credentials, view assessment scores,
                      and showcase your skills to employers. Our intuitive
                      interface makes it easy to manage your professional
                      profile and apply for opportunities.
                    </motion.p>
                    <motion.div
                      variants={fadeInUp}
                      className="flex flex-col gap-3"
                    >
                      {[
                        "Real-time skill verification",
                        "Tamper-proof credentials",
                        "Direct employer discovery",
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Image Content */}
                  <motion.div
                    variants={fadeInUp}
                    className="relative h-full min-h-96 lg:min-h-auto bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 sm:p-8 lg:p-10"
                  >
                    <LazyImage
                      src="/assets/landing/optimized_5.webp"
                      alt="Lune platform UI mockup showing skill dashboard and verification interface"
                      className="w-full h-auto max-w-lg object-cover drop-shadow-lg"
                      containerClassName="w-full flex items-center justify-center"
                      priority={false}
                    />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── TRUST / SOCIAL PROOF ── */}
        <section className="bg-slate-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl sm:text-4xl font-extrabold mb-3"
              >
                Trusted by professionals across 30+ countries
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-slate-400 text-base max-w-xl mx-auto"
              >
                Real results for real people, from Lagos to London to Los
                Angeles.
              </motion.p>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
            >
              {[
                {
                  stat: "12,000+",
                  label: "Professionals Certified",
                  icon: <Users size={18} />,
                },
                {
                  stat: "500+",
                  label: "Hiring Companies",
                  icon: <Briefcase size={18} />,
                },
                {
                  stat: "98%",
                  label: "Credential Accuracy",
                  icon: <Shield size={18} />,
                },
                { stat: "30+", label: "Countries", icon: <Globe size={18} /> },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  variants={fadeInUp}
                  className="bg-slate-800 rounded-2xl p-5 flex flex-col gap-2 border border-slate-700"
                >
                  <div className="text-slate-400">{item.icon}</div>
                  <p className="text-2xl font-extrabold text-white">
                    {item.stat}
                  </p>
                  <p className="text-sm text-slate-400 leading-snug">
                    {item.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Global Community Visual */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="mb-12"
            >
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700 p-8 lg:p-12">
                <motion.div
                  variants={fadeInUp}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
                >
                  <div className="flex flex-col gap-4">
                    <h3 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                      A Global Community of Verified Professionals
                    </h3>
                    <p className="text-slate-400 text-base leading-relaxed">
                      Talent from across continents, all verified by the same
                      rigorous standards. Join thousands of professionals who've
                      transformed their careers through skill verification and
                      global opportunity access.
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <LazyImage
                      src="/assets/landing/optimized_6.webp"
                      alt="Global community of verified professionals across 30+ countries"
                      className="w-full h-auto max-w-md rounded-xl object-cover"
                      containerClassName="w-full"
                      priority={false}
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Testimonials */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {[
                {
                  quote:
                    "I got hired within 2 weeks of earning my Lune certificate. My employer said the verified score was the deciding factor. This platform is a game-changer for remote workers.",
                  name: "Amara O.",
                  role: "Virtual Assistant · Nigeria",
                  color: "from-orange-500 to-orange-600",
                },
                {
                  quote:
                    "We used to spend 3 weeks screening candidates. With Lune, we find verified talent in hours. The credential accuracy is unmatched — we've made 47 hires through the platform.",
                  name: "James T.",
                  role: "Head of Talent · SaaS Company",
                  color: "from-teal-500 to-teal-600",
                },
              ].map((t) => (
                <motion.div
                  key={t.name}
                  variants={fadeInUp}
                  className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col gap-4"
                >
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className="text-orange-400 fill-orange-400"
                      />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                    >
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {t.name}
                      </p>
                      <p className="text-slate-500 text-xs">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── DUAL CTA ── */}
        <section id="dual-cta" className="bg-cream py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Candidates */}
              <motion.div
                variants={fadeInUp}
                className="relative overflow-hidden rounded-2xl p-8 flex flex-col gap-5"
                style={{
                  background:
                    "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                }}
              >
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
                <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10" />
                <div className="relative">
                  <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    For Candidates
                  </span>
                  <h3 className="text-2xl font-extrabold text-white leading-tight mb-2">
                    Prove your skills.
                    <br />
                    Get hired faster.
                  </h3>
                  <p className="text-orange-100 text-sm mb-5">
                    Take a free AI-proctored assessment and earn a credential
                    employers actually trust.
                  </p>
                  <button
                    onClick={() => onNavigate(ViewState.SIGNUP)}
                    className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-orange-50 transition-colors"
                  >
                    Start Free Assessment <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>

              {/* Employers */}
              <motion.div
                variants={fadeInUp}
                className="relative overflow-hidden rounded-2xl p-8 flex flex-col gap-5 bg-slate-900"
              >
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-teal-500/10" />
                <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-teal-500/10" />
                <div className="relative">
                  <span className="inline-block bg-teal-500/20 text-teal-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    For Employers
                  </span>
                  <h3 className="text-2xl font-extrabold text-white leading-tight mb-2">
                    Skip the noise.
                    <br />
                    Hire verified.
                  </h3>
                  <p className="text-slate-400 text-sm mb-5">
                    Browse a curated pool of skill-verified professionals ready
                    to contribute from day one.
                  </p>
                  <button
                    onClick={() => onNavigate(ViewState.SIGNUP)}
                    className="inline-flex items-center gap-2 bg-teal-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-teal-400 transition-colors"
                  >
                    Browse Talent <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-white border-t border-gray-100 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center flex-shrink-0">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
              <span className="font-bold text-gray-900">lune</span>
              <span className="text-gray-400 text-sm ml-2">
                © 2026 Lune Inc.
              </span>
            </div>
            <div className="flex items-center gap-5">
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                Terms
              </a>
              <a
                href="https://x.com/lunetalent"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                𝕏 / Twitter
              </a>
              <a
                href="https://www.linkedin.com/in/lunecompany/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
};
