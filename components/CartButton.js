// components/CartButton.js
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCarrinho } from "../context/CarrinhoContext";

export default function CartButton() {
  const { totalItens, lastAddedAt } = useCarrinho();
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (!lastAddedAt) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 350);
    return () => clearTimeout(t);
  }, [lastAddedAt]);

  return (
    <Link
      href="/carrinho"
      className={`relative px-4 py-2 rounded-full bg-yellow-400 text-black hover:bg-yellow-300 transition text-sm font-bold ${
        bump ? "scale-110" : "scale-100"
      }`}
    >
      🛒 Carrinho

      {/* Badge */}
      <span className="absolute -top-2 -right-2 bg-black text-yellow-400 border border-yellow-400 text-xs font-black px-2 py-0.5 rounded-full">
        {totalItens || 0}
      </span>
    </Link>
  );
}