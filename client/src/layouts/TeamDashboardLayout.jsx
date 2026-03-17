import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import TeamSidebar from '../components/layout/TeamSidebar';
import { Bell, Search, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { Toaster } from 'sonner';

export default function TeamDashboardLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <TeamSidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
            </button>
            <Link to="/team/settings">
              <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-emerald-500/50 transition-all">
                <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-xs font-bold">TM</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
