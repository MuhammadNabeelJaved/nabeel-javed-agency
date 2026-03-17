import React from 'react';
import Hero from '../../components/sections/Hero';
import TechStack from '../../components/sections/TechStack';
import Process from '../../components/sections/Process';
import FeaturedProjects from '../../components/sections/FeaturedProjects';
import Testimonials from '../../components/sections/Testimonials';
import FAQSection from '../../components/sections/FAQSection';
import TransformCTA from '../../components/sections/TransformCTA';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <TechStack />
      <Process />
      <FeaturedProjects />
      <Testimonials />
      <FAQSection />
      <TransformCTA />
    </main>
  );
}
