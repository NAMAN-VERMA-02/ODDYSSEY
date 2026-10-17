import { Suspense } from "react";
import Link from "next/link";
import { login } from "../actions";
import { AuthForm, Field } from "../form";

export const metadata = { title: "Log in" };

async function LinkError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p role="alert" className="mb-4 text-sm text-[var(--red)]">
      We could not finish setting up your account. Confirm with your college email and try again.
    </p>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="mb-8 text-4xl font-black uppercase tracking-tight">Log in</h1>

      <Suspense>
        <LinkError searchParams={searchParams} />
      </Suspense>

      <AuthForm action={login} submitLabel="Log in">
        <Field label="College email" name="email" type="email" autoComplete="email" required />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      </AuthForm>

      <p className="mt-6 text-sm">
        New here? <Link href="/signup" className="underline">Join KAL</Link>
      </p>
    </main>
  );
}
