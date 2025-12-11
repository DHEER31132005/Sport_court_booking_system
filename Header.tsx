import { Link, useLocation } from 'react-router-dom';
import { useAuth } from 'miaoda-auth-react';
import { Button } from '@/components/ui/button';
import { Activity, LogOut } from 'lucide-react';
import routes from '@/routes';
import { useEffect, useState } from 'react';
import { profilesApi } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { Profile } from '@/types/types';

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      profilesApi.getCurrentProfile().then(setProfile).catch(console.error);
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold gradient-text">SportsCourt</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {routes
              .filter(route => route.visible !== false)
              .filter(route => !route.adminOnly || isAdmin)
              .map((route) => (
                <Link
                  key={route.path}
                  to={route.path}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === route.path
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {route.name}
                </Link>
              ))}
          </nav>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-sm text-muted-foreground hidden md:inline">
                  {profile?.username || user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
