import React from 'react';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';

interface DashboardProps {
  user: {
    name: string;
    role: 'admin' | 'contributor' | 'auditor' | 'manager';
  } | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  if (!user) return null;
  
  if (user.role === 'admin') {
    return <AdminDashboard user={user} />;
  }
  
  return <UserDashboard user={user} />;
};

export default Dashboard;

