import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createPixOrder } from "@/lib/checkout.functions";
import { useCart, formatBRL } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronLeft, MapPin, ShieldCheck, Minus, Plus, Gift, Truck } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "Resumo do pedido | CS Capacetes" }] }),
});



const onlyDigits = (s: string) => s.replace(/\D+/g, "");

type Address = {
  name: string;
  phone: string;
  email: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

const empty: Address = {
  name: "", phone: "", email: "", cep: "",
  address: "", number: "", complement: "",
  neighborhood: "", city: "", state: "",
};

function CheckoutPage() {
  const { items, subtotal, setQty, remove } = useCart();
  const navigate = useNavigate();
  const createOrder = useServerFn(createPixOrder);

  const [loading, setLoading] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrStep, setAddrStep] = useState<"intro" | "form">("intro");
  const [addr, setAddr] = useState<Address>(empty);
  const [savedAddr, setSavedAddr] = useState<Address | null>(null);

  const [cpfOpen, setCpfOpen] = useState(false);
  const [cpfInput, setCpfInput] = useState("");
  const [savedCpf, setSavedCpf] = useState<string | null>(null);

  type ShippingId = "free" | "standard" | "express";
  const SHIPPING: { id: ShippingId; name: string; days: string; price: number; tag?: string }[] = [
    { id: "free", name: "Frete Grátis", days: "7-12 dias úteis", price: 0 },
    { id: "standard", name: "Frete Padrão", days: "5-8 dias úteis", price: 1490 },
    { id: "express", name: "Expresso", days: "2-4 dias úteis", price: 2490, tag: "RÁPIDO" },
  ];
  const [shippingId, setShippingId] = useState<ShippingId>("free");
  const shipping = SHIPPING.find((s) => s.id === shippingId)!;

  const [couponSec, setCouponSec] = useState(4 * 60 * 60);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cs-addr");
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedAddr(parsed);
        setAddr(parsed);
      }
      const cpf = localStorage.getItem("cs-cpf");
      if (cpf) setSavedCpf(cpf);
    } catch {}
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCouponSec((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(Math.floor(couponSec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((couponSec % 3600) / 60)).padStart(2, "0");
  const ss = String(couponSec % 60).padStart(2, "0");

  function openAddr() {
    setAddrStep(savedAddr ? "form" : "intro");
    setAddrOpen(true);
  }

  async function lookupCEP(cep: string) {
    const c = onlyDigits(cep);
    if (c.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`);
      const d = await r.json();
      if (d?.erro) return;
      setAddr((s) => ({
        ...s,
        address: d.logradouro || s.address,
        neighborhood: d.bairro || s.neighborhood,
        city: d.localidade || s.city,
        state: d.uf || s.state,
      }));
    } catch {}
  }

  function saveAddress() {
    const missing: string[] = [];
    if (!addr.name.trim()) missing.push("nome");
    if (!addr.phone.trim()) missing.push("telefone");
    if (!addr.cep.trim()) missing.push("CEP");
    if (!addr.address.trim()) missing.push("rua");
    if (!addr.number.trim()) missing.push("número");
    if (!addr.neighborhood.trim()) missing.push("bairro");
    if (!addr.city.trim()) missing.push("cidade");
    if (!addr.state.trim()) missing.push("estado");
    if (missing.length) {
      toast.error(`Preencha: ${missing.join(", ")}`);
      return;
    }
    localStorage.setItem("cs-addr", JSON.stringify(addr));
    setSavedAddr(addr);
    setAddrOpen(false);
  }

  function saveCpf() {
    const c = onlyDigits(cpfInput);
    if (c.length !== 11) {
      toast.error("CPF deve ter 11 dígitos");
      return;
    }
    localStorage.setItem("cs-cpf", c);
    setSavedCpf(c);
    setCpfOpen(false);
  }

  async function placeOrder() {
    if (items.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }
    if (
      !savedAddr ||
      !savedAddr.name.trim() ||
      !savedAddr.phone.trim() ||
      !savedAddr.cep.trim() ||
      !savedAddr.address.trim() ||
      !savedAddr.number.trim() ||
      !savedAddr.neighborhood.trim() ||
      !savedAddr.city.trim() ||
      !savedAddr.state.trim()
    ) {
      toast.error("Preencha o endereço de entrega para gerar o PIX");
      openAddr();
      return;
    }
    setLoading(true);
    try {
      const res = await createOrder({
        data: {
          customer: savedAddr
            ? {
                name: savedAddr.name,
                phone: savedAddr.phone,
                email: savedAddr.email,
                cep: savedAddr.cep,
                address: savedAddr.address,
                number: savedAddr.number,
                complement: savedAddr.complement,
                neighborhood: savedAddr.neighborhood,
                city: savedAddr.city,
                state: savedAddr.state,
              }
            : {},
          items: [
            ...items.map((i) => ({
              id: i.id,
              name: i.name,
              size: i.size,
              price: i.price,
              qty: i.qty,
              image: i.image,
            })),
            ...(shipping.price > 0
              ? [{ id: `frete-${shipping.id}`, name: `Frete ${shipping.name}`, price: shipping.price, qty: 1 }]
              : []),
          ],
        },
      });
      navigate({ to: "/pix/$transactionId", params: { transactionId: res.transactionId } });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao gerar PIX");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[480px] mx-auto p-6 text-center bg-white min-h-screen">
        <p className="text-muted-foreground mb-4">Seu carrinho está vazio.</p>
        <Button asChild>
          <Link to="/">Voltar à loja</Link>
        </Button>
      </div>
    );
  }

  const original = subtotal() * 7.55;
  const desconto = Math.max(0, original - subtotal());
  const total = subtotal() + shipping.price;
  const fmtCpf = (v: string) =>
    v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

  return (
    <div className="min-h-screen bg-white text-foreground max-w-[480px] mx-auto pb-44">
      <header className="sticky top-0 z-30 bg-white border-b flex items-center px-3 h-14 relative">
        <Link to="/" className="p-1 absolute left-3">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="w-full text-center">
          <h1 className="font-semibold text-base">Resumo do pedido</h1>
          <p className="text-emerald-600 text-xs flex items-center justify-center gap-1 mt-0.5">
            <ShieldCheck className="w-3 h-3" /> Cancelamento fácil
          </p>
        </div>
      </header>

      <button
        onClick={openAddr}
        className="w-full flex items-start gap-3 px-4 py-3 border-b text-left"
      >
        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
        <div className="flex-1 min-w-0">
          {savedAddr ? (
            <>
              <div className="text-sm font-medium truncate">
                {savedAddr.name} • {savedAddr.phone}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {savedAddr.address}, {savedAddr.number} - {savedAddr.neighborhood}, {savedAddr.city}/{savedAddr.state}
              </div>
            </>
          ) : (
            <div className="text-sm">Endereço de envio</div>
          )}
        </div>
        <span className="text-[color:var(--flash-end)] font-semibold text-sm">
          {savedAddr ? "Editar" : "+ Adicionar endereço"}
        </span>
      </button>

      <button
        onClick={() => { setCpfInput(savedCpf || ""); setCpfOpen(true); }}
        className="w-full flex items-center gap-3 px-4 py-3 border-b text-left"
      >
        <ShieldCheck className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1 text-sm">
          {savedCpf ? <span className="font-medium">CPF: {fmtCpf(savedCpf)}</span> : "CPF (opcional)"}
        </div>
        <span className="text-[color:var(--flash-end)] font-semibold text-sm">
          {savedCpf ? "Editar" : "+ Adicionar CPF"}
        </span>
      </button>

      <section className="px-4 py-3 border-b">
        <div className="font-semibold text-sm mb-1">CSCAPACETES</div>
        <p className="text-xs text-amber-600 mb-3">⭐ Melhor escolha! 8.2K vendido(s) e com nota 4.8/5,0</p>

        {items.map((i) => {
          const original = Math.round(i.price * 7.55);
          const off = Math.round(((original - i.price) / original) * 100);
          return (
            <div key={i.id} className="flex gap-3 mb-3">
              {i.image && (
                <img src={i.image} alt={i.name} className="w-20 h-20 object-contain bg-muted/30 rounded" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-snug">{i.name}</div>
                {i.size && <div className="text-xs text-muted-foreground mt-0.5">Tamanho: {i.size}</div>}
                <div className="mt-1 flex items-center gap-2">
                  <span className="bg-[color:var(--flash-end)] text-white text-[11px] font-semibold px-2 py-0.5 rounded">
                    ⚡ Oferta Relâmpago
                  </span>
                </div>
                <div className="text-xs text-emerald-600 mt-1">🟢 Devolução gratuita</div>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <div className="text-[color:var(--flash-end)] font-bold">{formatBRL(i.price)}</div>
                    <div className="text-xs text-muted-foreground">
                      <span className="line-through">{formatBRL(original)}</span>{" "}
                      <span className="text-[color:var(--flash-end)]">-{off}%</span>
                    </div>
                  </div>
                  <div className="flex items-center border rounded">
                    <button className="p-1.5" onClick={() => (i.qty <= 1 ? remove(i.id) : setQty(i.id, i.qty - 1))}>
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm">{i.qty}</span>
                    <button className="p-1.5" onClick={() => setQty(i.id, i.qty + 1)}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Shipping options */}
      <section className="px-4 py-3 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Frete</h3>
        </div>
        <div className="space-y-2">
          {SHIPPING.map((s) => {
            const active = s.id === shippingId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setShippingId(s.id)}
                className={`w-full flex items-center gap-3 border rounded-xl px-3 py-3 text-left transition-colors ${
                  active ? "border-emerald-500 bg-emerald-50/40" : "border-border"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    active ? "border-emerald-500" : "border-muted-foreground/40"
                  }`}
                >
                  {active && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {s.name}
                    {s.tag && (
                      <span className="bg-[color:var(--flash-end)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {s.tag}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.days}</div>
                </div>
                <div className={`text-sm font-semibold ${s.price === 0 ? "text-emerald-600" : ""}`}>
                  {s.price === 0 ? "Grátis" : formatBRL(s.price)}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-4 py-3 border-b">
        <h3 className="font-semibold mb-2">Resumo do pedido</h3>
        <div className="flex justify-between text-sm py-1">
          <span>Subtotal do produto</span>
          <span>{formatBRL(subtotal())}</span>
        </div>
        <div className="flex justify-between text-sm py-1 text-muted-foreground">
          <span>Preço original</span>
          <span>{formatBRL(original)}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-muted-foreground">Desconto Imposto</span>
          <span className="text-[color:var(--flash-end)]">- {formatBRL(desconto)}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span className="text-muted-foreground">Frete ({shipping.name})</span>
          <span>{shipping.price === 0 ? "Grátis" : formatBRL(shipping.price)}</span>
        </div>
        <div className="flex justify-between font-semibold pt-2 border-t mt-2 text-base">
          <span>Total</span>
          <span>{formatBRL(total)}</span>
        </div>
      </section>

      <p className="px-4 py-3 text-xs text-muted-foreground">
        Ao fazer um pedido, você concorda com os <strong>Termos de uso e venda da CS Capacetes</strong> e reconhece que leu e concordou com a <strong>Política de privacidade</strong>.
      </p>

      <div className="px-4 py-2 bg-pink-50 text-[color:var(--flash-end)] text-sm flex items-center gap-2">
        <Gift className="w-4 h-4" /> Você está economizando {formatBRL(desconto)} com impostos.
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t px-4 pt-2 pb-3 z-40">
        <div className="flex justify-between items-baseline mb-1">
          <span className="font-semibold">Total ({items.length} item{items.length > 1 ? "s" : ""})</span>
          <span className="text-[color:var(--flash-end)] font-bold text-lg">{formatBRL(total)}</span>
        </div>
        <div className="text-right text-xs text-emerald-600 mb-2">Economizando {formatBRL(desconto)}</div>
        <Button
          onClick={placeOrder}
          disabled={loading}
          className="w-full h-12 rounded-full text-base bg-[color:var(--flash-end)] hover:opacity-90"
        >
          {loading ? "Gerando PIX..." : "Fazer pedido"}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-1">
          O cupom expira em {hh}:{mm}:{ss}
        </p>
      </div>

      {/* address dialog */}
      <Dialog open={addrOpen} onOpenChange={setAddrOpen}>
        <DialogContent className="max-w-[440px] p-0 max-h-[90vh] overflow-y-auto">
          {addrStep === "intro" ? (
            <div className="p-6 text-center">
              <MapPin className="w-8 h-8 text-[color:var(--flash-end)] mx-auto" />
              <h2 className="font-bold text-lg mt-2">Endereço de entrega</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Recomendamos que adicione um endereço para a entrega do seu produto.
              </p>
              <Button
                onClick={() => setAddrStep("form")}
                className="w-full mt-4 h-12 rounded-full bg-[color:var(--flash-end)] hover:opacity-90"
              >
                Adicionar endereço
              </Button>
              <button
                onClick={() => setAddrOpen(false)}
                className="w-full mt-2 h-12 rounded-full border text-sm"
              >
                Adicionar endereço após a compra
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setAddrOpen(false)} className="p-1">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="font-semibold">Adicionar o novo endereço</h2>
              </div>

              <h3 className="font-semibold text-sm mb-2">Informações de contato</h3>
              <div className="space-y-2 mb-4">
                <Input placeholder="Nome e sobrenome" value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} />
                <Input placeholder="BR +55  Número de telefone" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} />
                <Input placeholder="E-mail" value={addr.email} onChange={(e) => setAddr({ ...addr, email: e.target.value })} />
              </div>

              <h3 className="font-semibold text-sm mb-2">Endereço</h3>
              <div className="space-y-2 mb-4">
                <Input
                  placeholder="CEP"
                  value={addr.cep}
                  onChange={(e) => {
                    setAddr({ ...addr, cep: e.target.value });
                    lookupCEP(e.target.value);
                  }}
                />
                <Input placeholder="Rua" value={addr.address} onChange={(e) => setAddr({ ...addr, address: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Número" value={addr.number} onChange={(e) => setAddr({ ...addr, number: e.target.value })} />
                  <Input placeholder="Complemento" value={addr.complement} onChange={(e) => setAddr({ ...addr, complement: e.target.value })} />
                </div>
                <Input placeholder="Bairro" value={addr.neighborhood} onChange={(e) => setAddr({ ...addr, neighborhood: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Cidade" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
                  <Input placeholder="Estado" maxLength={2} value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} />
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mb-3">
                Leia a <strong>Política de privacidade</strong> para saber mais sobre como usamos suas informações pessoais.
              </p>
              <Button onClick={saveAddress} className="w-full h-12 rounded-full bg-[color:var(--flash-end)] hover:opacity-90">
                Salvar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CPF dialog */}
      <Dialog open={cpfOpen} onOpenChange={setCpfOpen}>
        <DialogContent className="max-w-[400px]">
          <h2 className="font-bold text-lg">Adicionar CPF</h2>
          <p className="text-xs text-muted-foreground -mt-2">
            Necessário para emissão da nota fiscal.
          </p>
          <Input
            placeholder="000.000.000-00"
            value={cpfInput}
            maxLength={14}
            onChange={(e) => setCpfInput(e.target.value)}
          />
          <Button onClick={saveCpf} className="w-full h-11 rounded-full bg-[color:var(--flash-end)] hover:opacity-90">
            Salvar CPF
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
