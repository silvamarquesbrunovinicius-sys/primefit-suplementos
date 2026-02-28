// pages/produtos.js
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCarrinho } from "../context/CarrinhoContext";
import CartButton from "../components/CartButton";
import { pegarImagemProduto, corrigirUrlImagem } from "../lib/imagem";

function brl(valor) {
  const n = Number(valor || 0);
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

function ProdutoImagem({ src, alt }) {
  const [imgSrc, setImgSrc] = useState(corrigirUrlImagem(src));

  return (
    <Image
      src={imgSrc || "/logo.png"}
      alt={alt}
      fill
      className="object-contain"
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
      priority={false}
      onError={() => setImgSrc("/logo.png")}
    />
  );
}

export default function Produtos() {
  const router = useRouter();
  const { adicionarProduto, lastAddedAt } = useCarrinho();

  const [toast, setToast] = useState("");
  const [listaProdutos, setListaProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [cat, setCat] = useState("");

  function adicionarAoCarrinho(produto) {
    adicionarProduto({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem,
      qtd: 1,
    });
    setToast(`✅ ${produto.nome} adicionado ao carrinho`);
  }

  useEffect(() => {
    if (!router.isReady) return;
    setCat((router.query.cat || "").toString());
  }, [router.isReady, router.query.cat]);

  useEffect(() => {
    if (!lastAddedAt) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [lastAddedAt]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErro("");

        const r = await fetch("/api/produtos");
        const data = await r.json();

        if (!r.ok) throw new Error(data?.error || "Erro ao buscar produtos");

        const normalizado = (Array.isArray(data) ? data : []).map((p) => ({
          id: p.id,
          nome: p.nome ?? "Produto",
          preco: Number(p.preco ?? 0),
          imagem: pegarImagemProduto(p),
          categoria: String(p.categoria || "Outro").trim(),
          destaque: p.destaque || "",
          descricao: p.descricao || "",
          ativo: p.ativo !== false,
        }));

        setListaProdutos(normalizado);
      } catch (e) {
        setErro(e.message || "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtrados = useMemo(() => {
    const ativos = listaProdutos.filter((p) => p.ativo !== false);
    if (!cat) return ativos;
    return ativos.filter((p) => p.categoria === cat);
  }, [listaProdutos, cat]);

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HEADER FIXO MOBILE */}
      <header className="border-b border-yellow-400 sticky top-0 bg-black z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" className="h-9 sm:h-12" alt="PrimeFit" />
            <span className="text-yellow-400 font-black tracking-widest text-sm sm:text-xl">
              PRIMEFIT
            </span>
          </Link>
          <CartButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-10">

        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-xl sm:text-3xl font-black text-yellow-400">
            Todos Produtos
          </h1>

          {cat && (
            <Link
              href="/produtos"
              className="text-sm font-bold text-yellow-400 hover:text-yellow-300"
            >
              Limpar filtro: {cat} ✕
            </Link>
          )}
        </div>

        {loading && <p className="mt-6 text-gray-400">Carregando produtos...</p>}

        {erro && (
          <div className="mt-6 bg-[#111] border border-red-500 rounded-2xl p-4">
            <p className="text-red-300 font-bold">Erro:</p>
            <p className="text-gray-200">{erro}</p>
          </div>
        )}

        {!loading && !erro && filtrados.length === 0 && (
          <p className="mt-6 text-gray-400">
            Nenhum produto encontrado{cat ? ` na categoria "${cat}"` : ""}.
          </p>
        )}

        {!loading && !erro && filtrados.length > 0 && (
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">

            {filtrados.map((p) => (
              <div
                key={p.id}
                className="bg-[#111] border border-yellow-400/60 rounded-2xl flex flex-col overflow-hidden transition active:scale-95"
              >
                <div className="bg-black h-40 sm:h-48 flex items-center justify-center p-3">
                  <div className="relative w-full h-full">
                    <ProdutoImagem src={p.imagem} alt={p.nome} />
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-3">

                  {p.destaque ? (
                    <span className="inline-block mb-2 bg-yellow-400 text-black text-[11px] font-bold px-2 py-1 rounded-full self-start">
                      {p.destaque}
                    </span>
                  ) : (
                    <div className="mb-2 h-[20px]" />
                  )}

                  <h3 className="font-semibold text-white text-sm min-h-[38px] line-clamp-2">
                    {p.nome}
                  </h3>

                  <p className="mt-2 text-yellow-400 font-black text-lg">
                    {brl(p.preco)}
                  </p>

                  <p className="text-gray-400 text-xs mt-2 line-clamp-2 min-h-[32px]">
                    {p.descricao}
                  </p>

                  <div className="mt-auto pt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => adicionarAoCarrinho(p)}
                      className="h-12 bg-yellow-400 text-black rounded-xl font-bold text-sm active:scale-95 transition"
                    >
                      Adicionar
                    </button>

                    <Link
                      href={`/produto/${p.id}`}
                      className="h-12 flex items-center justify-center border border-yellow-400 text-yellow-400 rounded-xl font-bold text-sm active:scale-95 transition"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}
      </main>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3 w-full max-w-sm">
          <div className="bg-yellow-400 text-black font-black px-4 py-3 rounded-xl shadow-lg text-center text-sm">
            {toast}
          </div>
        </div>
      )}

      {/* WhatsApp */}
      <a
        href="https://wa.me/5598999614108"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-4 sm:right-6 z-50 bg-yellow-400 text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition"
        aria-label="WhatsApp"
      >
        💬
      </a>
    </div>
  );
}