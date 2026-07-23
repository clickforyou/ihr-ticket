"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, signup } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full h-11" disabled={pending}>
      {pending && <Loader2 size={16} className="animate-spin" />}
      {label}
    </Button>
  );
}

type State = { error?: string; ok?: string } | null;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useActionState<State, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {mode === "signup" && (
        <Field
          label="ชื่อ-นามสกุล"
          name="full_name"
          type="text"
          placeholder="สมชาย ใจดี"
          required
        />
      )}
      <Field
        label="อีเมล"
        name="email"
        type="email"
        placeholder="you@company.com"
        required
      />
      <Field
        label="รหัสผ่าน"
        name="password"
        type="password"
        placeholder="••••••••"
        required
      />

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.ok}
        </p>
      )}

      <SubmitButton label={mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"} />
    </form>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}
