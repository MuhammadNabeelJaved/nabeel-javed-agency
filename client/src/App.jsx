import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ContentProvider } from './contexts/ContentContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import TeamDashboardLayout from './layouts/TeamDashboardLayout';
import UserDashboardLayout from './layouts/UserDashboardLayout';

// ── Public Pages ──────────────────────────────────────────────────
import Home from './pages/public/Home';
import Services from './pages/public/Services';
import ServiceDetail from './pages/public/ServiceDetail';
import Portfolio from './pages/public/Portfolio';
import ProjectDetail from './pages/public/ProjectDetail';
import Contact from './pages/public/Contact';
import ContactSuccess from './pages/public/ContactSuccess';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import Verification from './pages/public/Verification';
import OtpVerification from './pages/public/OtpVerification';
import Team from './pages/public/Team';
import Careers from './pages/public/Careers';
import JobDetail from './pages/public/JobDetail';
import JobApplication from './pages/public/JobApplication';
import JobApplicationSuccess from './pages/public/JobApplicationSuccess';
import JobPrivacyPolicy from './pages/public/JobPrivacyPolicy';
import NotFound from './pages/public/NotFound';
import ServerError from './pages/public/ServerError';
import LoadingPage from './pages/public/LoadingPage';
import PageLoader from './pages/public/PageLoader';
import SkeletonPage from './pages/public/SkeletonPage';
import UnderConstruction from './pages/public/UnderConstruction';
import Maintenance from './pages/public/Maintenance';
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import TermsOfService from './pages/public/TermsOfService';
import CookiesSettings from './pages/public/CookiesSettings';
import StyleGuide from './pages/public/StyleGuide';

// ── Email Templates ───────────────────────────────────────────────
import SignupConfirmation from './pages/emails/SignupConfirmation';
import EmailVerification from './pages/emails/EmailVerification';
import PasswordReset from './pages/emails/PasswordReset';
import ProjectCreated from './pages/emails/ProjectCreated';
import ProjectCompleted from './pages/emails/ProjectCompleted';
import FeedbackRequest from './pages/emails/FeedbackRequest';

// ── Admin Pages ───────────────────────────────────────────────────
import DashboardHome from './pages/admin/DashboardHome';
import Messages from './pages/admin/Messages';
import Projects from './pages/admin/Projects';
import ServicesAdmin from './pages/admin/ServicesAdmin';
import CategoriesAdmin from './pages/admin/CategoriesAdmin';
import AITools from './pages/admin/AITools';
import Billing from './pages/admin/Billing';
import Support from './pages/admin/Support';
import Notifications from './pages/admin/Notifications';
import TeamManagement from './pages/admin/TeamManagement';
import JobManagement from './pages/admin/JobManagement';
import ClientManagement from './pages/admin/ClientManagement';
import ContactManagement from './pages/admin/ContactManagement';
import DatabaseManager from './pages/admin/DatabaseManager';
import ContentEditor from './pages/admin/ContentEditor';
import Settings from './pages/admin/Settings';

// ── Team Pages ────────────────────────────────────────────────────
import TeamDashboardHome from './pages/team/TeamDashboardHome';
import TeamProjects from './pages/team/TeamProjects';
import TeamProjectDetail from './pages/team/TeamProjectDetail';
import TeamTasks from './pages/team/TeamTasks';
import TeamClients from './pages/team/TeamClients';
import TeamClientDetail from './pages/team/TeamClientDetail';
import TeamReports from './pages/team/TeamReports';
import TeamCalendar from './pages/team/TeamCalendar';
import TeamChat from './pages/team/TeamChat';
import TeamResources from './pages/team/TeamResources';
import TeamNotifications from './pages/team/TeamNotifications';
import TeamSettings from './pages/team/TeamSettings';

