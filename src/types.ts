import { LucideIcon } from 'lucide-react';

export type Status = 'open' | 'pending' | 'completed' | 'archived' | 'flagged';

export interface Case {
  id: string;
  title: string;
  category: string;
  status: Status;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  assignee: {
    name: string;
    avatar: string;
  };
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'auditor' | 'manager' | 'contributor';
  organization: string;
  avatar?: string;
}
