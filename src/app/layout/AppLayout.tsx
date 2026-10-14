import { Outlet } from 'react-router';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from './OfflineBanner';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface font-body-md text-on-surface antialiased transition-colors duration-200">
      <Topbar />
      <OfflineBanner />

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <Sidebar />
        <main className="flex-1 min-w-0 pt-16 pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
