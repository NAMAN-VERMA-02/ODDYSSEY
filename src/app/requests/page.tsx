import Link from "next/link";
import { RequestsView } from "./requests-view";

export const metadata = { title: "Requests" };

export default function RequestsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <p className="mb-2 text-sm">
        <Link href="/dashboard" className="underline">
          Dashboard
        </Link>
        {" · "}
        <Link href="/matches" className="underline">
          Matches
        </Link>
      </p>
      <h1 className="mb-8 text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl">Requests</h1>
      <RequestsView />
    </main>
  );
}
