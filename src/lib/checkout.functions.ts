import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createPixCharge, getTransactionStatus } from "./paradise.server";

const ItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  variant: z.string().max(120).optional(),
  size: z.string().max(40).optional(),
  price: z.number().int().min(1).max(10_000_00),
  qty: z.number().int().min(1).max(20),
  image: z.string().max(500).optional(),
});

// Endereço é opcional — modelo "one-click" do Paradise.
// Se o cliente preencher endereço, gravamos para envio.
const CreateOrderSchema = z.object({
  customer: z
    .object({
      name: z.string().max(120).optional().or(z.literal("")),
      phone: z.string().max(20).optional().or(z.literal("")),
      email: z.string().max(120).optional().or(z.literal("")),
      cep: z.string().max(9).optional().or(z.literal("")),
      address: z.string().max(200).optional().or(z.literal("")),
      number: z.string().max(20).optional().or(z.literal("")),
      complement: z.string().max(120).optional().or(z.literal("")),
      neighborhood: z.string().max(120).optional().or(z.literal("")),
      city: z.string().max(120).optional().or(z.literal("")),
      state: z.string().max(2).optional().or(z.literal("")),
    })
    .partial()
    .optional()
    .default({}),
  items: z.array(ItemSchema).min(1).max(20),
});

const onlyDigits = (s: string) => s.replace(/\D+/g, "");

export const createPixOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => CreateOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const amount = data.items.reduce((acc, i) => acc + i.price * i.qty, 0);

    const c = data.customer || {};
    const phoneDigits = c.phone ? onlyDigits(c.phone) : undefined;

    const pix = await createPixCharge({
      amount,
      customer: {
        name: c.name || undefined,
        email: c.email || undefined,
        phone: phoneDigits || undefined,
        // CPF é gerado pelo backend (one-click) se não fornecido
      },
    });

    if (!pix.transactionId) {
      throw new Error("Paradise não retornou identificador da transação");
    }

    // Gera QR localmente caso a API só tenha devolvido o copia-e-cola
    let qrB64 = pix.qrCodeBase64;
    if (!qrB64 && pix.copyPaste) {
      const dataUrl = await QRCode.toDataURL(pix.copyPaste, {
        width: 320,
        margin: 1,
      });
      qrB64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    }

    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .insert({
        transaction_id: pix.transactionId,
        customer_name: c.name || "Cliente",
        customer_cpf: "",
        customer_email: c.email || "",
        customer_phone: phoneDigits || "",
        customer_cep: c.cep || null,
        customer_address: c.address || null,
        customer_number: c.number || null,
        customer_complement: c.complement || null,
        customer_neighborhood: c.neighborhood || null,
        customer_city: c.city || null,
        customer_state: c.state || null,
        items_json: data.items,
        amount_cents: amount,
        status: "pending",
        pix_copy_paste: pix.copyPaste || null,
        qr_code_b64: qrB64 || null,
        expires_at: pix.expiresAt,
      })
      .select("transaction_id")
      .single();

    if (error) {
      console.error("[checkout] insert order failed", error);
      throw new Error("Erro ao salvar pedido");
    }

    return {
      transactionId: row.transaction_id,
      copyPaste: pix.copyPaste,
      qrCodeB64: qrB64,
      amount,
      expiresAt: pix.expiresAt,
    };
  });

export const getOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ transactionId: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "transaction_id, status, amount_cents, customer_name, customer_email, customer_phone",
      )
      .eq("transaction_id", data.transactionId)
      .maybeSingle();

    if (error || !order) {
      throw new Error("Pedido não encontrado");
    }

    if (order.status === "pending") {
      try {
        const remote = await getTransactionStatus(data.transactionId);
        if (remote.status !== order.status) {
          await supabaseAdmin
            .from("orders")
            .update({
              status: remote.status,
              paid_at:
                remote.status === "paid" ? new Date().toISOString() : null,
            })
            .eq("transaction_id", data.transactionId);
          order.status = remote.status;
        }
      } catch (e) {
        console.warn("[checkout] remote status check failed", e);
      }
    }

    return order;
  });
