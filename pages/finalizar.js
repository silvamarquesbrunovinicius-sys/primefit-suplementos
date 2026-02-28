import Link from "next/link";
import { useCarrinho } from "../context/CarrinhoContext";

export default function Finalizar() {
  const { itens = [] } = useCarrinho();

  // usa um nome só (carrinho) no resto do código
  const carrinho = Array.isArray(itens) ? itens : [];

  const total = carrinho.reduce(
    (soma, item) => soma + (Number(item.preco) || 0) * (Number(item.qtd) || 0),
    0
  );

  const mensagem = carrinho
    .map((item) => {
      const qtd = Number(item.qtd) || 0;
      const preco = Number(item.preco) || 0;
      return `${qtd}x ${item.nome} - R$ ${(preco * qtd).toFixed(2)}`;
    })
    .join("\n");

  const whatsappLink = `https://wa.me/5598999614108?text=${encodeURIComponent(
    `Olá! Gostaria de finalizar o pedido:\n\n${mensagem}\n\nTotal: R$ ${total.toFixed(
      2
    )}`
  )}`;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">
          🧾 Finalizar Pedido
        </h1>

        {carrinho.length === 0 ? (
          <p className="text-center text-gray-500">Seu carrinho está vazio.</p>
        ) : (
          <>
            <ul className="divide-y mb-4">
              {carrinho.map((item, index) => {
                const qtd = Number(item.qtd) || 0;
                const preco = Number(item.preco) || 0;

                return (
                  <li key={index} className="flex justify-between py-3">
                    <div>
                      <p className="font-semibold">{item.nome}</p>
                      <p className="text-sm text-gray-500">
                        {qtd}x R$ {preco.toFixed(2)}
                      </p>
                    </div>

                    <p className="font-semibold">
                      R$ {(preco * qtd).toFixed(2)}
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-between items-center text-lg font-bold mb-6">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold mb-3"
            >
              Finalizar pelo WhatsApp
            </a>
          </>
        )}

        <Link
          href="/produtos"
          className="block text-center text-blue-600 hover:underline"
        >
          ← Voltar para produtos
        </Link>
      </div>
    </div>
  );
}