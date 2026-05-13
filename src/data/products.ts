export type Product = {
  id: string;
  name: string;
  price: number; // cents
  originalPrice: number; // cents
  image: string;
  brand: "NORISK" | "LS2";
};

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Names from the catalog (in order 1..43). Image for product i comes from the
// reversed position in the visor PDF: name #1 ↔ image 43, name #43 ↔ image 1.
const NAMES: { name: string; brand: "NORISK" | "LS2" }[] = [
  { name: "NORISK Soul II Grand Prix South Africa", brand: "NORISK" },
  { name: "NORISK Soul II Grand Prix France", brand: "NORISK" },
  { name: "NORISK Soul II Grand Prix Brazil", brand: "NORISK" },
  { name: "NORISK Soul II Grand Prix Argentina", brand: "NORISK" },
  { name: "NORISK Soul II Grand Prix Germany", brand: "NORISK" },
  { name: "NORISK Soul II Grand Prix Italy", brand: "NORISK" },
  { name: "NORISK Soul II Grand Prix Japan", brand: "NORISK" },
  { name: "NORISK Soul II Grand Prix United Kingdom", brand: "NORISK" },
  { name: "NORISK Soul II Grand Prix USA", brand: "NORISK" },
  { name: "LS2 FF358 Classic S Monocolor Vermelho", brand: "LS2" },
  { name: "LS2 FF358 Classic Tank Laranja", brand: "LS2" },
  { name: "LS2 FF358 Classic Tank Preto", brand: "LS2" },
  { name: "LS2 FF358 Classic Tribal Azul", brand: "LS2" },
  { name: "LS2 FF358 Classic Tribal Rosa", brand: "LS2" },
  { name: "LS2 FF358 Classic XDron Neon", brand: "LS2" },
  { name: "LS2 FF358 Classic Draze Azul", brand: "LS2" },
  { name: "LS2 FF358 Classic Draze Branco", brand: "LS2" },
  { name: "LS2 FF358 Classic Draze Preto", brand: "LS2" },
  { name: "LS2 FF358 Classic Draze Vermelho", brand: "LS2" },
  { name: "NORISK Avenger Monocolor Branco", brand: "NORISK" },
  { name: "NORISK Avenger Monocolor Cinza", brand: "NORISK" },
  { name: "NORISK Avenger Monocolor Preto", brand: "NORISK" },
  { name: "NORISK Avenger Monocolor Nardo Cinza", brand: "NORISK" },
  { name: "NORISK City Monocolor Branco", brand: "NORISK" },
  { name: "NORISK City Monocolor Cinza Fosco", brand: "NORISK" },
  { name: "NORISK City Monocolor Preto Fosco", brand: "NORISK" },
  { name: "NORISK Darth II Monocolor Preto Fosco", brand: "NORISK" },
  { name: "NORISK Razor Black Edition", brand: "NORISK" },
  { name: "NORISK Rock Monocolor Branco", brand: "NORISK" },
  { name: "NORISK Rock Monocolor Nardo Cinza", brand: "NORISK" },
  { name: "NORISK Rock Monocolor Preto Fosco", brand: "NORISK" },
  { name: "NORISK Soul II Manty Rosa Fosco", brand: "NORISK" },
  { name: "LS2 FF353 Rapid Monocolor Branco", brand: "LS2" },
  { name: "LS2 FF353 Rapid Monocolor Cinza", brand: "LS2" },
  { name: "LS2 FF353 Rapid Monocolor Preto Fosco", brand: "LS2" },
  { name: "Jaqueta NORISK Tornado Cinza", brand: "NORISK" },
  { name: "Jaqueta NORISK Tornado Branca", brand: "NORISK" },
  { name: "Jaqueta NORISK Tornado Air Preta", brand: "NORISK" },
  { name: "Jaqueta NORISK Trip Air Feminina Rosa", brand: "NORISK" },
  { name: "Viseira NORISK FF302 Fotocromática Transition VM Vision", brand: "NORISK" },
  { name: "Fone de Ouvido para Capacete Bluetooth Headset RGB Sem Fio Kateluo", brand: "NORISK" },
  { name: "Viseira Norisk Flow Iridium Rainbow Camaleão", brand: "NORISK" },
  { name: "Viseira do Capacete Norisk Flow Fumê", brand: "NORISK" },
];

function priceFor(name: string): { price: number; originalPrice: number } {
  if (/^Jaqueta/i.test(name)) return { price: 8990, originalPrice: 59900 };
  if (/^Viseira/i.test(name)) return { price: 4990, originalPrice: 19900 };
  if (/^Fone/i.test(name)) return { price: 8990, originalPrice: 34900 };
  if (/^LS2/i.test(name)) return { price: 5820, originalPrice: 37900 };
  return { price: 6200, originalPrice: 47400 }; // NORISK helmets
}

export const PRODUCTS: Product[] = NAMES.map((n, i) => {
  const imgIndex = NAMES.length - i; // 1-based reverse pairing → page in PDF
  const { price, originalPrice } = priceFor(n.name);
  return {
    id: slug(n.name),
    name: n.name,
    price,
    originalPrice,
    image: `/assets/cs/products/catalog/p${imgIndex}.jpg`,
    brand: n.brand,
  };
});

export const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const getProduct = (id: string) =>
  PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];
