/**
 * Database Seed Script
 * Run: node src/seed.js
 *
 * Populates the database with the original hardcoded content so it
 * renders correctly on the website via the CMS and API.
 *
 * Safe to re-run — uses upsert/replace logic, never duplicates.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './database/database.js';
import CMS from './models/usersModels/CMS.model.js';
import HomePage from './models/usersModels/HomePageHero.js';
import Service from './models/usersModels/Services.model.js';
import Task from './models/usersModels/Task.model.js';
import User from './models/usersModels/User.model.js';
import Resource from './models/usersModels/Resource.model.js';

// ─── Hero Section ─────────────────────────────────────────────────────────────

const heroData = {
  statusBadge: "Accepting New Projects for 2026",
  titleLine1: "We Build",
  titleLine2: "Digital Excellence",
  subtitle: "The agency for forward-thinking brands. We combine AI-driven development with award-winning design to build products that scale.",
  ctaButtons: [
    { text: "Start a Project", link: "/contact", isPrimary: true },
    { text: "View Our Work", link: "/portfolio", isPrimary: false },
  ],
  isActive: true,
};

// ─── CMS Data ─────────────────────────────────────────────────────────────────

const cmsData = {
  logoUrl: "https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/216147d0-06c1-4dee-8a5a-f933c6ef8556/1766429553723-26c2f3fe/N_Logo-01.png",

  techStack: [
    {
      categoryName: "Frontend & Experience",
      categoryDescription: "The technologies we use to build beautiful, fast user interfaces.",
      items: [
        { name: "React", iconKey: "ReactIcon", description: "UI Architecture", colorClass: "text-[#61DAFB]", order: 1 },
        { name: "Next.js", iconKey: "NextJsIcon", description: "SSR Framework", colorClass: "text-foreground", order: 2 },
        { name: "TypeScript", iconKey: "TypeScriptIcon", description: "Type Safety", colorClass: "text-[#3178C6]", order: 3 },
        { name: "Tailwind CSS", iconKey: "TailwindIcon", description: "Styling Engine", colorClass: "text-[#06B6D4]", order: 4 },
        { name: "Framer Motion", iconKey: "FramerIcon", description: "Motion & Animation", colorClass: "text-foreground", order: 5 },
      ],
    },
    {
      categoryName: "Backend & Data",
      categoryDescription: "Robust server-side technologies for scalable APIs and data management.",
      items: [
        { name: "Node.js", iconKey: "NodeJsIcon", description: "Runtime", colorClass: "text-[#339933]", order: 1 },
        { name: "Express", iconKey: "ExpressIcon", description: "Web Framework", colorClass: "text-foreground", order: 2 },
        { name: "MongoDB", iconKey: "MongoDBIcon", description: "NoSQL Database", colorClass: "text-[#47A248]", order: 3 },
        { name: "PostgreSQL", iconKey: "PostgresIcon", description: "Relational DB", colorClass: "text-[#4169E1]", order: 4 },
        { name: "Redis", iconKey: "RedisIcon", description: "Caching", colorClass: "text-[#DC382D]", order: 5 },
      ],
    },
    {
      categoryName: "AI & Infrastructure",
      categoryDescription: "Cutting-edge AI integrations and reliable cloud infrastructure.",
      items: [
        { name: "OpenAI", iconKey: "OpenAIIcon", description: "LLM Engine", colorClass: "text-foreground", order: 1 },
        { name: "AWS", iconKey: "AwsIcon", description: "Cloud Infrastructure", colorClass: "text-[#FF9900]", order: 2 },
        { name: "Docker", iconKey: "DockerIcon", description: "Containers", colorClass: "text-[#2496ED]", order: 3 },
        { name: "Vercel", iconKey: "VercelIcon", description: "Edge Deployment", colorClass: "text-foreground", order: 4 },
        { name: "Cloudinary", iconKey: "CloudinaryIcon", description: "Media CDN", colorClass: "text-[#3448C5]", order: 5 },
      ],
    },
  ],

  conceptToReality: {
    sectionBadge: "Our Process",
    sectionTitle: "From Concept to Reality",
    steps: [
      {
        stepTitle: "Discovery & Strategy",
        description: "We dive deep into your business goals, target audience, and competitive landscape to craft a winning strategy.",
        iconName: "Search",
        gradientColor: "from-blue-500 to-cyan-400",
        bulletPoints: ["Market Analysis", "User Personas", "Technical Feasibility", "Project Roadmap"],
        order: 1,
      },
      {
        stepTitle: "UX/UI Design",
        description: "Crafting intuitive interfaces that look stunning, feel natural, and convert visitors into customers.",
        iconName: "PenTool",
        gradientColor: "from-purple-500 to-pink-500",
        bulletPoints: ["Wireframing", "High-Fidelity Mockups", "Interactive Prototypes", "Design System"],
        order: 2,
      },
      {
        stepTitle: "Development",
        description: "Building robust, scalable applications with clean code and modern engineering practices.",
        iconName: "Code2",
        gradientColor: "from-green-500 to-emerald-400",
        bulletPoints: ["Clean Code Architecture", "API Integration", "Performance Optimization", "Responsive Design"],
        order: 3,
      },
      {
        stepTitle: "Quality Assurance",
        description: "Rigorous testing across devices and browsers to ensure a flawless, bug-free experience.",
        iconName: "LayoutTemplate",
        gradientColor: "from-orange-500 to-red-500",
        bulletPoints: ["Automated Testing", "Cross-Browser Checks", "Security Audits", "Load Testing"],
        order: 4,
      },
      {
        stepTitle: "Launch & Scale",
        description: "Deploying your product and monitoring its growth with real-time analytics and post-launch support.",
        iconName: "Rocket",
        gradientColor: "from-indigo-500 to-violet-500",
        bulletPoints: ["CI/CD Pipelines", "Analytics Setup", "Post-Launch Support", "Performance Monitoring"],
        order: 5,
      },
    ],
  },

  whyChooseUs: {
    titleLine1: "Why forward-thinking companies",
    titleLine2Highlighted: "choose us",
    description: "We're not just a dev shop. We're your strategic partner in building digital products that stand out and deliver measurable business results.",
    keyPoints: [
      "AI-First Development Approach",
      "Rapid Prototyping & Iteration",
      "Enterprise-Grade Security",
      "24/7 Support & Maintenance",
    ],
    scrollingCards: [
      { title: "24/7 Support", description: "Round-the-clock support so you're never left stranded.", iconName: "Clock", order: 1 },
      { title: "Top Security", description: "Enterprise-grade protection with SSL, audits & compliance.", iconName: "Shield", order: 2 },
      { title: "Expert Team", description: "Top 1% of global talent handpicked for your project.", iconName: "Users", order: 3 },
      { title: "Fast Delivery", description: "2x faster than industry average — without cutting corners.", iconName: "Zap", order: 4 },
      { title: "Scalable Architecture", description: "Built to grow from MVP to millions of users seamlessly.", iconName: "Rocket", order: 5 },
      { title: "Modern Tech Stack", description: "Always using the latest, battle-tested technologies.", iconName: "Code", order: 6 },
      { title: "Transparent Process", description: "Real-time updates, weekly calls, and full visibility.", iconName: "Eye", order: 7 },
      { title: "Results-Driven", description: "We measure success by your growth metrics, not just delivery.", iconName: "TrendingUp", order: 8 },
    ],
  },

  contactInfo: {
    address: "123 Tech Boulevard\nSan Francisco, CA 94107\nUnited States",
    email: "hello@nabeel.agency",
    phone: "+1 (555) 123-4567",
    businessHours: "Monday – Friday\n9:00 AM – 6:00 PM PST",
  },

  socialLinks: {
    twitter: "https://twitter.com/nabeelAgency",
    linkedin: "https://linkedin.com/company/nabeel-agency",
    instagram: "https://instagram.com/nabeelAgency",
    github: "https://github.com/nabeelAgency",
  },

  testimonials: [
    {
      content: "Working with Nabeel Agency was an absolute game-changer. They delivered our e-commerce platform in record time with exceptional quality. Our conversion rate jumped 40% after launch.",
      author: "Sarah Johnson",
      role: "CEO, TechVentures Inc.",
      rating: 5,
      order: 1,
    },
    {
      content: "The team's expertise in AI integration is unmatched. They built a custom recommendation engine that increased our user engagement by 60%. Highly professional and results-driven.",
      author: "Michael Chen",
      role: "CTO, DataFlow Systems",
      rating: 5,
      order: 2,
    },
    {
      content: "From design to deployment, the process was seamless. They understood our vision immediately and translated it into a stunning, high-performing website. Truly world-class work.",
      author: "Emma Williams",
      role: "Founder, StyleHouse",
      rating: 5,
      order: 3,
    },
    {
      content: "Their mobile app development skills are exceptional. The app they built has over 50,000 active users and a 4.9 star rating on the App Store. Couldn't be happier.",
      author: "James Rodriguez",
      role: "Product Manager, FinTech Solutions",
      rating: 5,
      order: 4,
    },
    {
      content: "We've worked with many agencies, but Nabeel Agency stands out for their communication, quality, and ability to solve complex problems. They're our go-to tech partner.",
      author: "Aisha Patel",
      role: "Director of Engineering, ScaleUp Labs",
      rating: 5,
      order: 5,
    },
    {
      content: "The redesign of our SaaS dashboard reduced customer support tickets by 35%. The team truly understood UX and delivered beyond expectations on every front.",
      author: "David Kim",
      role: "Head of Product, CloudBase",
      rating: 5,
      order: 6,
    },
  ],
};

// ─── Services ─────────────────────────────────────────────────────────────────

const servicesData = [
  {
    title: "Web Development",
    slug: "web-development",
    subtitle: "Custom websites and web applications built to perform",
    description: "We build high-performance, scalable web applications using the latest technologies. From simple landing pages to complex enterprise platforms, we deliver solutions that drive real business results.",
    category: "web-development",
    isActive: true,
    isFeatured: true,
    order: 1,
    deliveryTime: "4–8 weeks",
    heroSection: {
      badge: "Web Development",
      heading: "Web Applications That Scale",
      subheading: "From idea to production — fast, clean, and built to last.",
      ctaButton: { text: "Start Your Project", link: "/contact" },
      secondaryButton: { text: "View Portfolio", link: "/portfolio" },
    },
    metrics: [
      { value: "150+", label: "Web Projects", icon: "Globe" },
      { value: "99%", label: "Uptime SLA", icon: "Shield" },
      { value: "2x", label: "Faster Delivery", icon: "Zap" },
      { value: "40%", label: "Avg. Conversion Lift", icon: "TrendingUp" },
    ],
    features: [
      { icon: "Code2", title: "Custom Web Apps", description: "Bespoke applications built exactly to your requirements, not templated solutions.", category: "development" },
      { icon: "Zap", title: "Performance Optimized", description: "Sub-second load times with Lighthouse scores above 95 — for real.", category: "performance" },
      { icon: "Smartphone", title: "Fully Responsive", description: "Pixel-perfect experiences across every device, screen, and browser.", category: "design" },
      { icon: "Lock", title: "Secure by Default", description: "OWASP best practices, SSL, CSRF protection, and security headers out of the box.", category: "security" },
      { icon: "Database", title: "Scalable Architecture", description: "Architected to handle traffic spikes and grow alongside your business.", category: "infrastructure" },
      { icon: "BarChart", title: "Analytics Ready", description: "GA4, Hotjar, and custom event tracking integrated from day one.", category: "analytics" },
    ],
    technologies: [
      { name: "React", icon: "ReactIcon", category: "frontend" },
      { name: "Next.js", icon: "NextJsIcon", category: "frontend" },
      { name: "Node.js", icon: "NodeJsIcon", category: "backend" },
      { name: "MongoDB", icon: "MongoDBIcon", category: "database" },
      { name: "TypeScript", icon: "TypeScriptIcon", category: "language" },
      { name: "Tailwind CSS", icon: "TailwindIcon", category: "styling" },
    ],
    pricingPlans: [
      {
        name: "Starter",
        price: { amount: 2500, currency: "USD", period: "one-time" },
        description: "Perfect for small businesses and startups.",
        features: ["Up to 5 pages", "Responsive design", "Contact form", "Basic SEO setup", "1 month free support"],
        isPopular: false,
        ctaButton: { text: "Get Started", link: "/contact" },
      },
      {
        name: "Business",
        price: { amount: 7500, currency: "USD", period: "one-time" },
        description: "Ideal for growing businesses that need more power.",
        features: ["Up to 15 pages", "Custom CMS", "Advanced animations", "Full SEO optimization", "E-commerce ready", "3 months free support"],
        isPopular: true,
        ctaButton: { text: "Start Project", link: "/contact" },
      },
      {
        name: "Enterprise",
        price: { amount: 0, currency: "USD", period: "custom" },
        description: "For large-scale, complex web applications.",
        features: ["Unlimited pages", "Custom architecture", "AI/ML integrations", "Dedicated team", "SLA guarantee", "12 months support"],
        isPopular: false,
        ctaButton: { text: "Talk to Us", link: "/contact" },
      },
    ],
    faqs: [
      { question: "How long does a typical web project take?", answer: "Most projects take 4–8 weeks depending on complexity. We'll give you an exact timeline after the discovery call.", order: 1 },
      { question: "Do you provide hosting and maintenance?", answer: "Yes, we can set up hosting on AWS, Vercel, or any platform you prefer, and offer ongoing maintenance packages.", order: 2 },
      { question: "Can you work with our existing codebase?", answer: "Absolutely. We regularly take over legacy codebases, audit them, and modernize or extend them.", order: 3 },
    ],
    ctaSection: {
      heading: "Ready to build something great?",
      subheading: "Let's talk about your project.",
      description: "Book a free 30-minute discovery call and we'll map out exactly how to bring your vision to life.",
      button: { text: "Book a Free Call", link: "/contact" },
      contactEmail: "hello@nabeel.agency",
    },
  },
  {
    title: "Mobile App Development",
    slug: "mobile-app",
    subtitle: "Native and cross-platform apps that users love",
    description: "We craft beautiful, high-performance mobile applications for iOS and Android. Using React Native and modern tooling, we ship apps that feel native, scale effortlessly, and keep users coming back.",
    category: "mobile-app",
    isActive: true,
    isFeatured: true,
    order: 2,
    deliveryTime: "8–16 weeks",
    heroSection: {
      badge: "Mobile Development",
      heading: "Apps That Users Love",
      subheading: "iOS, Android, and everything in between — shipped fast.",
      ctaButton: { text: "Start Your App", link: "/contact" },
      secondaryButton: { text: "See Our Apps", link: "/portfolio" },
    },
    metrics: [
      { value: "80+", label: "Apps Launched", icon: "Smartphone" },
      { value: "4.8★", label: "Avg. App Store Rating", icon: "Star" },
      { value: "2M+", label: "Total Downloads", icon: "Download" },
      { value: "60%", label: "Avg. Retention Lift", icon: "TrendingUp" },
    ],
    features: [
      { icon: "Smartphone", title: "Cross-Platform", description: "One codebase for iOS and Android using React Native — 95% code sharing, 100% native feel.", category: "development" },
      { icon: "Zap", title: "Smooth Performance", description: "60fps animations and instant interactions — no compromise on performance.", category: "performance" },
      { icon: "Bell", title: "Push Notifications", description: "Smart, targeted push notifications to re-engage users at the right moment.", category: "engagement" },
      { icon: "WifiOff", title: "Offline Support", description: "Full offline-first architecture so your app works even without connectivity.", category: "reliability" },
      { icon: "Lock", title: "Secure Auth", description: "Biometric login, OAuth, and secure token storage built into every app.", category: "security" },
      { icon: "BarChart", title: "In-App Analytics", description: "Track every user action to understand behavior and optimize your product.", category: "analytics" },
    ],
    technologies: [
      { name: "React Native", icon: "ReactIcon", category: "framework" },
      { name: "TypeScript", icon: "TypeScriptIcon", category: "language" },
      { name: "Expo", icon: "ExpoIcon", category: "tooling" },
      { name: "Node.js", icon: "NodeJsIcon", category: "backend" },
      { name: "Firebase", icon: "FirebaseIcon", category: "services" },
    ],
    pricingPlans: [
      {
        name: "MVP",
        price: { amount: 8000, currency: "USD", period: "one-time" },
        description: "Launch fast and validate your idea.",
        features: ["Core features only", "iOS + Android", "Basic authentication", "API integration", "App Store submission", "1 month support"],
        isPopular: false,
        ctaButton: { text: "Build My MVP", link: "/contact" },
      },
      {
        name: "Full App",
        price: { amount: 20000, currency: "USD", period: "one-time" },
        description: "A full-featured production-ready app.",
        features: ["Unlimited features", "iOS + Android", "Push notifications", "Offline support", "Admin dashboard", "Analytics", "3 months support"],
        isPopular: true,
        ctaButton: { text: "Start Building", link: "/contact" },
      },
      {
        name: "Enterprise",
        price: { amount: 0, currency: "USD", period: "custom" },
        description: "Complex apps at scale with dedicated teams.",
        features: ["Custom architecture", "Dedicated dev team", "White-label options", "Security compliance", "SLA guarantee", "12 months support"],
        isPopular: false,
        ctaButton: { text: "Contact Sales", link: "/contact" },
      },
    ],
    faqs: [
      { question: "Do you build for both iOS and Android?", answer: "Yes, we build cross-platform apps using React Native that run natively on both platforms from a single codebase.", order: 1 },
      { question: "How do you handle App Store submission?", answer: "We handle the entire submission process for both the Apple App Store and Google Play Store as part of every project.", order: 2 },
      { question: "Can you add features to my existing app?", answer: "Absolutely. We regularly extend and maintain existing React Native and native apps.", order: 3 },
    ],
    ctaSection: {
      heading: "Have an app idea?",
      subheading: "Let's turn it into reality.",
      description: "From concept to the App Store — we'll guide you every step of the way.",
      button: { text: "Book a Free Call", link: "/contact" },
      contactEmail: "hello@nabeel.agency",
    },
  },
  {
    title: "E-Commerce Solutions",
    slug: "ecommerce",
    subtitle: "Online stores built to sell — beautifully and efficiently",
    description: "We build high-converting online stores that are fast, secure, and easy to manage. Whether you need a Shopify customization, a headless commerce build, or a fully custom platform, we deliver results.",
    category: "ecommerce",
    isActive: true,
    isFeatured: false,
    order: 3,
    deliveryTime: "6–12 weeks",
    heroSection: {
      badge: "E-Commerce",
      heading: "Online Stores That Convert",
      subheading: "Beautiful storefronts backed by powerful commerce engines.",
      ctaButton: { text: "Launch My Store", link: "/contact" },
      secondaryButton: { text: "See Examples", link: "/portfolio" },
    },
    metrics: [
      { value: "40+", label: "Stores Launched", icon: "ShoppingCart" },
      { value: "40%", label: "Avg. Conversion Lift", icon: "TrendingUp" },
      { value: "$2M+", label: "Revenue Generated", icon: "DollarSign" },
      { value: "99.9%", label: "Uptime", icon: "Shield" },
    ],
    features: [
      { icon: "ShoppingCart", title: "Seamless Checkout", description: "Streamlined, one-click checkout flows that reduce cart abandonment significantly.", category: "conversion" },
      { icon: "CreditCard", title: "Payment Integration", description: "Stripe, PayPal, Apple Pay, and 50+ payment gateways integrated out of the box.", category: "payments" },
      { icon: "Package", title: "Inventory Management", description: "Real-time stock tracking with low-stock alerts and automated reorder points.", category: "operations" },
      { icon: "Search", title: "SEO Optimized", description: "Product schema, sitemaps, and speed optimizations for maximum organic visibility.", category: "marketing" },
      { icon: "Globe", title: "Multi-Currency", description: "Sell globally with automatic currency conversion and localized pricing.", category: "global" },
      { icon: "BarChart", title: "Sales Analytics", description: "Detailed dashboards showing revenue, AOV, customer LTV, and more.", category: "analytics" },
    ],
    technologies: [
      { name: "Next.js", icon: "NextJsIcon", category: "frontend" },
      { name: "Shopify", icon: "ShopifyIcon", category: "platform" },
      { name: "Stripe", icon: "StripeIcon", category: "payments" },
      { name: "MongoDB", icon: "MongoDBIcon", category: "database" },
      { name: "Algolia", icon: "AlgoliaIcon", category: "search" },
    ],
    pricingPlans: [
      {
        name: "Starter Store",
        price: { amount: 3500, currency: "USD", period: "one-time" },
        description: "For small businesses launching their first store.",
        features: ["Up to 100 products", "Shopify setup", "Custom theme", "Payment gateway", "Mobile responsive", "1 month support"],
        isPopular: false,
        ctaButton: { text: "Launch My Store", link: "/contact" },
      },
      {
        name: "Growth Store",
        price: { amount: 12000, currency: "USD", period: "one-time" },
        description: "For brands ready to scale their online sales.",
        features: ["Unlimited products", "Headless commerce", "Custom checkout", "Advanced SEO", "Loyalty program", "Multi-currency", "3 months support"],
        isPopular: true,
        ctaButton: { text: "Start Building", link: "/contact" },
      },
      {
        name: "Enterprise",
        price: { amount: 0, currency: "USD", period: "custom" },
        description: "High-volume stores with custom requirements.",
        features: ["Custom platform", "ERP integration", "Dedicated infra", "SLA guarantee", "Custom analytics", "12 months support"],
        isPopular: false,
        ctaButton: { text: "Talk to Sales", link: "/contact" },
      },
    ],
    faqs: [
      { question: "Shopify vs custom build — which is right for me?", answer: "Shopify is great for standard stores launching quickly. Custom builds are better for unique requirements, complex integrations, or when you need full control.", order: 1 },
      { question: "Can you migrate my existing store?", answer: "Yes, we handle full migrations including products, customers, orders, and SEO redirects — with zero downtime.", order: 2 },
      { question: "Do you offer ongoing maintenance?", answer: "Yes, we offer monthly maintenance packages covering updates, security patches, and feature additions.", order: 3 },
    ],
    ctaSection: {
      heading: "Ready to sell online?",
      subheading: "Let's build your store.",
      description: "Book a free consultation and we'll recommend the best approach for your business.",
      button: { text: "Book Free Consultation", link: "/contact" },
      contactEmail: "hello@nabeel.agency",
    },
  },
  {
    title: "UI/UX Design",
    slug: "design",
    subtitle: "Interfaces that are beautiful, intuitive, and conversion-focused",
    description: "Our designers craft interfaces that don't just look stunning — they guide users effortlessly towards their goals. From brand identity to interactive prototypes, we bridge the gap between aesthetics and performance.",
    category: "design",
    isActive: true,
    isFeatured: false,
    order: 4,
    deliveryTime: "2–6 weeks",
    heroSection: {
      badge: "UI/UX Design",
      heading: "Design That Converts",
      subheading: "Beautiful interfaces built on data, empathy, and pixel-perfect craft.",
      ctaButton: { text: "Start Design Project", link: "/contact" },
      secondaryButton: { text: "View Design Work", link: "/portfolio" },
    },
    metrics: [
      { value: "200+", label: "Screens Designed", icon: "Layout" },
      { value: "95", label: "Avg. Satisfaction Score", icon: "Star" },
      { value: "35%", label: "Avg. Engagement Lift", icon: "TrendingUp" },
      { value: "2x", label: "Faster User Onboarding", icon: "Zap" },
    ],
    features: [
      { icon: "Layout", title: "UX Research", description: "User interviews, competitive analysis, and journey mapping to guide every design decision.", category: "research" },
      { icon: "PenTool", title: "UI Design", description: "High-fidelity mockups in Figma with pixel-perfect attention to every detail.", category: "design" },
      { icon: "Layers", title: "Design Systems", description: "Scalable component libraries and style guides your dev team will love.", category: "systems" },
      { icon: "Play", title: "Interactive Prototypes", description: "Clickable prototypes for user testing before a single line of code is written.", category: "prototyping" },
      { icon: "Palette", title: "Brand Identity", description: "Logo, color palette, typography, and full brand guidelines that communicate your values.", category: "branding" },
      { icon: "Monitor", title: "Responsive Design", description: "Every design is built to look perfect across desktop, tablet, and mobile.", category: "responsive" },
    ],
    technologies: [
      { name: "Figma", icon: "FigmaIcon", category: "design-tool" },
      { name: "Adobe XD", icon: "AdobeXDIcon", category: "design-tool" },
      { name: "Framer", icon: "FramerIcon", category: "prototyping" },
      { name: "Lottie", icon: "LottieIcon", category: "animation" },
    ],
    pricingPlans: [
      {
        name: "Brand Kit",
        price: { amount: 1500, currency: "USD", period: "one-time" },
        description: "Get a professional brand identity.",
        features: ["Logo design (3 concepts)", "Color palette", "Typography system", "Brand guidelines PDF", "Source files included"],
        isPopular: false,
        ctaButton: { text: "Get My Brand Kit", link: "/contact" },
      },
      {
        name: "Full UI/UX",
        price: { amount: 5000, currency: "USD", period: "one-time" },
        description: "Complete design for your product.",
        features: ["UX research", "Wireframes", "High-fidelity UI", "Interactive prototype", "Design system", "Handoff to dev"],
        isPopular: true,
        ctaButton: { text: "Start Design", link: "/contact" },
      },
      {
        name: "Design Partner",
        price: { amount: 3000, currency: "USD", period: "monthly" },
        description: "Ongoing design support for your team.",
        features: ["Unlimited design requests", "48h turnaround", "Dedicated designer", "Figma access", "Weekly sync calls"],
        isPopular: false,
        ctaButton: { text: "Become a Partner", link: "/contact" },
      },
    ],
    faqs: [
      { question: "What deliverables do I get?", answer: "You receive Figma source files, exported assets, design system documentation, and a developer handoff package.", order: 1 },
      { question: "How many revision rounds are included?", answer: "All packages include unlimited revisions until you're 100% satisfied.", order: 2 },
      { question: "Can you design for an existing brand?", answer: "Absolutely. We can work within existing brand guidelines or help you evolve your brand identity.", order: 3 },
    ],
    ctaSection: {
      heading: "Let's design something beautiful.",
      subheading: "Great design is a competitive advantage.",
      description: "Schedule a design consultation and we'll show you what's possible.",
      button: { text: "Book Design Consultation", link: "/contact" },
      contactEmail: "hello@nabeel.agency",
    },
  },
  {
    title: "Digital Strategy & Consulting",
    slug: "consulting",
    subtitle: "Strategic guidance to accelerate your digital growth",
    description: "We help businesses navigate the complex digital landscape with expert consulting in technology strategy, digital transformation, and AI adoption. Our battle-tested frameworks help you move faster, spend smarter, and build better.",
    category: "consulting",
    isActive: true,
    isFeatured: false,
    order: 5,
    deliveryTime: "1–4 weeks",
    heroSection: {
      badge: "Consulting",
      heading: "Strategy That Drives Growth",
      subheading: "Expert guidance to help you build, scale, and dominate digitally.",
      ctaButton: { text: "Book a Strategy Call", link: "/contact" },
      secondaryButton: { text: "Learn More", link: "/about" },
    },
    metrics: [
      { value: "50+", label: "Companies Advised", icon: "Building" },
      { value: "3x", label: "Avg. ROI Improvement", icon: "TrendingUp" },
      { value: "30%", label: "Avg. Cost Reduction", icon: "DollarSign" },
      { value: "100%", label: "Client Satisfaction", icon: "Star" },
    ],
    features: [
      { icon: "Map", title: "Technology Roadmap", description: "A clear 12–24 month plan for your technology investments with prioritized initiatives.", category: "strategy" },
      { icon: "Cpu", title: "AI Integration Strategy", description: "Identify where AI can reduce costs, increase revenue, or create competitive moats.", category: "ai" },
      { icon: "RefreshCw", title: "Digital Transformation", description: "End-to-end transformation planning from legacy systems to modern cloud architecture.", category: "transformation" },
      { icon: "DollarSign", title: "Tech Audit & Cost Optimization", description: "Deep dive into your existing tech stack to eliminate waste and improve efficiency.", category: "audit" },
      { icon: "Users", title: "Team Structure Advisory", description: "Build the right engineering team structure for your stage and growth trajectory.", category: "people" },
      { icon: "BarChart", title: "KPI & Analytics Framework", description: "Define the metrics that matter and build dashboards to track them in real time.", category: "analytics" },
    ],
    technologies: [
      { name: "Notion", icon: "NotionIcon", category: "productivity" },
      { name: "Miro", icon: "MiroIcon", category: "collaboration" },
      { name: "Datadog", icon: "DatadogIcon", category: "monitoring" },
    ],
    pricingPlans: [
      {
        name: "Strategy Sprint",
        price: { amount: 2000, currency: "USD", period: "one-time" },
        description: "A focused 2-week engagement for specific problems.",
        features: ["2-week engagement", "Discovery workshops", "Problem diagnosis", "Actionable roadmap", "1 follow-up call"],
        isPopular: false,
        ctaButton: { text: "Book Sprint", link: "/contact" },
      },
      {
        name: "Growth Advisory",
        price: { amount: 5000, currency: "USD", period: "monthly" },
        description: "Ongoing strategic support for scaling companies.",
        features: ["Weekly strategy calls", "Tech stack review", "Hiring advisory", "Vendor selection", "KPI dashboard setup", "Slack access"],
        isPopular: true,
        ctaButton: { text: "Start Advisory", link: "/contact" },
      },
      {
        name: "Fractional CTO",
        price: { amount: 10000, currency: "USD", period: "monthly" },
        description: "Senior tech leadership without the full-time cost.",
        features: ["20 hrs/week availability", "Board presentations", "Team leadership", "Architecture decisions", "Investor due diligence", "Full access"],
        isPopular: false,
        ctaButton: { text: "Hire Fractional CTO", link: "/contact" },
      },
    ],
    faqs: [
      { question: "What makes your consulting different?", answer: "We're builders first, consultants second. Every recommendation comes from hands-on experience shipping products — not just theoretical frameworks.", order: 1 },
      { question: "Do you only work with tech startups?", answer: "No. We work with startups, SMEs, and enterprises across all industries that are serious about digital transformation.", order: 2 },
      { question: "Can consulting lead to a development engagement?", answer: "Yes, and it often does. Many clients start with consulting to validate their approach before hiring us to build.", order: 3 },
    ],
    ctaSection: {
      heading: "Ready to accelerate your growth?",
      subheading: "Let's talk strategy.",
      description: "Book a free 30-minute discovery call and walk away with at least 3 actionable insights.",
      button: { text: "Book Free Strategy Call", link: "/contact" },
      contactEmail: "hello@nabeel.agency",
    },
  },
];

// ─── Seed Functions ────────────────────────────────────────────────────────────

async function seedHero() {
  await HomePage.deleteMany({});
  await HomePage.create(heroData);
  console.log('✓ HomePageHero seeded');
}

async function seedCMS() {
  // CMS is a singleton — delete existing and recreate
  await CMS.deleteMany({});
  await CMS.create(cmsData);
  console.log('✓ CMS seeded (techStack, processSteps, whyChooseUs, contactInfo, socialLinks, testimonials)');
}

async function seedServices() {
  // Remove existing services and insert fresh
  await Service.deleteMany({});
  await Service.insertMany(servicesData);
  console.log(`✓ Services seeded (${servicesData.length} services)`);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

async function seedTasks() {
  // Only seed if no tasks exist yet
  const existing = await Task.countDocuments();
  if (existing > 0) {
    console.log(`✓ Tasks already seeded (${existing} found), skipping`);
    return;
  }

  // Use first admin user as createdBy (required field)
  const adminUser = await User.findOne({ role: 'admin' }).lean();
  if (!adminUser) {
    console.log('⚠ No admin user found — skipping task seed. Create an admin first.');
    return;
  }

  const now = new Date();
  const d = (days) => new Date(now.getTime() + days * 86400000);

  const dummyTasks = [
    { title: 'Fix Mobile Navigation', description: 'Fix the broken hamburger menu on mobile viewport (< 768px). Menu closes unexpectedly on iOS Safari.', status: 'todo', priority: 'high', dueDate: d(0), tags: ['bug', 'mobile'], createdBy: adminUser._id },
    { title: 'Research Competitors', description: 'Analyze top 5 competitor websites — identify gaps in our service offering and pricing.', status: 'todo', priority: 'low', dueDate: d(3), tags: ['research'], createdBy: adminUser._id },
    { title: 'Update README & Onboarding Docs', description: 'Rewrite setup guide for new team members. Include env variables and local dev steps.', status: 'todo', priority: 'medium', dueDate: d(5), tags: ['docs'], createdBy: adminUser._id },
    { title: 'Homepage Hero Animation', description: 'Implement scroll-triggered fade-in + stagger animations for the hero section text and CTA buttons.', status: 'in_progress', priority: 'high', dueDate: d(0), tags: ['animation', 'frontend'], createdBy: adminUser._id },
    { title: 'Client Feedback Meeting', description: 'Prepare slide deck and live demo for FinTech Corp quarterly review. Focus on dashboard KPIs.', status: 'in_progress', priority: 'medium', dueDate: d(1), tags: ['meeting', 'client'], createdBy: adminUser._id },
    { title: 'Dark Mode Token Audit', description: 'Review all CSS custom properties and ensure dark mode variants are correctly defined across all pages.', status: 'in_progress', priority: 'medium', dueDate: d(4), tags: ['css', 'design-system'], createdBy: adminUser._id },
    { title: 'Update API Documentation', description: 'Sync Postman collection with latest endpoints. Add request/response examples for all v1 routes.', status: 'in_review', priority: 'low', dueDate: d(2), tags: ['docs', 'api'], createdBy: adminUser._id },
    { title: 'Setup Project Repo', description: 'Initialized GitHub repo with branch protection rules, CI/CD via GitHub Actions, and ESLint config.', status: 'completed', priority: 'high', tags: ['devops'], createdBy: adminUser._id },
    { title: 'Design System V1', description: 'Created base Figma component library — colors, typography, spacing tokens, and core UI components.', status: 'completed', priority: 'high', tags: ['design', 'figma'], createdBy: adminUser._id },
    { title: 'Performance Audit — Lighthouse', description: 'Ran Lighthouse on all public pages. Identified 3 CLS issues and 2 LCP bottlenecks to fix.', status: 'completed', priority: 'medium', tags: ['performance'], createdBy: adminUser._id },
  ];

  await Task.insertMany(dummyTasks);
  console.log(`✓ Tasks seeded (${dummyTasks.length} tasks across 4 Kanban columns)`);
}

// ─── Resources ────────────────────────────────────────────────────────────────

async function seedResources() {
  const existing = await Resource.countDocuments();
  if (existing > 0) {
    console.log(`✓ Resources already seeded (${existing} found), skipping`);
    return;
  }

  const adminUser = await User.findOne({ role: 'admin' }).lean();
  if (!adminUser) {
    console.log('⚠ No admin user found — skipping resource seed.');
    return;
  }

  const dummyResources = [
    {
      name: 'Brand Guidelines.pdf',
      originalName: 'Brand_Guidelines.pdf',
      url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      publicId: 'demo/brand-guidelines',
      mimeType: 'application/pdf',
      size: 2621440,           // 2.5 MB
      resourceType: 'raw',
      uploadedBy: adminUser._id,
    },
    {
      name: 'Design System V2.fig',
      originalName: 'Design_System_V2.fig',
      url: 'https://res.cloudinary.com/demo/raw/upload/sample',
      publicId: 'demo/design-system-v2',
      mimeType: 'application/octet-stream',
      size: 5242880,           // 5 MB
      resourceType: 'raw',
      uploadedBy: adminUser._id,
    },
    {
      name: 'Hero Banner.png',
      originalName: 'Hero_Banner.png',
      url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      publicId: 'demo/hero-banner',
      mimeType: 'image/png',
      size: 4300800,           // 4.1 MB
      resourceType: 'image',
      uploadedBy: adminUser._id,
    },
    {
      name: 'Q3 Report.pdf',
      originalName: 'Q3_Report_2025.pdf',
      url: 'https://res.cloudinary.com/demo/raw/upload/sample',
      publicId: 'demo/q3-report',
      mimeType: 'application/pdf',
      size: 2516582,           // 2.4 MB
      resourceType: 'raw',
      uploadedBy: adminUser._id,
    },
    {
      name: 'Legal Documents.zip',
      originalName: 'Legal_Documents.zip',
      url: 'https://res.cloudinary.com/demo/raw/upload/sample',
      publicId: 'demo/legal-documents',
      mimeType: 'application/zip',
      size: 8912896,           // 8.5 MB
      resourceType: 'raw',
      uploadedBy: adminUser._id,
    },
    {
      name: 'Project Assets.zip',
      originalName: 'Project_Assets_v3.zip',
      url: 'https://res.cloudinary.com/demo/raw/upload/sample',
      publicId: 'demo/project-assets',
      mimeType: 'application/zip',
      size: 47185920,          // 45 MB
      resourceType: 'raw',
      uploadedBy: adminUser._id,
    },
    {
      name: 'Team Photo.jpg',
      originalName: 'Team_Photo_2025.jpg',
      url: 'https://res.cloudinary.com/demo/image/upload/couple.jpg',
      publicId: 'demo/team-photo',
      mimeType: 'image/jpeg',
      size: 1887437,           // 1.8 MB
      resourceType: 'image',
      uploadedBy: adminUser._id,
    },
    {
      name: 'Onboarding Checklist.docx',
      originalName: 'Onboarding_Checklist.docx',
      url: 'https://res.cloudinary.com/demo/raw/upload/sample',
      publicId: 'demo/onboarding-checklist',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 409600,            // 400 KB
      resourceType: 'raw',
      uploadedBy: adminUser._id,
    },
  ];

  await Resource.insertMany(dummyResources);
  console.log(`✓ Resources seeded (${dummyResources.length} dummy files)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Starting database seed...\n');
  await connectDB();

  await seedHero();
  await seedCMS();
  await seedServices();
  await seedTasks();
  await seedResources();

  console.log('\n✅ Seed complete! All data is now live in the database.\n');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
