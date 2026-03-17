import { useState, useEffect } from 'react';
import { generateId } from '../lib/utils';

const initialJobs = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    type: 'Full-time',
    workMode: 'Remote',
    salaryRange: '$140,000 - $180,000',
    experienceLevel: 'Senior (5+ years)',
    description:
      'We are looking for a passionate Senior Frontend Engineer to join our growing team. You will be responsible for building exceptional user interfaces and leading frontend architecture decisions.',
    responsibilities: [
      'Lead frontend architecture and technical decisions',
      'Build responsive, accessible UI components using React',
      'Collaborate with designers to implement pixel-perfect designs',
      'Mentor junior engineers and conduct code reviews',
      'Optimize application performance and bundle sizes',
      'Contribute to our design system and component library',
    ],
    requirements: [
      '5+ years of experience with React and modern JavaScript',
      'Strong proficiency in TypeScript, HTML5, CSS3',
      'Experience with state management (Redux, Zustand, or similar)',
      'Familiarity with testing frameworks (Jest, React Testing Library)',
      'Experience with CI/CD pipelines and Git workflows',
      'Strong communication and collaboration skills',
    ],
    benefits: [
      'Competitive salary and equity package',
      'Remote-first culture with flexible hours',
      'Comprehensive health, dental, and vision insurance',
      '401(k) with company matching',
      '$2,000 annual learning & development budget',
      'Home office setup stipend',
    ],
    postedDate: '2024-03-01',
    status: 'active',
  },
  {
    id: '2',
    title: 'Product Designer',
    department: 'Design',
    location: 'New York, NY',
    type: 'Full-time',
    workMode: 'Hybrid',
    salaryRange: '$110,000 - $145,000',
    experienceLevel: 'Mid-Level (3-5 years)',
    description:
      'Join our design team to craft beautiful and intuitive product experiences. You will work closely with engineering and product to shape the future of our platform.',
    responsibilities: [
      'Design user-centered interfaces for web and mobile products',
      'Create wireframes, prototypes, and high-fidelity mockups',
      'Conduct user research and usability testing',
      'Maintain and evolve the design system',
      'Collaborate with engineers on implementation',
      'Present design decisions to stakeholders',
    ],
    requirements: [
      '3+ years of product design experience',
      'Proficiency in Figma and design tools',
      'Strong portfolio demonstrating UX/UI expertise',
      'Experience with user research methodologies',
      'Knowledge of accessibility standards',
      'Excellent visual design skills',
    ],
    benefits: [
      'Competitive salary and equity',
      'Hybrid work model (2 days in office)',
      'Health, dental, and vision coverage',
      'Creative development budget',
      'Regular team offsites and events',
      'Latest hardware and software tools',
    ],
    postedDate: '2024-03-05',
    status: 'active',
  },
  {
    id: '3',
    title: 'Full Stack Developer',
    department: 'Engineering',
    location: 'Austin, TX',
    type: 'Full-time',
    workMode: 'Remote',
    salaryRange: '$120,000 - $160,000',
    experienceLevel: 'Mid-Level (3-5 years)',
    description:
      'We need a versatile Full Stack Developer to build and scale our web applications. You will work across the entire stack, from database design to UI implementation.',
    responsibilities: [
      'Develop and maintain full-stack web applications',
      'Design and implement RESTful APIs and GraphQL endpoints',
      'Build responsive frontend features with React',
      'Work with databases (PostgreSQL, MongoDB)',
      'Implement security best practices',
      'Participate in agile ceremonies and sprint planning',
    ],
    requirements: [
      '3+ years of full-stack development experience',
      'Proficiency in Node.js and React',
      'Experience with SQL and NoSQL databases',
      'Knowledge of cloud platforms (AWS, GCP, or Azure)',
      'Understanding of DevOps practices',
      'Strong problem-solving skills',
    ],
    benefits: [
      'Competitive compensation package',
      'Fully remote position',
      'Health and wellness benefits',
      'Professional development budget',
      'Flexible PTO policy',
      'Stock options',
    ],
    postedDate: '2024-03-10',
    status: 'active',
  },
];

export function useJobs() {
  const [jobs, setJobs] = useState(() => {
    try {
      const stored = localStorage.getItem('agency_jobs');
      return stored ? JSON.parse(stored) : initialJobs;
    } catch {
      return initialJobs;
    }
  });

  useEffect(() => {
    localStorage.setItem('agency_jobs', JSON.stringify(jobs));
  }, [jobs]);

  const addJob = (jobData) => {
    const newJob = {
      ...jobData,
      id: generateId(),
      postedDate: new Date().toISOString().split('T')[0],
    };
    setJobs((prev) => [newJob, ...prev]);
    return newJob;
  };

  const updateJob = (id, updates) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updates } : job))
    );
  };

  const deleteJob = (id) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
  };

  const getJob = (id) => {
    return jobs.find((job) => job.id === id) || null;
  };

  return { jobs, addJob, updateJob, deleteJob, getJob };
}
