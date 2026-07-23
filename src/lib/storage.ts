import { createClient } from "@/lib/supabase/client";

export const ATTACHMENT_BUCKET = "ticket-attachments";

export function publicUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${ATTACHMENT_BUCKET}/${path}`;
}

/** Upload a file to the attachments bucket. Returns metadata for the DB row. */
export async function uploadAttachment(file: File) {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const rand = crypto.randomUUID();
  const path = `${new Date().getFullYear()}/${rand}.${ext}`;

  const { error } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  return {
    file_path: path,
    file_name: file.name,
    mime_type: file.type || "application/octet-stream",
    size: file.size,
  };
}
