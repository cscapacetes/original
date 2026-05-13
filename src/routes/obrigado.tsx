import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { getOrderStatus } from "@/lib/checkout.functions";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WHATSAPP = "5511999456792";

export const Route = createFileRoute("/obrigado")({
  validateSearch: z.object({ t: z.string().optional() }),
  component: ObrigadoPage,
  head: () => ({ meta: [{ title: "Obrigado pela compra | CS Capacetes" }] }),
});

function ObrigadoPage() {
  const { t } = Route.useSearch();
  const checkStatus = useServerFn(getOrderStatus);
  const [status, setStatus] = useState<string>("pending");
  const [customer, setCustomer] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (!t) return;
    let stopped = false;
    const tick = async () => {
      try {
        const res = await checkStatus({ data: { transactionId: t } });
        if (stopped) return;
        setStatus(res.status);
        setCustomer({ name: res.customer_name });
        if (res.status === "paid") return; // stop polling
        setTimeout(tick, 4000);
      } catch {
        if (!stopped) setTimeout(tick, 6000);
      }
    };
    tick();
    return () => {
      stopped = true;
    };
  }, [t, checkStatus]);

  if (!t) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-muted-foreground mb-4">Pedido não identificado.</p>
          <Button asChild>
            <Link to="/">Voltar à loja</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isPaid = status === "paid";

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {isPaid ? (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Pagamento confirmado!</h1>
            <p className="text-muted-foreground mb-6">
              {customer?.name ? `Obrigado, ${customer.name.split(" ")[0]}! ` : ""}
              Recebemos seu pedido. Nossa equipe entrará em contato em breve via WhatsApp para
              confirmar os detalhes da entrega.
            </p>
            <Button
              asChild
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                  `Olá! Acabei de finalizar o pedido ${t} e gostaria de confirmar os detalhes da entrega.`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Falar com a equipe no WhatsApp
              </a>
            </Button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Aguardando confirmação...</h1>
            <p className="text-muted-foreground mb-2">
              Estamos confirmando seu pagamento. Esta página atualiza automaticamente assim que o
              PIX for identificado.
            </p>
            <p className="text-xs text-muted-foreground mb-6">Pedido #{t.slice(0, 8)}</p>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/pix/$transactionId" params={{ transactionId: t }}>
                Ver código PIX novamente
              </Link>
            </Button>
          </>
        )}

        <p className="text-xs text-muted-foreground mt-6">
          Em caso de dúvidas, fale com a gente no WhatsApp{" "}
          <a className="underline" href={`https://wa.me/${WHATSAPP}`}>
            +55 11 99945-6792
          </a>
        </p>
      </div>
    </div>
  );
}
