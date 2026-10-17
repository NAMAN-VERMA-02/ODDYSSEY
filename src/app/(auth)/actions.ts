"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  emailMatchesCollege,
  loginSchema,
  signupSchema,
  type AuthFormState,
} from "@/lib/validation/auth";

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const { fullName, email, password, role, branch, batch } = parsed.data;

  const supabase = await createClient();

  const { data: colleges, error: collegeError } = await supabase
    .from("colleges")
    .select("email_domain");
  if (collegeError) return { message: "Something went wrong. Please try again." };

  if (!emailMatchesCollege(email, (colleges ?? []).map((c) => c.email_domain))) {
    return { errors: { email: ["Use your college email address to join SETU"] } };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      // The date of birth is checked here and discarded; only the 18+ confirmation is kept.
      data: { full_name: fullName, role, branch, batch, age_confirmed: true },
    },
  });
  if (error) return { message: "We could not create your account. Please try again." };

  // Same response whether or not the address was already registered.
  return { ok: true, message: "Check your college inbox for a link to confirm your email." };
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (/not confirmed/i.test(error.message)) {
      return { message: "Confirm your college email first — check your inbox for the link." };
    }
    // SETU only has college accounts: say so when the address could never have one.
    const { data: colleges } = await supabase.from("colleges").select("email_domain");
    if (!emailMatchesCollege(parsed.data.email, (colleges ?? []).map((c) => c.email_domain))) {
      return { message: "SETU is for college emails. Log in with your college address, or join with it." };
    }
    return { message: "Invalid email or password." };
  }
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
