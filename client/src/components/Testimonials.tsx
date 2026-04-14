/**
 * Testimonials Component
 * Premium glass cards with infinite scroll – data from approved+showOnHome reviews DB.
 * Falls back to CMS testimonials if no DB reviews are available.
 */
import React, { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { cn } from '../lib/utils';
import { useContent } from '../contexts/ContentContext';
import apiClient from '../api/apiClient';

const fallbackTestimonials = [
  { content: "Nova Agency transformed our digital presence. Their attention to detail is unmatched.", author: "Sarah Johnson", role: "CTO, TechFlow", rating: 5 },
  { content: "The AI integration features they built significantly improved our workflow efficiency.", author: "Michael Chen", role: "Founder, DataSphere", rating: 5 },
  { content: "Professional, responsive, and incredibly talented team. Executed our vision perfectly.", author: "Emily Rodriguez", role: "VP Ops, FinEdge", rating: 5 },
  { content: "They delivered the project 2 weeks ahead of schedule. Exceptional quality.", author: "David Kim", role: "CEO, StartupX", rating: 5 },
  { content: "The best design team we've ever worked with. Our conversion rates doubled.", author: "Lisa Patels", role: "Director, CreativeCo", rating: 5 },
];

const ReviewCard = ({ data, className }: { data: any; className?: string }) => (
  <div className={cn(
    "w-[85vw] sm:w-[350px] md:w-[400px] p-5 sm:p-8 rounded-3xl mx-3 sm:mx-4 flex flex-col justify-between min-h-[260px] transition-all duration-500 group",
    "bg-card/50 dark:bg-white/5 backdrop-blur-md border border-border/50 dark:border-white/10 hover:border-primary/40 hover:bg-card dark:hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2",
    className
  )}>
    <div className="relative">
      <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20 rotate-180 group-hover:text-primary/40 transition-colors" />
      <div className="flex gap-1 mb-6 pl-2">
        {[...Array(data.rating || 5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400 drop-shadow-sm" />
        ))}
      </div>
      <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6 italic relative z-10 pl-2 group-hover:text-foreground dark:group-hover:text-white transition-colors">
        "{data.content}"
      </p>
    </div>
    <div className="flex items-center gap-4 border-t border-border/50 dark:border-white/10 pt-6 group-hover:border-primary/20 transition-colors">
      {data.avatar ? (
        <img
          src={data.avatar}
          alt={data.author}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/50 transition-all"
        />
      ) : (
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-white shadow-lg text-lg ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
          {(data.author || 'A').charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <div className="font-bold text-foreground dark:text-white text-base">{data.author}</div>
        <div className="text-sm text-primary/80 font-medium group-hover:text-primary transition-colors">
          {data.role}{data.company && data.role ? `, ${data.company}` : data.company}
        </div>
      </div>
    </div>
  </div>
);

export function Testimonials() {
  const { testimonials: cmsTestimonials } = useContent();
  const [dbReviews, setDbReviews] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/reviews/home')
      .then(res => {
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0) setDbReviews(data);
      })
      .catch(() => {/* silent fallback */});
  }, []);

  // Priority: DB reviews → CMS testimonials → hardcoded fallback
  const displayTestimonials = dbReviews.length > 0
    ? dbReviews
    : cmsTestimonials.length > 0
      ? cmsTestimonials
      : fallbackTestimonials;

  return (
    <section className="py-16 sm:py-24 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10 sm:mb-14 md:mb-20">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Innovators</span></h2>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2 sm:px-0">
          Don't just take our word for it. Here's what our partners have to say about the digital experiences we build together.
        </p>
      </div>

      <div className="relative w-full overflow-hidden py-10">
        <div className="absolute inset-y-0 left-0 w-20 md:w-60 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 md:w-60 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="flex animate-scroll w-[max-content] hover:pause-on-hover">
          {[...displayTestimonials, ...displayTestimonials, ...displayTestimonials].map((t, i) => (
            <ReviewCard key={i} data={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
