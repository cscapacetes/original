import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { ShoppingCart, X } from "lucide-react";
import { PRODUCTS, formatBRL } from "@/data/products";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "NORISK Soul II Grand Prix | CS Capacetes" },
      { name: "description", content: "Capacete NORISK Soul II Grand Prix por R$ 62,00 com frete grátis. Oferta relâmpago por tempo limitado." },
    ],
  }),
});

const reviews = [
  { name: "Lucas Souza", time: "há 5 horas", text: "Chegou no prazo, capacete de qualidade!!", avatar: "/assets/cs/images/avatar-lucas.jpg", img: "/assets/cs/images/review-lucas.jpg" },
  { name: "Joel Lima", time: "há 3 horas", text: "Comprei meio na dúvida, mas a qualidade surpreendeu", avatar: "/assets/cs/images/avatar-joel.jpg", img: "/assets/cs/images/review-joel.jpg" },
  { name: "Carlos Santos", time: "há 2 horas", text: "De todos os capacetes que tive, esse é o melhor!", avatar: "/assets/cs/images/avatar-carlos.jpg", img: "/assets/cs/images/review-carlos.webp" },
  { name: "Fernanda Oliveira", time: "há 1 hora", text: "Produto excelente! Acabamento perfeito e muito confortável", avatar: "/assets/cs/images/avatar-fernanda.jpg", img: "/assets/cs/images/review-fernanda.webp" },
  { name: "Patrícia Mendes", time: "há 4 horas", text: "Jaqueta top demais, material resistente e bonita! Superou minhas expectativas", avatar: "/assets/cs/images/avatar-patricia.jpg", img: "/assets/cs/images/review-patricia.webp" },
  { name: "Camila Souza", time: "há 6 horas", text: "Amei a jaqueta, chegou certinho e o tamanho ficou perfeito!", avatar: "/assets/cs/images/avatar-camila.jpg", img: "/assets/cs/images/review-camila.jpg" },
  { name: "Rafael Mendes", time: "há 7 horas", text: "Capacete LS2 muito top! Acabamento impecável, viseira cristalina e ventilação excelente. Melhor custo-benefício que já comprei!", avatar: "/assets/cs/images/avatar-rafael.jpg", img: "/assets/cs/images/review-ls2.webp" },
];

const HELMET_SIZES = ["54", "56", "58", "60", "62"];
const JACKET_SIZES = ["P", "M", "G"];
const sizesFor = (name: string) => (/^Jaqueta/i.test(name) ? JACKET_SIZES : HELMET_SIZES);

