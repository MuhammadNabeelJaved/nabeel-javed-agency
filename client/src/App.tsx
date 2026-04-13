/**
 * Main Application Component
 * - Configures Tailwind Theme
 * - Sets up Routing
 * - Provides Theme Context
 */
import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ContentProvider } from './contexts/ContentContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SocketProvider } from './contexts/SocketContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalStyles } from './components/GlobalStyles';
import { Toaster } from 'sonner';
import { useTheme } from './contexts/ThemeContext';
import { PublicLayout } from './layouts/PublicLayout';
import { CookieConsent } from './components/CookieConsent';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import { useContent } from './contexts/ContentContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import PageLoaderFallback from './pages/public/PageLoader';

// Dashboard layouts (lazy — only needed for authenticated users)
const DashboardLayout      = lazy(() => import('./layouts/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const TeamDashboardLayout  = lazy(() => import('./layouts/TeamDashboardLayout').then(m => ({ default: m.TeamDashboardLayout })));
const UserDashboardLayout  = lazy(() => import('./layouts/UserDashboardLayout').then(m => ({ default: m.UserDashboardLayout })));

// ─── Public Pages ─────────────────────────────────────────────────────────────
const Home                   = lazy(() => import('./pages/public/Home'));
const Services               = lazy(() => import('./pages/public/Services'));
const ServiceDetail          = lazy(() => import('./pages/public/ServiceDetail'));
const Portfolio              = lazy(() => import('./pages/public/Portfolio'));
const ProjectDetail          = lazy(() => import('./pages/public/ProjectDetail'));
const Contact                = lazy(() => import('./pages/public/Contact'));
const ContactSuccess         = lazy(() => import('./pages/public/ContactSuccess'));
const Login                  = lazy(() => import('./pages/public/Login'));
const Signup                 = lazy(() => import('./pages/public/Signup'));
const NotFound               = lazy(() => import('./pages/public/NotFound'));
const ServerError            = lazy(() => import('./pages/public/ServerError'));
const StyleGuide             = lazy(() => import('./pages/public/StyleGuide'));
const PrivacyPolicy          = lazy(() => import('./pages/public/PrivacyPolicy'));
const TermsOfService         = lazy(() => import('./pages/public/TermsOfService'));
const CookiesSettings        = lazy(() => import('./pages/public/CookiesSettings'));
const Verification           = lazy(() => import('./pages/public/Verification'));
const Team                   = lazy(() => import('./pages/public/Team'));
const JobApplication         = lazy(() => import('./pages/public/JobApplication'));
const JobPrivacyPolicy       = lazy(() => import('./pages/public/JobPrivacyPolicy'));
const JobApplicationSuccess  = lazy(() => import('./pages/public/JobApplicationSuccess'));
const Careers                = lazy(() => import('./pages/public/Careers'));
const JobDetail              = lazy(() => import('./pages/public/JobDetail'));
const UnderConstruction      = lazy(() => import('./pages/public/UnderConstruction'));
const Maintenance            = lazy(() => import('./pages/public/Maintenance'));
const SkeletonPage           = lazy(() => import('./pages/public/SkeletonPage'));
const LoadingPage            = lazy(() => import('./pages/public/LoadingPage'));
const PageLoader             = lazy(() => import('./pages/public/PageLoader'));
const OAuthCallback          = lazy(() => import('./pages/public/OAuthCallback'));
const OtpVerification        = lazy(() => import('./pages/OtpVerification'));

// ─── Email Templates ──────────────────────────────────────────────────────────
const SignupConfirmation  = lazy(() => import('./pages/emails/SignupConfirmation'));
const EmailVerification  = lazy(() => import('./pages/emails/EmailVerification'));
const PasswordReset      = lazy(() => import('./pages/emails/PasswordReset'));
const ProjectCreated     = lazy(() => import('./pages/emails/ProjectCreated'));
const ProjectCompleted   = lazy(() => import('./pages/emails/ProjectCompleted'));
const FeedbackRequest    = lazy(() => import('./pages/emails/FeedbackRequest'));

// ─── Admin Pages ──────────────────────────────────────────────────────────────
const DashboardHome         = lazy(() => import('./pages/admin/DashboardHome'));
const Messages              = lazy(() => import('./pages/admin/Messages'));
const Projects              = lazy(() => import('./pages/admin/Projects'));
const ServicesAdmin         = lazy(() => import('./pages/admin/ServicesAdmin'));
const CategoriesAdmin       = lazy(() => import('./pages/admin/CategoriesAdmin'));
const AITools               = lazy(() => import('./pages/admin/AITools'));
const ChatbotManager        = lazy(() => import('./pages/admin/ChatbotManager'));
const Support               = lazy(() => import('./pages/admin/Support'));
const Notifications         = lazy(() => import('./pages/admin/Notifications'));
const Settings              = lazy(() => import('./pages/admin/Settings'));
const ContentEditor         = lazy(() => import('./pages/admin/ContentEditor'));
const TeamManagement        = lazy(() => import('./pages/admin/TeamManagement'));
const JobManagement         = lazy(() => import('./pages/admin/JobManagement'));
const AdminJobApplications  = lazy(() => import('./pages/admin/AdminJobApplications'));
const ClientManagement      = lazy(() => import('./pages/admin/ClientManagement'));
const ContactManagement     = lazy(() => import('./pages/admin/ContactManagement'));
const DatabaseManager       = lazy(() => import('./pages/admin/DatabaseManager'));
const ClientProjectRequests = lazy(() => import('./pages/admin/ClientProjectRequests'));
const PageManager           = lazy(() => import('./pages/admin/PageManager'));
const AnnouncementManager   = lazy(() => import('./pages/admin/AnnouncementManager'));
const NavFooterManager      = lazy(() => import('./pages/admin/NavFooterManager'));

// ─── Team Pages ───────────────────────────────────────────────────────────────
const TeamDashboardHome       = lazy(() => import('./pages/team/TeamDashboardHome'));
const TeamProjects            = lazy(() => import('./pages/team/TeamProjects'));
const TeamProjectDetail       = lazy(() => import('./pages/team/TeamProjectDetail'));
const TeamTasks               = lazy(() => import('./pages/team/TeamTasks'));
const TeamReports             = lazy(() => import('./pages/team/TeamReports'));
const TeamNotifications       = lazy(() => import('./pages/team/TeamNotifications'));
const TeamSettings            = lazy(() => import('./pages/team/TeamSettings'));
const TeamCalendar            = lazy(() => import('./pages/team/TeamCalendar'));
const TeamChat                = lazy(() => import('./pages/team/TeamChat'));
const TeamResources           = lazy(() => import('./pages/team/TeamResources'));
const TeamClientRequestDetail = lazy(() => import('./pages/team/TeamClientRequestDetail'));
const TeamSupport             = lazy(() => import('./pages/team/TeamSupport'));
const TeamAIChat              = lazy(() => import('./pages/team/TeamAIChat'));
const TeamAppliedJobs         = lazy(() => import('./pages/team/TeamAppliedJobs'));

// ─── User Pages ───────────────────────────────────────────────────────────────
const UserDashboardHome  = lazy(() => import('./pages/user/UserDashboardHome'));
const UserProjects       = lazy(() => import('./pages/user/UserProjects'));
const UserChat           = lazy(() => import('./pages/user/UserChat'));
const UserAIChat         = lazy(() => import('./pages/user/UserAIChat'));
const UserProfile        = lazy(() => import('./pages/user/UserProfile'));
const UserNotifications  = lazy(() => import('./pages/user/UserNotifications'));
const UserAppliedJobs    = lazy(() => import('./pages/user/UserAppliedJobs'));
const UserBilling        = lazy(() => import('./pages/user/UserBilling'));
const UserSupport        = lazy(() => import('./pages/user/UserSupport'));

// Configure Tailwind Theme Extension
// This must run before rendering
const configureTailwind = () => {
  if (typeof window !== 'undefined' && window.tailwind) {
    window.tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            border: 'hsl(var(--border))',
            input: 'hsl(var(--input))',
            ring: 'hsl(var(--ring))',
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            primary: {
              DEFAULT: 'hsl(var(--primary))',
              foreground: 'hsl(var(--primary-foreground))',
            },
            secondary: {
              DEFAULT: 'hsl(var(--secondary))',
              foreground: 'hsl(var(--secondary-foreground))',
            },
            destructive: {
              DEFAULT: 'hsl(var(--destructive))',
              foreground: 'hsl(var(--destructive-foreground))',
            },
            muted: {
              DEFAULT: 'hsl(var(--muted))',
              foreground: 'hsl(var(--muted-foreground))',
            },
            accent: {
              DEFAULT: 'hsl(var(--accent))',
              foreground: 'hsl(var(--accent-foreground))',
            },
            popover: {
              DEFAULT: 'hsl(var(--popover))',
              foreground: 'hsl(var(--popover-foreground))',
            },
            card: {
              DEFAULT: 'hsl(var(--card))',
              foreground: 'hsl(var(--card-foreground))',
            },
          },
          borderRadius: {
            lg: 'var(--radius)',
            md: 'calc(var(--radius) - 2px)',
            sm: 'calc(var(--radius) - 4px)',
          },
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
          }
        }
      }
    };
  }
};

