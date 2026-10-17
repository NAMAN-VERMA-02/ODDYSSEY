import Link from "next/link";
import { PayItForwardView } from "./payitforward-view";

export const metadata = { title: "Pay it forward" };

export default function PayItForwardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <p className="mb-2 text-sm">
        <Link href="/dashboard" className="underline">
          Dashboard
        </Link>
      </p>
      <h1 className="mb-8 text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl">
        Pay it
        <br className="hidden sm:block" /> forward ×3
      </h1>
      <PayItForwardView />
    </main>
  );
}
