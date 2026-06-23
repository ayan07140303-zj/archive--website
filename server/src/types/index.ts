// ─── 枚举 ───
export type UserRole = 'admin' | 'contributor' | 'auditor' | 'manager';
export type CaseStatus = 'open' | 'pending' | 'completed' | 'archived' | 'flagged';
export type CasePriority = 'low' | 'medium' | 'high';

// ─── JWT Payload ───
export interface JwtPayload {
  userId: string;
  role: UserRole;
}

// ─── API 响应 ───
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedData<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ─── 请求中的用户扩展 ───
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
