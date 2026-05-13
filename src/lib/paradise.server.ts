// Server-only Paradise Pag wrapper.
// Endpoints e payload conforme prompt oficial enviado pela Paradise:
//   POST https://multi.paradisepags.com/api/v1/transaction.php
//   GET  https://multi.paradisepags.com/api/v1/check_status.php?hash=<external_id>
// Auth: header X-API-Key

const BASE_URL =
  process.env.PARADISE_BASE_URL || "https://multi.paradisepags.com";

// productHash configurável via env, com fallback para o produto fornecido pelo lojista.
const DEFAULT_PRODUCT_HASH =
  process.env.PARADISE_PRODUCT_HASH || "prod_40e485d44e117d3a";

function getApiKey(): string {
  const key = process.env.PARADISE_API_KEY;
  if (!key) throw new Error("PARADISE_API_KEY não configurada");
  return key;
}

// ---------- helpers para gerar dados de cliente "one click" ----------
function genCpf(): string {
  const n: number[] = Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10),
  );
  let s = n.reduce((acc, v, i) => acc + v * (10 - i), 0);
  const d1 = ((s * 10) % 11) % 10;
  n.push(d1);
  s = n.reduce((acc, v, i) => acc + v * (11 - i), 0);
  const d2 = ((s * 10) % 11) % 10;
  n.push(d2);
  return n.join("");
}

const FIRST = ["Lucas", "Carlos", "Ana", "Mariana", "Joao", "Pedro", "Rafael", "Juliana", "Beatriz", "Felipe"];
const LAST = ["Silva", "Souza", "Lima", "Oliveira", "Santos", "Pereira", "Costa", "Ferreira", "Gomes", "Rocha"];
function genName() {
  return `${FIRST[Math.floor(Math.random() * FIRST.length)]} ${LAST[Math.floor(Math.random() * LAST.length)]}`;
}
function genEmail() {
  return `cliente_${Date.now()}_${Math.floor(Math.random() * 9999)}@email.com`;
}
function genPhone() {
  // 11 9XXXX XXXX
  const n = Math.floor(Math.random() * 90000000) + 10000000;
  return `119${n}`.slice(0, 11);
}

// ---------- tipos ----------
export type ParadiseCustomerInput = {
  name?: string;
  email?: string;
  document?: string;
  phone?: string;
};

export type CreatePixInput = {
  amount: number; // centavos
  customer?: ParadiseCustomerInput;
  productHash?: string;
};

export type CreatePixResult = {
  transactionId: string;
  qrCodeBase64: string; // sem prefixo data:
  copyPaste: string;
  expiresAt: string | null;
  raw: any;
};

// ---------- API ----------
export async function createPixCharge(
  input: CreatePixInput,
): Promise<CreatePixResult> {
  const customer = {
    name: input.customer?.name || genName(),
    email: input.customer?.email || genEmail(),
    document: input.customer?.document || genCpf(),
    phone: input.customer?.phone || genPhone(),
  };

  const payload = {
    amount: input.amount,
    productHash: input.productHash || DEFAULT_PRODUCT_HASH,
    customer,
  };

  const url = `${BASE_URL}/api/v1/transaction.php`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": getApiKey(),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* keep text */
  }

  if (!res.ok) {
    console.error("[paradise] createPixCharge failed", res.status, text);
    const msg = json?.error || json?.message || text || res.statusText;
    throw new Error(`Paradise (${res.status}): ${msg}`);
  }

  // Tentar várias formas de leitura do retorno
  const transactionId =
    json?.hash ??
    json?.external_id ??
    json?.id ??
    json?.transaction?.hash ??
    json?.data?.hash ??
    json?.data?.id ??
    "";

  const copyPaste =
    json?.pix?.copy_paste ??
    json?.pix?.copyPaste ??
    json?.pix?.qrcode ??
    json?.pix?.qrCode ??
    json?.pix?.payload ??
    json?.qr_code ??
    json?.copy_paste ??
    "";

  const qrCodeBase64Raw =
    json?.pix?.qr_code_base64 ??
    json?.pix?.qrCodeBase64 ??
    json?.qr_code_base64 ??
    "";
  const qrCodeBase64 = String(qrCodeBase64Raw).replace(
    /^data:image\/png;base64,/,
    "",
  );

  const expiresAt =
    json?.pix?.expiration_date ??
    json?.pix?.expirationDate ??
    json?.pix?.expiresAt ??
    null;

  return {
    transactionId: String(transactionId),
    qrCodeBase64,
    copyPaste,
    expiresAt,
    raw: json,
  };
}

export async function getTransactionStatus(transactionId: string): Promise<{
  status: "pending" | "paid" | "expired" | "failed";
  raw: any;
}> {
  const url = `${BASE_URL}/api/v1/check_status.php?hash=${encodeURIComponent(transactionId)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "X-API-Key": getApiKey() },
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* keep text */
  }
  if (!res.ok) {
    console.error("[paradise] getTransactionStatus failed", res.status, text);
    throw new Error(`Paradise status (${res.status})`);
  }
  const raw =
    json?.payment_status ??
    json?.status ??
    json?.data?.status ??
    json?.data?.payment_status ??
    "pending";
  const norm = String(raw).toLowerCase();
  let status: "pending" | "paid" | "expired" | "failed" = "pending";
  if (["paid", "approved", "completed", "succeeded"].includes(norm))
    status = "paid";
  else if (["expired", "canceled", "cancelled"].includes(norm))
    status = "expired";
  else if (["refused", "failed", "chargedback"].includes(norm))
    status = "failed";
  return { status, raw: json };
}