// ── User Pages ────────────────────────────────────────────────────
import UserDashboardHome from './pages/user/UserDashboardHome';
import UserProjects from './pages/user/UserProjects';
import UserChat from './pages/user/UserChat';
import UserAIChat from './pages/user/UserAIChat';
import UserProfile from './pages/user/UserProfile';
import UserNotifications from './pages/user/UserNotifications';

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ContentProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* ── Public Routes ──────────────────────────────────── */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:slug" element={<ServiceDetail />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/portfolio/:slug" element={<ProjectDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/contact/success" element={<ContactSuccess />} />
                <Route path="/our-team" element={<Team />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/careers/:id" element={<JobDetail />} />
                <Route path="/careers/apply" element={<JobApplication />} />
                <Route path="/careers/apply/success" element={<JobApplicationSuccess />} />
                <Route path="/careers/privacy" element={<JobPrivacyPolicy />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/cookies" element={<CookiesSettings />} />
                <Route path="/style-guide" element={<StyleGuide />} />
                <Route path="/coming-soon" element={<UnderConstruction />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/skeleton" element={<SkeletonPage />} />
                <Route path="/loading" element={<LoadingPage />} />
                <Route path="/page-loader" element={<PageLoader />} />
                <Route path="/500" element={<ServerError />} />
              </Route>

              {/* ── Auth Routes (no layout) ─────────────────────────── */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/otp-verification" element={<OtpVerification />} />

              {/* ── Email Template Routes ─────────────────────────── */}
              <Route path="/emails/signup-confirmation" element={<SignupConfirmation />} />
              <Route path="/emails/email-verification" element={<EmailVerification />} />
              <Route path="/emails/password-reset" element={<PasswordReset />} />
              <Route path="/emails/project-created" element={<ProjectCreated />} />
              <Route path="/emails/project-completed" element={<ProjectCompleted />} />
              <Route path="/emails/feedback-request" element={<FeedbackRequest />} />

              {/* ── Admin Routes ──────────────────────────────────── */}
              <Route path="/admin" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="messages" element={<Messages />} />
                <Route path="projects" element={<Projects />} />
                <Route path="services" element={<ServicesAdmin />} />
                <Route path="categories" element={<CategoriesAdmin />} />
                <Route path="ai-tools" element={<AITools />} />
                <Route path="billing" element={<Billing />} />
                <Route path="support" element={<Support />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="team" element={<TeamManagement />} />
                <Route path="jobs" element={<JobManagement />} />
                <Route path="clients" element={<ClientManagement />} />
                <Route path="contacts" element={<ContactManagement />} />
                <Route path="database" element={<DatabaseManager />} />
                <Route path="content-editor" element={<ContentEditor />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* ── Team Routes ──────────────────────────────────── */}
              <Route path="/team" element={<TeamDashboardLayout />}>
                <Route index element={<TeamDashboardHome />} />
                <Route path="projects" element={<TeamProjects />} />
                <Route path="projects/:id" element={<TeamProjectDetail />} />
                <Route path="tasks" element={<TeamTasks />} />
                <Route path="clients" element={<TeamClients />} />
                <Route path="clients/:id" element={<TeamClientDetail />} />
                <Route path="reports" element={<TeamReports />} />
                <Route path="calendar" element={<TeamCalendar />} />
                <Route path="chat" element={<TeamChat />} />
                <Route path="resources" element={<TeamResources />} />
                <Route path="notifications" element={<TeamNotifications />} />
                <Route path="settings" element={<TeamSettings />} />
              </Route>

              {/* ── User Routes ──────────────────────────────────── */}
              <Route path="/user-dashboard" element={<UserDashboardLayout />}>
                <Route index element={<UserDashboardHome />} />
                <Route path="projects" element={<UserProjects />} />
                <Route path="messages" element={<UserChat />} />
                <Route path="ai-assistant" element={<UserAIChat />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="notifications" element={<UserNotifications />} />
              </Route>

              {/* ── Catch-all ─────────────────────────────────────── */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </ContentProvider>
    </ThemeProvider>
  );
}
