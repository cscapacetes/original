import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/paradise-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const text = await request.text();
        let payload: any = null;
        try {
          payload = JSON.parse(text);
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const txId =
          payload?.data?.id ??
          payload?.transaction?.id ??
          payload?.id ??
          payload?.transactionId ??
          null;
        const rawStatus =
          payload?.data?.status ?? payload?.transaction?.status ?? payload?.status ?? "";

        if (!txId) {
          console.warn("[paradise-webhook] missing transaction id", payload);
          return new Response("missing tx id", { status: 400 });
        }

        const norm = String(rawStatus).toLowerCase();
        let status: "pending" | "paid" | "expired" | "failed" = "pending";
        if (["paid", "approved", "completed", "succeeded"].includes(norm)) status = "paid";
        else if (["expired", "canceled", "cancelled"].includes(norm)) status = "expired";
        else if (["refused", "failed", "chargedback"].includes(norm)) status = "failed";

        const { error } = await supabaseAdmin
          .from("orders")
          .update({
            status,
            paid_at: status === "paid" ? new Date().toISOString() : null,
          })
          .eq("transaction_id", String(txId));

        if (error) {
          console.error("[paradise-webhook] update failed", error);
          return new Response("db error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
