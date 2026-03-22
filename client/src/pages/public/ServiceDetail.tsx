/**
 * Service Detail Page
 * Fetches service data from the API using the slug from the URL.
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { FAQSection } from '../../components/FAQSection';
import { servicesApi } from '../../api/services.api';

const categoryImageMap: Record<string, string> = {
  'web-development': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop',
  'mobile-app': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=2070&auto=format&fit=crop',
  'ecommerce': 'https://images.unsplash.com/photo-1661956602116-aa6865609028?q=80&w=2064&auto=format&fit=crop',
  'design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2000&auto=format&fit=crop',
  'consulting': 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop',
  'other': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
};

function formatPrice(plan: any): string {
  if (!plan.price?.amount || plan.price.amount === 0) return 'Custom';
  const currency = plan.price.currency === 'USD' ? '$' : plan.price.currency;
  const amount = plan.price.amount.toLocaleString();
  const period = plan.price.period === 'monthly' ? '/mo' : plan.price.period === 'one-time' ? '' : `/${plan.price.period}`;
  return `${currency}${amount}${period}`;
}

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [service, setService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoading(true);
    setNotFound(false);
    servicesApi.getBySlug(slug!)
      .then(res => setService(res.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 text-center px-4">
        <h1 className="text-4xl font-bold">Service Not Found</h1>
        <p className="text-muted-foreground text-lg">The service you're looking for doesn't exist.</p>
        <Link to="/services">
          <Button className="rounded-full px-8">Browse All Services</Button>
        </Link>
      </div>
    );
  }

  const heroImage = service.thumbnail || categoryImageMap[service.category] || categoryImageMap['other'];
  const hero = service.heroSection || {};
  const metrics = service.metrics || [];
  const features = service.features || [];
  const pricing = service.pricingPlans || [];
  const faqs = (service.faqs || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  const cta = service.ctaSection || {};

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Immersive Header Banner */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt={service.title}
            className="w-full h-full object-cover opacity-30 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/60 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-70" />
        </div>

        <div className="container relative z-10 px-4 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>{hero.badge || 'Premium Service'}</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tight text-foreground drop-shadow-sm">
              {hero.heading || service.title}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {hero.subheading || service.subtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={hero.ctaButton?.link || '/contact'}>
                <Button size="lg" className="rounded-full px-8 h-12 text-lg">
                  {hero.ctaButton?.text || 'Start Project'}
                </Button>
              </Link>
              <Link to={hero.secondaryButton?.link || '/portfolio'}>
                <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-lg bg-background/50 backdrop-blur-md">
                  {hero.secondaryButton?.text || 'View Case Studies'}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-muted-foreground rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-muted-foreground rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Stats / Metrics */}
      {metrics.length > 0 && (
        <section className="py-12 border-y border-border/50 bg-card/50 backdrop-blur-sm -mt-20 relative z-20 mx-4 md:mx-auto max-w-7xl rounded-2xl shadow-xl">
          <div className={`grid grid-cols-2 md:grid-cols-${metrics.length} gap-8 text-center divide-x divide-border/50`}>
            {metrics.map((stat: any, i: number) => (
              <div key={i} className="p-2">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Description & Features */}
      <section className="py-32">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                Transforming ideas into <span className="text-primary">digital reality</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>

            {features.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {features.slice(0, 4).map((feature: any, index: number) => (
                  <div key={index} className="bg-card border border-border/50 p-6 rounded-2xl hover:border-primary/50 transition-colors shadow-sm group">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                      <span className="text-xl font-bold text-primary">{(feature.title || '?')[0]}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All features list */}
          {features.length > 4 && (
            <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.slice(4).map((feature: any, index: number) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/20 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section */}
      {pricing.length > 0 && (
        <section className="py-20 bg-muted/10">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                No hidden fees. Choose the plan that fits your growth stage.
              </p>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-${Math.min(pricing.length, 3)} gap-8`}>
              {pricing.map((plan: any, index: number) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -10 }}
                  className={`relative bg-card border ${plan.isPopular ? 'border-primary shadow-2xl shadow-primary/10' : 'border-border'} p-8 rounded-3xl flex flex-col`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="mb-8 text-center">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold mb-4">{formatPrice(plan)}</div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="space-y-4 mb-8 flex-grow border-t border-border/50 pt-8">
                    {(plan.features || []).map((feature: string, i: number) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link to={plan.ctaButton?.link || '/contact'}>
                    <Button
                      variant={plan.isPopular ? "default" : "outline"}
                      className={`w-full rounded-full h-12 ${plan.isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                    >
                      {plan.ctaButton?.text || 'Get Started'}
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <FAQSection
          title="Frequently Asked Questions"
          description={`Everything you need to know about our ${service.title} services.`}
          items={faqs}
          className="bg-background"
        />
      )}

      {/* CTA Section */}
      {(cta.heading || cta.button?.text) && (
        <section className="py-24 bg-muted/5 border-t border-border/50">
          <div className="container mx-auto px-4 max-w-3xl text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold">{cta.heading}</h2>
            {cta.subheading && <p className="text-xl font-medium text-primary">{cta.subheading}</p>}
            {cta.description && <p className="text-lg text-muted-foreground">{cta.description}</p>}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to={cta.button?.link || '/contact'}>
                <Button size="lg" className="rounded-full px-10 h-14 text-lg">
                  {cta.button?.text || 'Get Started'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              {cta.contactEmail && (
                <a href={`mailto:${cta.contactEmail}`}>
                  <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-lg">
                    {cta.contactEmail}
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
