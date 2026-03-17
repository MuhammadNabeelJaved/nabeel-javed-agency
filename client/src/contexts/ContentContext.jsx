import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultHeroContent = {
  badge: '🚀 Now Offering AI-Powered Solutions',
  heading: 'We Build Digital',
  headingHighlight: 'Experiences',
  headingEnd: 'That Matter',
  subheading:
    'Transform your vision into stunning digital reality. We craft high-performance web applications, mobile experiences, and AI-powered solutions that drive real business growth.',
  primaryCta: 'Start Your Project',
  secondaryCta: 'View Our Work',
};

const defaultLogoUrl = '';

const defaultTechStack = [
  { id: '1', name: 'React', icon: '⚛️', category: 'Frontend', description: 'UI Framework' },
  { id: '2', name: 'Next.js', icon: '▲', category: 'Frontend', description: 'React Framework' },
  { id: '3', name: 'TypeScript', icon: '📘', category: 'Frontend', description: 'Type Safety' },
  { id: '4', name: 'Tailwind CSS', icon: '🎨', category: 'Frontend', description: 'Styling' },
  { id: '5', name: 'Vue.js', icon: '💚', category: 'Frontend', description: 'Progressive Framework' },
  { id: '6', name: 'Node.js', icon: '🟢', category: 'Backend', description: 'Runtime' },
  { id: '7', name: 'Express', icon: '🚂', category: 'Backend', description: 'Web Framework' },
  { id: '8', name: 'MongoDB', icon: '🍃', category: 'Backend', description: 'NoSQL Database' },
  { id: '9', name: 'PostgreSQL', icon: '🐘', category: 'Backend', description: 'SQL Database' },
  { id: '10', name: 'Redis', icon: '🔴', category: 'Backend', description: 'Cache & Queue' },
  { id: '11', name: 'OpenAI', icon: '🤖', category: 'AI', description: 'GPT Models' },
  { id: '12', name: 'AWS', icon: '☁️', category: 'AI', description: 'Cloud Platform' },
  { id: '13', name: 'Docker', icon: '🐋', category: 'AI', description: 'Containerization' },
  { id: '14', name: 'Vercel', icon: '⚡', category: 'AI', description: 'Deployment' },
  { id: '15', name: 'GraphQL', icon: '◈', category: 'Backend', description: 'API Query' },
  { id: '16', name: 'Firebase', icon: '🔥', category: 'Backend', description: 'Backend as Service' },
];

const defaultProcessSteps = [
  {
    id: '1',
    step: '01',
    title: 'Discovery & Strategy',
    description: 'We deep-dive into your business goals, target audience, and market positioning.',
    details: [
      'Stakeholder interviews & workshops',
      'Competitive analysis & market research',
      'Technical requirements documentation',
      'Project roadmap & timeline creation',
    ],
    icon: '🔍',
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: '2',
    step: '02',
    title: 'Design & Prototype',
    description: 'Creating stunning visual designs that align with your brand identity.',
    details: [
      'Wireframing & user flow mapping',
      'High-fidelity UI/UX design',
      'Interactive prototype creation',
      'Design system & component library',
    ],
    icon: '🎨',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: '3',
    step: '03',
    title: 'Development',
    description: 'Building your product with clean, scalable, and maintainable code.',
    details: [
      'Frontend & backend development',
      'API integration & development',
      'Database architecture & optimization',
      'Performance & security implementation',
    ],
    icon: '⚙️',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: '4',
    step: '04',
    title: 'Testing & QA',
    description: 'Rigorous testing to ensure a flawless user experience.',
    details: [
      'Unit & integration testing',
      'Cross-browser compatibility testing',
      'Performance & load testing',
      'Security vulnerability assessment',
    ],
    icon: '🧪',
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: '5',
    step: '05',
    title: 'Launch & Growth',
    description: "Deploying your product and supporting its growth post-launch.",
    details: [
      'Deployment & infrastructure setup',
      'SEO & performance optimization',
      'Analytics & monitoring setup',
      'Ongoing support & maintenance',
    ],
    icon: '🚀',
    color: 'from-pink-500 to-rose-500',
  },
];

const defaultWhyChooseUs = [
  {
    id: '1',
    title: 'Expert Team',
    description: '10+ years of combined experience building world-class digital products.',
    icon: '👥',
  },
  {
    id: '2',
    title: 'On-Time Delivery',
    description: '98% of projects delivered on time and within budget, guaranteed.',
    icon: '⏱️',
  },
  {
    id: '3',
    title: 'Modern Tech Stack',
    description: 'We use cutting-edge technologies to build fast, scalable applications.',
    icon: '⚡',
  },
  {
    id: '4',
    title: '24/7 Support',
    description: 'Round-the-clock support to keep your business running smoothly.',
    icon: '🛡️',
  },
];

const ContentContext = createContext(undefined);

export function ContentProvider({ children }) {
  const [heroContent, setHeroContent] = useState(() => {
    try {
      const stored = localStorage.getItem('agency_hero_content');
      return stored ? JSON.parse(stored) : defaultHeroContent;
    } catch {
      return defaultHeroContent;
    }
  });

  const [logoUrl, setLogoUrl] = useState(() => {
    try {
      return localStorage.getItem('agency_logo_url') || defaultLogoUrl;
    } catch {
      return defaultLogoUrl;
    }
  });

  const [techStack, setTechStack] = useState(() => {
    try {
      const stored = localStorage.getItem('agency_tech_stack');
      return stored ? JSON.parse(stored) : defaultTechStack;
    } catch {
      return defaultTechStack;
    }
  });

  const [processSteps, setProcessSteps] = useState(() => {
    try {
      const stored = localStorage.getItem('agency_process_steps');
      return stored ? JSON.parse(stored) : defaultProcessSteps;
    } catch {
      return defaultProcessSteps;
    }
  });

  const [whyChooseUs, setWhyChooseUs] = useState(() => {
    try {
      const stored = localStorage.getItem('agency_why_choose_us');
      return stored ? JSON.parse(stored) : defaultWhyChooseUs;
    } catch {
      return defaultWhyChooseUs;
    }
  });

  const updateHeroContent = (updates) => {
    setHeroContent((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('agency_hero_content', JSON.stringify(updated));
      return updated;
    });
  };

  const updateLogoUrl = (url) => {
    setLogoUrl(url);
    localStorage.setItem('agency_logo_url', url);
  };

  const updateTechStack = (items) => {
    setTechStack(items);
    localStorage.setItem('agency_tech_stack', JSON.stringify(items));
  };

  const updateProcessSteps = (steps) => {
    setProcessSteps(steps);
    localStorage.setItem('agency_process_steps', JSON.stringify(steps));
  };

  const updateWhyChooseUs = (items) => {
    setWhyChooseUs(items);
    localStorage.setItem('agency_why_choose_us', JSON.stringify(items));
  };

  return (
    <ContentContext.Provider
      value={{
        heroContent,
        updateHeroContent,
        logoUrl,
        updateLogoUrl,
        techStack,
        updateTechStack,
        processSteps,
        updateProcessSteps,
        whyChooseUs,
        updateWhyChooseUs,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
}
