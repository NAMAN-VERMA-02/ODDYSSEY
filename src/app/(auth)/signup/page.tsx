import Link from "next/link";
import { ROLES } from "@/lib/validation/auth";
import { signup } from "../actions";
import { AuthForm, Field, SelectField } from "../form";

export const metadata = { title: "Join KAL" };

export default function SignupPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="mb-2 text-4xl font-black uppercase tracking-tight">Join KAL</h1>
      <p className="mb-8 text-[var(--muted)]">Use your college email. You must be 18 or older.</p>

      <AuthForm action={signup} submitLabel="Create account">
        <Field label="Full name" name="fullName" autoComplete="name" required />
        <Field label="College email" name="email" type="email" autoComplete="email" required />
        <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={10} required />
        <SelectField label="I am a" name="role" options={ROLES} defaultValue="student" required />
        <Field label="Branch" name="branch" required />
        <Field label="Batch (graduation year)" name="batch" type="number" inputMode="numeric" min={1990} max={2100} required />
        <Field label="Date of birth" name="dob" type="date" autoComplete="bday" required />
      </AuthForm>

      <p className="mt-6 text-sm">
        Already a member? <Link href="/login" className="underline">Log in</Link>
      </p>
    </main>
  );
}
