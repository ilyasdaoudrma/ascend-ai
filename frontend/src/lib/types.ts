export interface Profile {
  gender: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  body_fat_pct: number | null;
  activity_level: string;
  experience: string;
  goal: string;
  weekly_training_days: number;
  gym_access: boolean;
  equipment: string[];
  sleep_average_hours: number;
  dietary_preference: string;
  bmi: number | null;
  bmr: number | null;
  tdee: number | null;
  maintenance_calories: number | null;
  recommended_calories: number | null;
  protein_target_g: number | null;
  carbs_target_g: number | null;
  fat_target_g: number | null;
  water_target_ml: number | null;
  sleep_target_hours: number | null;
  bio: string;
  country: string;
  accent_color: string;
  avatar: string | null;
  banner: string | null;
  is_public: boolean;
  onboarding_completed: boolean;
  is_premium: boolean;
}

export interface User {
  id: number;
  email: string;
  username: string | null;
  full_name: string;
  is_staff: boolean;
  date_joined: string;
  profile: Profile;
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface Checkin {
  id: number;
  date: string;
  weight_kg: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  water_ml: number | null;
  sleep_hours: number | null;
  workout_completed: boolean;
  mood: string;
  energy_level: number | null;
  notes: string;
  daily_score: number;
}

export interface WorkoutItem {
  id: number;
  exercise: { id: number; name: string; muscle_group: string };
  order: number;
  sets: number;
  reps: string;
  rest_seconds: number;
}

export interface Workout {
  id: number;
  name: string;
  slug: string;
  category: string;
  level: string;
  description: string;
  estimated_minutes: number;
  items: WorkoutItem[];
}

export interface SetLog {
  id: number;
  exercise: number;
  exercise_name: string;
  exercise_muscle: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  completed: boolean;
}

export interface WorkoutSession {
  id: number;
  workout: number | null;
  status: "in_progress" | "completed" | "abandoned";
  started_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
  total_volume_kg: number;
  notes: string;
  set_logs: SetLog[];
  rewards?: {
    xp_awarded: number;
    unlocked: { code: string; name: string; xp_reward: number }[];
  };
}

export interface Recommendation {
  category: "nutrition" | "workout" | "recovery" | "general";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
}

export interface Goal {
  id: number;
  goal_type: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  due_date: string | null;
  is_completed: boolean;
  progress_pct: number;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---- Social ----
export interface SocialUser {
  id: number;
  username: string | null;
  full_name: string;
  avatar: string | null;
  accent_color: string;
}

export interface Post {
  id: number;
  author: SocialUser;
  post_type: string;
  content: string;
  image_url: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

export interface Comment {
  id: number;
  author: SocialUser;
  content: string;
  created_at: string;
}

export interface SocialNotification {
  id: number;
  kind: string;
  message: string;
  link: string;
  is_read: boolean;
  actor: SocialUser | null;
  created_at: string;
}

export interface LeaderboardEntry {
  user: SocialUser;
  value: number;
  level: number;
  rank: number;
  is_me: boolean;
}

export interface PublicProfile {
  id: number;
  username: string;
  full_name: string;
  date_joined: string;
  avatar: string | null;
  banner: string | null;
  profile: {
    is_public: boolean;
    bio: string;
    country: string;
    accent_color: string;
    goal?: string;
    experience?: string;
    weight_kg?: number | null;
  };
  stats: {
    followers: number;
    following: number;
    workouts: number;
    xp: number;
    level: number;
    streak: number;
    achievements: number;
  };
  is_following: boolean;
}

export interface Challenge {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: string;
  target_value: number;
  unit: string;
  participant_count: number;
  joined: boolean;
  my_progress: number;
}

export interface Friendship {
  id: number;
  from_user: SocialUser;
  to_user: SocialUser;
  status: string;
  created_at: string;
}

export interface ChatRoom {
  id: number;
  other_user: SocialUser | null;
  last_message: string;
  unread: number;
  updated_at: string;
}

export interface Message {
  id: number;
  sender: SocialUser;
  content: string;
  is_read: boolean;
  is_mine: boolean;
  created_at: string;
}

export interface Group {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  member_count: number;
  joined: boolean;
  created_at: string;
}

export interface ActivityEvent {
  id: number;
  actor: SocialUser;
  verb: string;
  text: string;
  created_at: string;
}

export interface GroupMessage {
  id: number;
  sender: SocialUser;
  content: string;
  is_mine: boolean;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "coach";
  content: string;
}

export interface AdminUser {
  id: number;
  email: string;
  username: string | null;
  full_name: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  banned_until: string | null;
  ban_reason: string;
  is_banned: boolean;
  goal: string;
}
