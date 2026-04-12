import apiClient from './apiClient';

export const cmsApi = {
  get: () => apiClient.get('/cms'),

  updateGlobalTheme: (globalTheme: 'dark' | 'light' | null) => apiClient.patch('/cms/global-theme', { globalTheme }),

  getNavLinks: () => apiClient.get('/cms/nav-links'),
  updateNavLinks: (navLinks: any[]) => apiClient.put('/cms/nav-links', { navLinks }),

  getFooterSections: () => apiClient.get('/cms/footer-sections'),
  updateFooterSections: (footerSections: any[]) => apiClient.put('/cms/footer-sections', { footerSections }),

  getFooterBottom: () => apiClient.get('/cms/footer-bottom'),
  updateFooterBottom: (data: any) => apiClient.put('/cms/footer-bottom', data),

  updateLogo: (logoUrl: string) => apiClient.patch('/cms/logo', { logoUrl }),

  updateTechStack: (techStack: any[]) => apiClient.put('/cms/tech-stack', { techStack }),

  updateConceptToReality: (data: any) => apiClient.put('/cms/concept-to-reality', data),
  addProcessStep: (step: any) => apiClient.post('/cms/concept-to-reality/step', step),
  updateProcessStep: (stepId: string, step: any) => apiClient.put(`/cms/concept-to-reality/step/${stepId}`, step),
  deleteProcessStep: (stepId: string) => apiClient.delete(`/cms/concept-to-reality/step/${stepId}`),

  updateWhyChooseUs: (data: any) => apiClient.put('/cms/why-choose-us', data),
  addScrollingCard: (card: any) => apiClient.post('/cms/why-choose-us/card', card),
  updateScrollingCard: (cardId: string, card: any) => apiClient.put(`/cms/why-choose-us/card/${cardId}`, card),
  deleteScrollingCard: (cardId: string) => apiClient.delete(`/cms/why-choose-us/card/${cardId}`),

  updateContactInfo: (data: any) => apiClient.put('/cms/contact-info', data),
  updateSocialLinks: (data: any) => apiClient.put('/cms/social-links', data),

  updateTestimonials: (testimonials: any[]) => apiClient.put('/cms/testimonials', { testimonials }),
  addTestimonial: (testimonial: any) => apiClient.post('/cms/testimonials', testimonial),
  updateTestimonial: (id: string, testimonial: any) => apiClient.put(`/cms/testimonials/${id}`, testimonial),
  deleteTestimonial: (id: string) => apiClient.delete(`/cms/testimonials/${id}`),
};
