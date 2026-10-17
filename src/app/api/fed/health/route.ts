import { connection } from "next/server";
import { NODE_IDS, NODE_META } from "@/lib/fed/config";
import { fedDb } from "@/lib/fed/db";
import { nodeHealth } from "@/lib/fed/nodes";
import { ensureNodes, ok } from "@/lib/fed/server";

/**
 * Pings both college nodes and records their state. The open /live and /stage screens call this
 * every few seconds, which is the heartbeat (Vercel has no background worker).
 */
export async function GET() {
  await connection();
  await ensureNodes();
  const checks = await Promise.all(NODE_IDS.map(nodeHealth));
  const db = fedDb();
  await Promise.all(
    checks.map((c) =>
      db
        .from("fed_nodes")
        .update({
          status: !c.reachable ? "offline" : c.hubAccess ? "online" : "revoked",
          latency_ms: c.reachable ? c.ms : null,
          people_count: c.people,
          ...(c.reachable ? { last_seen: new Date().toISOString() } : {}),
        })
        .eq("id", c.node),
    ),
  );
  return ok({
    nodes: checks.map((c) => ({
      id: c.node,
      name: NODE_META[c.node].name,
      city: NODE_META[c.node].city,
      status: !c.reachable ? "offline" : c.hubAccess ? "online" : "revoked",
      latencyMs: c.reachable ? c.ms : null,
      people: c.people,
    })),
    time: new Date().toISOString(),
  });
}
