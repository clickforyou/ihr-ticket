export type TicketStatus = "todo" | "in_progress" | "in_review" | "done";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type UserRole = "admin" | "dev" | "member";

export const STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

export const PRIORITIES: {
  value: TicketPriority;
  label: string;
  color: string;
  dot: string;
}[] = [
  { value: "urgent", label: "Urgent", color: "text-red-600", dot: "bg-red-500" },
  { value: "high", label: "High", color: "text-orange-600", dot: "bg-orange-500" },
  { value: "medium", label: "Medium", color: "text-amber-600", dot: "bg-amber-500" },
  { value: "low", label: "Low", color: "text-slate-500", dot: "bg-slate-400" },
];

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  color: string;
  created_at: string;
}

export interface Label {
  id: string;
  project_id: string | null;
  name: string;
  color: string;
}

export interface Attachment {
  id: string;
  ticket_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
}

export interface Comment {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: Profile;
}

export interface Activity {
  id: string;
  ticket_id: string;
  actor_id: string;
  action: string;
  meta: Record<string, unknown> | null;
  created_at: string;
  actor?: Profile;
}

export interface Ticket {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assignee_id: string | null;
  reporter_id: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  // joined
  project?: Project;
  assignee?: Profile | null;
  reporter?: Profile | null;
  labels?: Label[];
  attachments?: Attachment[];
}
