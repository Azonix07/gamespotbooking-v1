import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import GameSpotLoader from '@/components/GameSpotLoader';

const AdminDashboardClient = dynamic(() => import('./AdminDashboardClient'), {
  loading: () => <GameSpotLoader variant="admin" />,
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'GameSpot Admin Dashboard - Manage bookings, users, memberships, and system settings.',
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
