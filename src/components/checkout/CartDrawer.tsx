import { Link } from "@tanstack/react-router";
import { useCart, formatBRL } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Trash2, Minus, Plus } from "lucide-react";

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, subtotal } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(o) => (o ? null : close())}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Seu carrinho</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground py-12 text-center">
              Seu carrinho está vazio.
            </p>
          )}
          {items.map((i) => (
            <div key={i.id} className="flex gap-3 border-b pb-3">
              {i.image && (
                <img src={i.image} alt={i.name} className="w-16 h-16 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{i.name}</p>
                {(i.variant || i.size) && (
                  <p className="text-xs text-muted-foreground">
                    {[i.variant, i.size].filter(Boolean).join(" • ")}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border rounded">
                    <button
                      className="p-1"
                      onClick={() => setQty(i.id, i.qty - 1)}
                      aria-label="Diminuir"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-sm">{i.qty}</span>
                    <button
                      className="p-1"
                      onClick={() => setQty(i.id, i.qty + 1)}
                      aria-label="Aumentar"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold">{formatBRL(i.price * i.qty)}</span>
                </div>
              </div>
              <button onClick={() => remove(i.id)} aria-label="Remover" className="self-start">
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between text-base font-semibold">
              <span>Subtotal</span>
              <span>{formatBRL(subtotal())}</span>
            </div>
            <p className="text-xs text-emerald-600">Frete grátis aplicado no checkout</p>
            <Button asChild className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700">
              <Link to="/checkout" onClick={close}>
                Finalizar compra
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
