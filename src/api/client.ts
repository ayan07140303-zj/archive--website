const BASE_URL = '/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string };
  pagination?: { page: number; pageSize: number; total: number; totalPages: number };
}

function getToken(): string | null {
  const auth = localStorage.getItem('auth');
  return auth ? JSON.parse(auth).token : null;
}

/** 供需直接操作 FormData 的组件使用 */
export { getToken };

/** 直接提交 FormData（announcement 管理等需要混合字段+文件的场景） */
async function uploadFormData<T = any>(path: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: formData });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export function setAuth(token: string, user: Record<string, unknown>): void {
  localStorage.setItem('auth', JSON.stringify({ token, user }));
}

export function clearAuth(): void {
  localStorage.removeItem('auth');
}

export function getStoredUser(): Record<string, unknown> | null {
  const auth = localStorage.getItem('auth');
  if (!auth) return null;
  try {
    return JSON.parse(auth).user;
  } catch {
    return null;
  }
}

async function request<T = any>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

/** 文件上传（FormData），支持额外字段 */
async function uploadFiles<T = any>(path: string, files: File[], extraFields?: Record<string, string>): Promise<ApiResponse<T>> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  if (extraFields) {
    Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
  }

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: formData });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: <T = any>(path: string) => request<T>('GET', path),
  post: <T = any>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T = any>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T = any>(path: string) => request<T>('DELETE', path),
  upload: <T = any>(path: string, files: File[], extraFields?: Record<string, string>) => uploadFiles<T>(path, files, extraFields),
  uploadForm: <T = any>(path: string, formData: FormData, method: 'POST' | 'PUT' = 'POST') => uploadFormData<T>(path, formData, method),
};
