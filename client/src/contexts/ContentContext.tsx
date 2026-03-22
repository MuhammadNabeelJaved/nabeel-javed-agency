import React, { createContext, useContext, useState, useEffect } from 'react';
import { cmsApi } from '../api/cms.api';
import { pageStatusApi, type PageStatusItem } from '../api/pageStatus.api';
import { announcementsApi, type AnnouncementItem } from '../api/announcements.api';

// --- Types ---

export interface HeroContent {
  badgeText: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
}

export interface TechItem {
  name: string;
  iconName: string;
  description: string;
  color: string;
}

export interface TechGroup {
  id: string;
  title: string;
  direction: 'left' | 'right';
  speed: number;
  items: TechItem[];
}

export interface ProcessStep {
  id: number;
  title: string;
  description: string;
  iconName: string;
  color: string;
  details: string[];
}

export interface WhyChooseUsFeature {
  title: string;
  iconName: string;
  desc: string;
}

export interface WhyChooseUsContent {
  titleLine1: string;
  titleLine2: string;
  description: string;
  points: string[];
  features: WhyChooseUsFeature[];
}

export interface ContactInfo {
  address: string;
  email: string;
  phone: string;
  businessHours: string;
}

export interface SocialLinks {
  twitter: string;
  linkedin: string;
  instagram: string;
  github: string;
}

export interface Testimonial {
  _id?: string;
  content: string;
  author: string;
  role: string;
  rating: number;
}

export interface ContentContextType {
  logoUrl: string;
  heroContent: HeroContent;
  updateHeroContent: (content: HeroContent) => void;
  techStack: TechGroup[];
  processSteps: ProcessStep[];
  whyChooseUs: WhyChooseUsContent;
  contactInfo: ContactInfo;
  socialLinks: SocialLinks;
  testimonials: Testimonial[];
  isLoading: boolean;
  // Page statuses (maintenance / coming-soon control)
  pageStatuses: PageStatusItem[];
  setPageStatuses: React.Dispatch<React.SetStateAction<PageStatusItem[]>>;
  // Announcement bar
  announcements: AnnouncementItem[];
  setAnnouncements: React.Dispatch<React.SetStateAction<AnnouncementItem[]>>;
  hasActiveAnnouncements: boolean;
  // Updaters (save to API + local state)
  updateLogoUrl: (url: string) => Promise<void>;
  updateTechStack: (groups: TechGroup[]) => Promise<void>;
  updateProcessSteps: (steps: ProcessStep[]) => Promise<void>;
  updateWhyChooseUs: (content: WhyChooseUsContent) => Promise<void>;
  updateContactInfo: (info: ContactInfo) => Promise<void>;
  updateSocialLinks: (links: SocialLinks) => Promise<void>;
  updateTestimonials: (items: Testimonial[]) => Promise<void>;
  // Refetch from API
  refetch: () => Promise<void>;
}

// --- Defaults ---

const defaultLogoUrl = "https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/216147d0-06c1-4dee-8a5a-f933c6ef8556/1766429553723-26c2f3fe/N_Logo-01.png";

const defaultHeroContent: HeroContent = {
  badgeText: "Accepting New Projects for 2026",
  titleLine1: "We Build",
  titleLine2: "Digital Excellence",
  subtitle: "The agency for forward-thinking brands. We combine AI-driven development with award-winning design to build products that scale."
};

const defaultTechStack: TechGroup[] = [
  {
    id: "frontend", title: "Frontend & Experience", direction: "left", speed: 35,
    items: [
      { name: 'React', iconName: 'ReactIcon', description: 'UI Architecture', color: 'text-[#61DAFB]' },
      { name: 'Next.js', iconName: 'NextJsIcon', description: 'SSR Framework', color: 'text-foreground' },
      { name: 'TypeScript', iconName: 'TypeScriptIcon', description: 'Type Safety', color: 'text-[#3178C6]' },
      { name: 'Tailwind', iconName: 'TailwindIcon', description: 'Styling Engine', color: 'text-[#06B6D4]' },
      { name: 'Framer', iconName: 'FramerIcon', description: 'Motion', color: 'text-foreground' },
    ]
  },
  {
    id: "backend", title: "Backend & Data", direction: "right", speed: 40,
    items: [
      { name: 'Node.js', iconName: 'NodeJsIcon', description: 'Runtime', color: 'text-[#339933]' },
      { name: 'MongoDB', iconName: 'MongoDBIcon', description: 'Database', color: 'text-[#47A248]' },
      { name: 'PostgreSQL', iconName: 'PostgresIcon', description: 'Relational', color: 'text-[#4169E1]' },
    ]
  },
  {
    id: "ai-infra", title: "AI & Infrastructure", direction: "left", speed: 30,
    items: [
      { name: 'OpenAI', iconName: 'OpenAIIcon', description: 'LLM Engine', color: 'text-foreground' },
      { name: 'AWS', iconName: 'AwsIcon', description: 'Cloud Infra', color: 'text-[#FF9900]' },
      { name: 'Docker', iconName: 'DockerIcon', description: 'Containers', color: 'text-[#2496ED]' },
    ]
  }
];

