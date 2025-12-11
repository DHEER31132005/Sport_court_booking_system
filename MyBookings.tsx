import { useState, useEffect } from 'react';
import { useAuth } from 'miaoda-auth-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar, Clock, MapPin, User, DollarSign, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { bookingsApi } from '@/db/api';
import type { BookingWithDetails } from '@/types/types';
import { format } from 'date-fns';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;

    try {
      const data = await bookingsApi.getByUserId(user.id);
      setBookings(data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await bookingsApi.cancel(bookingId);
      toast.success('Booking cancelled successfully');
      await loadBookings();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success text-success-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      case 'waitlist':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your court bookings</p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No bookings yet</p>
              <p className="text-muted-foreground mb-6">Start by booking your first court</p>
              <Button onClick={() => window.location.href = '/booking'}>
                Book a Court
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        {booking.court?.name || 'Unknown Court'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {booking.court?.type && (
                          <Badge variant="outline" className="mr-2">
                            {booking.court.type}
                          </Badge>
                        )}
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </CardDescription>
                    </div>
                    {booking.status === 'confirmed' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={cancellingId === booking.id}
                          >
                            {cancellingId === booking.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this booking? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelBooking(booking.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Cancel Booking
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(booking.start_time), 'MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                        </span>
                      </div>
                      {booking.coach && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Coach: {booking.coach.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {(booking.racket_count > 0 || booking.shoes_count > 0) && (
                        <div className="text-sm">
                          <p className="font-medium mb-1">Equipment</p>
                          {booking.racket_count > 0 && (
                            <p className="text-muted-foreground">• {booking.racket_count} Racket(s)</p>
                          )}
                          {booking.shoes_count > 0 && (
                            <p className="text-muted-foreground">• {booking.shoes_count} Shoes</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base Price</span>
                      <span>${booking.base_price.toFixed(2)}</span>
                    </div>

                    {booking.pricing_modifiers && Array.isArray(booking.pricing_modifiers) && booking.pricing_modifiers.length > 0 && (
                      <div className="space-y-1">
                        {booking.pricing_modifiers.map((modifier, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{modifier.rule_name}</span>
                            <span className="text-secondary">+${modifier.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {booking.equipment_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Equipment Fee</span>
                        <span>${booking.equipment_fee.toFixed(2)}</span>
                      </div>
                    )}

                    {booking.coach_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Coach Fee</span>
                        <span>${booking.coach_fee.toFixed(2)}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-bold">
                      <span className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Total
                      </span>
                      <span className="text-primary">${booking.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}