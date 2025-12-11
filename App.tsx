import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAuth } from 'miaoda-auth-react';
import { Toaster } from '@/components/ui/sonner';
import { supabase } from '@/db/supabase';
import Header from '@/components/common/Header';
import routes from './routes';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider client={supabase}>
        <RequireAuth whiteList={['/login']}>
          <Toaster />
          <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow">
              <Routes>
                {routes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={route.element}
                  />
                ))}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </RequireAuth>
      </AuthProvider>
    </Router>
  );
};

export default App;
