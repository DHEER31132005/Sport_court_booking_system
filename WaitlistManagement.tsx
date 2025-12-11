import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { waitlistApi } from '@/db/api';
import type { WaitlistWithDetails } from '@/types/types';
import { format } from 'date-fns';

export default function WaitlistManagement() {
  const [waitlist, setWaitlist] = useState<WaitlistWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWaitlist();
  }, []);

  const loadWaitlist = async () => {
    try {
      const data = await waitlistApi.getAll();
      setWaitlist(data);
    } catch (error) {
      console.error('Failed to load waitlist:', error);
      toast.error('Failed to load waitlist');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-warning text-warning-foreground';
      case 'notified':
        return 'bg-info text-info-foreground';
      case 'expired':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waitlist Management</CardTitle>
        <CardDescription>View all waitlist entries across the facility</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Court</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {waitlist.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No waitlist entries found
                </TableCell>
              </TableRow>
            ) : (
              waitlist.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {entry.user?.username || 'Unknown'}
                  </TableCell>
                  <TableCell>{entry.court?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    {format(new Date(entry.start_time), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(entry.start_time), 'h:mm a')} - {format(new Date(entry.end_time), 'h:mm a')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">#{entry.position}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(entry.status)}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
