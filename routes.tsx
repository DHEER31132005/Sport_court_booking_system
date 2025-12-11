import Home from './pages/Home';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';
import Admin from './pages/Admin';
import Login from './pages/Login';
import type { ReactNode } from 'react';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  adminOnly?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <Home />,
    visible: true
  },
  {
    name: 'Book Court',
    path: '/booking',
    element: <Booking />,
    visible: true
  },
  {
    name: 'My Bookings',
    path: '/my-bookings',
    element: <MyBookings />,
    visible: true
  },
  {
    name: 'Admin',
    path: '/admin',
    element: <Admin />,
    visible: true,
    adminOnly: true
  },
  {
    name: 'Login',
    path: '/login',
    element: <Login />,
    visible: false
  }
];

export default routes