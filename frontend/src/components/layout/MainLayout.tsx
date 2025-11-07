import { ReactNode } from 'react';
import BottomNavigation from '../navigation/BottomNavigation';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <BottomNavigation />

      {/* Main Content */}
      <div className="md:pl-64 pb-16 md:pb-0">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
