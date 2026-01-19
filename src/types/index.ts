export type UserRole = 'employee' | 'manager' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  department: string;
  avatar_url?: string;
  organization_id?: string;
  status?: 'active' | 'suspended';
  created_at: string;
}

export type RequestStatus = 'draft' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'changes_requested';

export interface AuditRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  amount: number;
  total_amount: number;
  status: RequestStatus;
  employee_id: string;
  department: string;
  attachments: string[];
  file_urls?: string[];
  ai_summary?: string;
  ai_completeness_score?: number;
  ai_feedback?: string[];
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  request_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface ActivityTrace {
  id: string;
  request_id: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
}
