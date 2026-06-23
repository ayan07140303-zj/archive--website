import React from 'react';
import PortalPage from './PortalPage';

interface UserDashboardProps {
  user: { name: string; role: 'admin' | 'contributor' | 'auditor' | 'manager' };
}

const UserDashboard: React.FC<UserDashboardProps> = () => {
  return <PortalPage />;
};

export default UserDashboard;
