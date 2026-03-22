/**
 * Team Page
 * Public facing team directory - fetches from /users/team API
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Mail, ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { TransformCTA } from '../../components/TransformCTA';
import apiClient from '../../api/apiClient';

export default function Team() {
  const [team, setTeam] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/users/team')
      .then(res => {
        const data = res.data.data;
        setTeam(Array.isArray(data) ? data : []);
      })
      .catch(() => setTeam([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="outline" className="mb-6 px-4 py-1 text-sm border-primary/20 bg-primary/5 text-primary">
              The Dream Team
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Meet the minds behind <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary">the magic.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We are a diverse group of thinkers, creators, and builders united by a single passion: crafting exceptional digital experiences.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : team.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No team members found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => {
              const profile = member.teamProfile || {};
              const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.name || 'Team Member';
              const role = profile.position || member.role || '';
              const bio = profile.bio || '';
              const avatar = member.avatar || '';
              const skills: string[] = profile.skills || [];
              const socials = profile.socialLinks || {};

              return (
                <motion.div
                  key={member._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden aspect-[4/5]">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                        {avatar ? (
                          <img src={avatar} alt={name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <span className="text-7xl font-bold text-primary/40">{name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <div className="space-y-2">
                            {skills.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                {skills.slice(0, 3).map((tag, i) => (
                                  <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white backdrop-blur-md px-2 py-1 rounded">{tag}</span>
                                ))}
                              </div>
                            )}
                            <h3 className="text-2xl font-bold text-white">{name}</h3>
                            <p className="text-primary-foreground/80 font-medium">{role}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <p className="text-muted-foreground text-sm leading-relaxed">{bio || 'A valued member of our team.'}</p>
                        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                          {socials.twitter && <a href={socials.twitter} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-4 w-4" /></a>}
                          {socials.linkedin && <a href={socials.linkedin} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="h-4 w-4" /></a>}
                          {socials.github && <a href={socials.github} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Github className="h-4 w-4" /></a>}
                          {member.email && (
                            <a href={`mailto:${member.email}`} className="ml-auto text-muted-foreground hover:text-primary transition-colors">
                              <Button variant="ghost" size="sm" className="gap-1 text-xs hover:text-primary">Contact <ArrowUpRight className="h-3 w-3" /></Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Join Team CTA */}
      <section className="bg-muted/30 py-24 border-y border-border/50">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Want to join the team?</h2>
          <p className="text-lg text-muted-foreground">
            We're always looking for talented individuals to help us build the future of digital products.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="rounded-full px-8">View Open Roles</Button>
            <Button size="lg" variant="outline" className="rounded-full px-8">Culture & Perks</Button>
          </div>
        </div>
      </section>

      <TransformCTA />
    </div>
  );
}
