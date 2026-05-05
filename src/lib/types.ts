export type UserRole = 'worker' | 'employer';

export interface WorkExperience {
  title: string;
  company: string;
  period: string;
  description: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  rating: number;
  verified: boolean;
  level: number;
  xp: number;
  jobs_done: number;
  hours_logged: number;
  punctuality: number;
  total_earned: number;
  created_at: string;
  company_name?: string | null;
  skills?: string[];
  experience?: WorkExperience[];
  education?: string | null;
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  company: string;
  location: string;
  lat: number | null;
  lng: number | null;
  distance?: string;
  pay: number;
  pay_unit: string;
  tips: boolean;
  date: string;
  time_start: string;
  time_end: string;
  duration: string;
  description: string;
  requirements: string[];
  tags: string[];
  image_url: string;
  status: 'active' | 'filled' | 'expired';
  created_at: string;
}

export interface Match {
  id: string;
  worker_id: string;
  job_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  job?: Job;
  worker?: UserProfile;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  match_id: string | null;
  rating: number;
  text: string;
  created_at: string;
  reviewer?: UserProfile;
}
