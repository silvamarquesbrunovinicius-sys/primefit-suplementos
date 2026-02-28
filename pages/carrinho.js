import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useCarrinho } from "../context/CarrinhoContext";
import CartButton from "../components/CartButton";

function brl(valor) {
  const n = Number(valor || 0);
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

export default function Carrinho() {
  const { itens = [], alterarQtd, removerItem, limparCarrinho } = useCarrinho();

  const totalItens = useMemo(
    () => (itens || []).reduce((soma, item) => soma + Number(item.qtd || 1), 0),
    [itens]
  );

  const total = useMemo(
    () =>
      (itens || []).reduce(
        (soma, item) => soma + Number(item.preco || 0) * Number(item.qtd || 1),
        0
      ),
    [itens]
  );

  const mensagemWhats = useMemo(() => {
    if (!itens?.length) return "Olá! Gostaria de fazer um pedido.";

    const linhas = itens.map((item) => {
      const subt = Number(item.preco || 0) * Number(item.qtd || 1);
      const saborTxt = item.sabor ? ` (${item.sabor})` : "";
      return `${item.qtd}x ${item.nome}${saborTxt} - ${brl(subt)}`;
    });

    return (
      `Olá! Gostaria de finalizar um pedido:\n\n` +
      linhas.join("\n") +
      `\n\nTotal: ${brl(total)}\nItens: ${totalItens}`
    );
  }, [itens, total, totalItens]);

  const whatsappLink = `https://wa.me/5598999614108?text=${encodeURIComponent(
    mensagemWhats
  )}`;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="PrimeFit" className="h-10 sm:h-14" />
            <span className="font-black tracking-widest text-yellow-400 text-base sm:text-2xl">
              PRIMEFIT SUPLEMENTOS
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              href="/produtos"
              className="px-4 py-2 rounded-full border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition text-sm font-semibold"
            >
              Produtos
            </Link>
            <CartButton />
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <h1 className="text-xl sm:text-2xl font-black text-yellow-400 mb-6">
          🛒 Carrinho
        </h1>

        {itens.length === 0 ? (
          <div className="bg-[#111] border border-yellow-400 rounded-2xl p-6">
            <p className="text-gray-300">Seu carrinho está vazio.</p>
            <Link
              href="/produtos"
              className="inline-flex items-center justify-center mt-4 bg-yellow-400 text-black px-6 h-11 rounded-xl font-black hover:bg-yellow-300"
            >
              Ver produtos
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {itens.map((item) => {
                const subtotal = Number(item.preco || 0) * Number(item.qtd || 1);

                return (
                  <div
                    key={`${item.id}-${item.sabor || ""}`}
                    className="bg-[#111] border border-yellow-400 rounded-2xl p-4 flex flex-col sm:flex-row gap-4"
                  >
                    <div className="bg-black border border-yellow-400/50 rounded-xl p-3 w-full sm:w-44 flex items-center justify-center">
                      <div className="relative w-full h-28">
                        <Image
                          src={item.imagem || "/produtos/whey.png"}
                          alt={item.nome}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, 200px"
                        />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-black text-lg">{item.nome}</h2>
                          {item.sabor ? (
                            <p className="text-gray-400 text-sm">Sabor: {item.sabor}</p>
                          ) : null}
                          <p className="text-gray-300 text-sm mt-1">
                            Unitário:{" "}
                            <span className="text-yellow-400 font-bold">
                              {brl(item.preco)}
                            </span>
                          </p>
                        </div>

                        <button
                          onClick={() => removerItem(item.id, item.sabor || "")}
                          className="h-11 px-4 rounded-xl border border-red-500 text-red-300 font-black hover:bg-red-500 hover:text-black transition"
                        >
                          Remover
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-300 font-semibold">Qtd</span>

                          <div className="flex items-center bg-black border border-yellow-400 rounded-xl overflow-hidden">
                            <button
                              onClick={() =>
                                alterarQtd(item.id, (item.qtd || 1) - 1, item.sabor)
                              }
                              className="w-12 h-11 text-yellow-400 font-black hover:bg-yellow-400 hover:text-black transition"
                              aria-label="Diminuir"
                            >
                              –
                            </button>

                            <div className="px-5 h-11 flex items-center font-bold">
                              {item.qtd || 1}
                            </div>

                            <button
                              onClick={() =>
                                alterarQtd(item.id, (item.qtd || 1) + 1, item.sabor)
                              }
                              className="w-12 h-11 text-yellow-400 font-black hover:bg-yellow-400 hover:text-black transition"
                              aria-label="Aumentar"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-gray-300 text-sm">Subtotal</p>
                          <p className="text-yellow-400 font-black text-lg">
                            {brl(subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 bg-[#111] border border-yellow-400 rounded-2xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-gray-300">
                    Itens: <b className="text-yellow-400">{totalItens}</b>
                  </p>
                  <p className="text-gray-300 mt-1">
                    Total:{" "}
                    <span className="text-yellow-400 font-black text-2xl">
                      {brl(total)}
                    </span>
                  </p>
                </div>

                <div className="flex gap-3 flex-wrap w-full sm:w-auto">
                  <button
                    onClick={() => limparCarrinho?.()}
                    className="flex-1 sm:flex-none h-11 px-6 rounded-xl border border-yellow-400 text-yellow-400 font-black hover:bg-yellow-400 hover:text-black transition"
                  >
                    Limpar
                  </button>

                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-green-500 text-black font-black hover:bg-green-400 transition flex items-center justify-center"
                  >
                    Finalizar no WhatsApp
                  </a>
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                * Pagamento e entrega são combinados via WhatsApp.
              </p>
            </div>
          </>
        )}
      </main>

      <a
        href="https://wa.me/5598999614108"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-yellow-400 text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition"
        aria-label="WhatsApp"
      >
        💬
      </a>
    </div>
  );
}