import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, DollarSign, Users } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Book courts, equipment, and coaches in just a few clicks'
    },
    {
      icon: Clock,
      title: 'Real-Time Availability',
      description: 'See available time slots instantly with conflict detection'
    },
    {
      icon: DollarSign,
      title: 'Dynamic Pricing',
      description: 'Transparent pricing with automatic calculation of peak hours and premiums'
    },
    {
      icon: Users,
      title: 'Professional Coaches',
      description: 'Book experienced coaches to improve your game'
    }
  ];

  return (
    <div className="min-h-screen bg-muted">
      <section className="relative py-32 px-4 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://media.istockphoto.com/id/1176735816/photo/blue-tennis-court-and-illuminated-indoor-arena-with-fans-upper-front-view.jpg?s=2048x2048&w=is&k=20&c=nDv7RaHrkqPOvVPpTyPAC6W85qGC1aVxdQaHyNdo--s=)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95" />
        </div>
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
            Book Your Sports Court Today
          </h1>
          <p className="text-xl text-foreground mb-8 max-w-2xl mx-auto">
            Professional sports facility booking platform with multi-resource scheduling and dynamic pricing
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/booking">
              <Button size="lg" className="shadow-elegant">
                Book a Court
              </Button>
            </Link>
            <Link to="/my-bookings">
              <Button size="lg" variant="outline">
                View My Bookings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover">
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-card">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of players who trust our platform for their sports facility bookings
          </p>
          <Link to="/booking">
            <Button size="lg" className="shadow-elegant">
              Start Booking Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
