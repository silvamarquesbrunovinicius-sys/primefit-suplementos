// pages/index.js

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { corrigirUrlImagem } from "../lib/imagem";
import CartButton from "../components/CartButton";

function normalizarCategoria(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ehPromocao(cat) {
  return normalizarCategoria(cat) === normalizarCategoria("Promoções");
}

export default function Home() {
  const [listaProdutos, setListaProdutos] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [slideAtivo, setSlideAtivo] = useState(0);
  const [categoriasDB, setCategoriasDB] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const res = await fetch("/api/produtos");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error);

        const lista = (Array.isArray(data) ? data : [])
          .filter((p) => p.ativo !== false)
          .map((p) => ({
            id: p.id,
            nome: p.nome || "Produto",
            preco: Number(p.preco || 0),
            categoria: String(p.categoria || "Outro").trim(),
            destaque: p.destaque || "",
            descricao: p.descricao || "",
            imagem: corrigirUrlImagem(p.imagem_url || p.imagem),
          }));

        setListaProdutos(lista);
        setOfertas(lista.slice(0, 4));
      } catch (err) {
        console.error(err);
      }
    }

    carregarProdutos();
  }, []);

  useEffect(() => {
    async function carregarCategorias() {
      try {
        const r = await fetch("/api/categorias");
        const data = await r.json();
        if (!r.ok) throw new Error();

        const unicas = [];
        const seen = new Set();

        for (const c of data || []) {
          const nome = String(c?.nome || "").trim();
          const key = normalizarCategoria(nome);
          if (!key || seen.has(key)) continue;
          seen.add(key);
          unicas.push({ ...c, nome });
        }

        unicas.sort((a, b) => a.nome.localeCompare(b.nome));
        setCategoriasDB(unicas);
      } catch {
        setCategoriasDB([]);
      } finally {
        setLoadingCategorias(false);
      }
    }

    carregarCategorias();
  }, []);

  const slides = useMemo(() => {
    const promos = listaProdutos.filter((p) => ehPromocao(p.categoria));

    if (!promos.length) {
      return [
        {
          id: "banner",
          imagem: "/banner.jpg",
          titulo: "Promoções PrimeFit",
          link: "/produtos",
        },
      ];
    }

    return promos.map((p) => ({
      id: p.id,
      imagem: p.imagem,
      titulo: p.nome,
      preco: p.preco,
      link: `/produto/${p.id}`,
    }));
  }, [listaProdutos]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setSlideAtivo((s) => (s + 1) % slides.length);
    }, 3500);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HEADER FIXO MOBILE */}
      <header className="border-b border-yellow-400 sticky top-0 bg-black z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" className="h-10 sm:h-14" />
            <span className="text-yellow-400 font-black text-sm sm:text-xl">
              PRIMEFIT
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/produtos"
              className="text-yellow-400 text-sm font-semibold"
            >
              Produtos
            </Link>
            <CartButton />
          </div>
        </div>
      </header>

      {/* CARROSSEL */}
      <section className="max-w-7xl mx-auto px-4 py-5">
        <div className="relative rounded-2xl overflow-hidden border border-yellow-400">
          <img
            src={slides[slideAtivo]?.imagem}
            className="w-full h-[220px] sm:h-[350px] object-cover"
          />

          <div className="absolute inset-0 bg-black/50 flex items-end">
            <div className="p-5">
              <h2 className="text-xl sm:text-3xl font-black">
                {slides[slideAtivo]?.titulo}
              </h2>

              {slides[slideAtivo]?.preco && (
                <p className="text-yellow-400 font-black text-xl mt-2">
                  R$ {slides[slideAtivo].preco.toFixed(2).replace(".", ",")}
                </p>
              )}

              <Link
                href={slides[slideAtivo]?.link}
                className="inline-block mt-3 bg-yellow-400 text-black px-5 py-2 rounded-xl font-bold"
              >
                Ver produto
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-center text-yellow-400 font-black text-lg">
          CATEGORIAS
        </h2>

        {loadingCategorias ? (
          <p className="text-center text-gray-400 mt-4">Carregando...</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categoriasDB.map((c) => (
              <Link
                key={c.id}
                href={`/produtos?cat=${encodeURIComponent(c.nome)}`}
                className="py-3 text-center border border-yellow-400 rounded-xl text-yellow-400 font-bold hover:bg-yellow-400 hover:text-black transition"
              >
                {c.nome}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* OFERTAS */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-center text-yellow-400 font-black text-lg">
          OFERTAS ESPECIAIS
        </h2>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {ofertas.map((p) => (
            <div
              key={p.id}
              className="bg-[#111] border border-yellow-400/50 rounded-2xl p-3"
            >
              <div className="bg-black rounded-xl p-3">
                <img
                  src={p.imagem}
                  className="w-full h-32 object-contain"
                />
              </div>

              <h3 className="mt-3 text-xs min-h-[32px]">{p.nome}</h3>

              <p className="text-yellow-400 font-black mt-2 text-lg">
                R$ {p.preco.toFixed(2).replace(".", ",")}
              </p>

              <Link
                href={`/produto/${p.id}`}
                className="mt-3 block text-center bg-yellow-400 text-black py-2 rounded-xl font-bold text-sm"
              >
                Ver
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-yellow-400 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} PrimeFit Suplementos
      </footer>

      {/* WHATS FIXO */}
      <a
        href="https://wa.me/5598999614108"
        target="_blank"
        className="fixed bottom-6 right-4 bg-yellow-400 text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
      >
        💬
      </a>
    </div>
  );
}