function useCountdown(initial = 24 * 60 * 60 - 3) {
  const [s, setS] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => setS(v => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const days = Math.floor(s / 86400);
  if (days >= 1) return `${days} dia${days > 1 ? "s" : ""}`;
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function Star({ filled = true, className = "" }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "#fbbf24" : "#e5e7eb"}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function Index() {
  const time = useCountdown();
  const navigate = useNavigate();
  const { add, items, open } = useCart();
  const cartCount = items.reduce((a, i) => a + i.qty, 0);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [sheetSize, setSheetSize] = useState<string | null>(null);

  const product = PRODUCTS[selectedIdx];
  const sheetProduct = PRODUCTS[sheetIdx];
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  const sheetDiscount = Math.round(((sheetProduct.originalPrice - sheetProduct.price) / sheetProduct.originalPrice) * 100);
  const savings = product.originalPrice - product.price;

  const goNext = () => setSelectedIdx((i) => (i + 1) % PRODUCTS.length);
  const goPrev = () => setSelectedIdx((i) => (i - 1 + PRODUCTS.length) % PRODUCTS.length);

  // Pré-carrega todas as imagens de produto para troca instantânea
  useEffect(() => {
    PRODUCTS.forEach((p) => {
      const img = new Image();
      img.src = p.image;
    });
  }, []);

  function openSheet() {
    setSheetIdx(selectedIdx);
    setSheetSize(null);
    setSheetOpen(true);
  }

  function addAndCart() {
    if (!sheetSize) return;
    add({
      id: `${sheetProduct.id}-${sheetSize}`,
      name: sheetProduct.name,
      size: sheetSize,
      price: sheetProduct.price,
      qty: 1,
      image: sheetProduct.image,
    });
    setSheetOpen(false);
  }

  function buyNow() {
    if (!sheetSize) return;
    add({
      id: `${sheetProduct.id}-${sheetSize}`,
      name: sheetProduct.name,
      size: sheetSize,
      price: sheetProduct.price,
      qty: 1,
      image: sheetProduct.image,
    });
    setSheetOpen(false);
    navigate({ to: "/checkout" });
  }

  return (
    <div className="min-h-screen bg-white text-foreground max-w-[480px] mx-auto pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white flex items-center justify-between px-3 h-12">
        <button aria-label="Voltar" className="p-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex items-center gap-3">
          <button aria-label="Compartilhar" className="p-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
          </button>
          <button aria-label="Carrinho" className="p-2 relative" onClick={open}>
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[color:var(--flash-end)] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button aria-label="Mais" className="p-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          </button>
        </div>
      </header>

      {/* Image gallery */}
      <div className="relative bg-white">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-[360px] object-contain"
        />
        <button
          aria-label="Anterior"
          onClick={goPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button
          aria-label="Próxima"
          onClick={goNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
          {selectedIdx + 1}/{PRODUCTS.length}
        </span>
      </div>

      {/* Flash offer banner — edge-to-edge */}
      <div className="mt-3">
        <div className="overflow-hidden text-white px-4 py-3 flex items-center justify-between" style={{ background: "linear-gradient(90deg, var(--flash), var(--flash-end))" }}>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="bg-white/95 text-[color:var(--flash-end)] text-[11px] font-bold px-1.5 py-0.5 rounded">-{discount}%</span>
              <span className="text-sm">R$</span>
              <span className="text-3xl font-bold leading-none">{(product.price / 100).toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="text-white/85 text-xs line-through mt-1">{formatBRL(product.originalPrice)}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end text-sm font-semibold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
              Oferta Relâmpago
            </div>
            <div className="text-xs mt-1">Termina em {time}</div>
          </div>
        </div>
      </div>

      {/* Savings chips */}
      <div className="px-3 pt-2 flex gap-2">
        <span className="bg-[color:var(--savings-bg)] text-[color:var(--savings-fg)] text-xs font-medium px-2 py-1 rounded border border-[color:var(--savings-fg)]/20">🎁 Economize {formatBRL(savings)}</span>
        <span className="bg-[color:var(--savings-bg)] text-[color:var(--savings-fg)] text-xs font-medium px-2 py-1 rounded border border-[color:var(--savings-fg)]/20">Economize {discount}% com bônus</span>
      </div>

      {/* Title */}
      <div className="px-3 pt-3 flex items-start justify-between gap-3">
        <h1 className="text-base font-semibold leading-snug">{product.name}</h1>
        <button aria-label="Favoritar" className="p-1 text-muted-foreground">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z"/></svg>
        </button>
      </div>

      {/* Rating */}
      <div className="px-3 pt-1 flex items-center gap-2 text-sm">
        <Star className="w-4 h-4" />
        <span className="font-medium">4.9</span>
        <a className="text-[color:var(--link)]">(2.745)</a>
        <span className="text-muted-foreground">|</span>
        <span className="text-muted-foreground">2.745 vendidos</span>
      </div>

      {/* Delivery box */}
      <div className="mx-3 mt-3 border rounded-lg p-3 space-y-2.5 text-sm">
        <div className="flex items-start gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground mt-0.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          <div>
            <div>Receba até <strong>9 de mai – 14 de mai</strong></div>
            <div className="text-muted-foreground"><span className="line-through">Taxa de envio: R$ 9,60</span></div>
            <div className="text-[color:var(--savings-fg)] font-medium">Frete Grátis neste produto 🎉</div>
          </div>
        </div>
        <div className="border-t pt-2.5 flex items-start gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <div>
            <div>Devoluções gratuitas em <strong>30 dias</strong></div>
            <div className="text-muted-foreground text-xs">Cancelamento fácil</div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-4 px-3">
        <h2 className="text-base font-semibold">Avaliações dos clientes (207)</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-2xl font-bold">4.7</span>
          <span className="text-xs text-muted-foreground">/5</span>
          <div className="flex">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4" />)}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1">
          <span>🖼 Inclui imagens ou vídeos (52)</span>
          <span>5 ⭐ (155)</span>
          <span>4 ⭐ (22)</span>
        </div>

        <ul className="mt-3 space-y-4">
          {reviews.map((r, i) => (
            <li key={i} className="border-b pb-4 last:border-0">
              <div className="flex items-center gap-2">
                <img src={r.avatar} alt={r.name} className="w-8 h-8 rounded-full object-cover bg-muted" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.time}</div>
                </div>
              </div>
              <div className="flex mt-1.5">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5" />)}
              </div>
              <p className="text-sm mt-1.5">{r.text}</p>
              <img src={r.img} alt="Foto da avaliação" className="mt-2 w-24 h-24 object-cover rounded-md bg-muted" />
            </li>
          ))}
        </ul>
      </section>

      {/* Store */}
      <section className="mt-4 px-3">
        <h3 className="text-sm font-semibold mb-2">Avaliações da loja (207)</h3>
        <div className="border rounded-lg p-3 flex items-start gap-3">
          <img src="/assets/cs/images/norisk-logo.png" alt="Norisk Oficial" className="w-12 h-12 rounded-md object-cover bg-muted" />
          <div className="flex-1">
            <div className="font-semibold text-sm">Norisk Oficial</div>
            <div className="text-xs text-muted-foreground">97 produtos</div>
          </div>
          <button className="text-[color:var(--link)] text-sm font-medium border border-[color:var(--link)] rounded-full px-3 py-1">Seguir</button>
        </div>
      </section>

      {/* Trust badges */}
      <div className="mt-4 px-3 flex justify-around text-xs text-muted-foreground">
        <span>🚚 Frete grátis</span>
        <span>🔒 Compra segura</span>
      </div>

      <footer className="mt-6 px-3 text-center text-[11px] text-muted-foreground">
        © 2025 CS Capacetes. Todos os direitos reservados.
      </footer>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t flex items-center z-40">
        <button className="flex-1 flex flex-col items-center py-2 text-[11px] text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          Loja
        </button>
        <button className="flex-1 flex flex-col items-center py-2 text-[11px] text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          Chat
        </button>
        <button onClick={openSheet} className="flex-[1.6] m-2 bg-[color:var(--flash-end)] text-white font-semibold py-3 rounded-full text-sm">
          Adicionar
        </button>
      </div>

      {/* Bottom-sheet de tamanho/seleção */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-w-[480px] mx-auto rounded-t-2xl p-0 max-h-[90vh] overflow-y-auto">
          <div className="p-4">
            {/* topo: imagem + preço */}
            <div className="flex gap-3">
              <img src={sheetProduct.image} alt={sheetProduct.name} className="w-24 h-24 object-contain bg-muted/30 rounded-lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-[color:var(--flash-end)] text-white text-[11px] font-bold px-1.5 py-0.5 rounded">-{sheetDiscount}%</span>
                  <span className="text-[color:var(--flash-end)] text-2xl font-bold">
                    R$ {(sheetProduct.price / 100).toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground line-through">{formatBRL(sheetProduct.originalPrice)}</div>
                <span className="inline-block mt-1 bg-pink-100 text-[color:var(--flash-end)] text-xs px-2 py-0.5 rounded">Frete grátis</span>
              </div>
              <button onClick={() => setSheetOpen(false)} className="self-start p-1 text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* miniaturas dos modelos */}
            <div className="mt-3 flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
              {PRODUCTS.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSheetIdx(idx)}
                  className={`flex-shrink-0 w-20 rounded-lg overflow-hidden border-2 ${idx === sheetIdx ? "border-[color:var(--flash-end)]" : "border-transparent"}`}
                >
                  <img src={p.image} alt={p.name} className="w-20 h-20 object-contain bg-white" />
                  <div className="text-[10px] leading-tight text-center px-1 py-1 bg-muted/40 line-clamp-2 min-h-[28px]">
                    {p.name.replace(/^(NORISK Soul II Grand Prix |LS2 )/, "")}
                  </div>
                </button>
              ))}
            </div>

            {/* faixa oferta */}
            <div className="mt-3 rounded-lg text-white px-3 py-2 flex items-center justify-between text-sm" style={{ background: "linear-gradient(90deg, var(--flash), var(--flash-end))" }}>
              <span className="flex items-center gap-1 font-semibold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
                Oferta Relâmpago
              </span>
              <span className="text-xs">Termina em {time}</span>
            </div>

            {/* Tamanhos */}
            {(() => { const sizes = sizesFor(sheetProduct.name); return (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Tamanho ({sizes.length})</h3>
                <button className="text-[color:var(--link)] text-sm">Guia de tamanhos</button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSheetSize(sz)}
                    className={`border rounded-lg p-2 text-center ${sheetSize === sz ? "border-[color:var(--flash-end)] bg-pink-50" : ""}`}
                  >
                    <img src={sheetProduct.image} alt="" className="w-full h-16 object-contain" />
                    <div className="font-semibold text-sm mt-1">{sz}</div>
                  </button>
                ))}
              </div>
            </div>
            ); })()}

            {/* CTAs */}
            <div className="mt-4 space-y-2">
              <button
                onClick={buyNow}
                disabled={!sheetSize}
                className="w-full h-12 rounded-full bg-[color:var(--flash-end)] text-white font-semibold disabled:opacity-50"
              >
                <div>Comprar agora</div>
                <div className="text-xs font-normal">R$ {(sheetProduct.price / 100).toFixed(2).replace(".", ",")}</div>
              </button>
              <button
                onClick={addAndCart}
                disabled={!sheetSize}
                className="w-full h-12 rounded-full border-2 border-[color:var(--flash-end)] text-[color:var(--flash-end)] font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" /> Adicionar ao Carrinho
              </button>
              {!sheetSize && (
                <p className="text-xs text-center text-muted-foreground">Selecione um tamanho</p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
