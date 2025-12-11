import { useState, useEffect } from 'react';
import { useAuth } from 'miaoda-auth-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { courtsApi, coachesApi, equipmentApi, bookingsApi, pricingApi, waitlistApi } from '@/db/api';
import type { Court, Coach, Equipment, PriceCalculation, WaitlistPosition } from '@/types/types';
import { format } from 'date-fns';

export default function Booking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courts, setCourts] = useState<Court[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<WaitlistPosition | null>(null);
  const [isCheckingWaitlist, setIsCheckingWaitlist] = useState(false);

  const [formData, setFormData] = useState({
    court_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    coach_id: '',
    racket_count: 0,
    shoes_count: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.court_id && formData.date && formData.start_time && formData.end_time) {
      calculatePrice();
      checkWaitlistPosition();
    }
  }, [formData]);

  const loadData = async () => {
    try {
      const [courtsData, coachesData, equipmentData] = await Promise.all([
        courtsApi.getAll(),
        coachesApi.getAll(),
        equipmentApi.getAll()
      ]);
      setCourts(courtsData.filter(c => c.status === 'available'));
      setCoaches(coachesData.filter(c => c.status === 'available'));
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load booking data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePrice = async () => {
    if (!formData.court_id || !formData.date || !formData.start_time || !formData.end_time) {
      return;
    }

    setIsCalculatingPrice(true);
    try {
      const start_time = `${formData.date}T${formData.start_time}:00`;
      const end_time = `${formData.date}T${formData.end_time}:00`;

      const calculation = await pricingApi.calculatePrice({
        court_id: formData.court_id,
        start_time,
        end_time,
        coach_id: formData.coach_id || undefined,
        racket_count: formData.racket_count,
        shoes_count: formData.shoes_count
      });

      setPriceCalculation(calculation);
    } catch (error) {
      console.error('Failed to calculate price:', error);
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  const checkWaitlistPosition = async () => {
    if (!formData.court_id || !formData.date || !formData.start_time || !formData.end_time || !user) {
      return;
    }

    setIsCheckingWaitlist(true);
    try {
      const start_time = `${formData.date}T${formData.start_time}:00`;
      const end_time = `${formData.date}T${formData.end_time}:00`;

      const position = await waitlistApi.getPosition({
        court_id: formData.court_id,
        start_time,
        end_time
      });

      setWaitlistPosition(position);
    } catch (error) {
      console.error('Failed to check waitlist:', error);
    } finally {
      setIsCheckingWaitlist(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to book');
      return;
    }

    if (!priceCalculation) {
      toast.error('Please wait for price calculation');
      return;
    }

    setIsSubmitting(true);

    try {
      const start_time = `${formData.date}T${formData.start_time}:00`;
      const end_time = `${formData.date}T${formData.end_time}:00`;

      const availability = await bookingsApi.checkAvailability({
        court_id: formData.court_id,
        start_time,
        end_time,
        coach_id: formData.coach_id || undefined,
        racket_count: formData.racket_count,
        shoes_count: formData.shoes_count
      });

      if (!availability.available) {
        if (!availability.court_available) {
          toast.error('Court is not available for the selected time');
        } else if (!availability.coach_available) {
          toast.error('Coach is not available for the selected time');
        } else if (availability.rackets_available < formData.racket_count) {
          toast.error(`Only ${availability.rackets_available} rackets available`);
        } else if (availability.shoes_available < formData.shoes_count) {
          toast.error(`Only ${availability.shoes_available} shoes available`);
        }
        return;
      }

      await bookingsApi.create({
        user_id: user.id,
        court_id: formData.court_id,
        coach_id: formData.coach_id || null,
        start_time,
        end_time,
        racket_count: formData.racket_count,
        shoes_count: formData.shoes_count,
        base_price: priceCalculation.base_price,
        pricing_modifiers: priceCalculation.pricing_modifiers,
        equipment_fee: priceCalculation.equipment_fee,
        coach_fee: priceCalculation.coach_fee,
        total_price: priceCalculation.total_price
      });

      toast.success('Booking created successfully!');
      navigate('/my-bookings');
    } catch (error) {
      console.error('Failed to create booking:', error);
      const message = error instanceof Error ? error.message : 'Failed to create booking';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!user) {
      toast.error('Please login to join waitlist');
      return;
    }

    setIsSubmitting(true);

    try {
      const start_time = `${formData.date}T${formData.start_time}:00`;
      const end_time = `${formData.date}T${formData.end_time}:00`;

      const result = await waitlistApi.join({
        court_id: formData.court_id,
        start_time,
        end_time,
        coach_id: formData.coach_id || undefined,
        racket_count: formData.racket_count,
        shoes_count: formData.shoes_count
      });

      toast.success(`Joined waitlist! You are #${result.position} in queue`);
      await checkWaitlistPosition();
    } catch (error) {
      console.error('Failed to join waitlist:', error);
      const message = error instanceof Error ? error.message : 'Failed to join waitlist';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const racketEquipment = equipment.find(e => e.type === 'racket');
  const shoesEquipment = equipment.find(e => e.type === 'shoes');

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
          <h1 className="text-3xl font-bold mb-2">Book a Court</h1>
          <p className="text-muted-foreground">Select your preferred court, time, and additional resources</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>Fill in the details for your booking</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="court">Court *</Label>
                    <Select
                      value={formData.court_id}
                      onValueChange={(value) => setFormData({ ...formData, court_id: value })}
                      required
                    >
                      <SelectTrigger id="court">
                        <SelectValue placeholder="Select a court" />
                      </SelectTrigger>
                      <SelectContent>
                        {courts.map((court) => (
                          <SelectItem key={court.id} value={court.id}>
                            {court.name} ({court.type}) - ${court.base_price}/hr
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start-time">Start Time *</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-time">End Time *</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="coach">Coach (Optional)</Label>
                    <Select
                      value={formData.coach_id}
                      onValueChange={(value) => setFormData({ ...formData, coach_id: value })}
                    >
                      <SelectTrigger id="coach">
                        <SelectValue placeholder="No coach" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No coach</SelectItem>
                        {coaches.map((coach) => (
                          <SelectItem key={coach.id} value={coach.id}>
                            {coach.name} - ${coach.hourly_rate}/hr
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rackets">Rackets</Label>
                      <Input
                        id="rackets"
                        type="number"
                        min="0"
                        max={racketEquipment?.available_count || 0}
                        value={formData.racket_count}
                        onChange={(e) => setFormData({ ...formData, racket_count: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Available: {racketEquipment?.available_count || 0} | ${racketEquipment?.rental_price || 0} each
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shoes">Shoes</Label>
                      <Input
                        id="shoes"
                        type="number"
                        min="0"
                        max={shoesEquipment?.available_count || 0}
                        value={formData.shoes_count}
                        onChange={(e) => setFormData({ ...formData, shoes_count: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Available: {shoesEquipment?.available_count || 0} | ${shoesEquipment?.rental_price || 0} each
                      </p>
                    </div>
                  </div>

                  {waitlistPosition?.in_waitlist && (
                    <div className="p-4 bg-warning/10 border border-warning rounded-md">
                      <div className="flex items-center gap-2 text-warning-foreground">
                        <Users className="h-5 w-5" />
                        <p className="font-medium">You are in the waitlist</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Position: #{waitlistPosition.position} | Total waiting: {waitlistPosition.total_waiting}
                      </p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isSubmitting || !priceCalculation}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Booking...
                      </>
                    ) : (
                      'Confirm Booking'
                    )}
                  </Button>

                  {waitlistPosition && !waitlistPosition.in_waitlist && waitlistPosition.total_waiting > 0 && (
                    <div className="space-y-2">
                      <Separator />
                      <div className="p-4 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-2">Slot Full?</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {waitlistPosition.total_waiting} {waitlistPosition.total_waiting === 1 ? 'person is' : 'people are'} waiting. Join the waitlist to be notified when this slot becomes available.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={handleJoinWaitlist}
                          disabled={isSubmitting}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Join Waitlist
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Price Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCalculatingPrice ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : priceCalculation ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Base Price</span>
                        <span className="font-medium">${priceCalculation.base_price.toFixed(2)}</span>
                      </div>

                      {priceCalculation.pricing_modifiers.length > 0 && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Price Modifiers</p>
                            {priceCalculation.pricing_modifiers.map((modifier, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                  {modifier.rule_name}
                                  <Badge variant="secondary" className="text-xs">
                                    {modifier.type === 'multiplier' ? 'x' : '+'}
                                  </Badge>
                                </span>
                                <span className="font-medium text-secondary">
                                  +${modifier.amount.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {priceCalculation.equipment_fee > 0 && (
                        <>
                          <Separator />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Equipment Fee</span>
                            <span className="font-medium">${priceCalculation.equipment_fee.toFixed(2)}</span>
                          </div>
                        </>
                      )}

                      {priceCalculation.coach_fee > 0 && (
                        <>
                          <Separator />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Coach Fee</span>
                            <span className="font-medium">${priceCalculation.coach_fee.toFixed(2)}</span>
                          </div>
                        </>
                      )}

                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">${priceCalculation.total_price.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="pt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formData.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formData.start_time} - {formData.end_time}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Select booking details to see price
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
