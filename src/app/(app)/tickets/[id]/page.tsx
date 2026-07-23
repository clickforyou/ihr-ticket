import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TicketDetail } from "@/components/ticket/ticket-detail";
import type {
  Ticket,
  Profile,
  Label,
  Comment,
  Activity,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TicketPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("tickets")
    .select(
      `id, project_id, title, description, status, priority, assignee_id, reporter_id, due_date, position, created_at, updated_at,
       project:projects(id, name, key, description, color, created_at),
       assignee:profiles!tickets_assignee_id_fkey(id, full_name, avatar_url, role),
       reporter:profiles!tickets_reporter_id_fkey(id, full_name, avatar_url, role),
       ticket_labels(label:labels(id, project_id, name, color)),
       attachments(id, ticket_id, file_path, file_name, mime_type, size, created_at)`,
    )
    .eq("id", id)
    .single();

  if (!raw) notFound();

  const [membersRes, labelsRes, commentsRes, activityRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url, role"),
    supabase.from("labels").select("id, project_id, name, color"),
    supabase
      .from("comments")
      .select(
        "id, ticket_id, author_id, body, created_at, author:profiles(id, full_name, avatar_url, role)",
      )
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("activity")
      .select(
        "id, ticket_id, actor_id, action, meta, created_at, actor:profiles(id, full_name, avatar_url, role)",
      )
      .eq("ticket_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const r = raw as unknown as Ticket & {
    ticket_labels?: { label: Label | null }[];
  };
  const ticket: Ticket = {
    ...r,
    labels: (r.ticket_labels ?? [])
      .map((tl) => tl.label)
      .filter((l): l is Label => Boolean(l)),
  };

  return (
    <TicketDetail
      ticket={ticket}
      members={(membersRes.data as Profile[]) ?? []}
      allLabels={(labelsRes.data as Label[]) ?? []}
      comments={(commentsRes.data as unknown as Comment[]) ?? []}
      activity={(activityRes.data as unknown as Activity[]) ?? []}
    />
  );
}
