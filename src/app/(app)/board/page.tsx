import { createClient } from "@/lib/supabase/server";
import { BoardView } from "@/components/board/board-view";
import type { Ticket, Project, Profile, Label } from "@/lib/types";

export const dynamic = "force-dynamic";

type RawTicket = Omit<Ticket, "labels"> & {
  ticket_labels?: { label: Label | null }[];
};

export default async function BoardPage(props: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectFilter } = await props.searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [projectsRes, membersRes, labelsRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, key, description, color, created_at")
      .order("created_at"),
    supabase.from("profiles").select("id, full_name, avatar_url, role"),
    supabase.from("labels").select("id, project_id, name, color"),
  ]);

  let query = supabase
    .from("tickets")
    .select(
      `id, project_id, title, description, status, priority, assignee_id, reporter_id, due_date, position, created_at, updated_at,
       assignee:profiles!tickets_assignee_id_fkey(id, full_name, avatar_url, role),
       ticket_labels(label:labels(id, project_id, name, color)),
       attachments(id, ticket_id, file_path, file_name, mime_type, size, created_at)`,
    )
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (projectFilter) query = query.eq("project_id", projectFilter);

  const { data: rawTickets } = await query;

  const tickets: Ticket[] = ((rawTickets as unknown as RawTicket[]) ?? []).map(
    (t) => ({
      ...t,
      labels: (t.ticket_labels ?? [])
        .map((tl) => tl.label)
        .filter((l): l is Label => Boolean(l)),
    }),
  );

  return (
    <BoardView
      projects={(projectsRes.data as Project[]) ?? []}
      members={(membersRes.data as Profile[]) ?? []}
      labels={(labelsRes.data as Label[]) ?? []}
      initialTickets={tickets}
      activeProject={projectFilter ?? null}
      currentUserId={user?.id ?? null}
    />
  );
}
