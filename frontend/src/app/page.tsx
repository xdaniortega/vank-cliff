'use client';

import { useEffect, useState } from 'react';
import AppBar from '@/components/AppBar';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import AuthGuard from '@/components/AuthGuard';
import { useResponsive } from '@/hooks/useResponsive';
import { fetchDashboardData, DashboardData } from '@/api/api_calls';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const { isMobile } = useResponsive();
  
  const [dataState, setDataState] = useState<{
    isLoading: boolean;
    data: DashboardData | null;
    isHardcoded: boolean;
  }>({
    isLoading: true,
    data: null,
    isHardcoded: false
  });

  useEffect(() => {
    // Use centralized API call for dashboard data
    fetchDashboardData()
      .then((dashboardData) => {
        setDataState({
          isLoading: false,
          data: dashboardData,
          isHardcoded: false
        });
      })
      .catch((error) => {
        console.error('Error fetching dashboard data:', error);
        setDataState({
          isLoading: false,
          data: null,
          isHardcoded: false
        });
      });
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