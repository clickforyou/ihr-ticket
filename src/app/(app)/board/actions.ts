"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TicketStatus, TicketPriority } from "@/lib/types";

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function createTicket(input: {
  project_id: string;
  title: string;
  description?: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignee_id?: string | null;
  due_date?: string | null;
  label_ids?: string[];
  attachments?: {
    file_path: string;
    file_name: string;
    mime_type: string;
    size: number;
  }[];
}) {
  const { supabase, userId } = await currentUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      project_id: input.project_id,
      title: input.title,
      description: input.description || null,
      priority: input.priority,
      status: input.status,
      assignee_id: input.assignee_id || null,
      reporter_id: userId,
      due_date: input.due_date || null,
    })
    .select("id")
    .single();

  if (error || !ticket) return { error: error?.message ?? "insert failed" };

  if (input.label_ids?.length) {
    await supabase
      .from("ticket_labels")
      .insert(input.label_ids.map((label_id) => ({ ticket_id: ticket.id, label_id })));
  }

  if (input.attachments?.length) {
    await supabase.from("attachments").insert(
      input.attachments.map((a) => ({
        ticket_id: ticket.id,
        uploaded_by: userId,
        ...a,
      })),
    );
  }

  await supabase.from("activity").insert({
    ticket_id: ticket.id,
    actor_id: userId,
    action: "created",
  });

  revalidatePath("/board");
  revalidatePath(`/tickets/${ticket.id}`);
  return { id: ticket.id };
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
  const { supabase, userId } = await currentUserId();
  if (!userId) return { error: "unauthorized" };

  const { error } = await supabase.from("tickets").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("activity").insert({
    ticket_id: id,
    actor_id: userId,
    action: "status_changed",
    meta: { status },
  });

  revalidatePath("/board");
  revalidatePath(`/tickets/${id}`);
  return { ok: true };
}

export async function updateTicket(
  id: string,
  patch: Partial<{
    title: string;
    description: string | null;
    status: TicketStatus;
    priority: TicketPriority;
    assignee_id: string | null;
    due_date: string | null;
  }>,
) {
  const { supabase, userId } = await currentUserId();
  if (!userId) return { error: "unauthorized" };

  const { error } = await supabase.from("tickets").update(patch).eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("activity").insert({
    ticket_id: id,
    actor_id: userId,
    action: "updated",
    meta: patch as Record<string, unknown>,
  });

  revalidatePath("/board");
  revalidatePath(`/tickets/${id}`);
  return { ok: true };
}

export async function deleteTicket(id: string) {
  const { supabase, userId } = await currentUserId();
  if (!userId) return { error: "unauthorized" };
  const { error } = await supabase.from("tickets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/board");
  return { ok: true };
}

export async function addComment(ticketId: string, body: string) {
  const { supabase, userId } = await currentUserId();
  if (!userId) return { error: "unauthorized" };
  if (!body.trim()) return { error: "empty" };

  const { error } = await supabase
    .from("comments")
    .insert({ ticket_id: ticketId, author_id: userId, body: body.trim() });
  if (error) return { error: error.message };

  await supabase.from("activity").insert({
    ticket_id: ticketId,
    actor_id: userId,
    action: "commented",
  });

  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true };
}
