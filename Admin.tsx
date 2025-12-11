import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { profilesApi } from '@/db/api';
import type { Profile } from '@/types/types';
import CourtsManagement from '@/components/admin/CourtsManagement';
import CoachesManagement from '@/components/admin/CoachesManagement';
import EquipmentManagement from '@/components/admin/EquipmentManagement';
import PricingRulesManagement from '@/components/admin/PricingRulesManagement';
import BookingsManagement from '@/components/admin/BookingsManagement';
import UsersManagement from '@/components/admin/UsersManagement';
import WaitlistManagement from '@/components/admin/WaitlistManagement';

export default function Admin() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profilesApi.getCurrentProfile();
      setProfile(data);

      if (data?.role !== 'admin') {
        toast.error('Access denied: Admin privileges required');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to verify admin access');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage courts, coaches, equipment, pricing, and bookings</p>
        </div>

        <Tabs defaultValue="courts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
            <TabsTrigger value="courts">Courts</TabsTrigger>
            <TabsTrigger value="coaches">Coaches</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="courts">
            <CourtsManagement />
          </TabsContent>

          <TabsContent value="coaches">
            <CoachesManagement />
          </TabsContent>

          <TabsContent value="equipment">
            <EquipmentManagement />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingRulesManagement />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingsManagement />
          </TabsContent>

          <TabsContent value="waitlist">
            <WaitlistManagement />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}