// Syncs admin-set globalTheme from ContentContext into ThemeContext on load/change
function GlobalThemeSyncer() {
  const { globalTheme } = useContent();
  const { setTheme } = useTheme();
  useEffect(() => {
    if (globalTheme === 'dark' || globalTheme === 'light') {
      setTheme(globalTheme);
    }
  }, [globalTheme]);
  return null;
}

function ToasterWrapper() {
  const { theme } = useTheme();
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      theme={theme as 'light' | 'dark' | 'system'}
      duration={4000}
    />
  );
}

export default function App() {
  useEffect(() => {
    configureTailwind();
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="agency-theme">
      <CookieConsentProvider>
      <LanguageProvider>
      <AuthProvider>
      <SocketProvider>
      <ContentProvider>
        <GlobalThemeSyncer />
        <GlobalStyles />
        <ToasterWrapper />
        <div className="min-h-screen bg-background text-foreground font-sans antialiased">
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CookieConsent />
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><Home /></ErrorBoundary></Suspense>} />
                <Route path="/services" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><Services /></ErrorBoundary></Suspense>} />
                <Route path="/services/:slug" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><ServiceDetail /></ErrorBoundary></Suspense>} />
                <Route path="/portfolio" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><Portfolio /></ErrorBoundary></Suspense>} />
                <Route path="/portfolio/:slug" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><ProjectDetail /></ErrorBoundary></Suspense>} />
                <Route path="/contact" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><Contact /></ErrorBoundary></Suspense>} />
                <Route path="/contact/success" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><ContactSuccess /></ErrorBoundary></Suspense>} />
                <Route path="/login" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><Login /></ErrorBoundary></Suspense>} />
                <Route path="/signup" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><Signup /></ErrorBoundary></Suspense>} />
                <Route path="/500" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><ServerError /></ErrorBoundary></Suspense>} />
                <Route path="/style-guide" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><StyleGuide /></ErrorBoundary></Suspense>} />
                <Route path="/privacy" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><PrivacyPolicy /></ErrorBoundary></Suspense>} />
                <Route path="/terms" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><TermsOfService /></ErrorBoundary></Suspense>} />
                <Route path="/cookies" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><CookiesSettings /></ErrorBoundary></Suspense>} />
                <Route path="/verification" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><Verification /></ErrorBoundary></Suspense>} />
                <Route path="/our-team" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><Team /></ErrorBoundary></Suspense>} />
                <Route path="/careers" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><Careers /></ErrorBoundary></Suspense>} />
                <Route path="/careers/:id" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><JobDetail /></ErrorBoundary></Suspense>} />
                <Route path="/careers/apply" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><JobApplication /></ErrorBoundary></Suspense>} />
                <Route path="/careers/apply/success" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><JobApplicationSuccess /></ErrorBoundary></Suspense>} />
                <Route path="/careers/privacy" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><JobPrivacyPolicy /></ErrorBoundary></Suspense>} />
                <Route path="/coming-soon" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><UnderConstruction /></ErrorBoundary></Suspense>} />
                <Route path="/maintenance" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><Maintenance /></ErrorBoundary></Suspense>} />
                <Route path="/skeleton" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><SkeletonPage /></ErrorBoundary></Suspense>} />
                <Route path="/loading" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><LoadingPage /></ErrorBoundary></Suspense>} />
                <Route path="/page-loader" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><PageLoader /></ErrorBoundary></Suspense>} />
                <Route path="/emails/signup-confirmation" element={<Suspense fallback={<PageLoaderFallback />}><SignupConfirmation /></Suspense>} />
                <Route path="/emails/email-verification" element={<Suspense fallback={<PageLoaderFallback />}><EmailVerification /></Suspense>} />
                <Route path="/emails/password-reset" element={<Suspense fallback={<PageLoaderFallback />}><PasswordReset /></Suspense>} />
                <Route path="/emails/project-created" element={<Suspense fallback={<PageLoaderFallback />}><ProjectCreated /></Suspense>} />
                <Route path="/emails/project-completed" element={<Suspense fallback={<PageLoaderFallback />}><ProjectCompleted /></Suspense>} />
                <Route path="/emails/feedback-request" element={<Suspense fallback={<PageLoaderFallback />}><FeedbackRequest /></Suspense>} />
                <Route path="/otp-verification" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><OtpVerification /></ErrorBoundary></Suspense>} />
                <Route path="/auth/callback" element={<Suspense fallback={<PageLoaderFallback />}><ErrorBoundary><OAuthCallback /></ErrorBoundary></Suspense>} />
                <Route path="*" element={<Suspense fallback={<PageLoaderFallback />}><NotFound /></Suspense>} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoaderFallback />}>
                      <DashboardLayout />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }>
                <Route index element={<Suspense fallback={<PageLoaderFallback />}><DashboardHome /></Suspense>} />
                <Route path="messages" element={<Suspense fallback={<PageLoaderFallback />}><Messages /></Suspense>} />
                <Route path="projects" element={<Suspense fallback={<PageLoaderFallback />}><Projects /></Suspense>} />
                <Route path="services" element={<Suspense fallback={<PageLoaderFallback />}><ServicesAdmin /></Suspense>} />
                <Route path="categories" element={<Suspense fallback={<PageLoaderFallback />}><CategoriesAdmin /></Suspense>} />
                <Route path="ai-tools" element={<Suspense fallback={<PageLoaderFallback />}><AITools /></Suspense>} />
                <Route path="chatbot-manager" element={<Suspense fallback={<PageLoaderFallback />}><ChatbotManager /></Suspense>} />
                <Route path="support" element={<Suspense fallback={<PageLoaderFallback />}><Support /></Suspense>} />
                <Route path="notifications" element={<Suspense fallback={<PageLoaderFallback />}><Notifications /></Suspense>} />
                <Route path="team" element={<Suspense fallback={<PageLoaderFallback />}><TeamManagement /></Suspense>} />
                <Route path="clients" element={<Suspense fallback={<PageLoaderFallback />}><ClientManagement /></Suspense>} />
                <Route path="client-requests" element={<Suspense fallback={<PageLoaderFallback />}><ClientProjectRequests /></Suspense>} />
                <Route path="contacts" element={<Suspense fallback={<PageLoaderFallback />}><ContactManagement /></Suspense>} />
                <Route path="jobs" element={<Suspense fallback={<PageLoaderFallback />}><JobManagement /></Suspense>} />
                <Route path="job-applications" element={<Suspense fallback={<PageLoaderFallback />}><AdminJobApplications /></Suspense>} />
                <Route path="database" element={<Suspense fallback={<PageLoaderFallback />}><DatabaseManager /></Suspense>} />
                <Route path="announcements" element={<Suspense fallback={<PageLoaderFallback />}><AnnouncementManager /></Suspense>} />
                <Route path="page-manager" element={<Suspense fallback={<PageLoaderFallback />}><PageManager /></Suspense>} />
                <Route path="nav-footer" element={<Suspense fallback={<PageLoaderFallback />}><NavFooterManager /></Suspense>} />
                <Route path="content-editor" element={<Suspense fallback={<PageLoaderFallback />}><ContentEditor /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<PageLoaderFallback />}><Settings /></Suspense>} />
              </Route>

              {/* Team Dashboard Routes */}
              <Route path="/team" element={
                <ProtectedRoute allowedRoles={['admin', 'team']}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoaderFallback />}>
                      <TeamDashboardLayout />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }>
                <Route index element={<Suspense fallback={<PageLoaderFallback />}><TeamDashboardHome /></Suspense>} />
                <Route path="projects" element={<Suspense fallback={<PageLoaderFallback />}><TeamProjects /></Suspense>} />
                <Route path="projects/:id" element={<Suspense fallback={<PageLoaderFallback />}><TeamProjectDetail /></Suspense>} />
                <Route path="client-requests/:id" element={<Suspense fallback={<PageLoaderFallback />}><TeamClientRequestDetail /></Suspense>} />
                <Route path="tasks" element={<Suspense fallback={<PageLoaderFallback />}><TeamTasks /></Suspense>} />
                <Route path="reports" element={<Suspense fallback={<PageLoaderFallback />}><TeamReports /></Suspense>} />
                <Route path="calendar" element={<Suspense fallback={<PageLoaderFallback />}><TeamCalendar /></Suspense>} />
                <Route path="chat" element={<Suspense fallback={<PageLoaderFallback />}><TeamChat /></Suspense>} />
                <Route path="resources" element={<Suspense fallback={<PageLoaderFallback />}><TeamResources /></Suspense>} />
                <Route path="notifications" element={<Suspense fallback={<PageLoaderFallback />}><TeamNotifications /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<PageLoaderFallback />}><TeamSettings /></Suspense>} />
                <Route path="ai-assistant" element={<Suspense fallback={<PageLoaderFallback />}><TeamAIChat /></Suspense>} />
                <Route path="support" element={<Suspense fallback={<PageLoaderFallback />}><TeamSupport /></Suspense>} />
                <Route path="applied-jobs" element={<Suspense fallback={<PageLoaderFallback />}><TeamAppliedJobs /></Suspense>} />
              </Route>

              {/* User Dashboard Routes */}
              <Route path="/user-dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'team', 'user']}>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoaderFallback />}>
                      <UserDashboardLayout />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }>
                <Route index element={<Suspense fallback={<PageLoaderFallback />}><UserDashboardHome /></Suspense>} />
                <Route path="projects" element={<Suspense fallback={<PageLoaderFallback />}><UserProjects /></Suspense>} />
                <Route path="messages" element={<Suspense fallback={<PageLoaderFallback />}><UserChat /></Suspense>} />
                <Route path="ai-assistant" element={<Suspense fallback={<PageLoaderFallback />}><UserAIChat /></Suspense>} />
                <Route path="applied-jobs" element={<Suspense fallback={<PageLoaderFallback />}><UserAppliedJobs /></Suspense>} />
                <Route path="billing" element={<Suspense fallback={<PageLoaderFallback />}><UserBilling /></Suspense>} />
                <Route path="profile" element={<Suspense fallback={<PageLoaderFallback />}><UserProfile /></Suspense>} />
                <Route path="notifications" element={<Suspense fallback={<PageLoaderFallback />}><UserNotifications /></Suspense>} />
                <Route path="support" element={<Suspense fallback={<PageLoaderFallback />}><UserSupport /></Suspense>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </div>
      </ContentProvider>
      </SocketProvider>
      </AuthProvider>
      </LanguageProvider>
      </CookieConsentProvider>
    </ThemeProvider>
  );
}
