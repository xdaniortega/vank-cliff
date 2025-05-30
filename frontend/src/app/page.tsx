'use client';

import { useEffect, useState } from 'react';
import AppBar from '@/components/AppBar';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import AuthGuard from '@/components/AuthGuard';
import { useResponsive } from '@/hooks/useResponsive';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const { isMobile } = useResponsive();
  
  const [dataState, setDataState] = useState<{
    isLoading: boolean;
    data: any;
    isHardcoded: boolean;
  }>({
    isLoading: true,
    data: null,
    isHardcoded: false
  });

  useEffect(() => {
    // Simulate API loading delay
    const timer = setTimeout(() => {
      setDataState({
        isLoading: false,
        data: {
          // Simulated loaded data
          dashboardStats: {
            totalUsers: 1087,
            activeProjects: 32,
            completedTasks: 756,
            revenue: '$98,230'
          },
          projects: [
            { id: 1, name: 'Blockchain Explorer', status: 'active', progress: 60 },
            { id: 2, name: 'Smart Contract Audit', status: 'completed', progress: 100 }
          ],
          notifications: [
            { id: 1, message: 'System update completed', time: '5 minutes ago' }
          ]
        },
        isHardcoded: false
      });
    }, 1500); // 1.5 second delay to show loading

    return () => clearTimeout(timer);
  }, []);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  return (
    <AuthGuard>
      <div style={{
        minHeight: '100vh',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
      }}>
        <AppBar 
          onMenuToggle={handleMenuToggle}
          isMobile={isMobile}
        />
        
        <Sidebar
          isOpen={sidebarOpen}
          isMobile={isMobile}
          onClose={handleSidebarClose}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
        
        <MainContent
          activeSection={activeSection}
          isMobile={isMobile}
        />
      </div>
    </AuthGuard>
  );
} 