const defaultProcessSteps: ProcessStep[] = [
  { id: 1, title: "Discovery & Strategy", description: "We dive deep into your business goals.", iconName: "Search", color: "from-blue-500 to-cyan-400", details: ["Market Analysis", "User Personas", "Technical Feasibility"] },
  { id: 2, title: "UX/UI Design", description: "Crafting intuitive interfaces that look stunning.", iconName: "PenTool", color: "from-purple-500 to-pink-500", details: ["Wireframing", "High-Fidelity Mockups", "Interactive Prototypes"] },
  { id: 3, title: "Development", description: "Building robust, scalable applications.", iconName: "Code2", color: "from-green-500 to-emerald-400", details: ["Clean Code Architecture", "API Integration", "Performance Optimization"] },
  { id: 4, title: "Quality Assurance", description: "Rigorous testing to ensure a bug-free experience.", iconName: "LayoutTemplate", color: "from-orange-500 to-red-500", details: ["Automated Testing", "Cross-Browser Checks", "Security Audits"] },
  { id: 5, title: "Launch & Scale", description: "Deploying and monitoring your product's growth.", iconName: "Rocket", color: "from-indigo-500 to-violet-500", details: ["CI/CD Pipelines", "Analytics Setup", "Post-Launch Support"] }
];

const defaultWhyChooseUs: WhyChooseUsContent = {
  titleLine1: "Why forward-thinking companies",
  titleLine2: "choose us",
  description: "We're not just a dev shop. We're your strategic partner in building digital products that stand out.",
  points: ["AI-First Development Approach", "Rapid Prototyping & Iteration", "Enterprise-Grade Security", "24/7 Support & Maintenance"],
  features: [
    { title: "24/7 Support", iconName: "Clock", desc: "Always here when you need us." },
    { title: "Top Security", iconName: "Shield", desc: "Enterprise-grade protection." },
    { title: "Expert Team", iconName: "Users", desc: "Top 1% of global talent." },
    { title: "Fast Delivery", iconName: "Zap", desc: "2x faster than competitors." },
    { title: "Scalable Arch", iconName: "Rocket", desc: "Built to grow with you." },
    { title: "Modern Stack", iconName: "Code", desc: "Latest technologies used." },
  ]
};

const defaultContactInfo: ContactInfo = { address: "", email: "", phone: "", businessHours: "" };
const defaultSocialLinks: SocialLinks = { twitter: "", linkedin: "", instagram: "", github: "" };

// --- Map CMS API response to frontend types ---

