import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Plus, Video, Users, LayoutTemplate, Settings, Menu, X, LogOut, Zap, Brain
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new', icon: Plus, label: 'Nuevo Video' },
  { to: '/intelligence', icon: Brain, label: 'Intelligence' },
  { to: '/videos', icon: Video, label: 'Mis Videos' },
  { to: '/personas', icon: Users, label: 'Personas' },
  { to: '/templates', icon: LayoutTemplate, label: 'Templates' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-card border border-border"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || true) && (
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            className={`fixed md:sticky top-0 left-0 z-40 h-screen w-60 flex-shrink-0 border-r border-border bg-sidebar flex flex-col ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            } transition-transform md:transition-none`}
          >
            <div className="p-6 flex items-center gap-2">
              <Zap className="text-primary" size={24} />
              <span className="text-xl font-heading font-bold">
                <span className="text-primary">UGC</span>Forge
              </span>
            </div>

            <nav className="flex-1 px-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={handleLogout}
              >
                <LogOut size={16} className="mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
