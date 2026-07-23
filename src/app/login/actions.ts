"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function login(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/board");
}

export async function signup(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (password.length < 6)
    return { error: "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return { error: error.message };

  // ถ้าปิด email confirmation ไว้ จะได้ session เลย → เข้าใช้งานได้ทันที
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/board");
  }

  return {
    ok: "สมัครสำเร็จ! กรุณายืนยันอีเมลของคุณ แล้วกลับมาเข้าสู่ระบบ",
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
