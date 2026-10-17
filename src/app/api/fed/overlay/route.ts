import { connection } from "next/server";
import { fedDb } from "@/lib/fed/db";
import { hopUrl } from "@/lib/fed/tokens";
import { secret, siteUrl } from "@/lib/fed/config";
import { ok } from "@/lib/fed/server";

/**
 * What the projector should overlay right now: the join QR, or Priya's hop QR once her hop has been asked.
 * Both are things the presenter chose to put on a big screen anyway.
 */
export async function GET() {
  await connection();
  const db = fedDb();
  const { data: stage } = await db.from("fed_events").select("text").eq("kind", "stage").order("id", { ascending: false }).limit(20);
  const flag = (prefix: string) => (stage ?? []).find((e) => e.text.startsWith(prefix))?.text.endsWith(":on") ?? false;
  const joinQr = flag("qr_join");
  const priyaOn = flag("qr_priya");

  let priyaLink: string | null = null;
  if (priyaOn) {
    const { data: priya } = await db.from("fed_directory").select("pid").eq("story_key", "priya").maybeSingle();
    if (priya) {
      const { data: hop } = await db
        .from("fed_hops")
        .select("id")
        .eq("to_pid", priya.pid)
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (hop) priyaLink = hopUrl(siteUrl(), secret("HOP_TOKEN_SECRET"), hop.id);
    }
  }
  return ok({ joinQr, priyaLink, siteUrl: siteUrl() });
}