function mapCmsToState(cms: any) {
  const techStack: TechGroup[] = (cms.techStack || []).map((cat: any, i: number) => ({
    id: cat._id || `cat-${i}`,
    title: cat.categoryName || '',
    direction: i % 2 === 0 ? 'left' : 'right' as 'left' | 'right',
    speed: 35 + i * 5,
    items: (cat.items || []).map((item: any) => ({
      name: item.name,
      iconName: item.iconKey || item.iconName || '',
      description: item.description || '',
      color: item.colorClass || item.color || 'text-foreground',
    })),
  }));

  const processSteps: ProcessStep[] = (cms.conceptToReality?.steps || [])
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    .map((step: any, i: number) => ({
      id: i + 1,
      title: step.stepTitle || '',
      description: step.description || '',
      iconName: step.iconName || 'Circle',
      color: step.gradientColor || 'from-blue-500 to-cyan-400',
      details: step.bulletPoints || [],
    }));

  const wcu = cms.whyChooseUs || {};
  const whyChooseUs: WhyChooseUsContent = {
    titleLine1: wcu.titleLine1 || defaultWhyChooseUs.titleLine1,
    titleLine2: wcu.titleLine2Highlighted || defaultWhyChooseUs.titleLine2,
    description: wcu.description || defaultWhyChooseUs.description,
    points: wcu.keyPoints || defaultWhyChooseUs.points,
    features: (wcu.scrollingCards || []).map((card: any) => ({
      title: card.title,
      iconName: card.iconName || 'Star',
      desc: card.description || '',
    })),
  };

  const contactInfo: ContactInfo = {
    address: cms.contactInfo?.address || '',
    email: cms.contactInfo?.email || '',
    phone: cms.contactInfo?.phone || '',
    businessHours: cms.contactInfo?.businessHours || '',
  };

  const socialLinks: SocialLinks = {
    twitter: cms.socialLinks?.twitter || '',
    linkedin: cms.socialLinks?.linkedin || '',
    instagram: cms.socialLinks?.instagram || '',
    github: cms.socialLinks?.github || '',
  };

  const testimonials: Testimonial[] = (cms.testimonials || [])
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    .map((t: any) => ({
      _id: t._id,
      content: t.content,
      author: t.author,
      role: t.role || '',
      rating: t.rating || 5,
    }));

  return { techStack, processSteps, whyChooseUs, contactInfo, socialLinks, testimonials, logoUrl: cms.logoUrl || defaultLogoUrl };
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState(defaultLogoUrl);
  const [techStack, setTechStack] = useState<TechGroup[]>(defaultTechStack);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>(defaultProcessSteps);
  const [whyChooseUs, setWhyChooseUs] = useState<WhyChooseUsContent>(defaultWhyChooseUs);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContactInfo);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(defaultSocialLinks);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pageStatuses, setPageStatuses] = useState<PageStatusItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  // Hero content stays in localStorage (managed via HomePageHero API separately)
  const [heroContent, setHeroContent] = useState<HeroContent>(() => {
    try {
      const saved = localStorage.getItem('heroContent');
      return saved ? JSON.parse(saved) : defaultHeroContent;
    } catch { return defaultHeroContent; }
  });

  const updateHeroContent = (content: HeroContent) => {
    setHeroContent(content);
    localStorage.setItem('heroContent', JSON.stringify(content));
  };

  const fetchCMS = async () => {
    try {
      const res = await cmsApi.get();
      const cms = res.data.data;
      if (!cms) return;
      const mapped = mapCmsToState(cms);
      setLogoUrl(mapped.logoUrl || defaultLogoUrl);
      if (mapped.techStack.length > 0) setTechStack(mapped.techStack);
      if (mapped.processSteps.length > 0) setProcessSteps(mapped.processSteps);
      setWhyChooseUs(mapped.whyChooseUs);
      setContactInfo(mapped.contactInfo);
      setSocialLinks(mapped.socialLinks);
      setTestimonials(mapped.testimonials);
    } catch {
      // Keep defaults on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCMS();
    pageStatusApi.getAll()
      .then(res => setPageStatuses(res.data.data ?? []))
      .catch(() => {});
    announcementsApi.getActive()
      .then(res => setAnnouncements((res.data as any).data ?? []))
      .catch(() => {});
  }, []);

  const updateLogoUrl = async (url: string) => {
    setLogoUrl(url);
    await cmsApi.updateLogo(url);
  };

  const updateTechStack = async (groups: TechGroup[]) => {
    setTechStack(groups);
    const payload = groups.map(g => ({
      categoryName: g.title,
      items: g.items.map(item => ({
        name: item.name,
        iconKey: item.iconName,
        description: item.description,
        colorClass: item.color,
      })),
    }));
    await cmsApi.updateTechStack(payload);
  };

  const updateProcessSteps = async (steps: ProcessStep[]) => {
    setProcessSteps(steps);
    const payload = steps.map((s, i) => ({
      stepTitle: s.title,
      description: s.description,
      iconName: s.iconName,
      gradientColor: s.color,
      bulletPoints: s.details,
      order: i,
    }));
    await cmsApi.updateConceptToReality({ steps: payload });
  };

  const updateWhyChooseUs = async (content: WhyChooseUsContent) => {
    setWhyChooseUs(content);
    await cmsApi.updateWhyChooseUs({
      titleLine1: content.titleLine1,
      titleLine2Highlighted: content.titleLine2,
      description: content.description,
      keyPoints: content.points,
      scrollingCards: content.features.map((f, i) => ({ title: f.title, iconName: f.iconName, description: f.desc, order: i })),
    });
  };

  const updateContactInfo = async (info: ContactInfo) => {
    setContactInfo(info);
    await cmsApi.updateContactInfo(info);
  };

  const updateSocialLinks = async (links: SocialLinks) => {
    setSocialLinks(links);
    await cmsApi.updateSocialLinks(links);
  };

  const updateTestimonials = async (items: Testimonial[]) => {
    setTestimonials(items);
    await cmsApi.updateTestimonials(items);
  };

  return (
    <ContentContext.Provider value={{
      logoUrl, heroContent, updateHeroContent, techStack, processSteps, whyChooseUs,
      contactInfo, socialLinks, testimonials, isLoading,
      pageStatuses, setPageStatuses,
      announcements, setAnnouncements,
      hasActiveAnnouncements: announcements.length > 0,
      updateLogoUrl, updateTechStack, updateProcessSteps, updateWhyChooseUs,
      updateContactInfo, updateSocialLinks, updateTestimonials,
      refetch: fetchCMS,
    }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (context === undefined) throw new Error('useContent must be used within a ContentProvider');
  return context;
}
