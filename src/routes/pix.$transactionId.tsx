import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getOrderStatus } from "@/lib/checkout.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, Clock, ChevronLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pix/$transactionId")({
  component: PixPage,
  head: () => ({ meta: [{ title: "Pagamento PIX | CS Capacetes" }] }),
});

type OrderItem = { id: string; name: string; size?: string; price: number; qty: number; image?: string };

function PixPage() {
  const { transactionId } = Route.useParams();
  const checkStatus = useServerFn(getOrderStatus);
  const [order, setOrder] = useState<{
    qr_code_b64: string | null;
    pix_copy_paste: string | null;
    amount_cents: number;
    status: string;
    expires_at: string | null;
    items_json: OrderItem[] | null;
  } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("qr_code_b64, pix_copy_paste, amount_cents, status, expires_at, items_json")
        .eq("transaction_id", transactionId)
        .maybeSingle();
      if (mounted && data) setOrder(data as any);
    })();
    return () => {
      mounted = false;
    };
  }, [transactionId]);

  useEffect(() => {
    if (!order?.expires_at) return;
    const exp = new Date(order.expires_at).getTime();
    const tick = () => setSecondsLeft(Math.max(0, Math.floor((exp - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order?.expires_at]);

  useEffect(() => {
    if (!order || order.status !== "pending") return;
    const id = setInterval(async () => {
      try {
        const res = await checkStatus({ data: { transactionId } });
        if (res.status !== order.status) {
          setOrder((o) => (o ? { ...o, status: res.status } : o));
          if (res.status === "paid") {
            window.location.href = `/obrigado?t=${encodeURIComponent(transactionId)}`;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [order, transactionId, checkStatus]);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-muted-foreground">Carregando pedido...</p>
      </div>
    );
  }

  const copy = async () => {
    if (!order.pix_copy_paste) return;
    await navigator.clipboard.writeText(order.pix_copy_paste);
    toast.success("Código PIX copiado!");
  };

  const mins = secondsLeft != null ? Math.floor(secondsLeft / 60) : null;
  const secs = secondsLeft != null ? secondsLeft % 60 : null;
  const items = (order.items_json || []) as OrderItem[];
  const fmt = (c: number) =>
    (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-white max-w-[480px] mx-auto pb-10">
      <header className="sticky top-0 z-30 bg-white border-b flex items-center px-3 h-14 relative">
        <Link to="/" className="p-1 absolute left-3">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="w-full text-center">
          <h1 className="font-semibold text-base">Pagamento PIX</h1>
          <p className="text-emerald-600 text-xs flex items-center justify-center gap-1 mt-0.5">
            <ShieldCheck className="w-3 h-3" /> Aprovação instantânea
          </p>
        </div>
      </header>

      <div className="px-4 pt-4">
        <p className="text-sm text-center text-muted-foreground">
          Escaneie o QR Code ou copie o código PIX para pagar
        </p>
      </div>

      {order.status === "paid" ? (
        <div className="m-4 bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
          <p className="font-semibold text-emerald-800">Pagamento confirmado!</p>
          <Button asChild className="mt-4">
            <Link to="/obrigado" search={{ t: transactionId }}>Continuar</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mx-4 mt-3 border rounded-2xl p-4 bg-white">
            {order.qr_code_b64 && (
              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${order.qr_code_b64}`}
                  alt="QR Code PIX"
                  className="w-64 h-64"
                />
              </div>
            )}
            <div className="text-center mt-3">
              <div className="text-2xl font-bold">{fmt(order.amount_cents)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Pagamento via PIX • Aprovação instantânea
              </div>
            </div>

            {order.pix_copy_paste && (
              <>
                <div className="mt-4 bg-muted/40 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground text-center mb-1">
                    Código PIX Copia e Cola:
                  </div>
                  <div className="text-[11px] break-all leading-snug font-mono">
                    {order.pix_copy_paste}
                  </div>
                </div>
                <button
                  onClick={copy}
                  className="mt-3 w-full h-12 rounded-full bg-black text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" /> Copiar código PIX
                </button>
              </>
            )}

            {secondsLeft != null && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-3">
                <Clock className="w-3.5 h-3.5" />
                Este código expira em {mins}:{String(secs).padStart(2, "0")} minutos
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="mx-4 mt-4 border rounded-2xl p-4">
              <h3 className="font-semibold mb-3">Resumo do pedido</h3>
              <ul className="space-y-3">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3">
                    {i.image ? (
                      <img src={i.image} alt={i.name} className="w-14 h-14 object-contain bg-muted/30 rounded" />
                    ) : (
                      <div className="w-14 h-14 rounded bg-muted/30" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-snug line-clamp-2">{i.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {i.size ? `Tam: ${i.size} • ` : ""}Qtd: {i.qty}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{fmt(i.price * i.qty)}</div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-semibold pt-3 mt-3 border-t">
                <span>Total</span>
                <span>{fmt(order.amount_cents)}</span>
              </div>
            </div>
          )}

          <ol className="mt-4 mx-4 text-sm text-muted-foreground list-decimal pl-5 space-y-1">
            <li>Abra o app do seu banco</li>
            <li>Selecione PIX → Pagar com QR Code ou Copia e Cola</li>
            <li>Confirme o pagamento</li>
            <li>Aguarde nesta tela — confirmação é automática</li>
          </ol>
        </>
      )}
    </div>
  );
}
