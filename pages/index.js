
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { corrigirUrlImagem } from "../lib/imagem";
import CartButton from "../components/CartButton";

/** ✅ normaliza texto (acentos/caixa/espaços) */
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

  // ✅ categorias agora vem SOMENTE do banco
  const [categoriasDB, setCategoriasDB] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

useEffect(() => {
  async function carregarProdutos() {
    try {
      const res = await fetch("/api/produtos");
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Erro ao buscar produtos");

      const lista = (Array.isArray(data) ? data : [])
        .filter((p) => p.ativo !== false)
        .map((p) => ({
          id: p.id,
          nome: p.nome || "Produto",
          preco: Number(p.preco || 0),
          categoria: String(p.categoria || "Outro").trim(),
          destaque: p.destaque || "",
          descricao: p.descricao || "",
          ativo: p.ativo !== false,

          // ✅ AQUI é o mais importante:
          imagem: corrigirUrlImagem(p.imagem_url || p.imagem),
          imagens: Array.isArray(p.imagens) ? p.imagens.map(corrigirUrlImagem) : [],
        }));

      setListaProdutos(lista);
      setOfertas(lista.slice(0, 4));
    } catch (err) {
      console.error(err);
      setListaProdutos([]);
      setOfertas([]);
    }
  }

  carregarProdutos();
}, []);

  // ✅ carrega categorias do BANCO (sem localStorage/json)
  useEffect(() => {
    async function carregarCategorias() {
      try {
        setLoadingCategorias(true);

        const r = await fetch("/api/categorias");
        const data = await r.json();

        if (!r.ok) throw new Error(data?.error || "Erro ao carregar categorias");

        const arr = Array.isArray(data) ? data : [];

        // remove duplicadas por normalização (nome)
        const seen = new Set();
        const unicas = [];
        for (const c of arr) {
          const nome = String(c?.nome || "").trim();
          const key = normalizarCategoria(nome);
          if (!key || seen.has(key)) continue;
          seen.add(key);
          unicas.push({ ...c, nome });
        }

        // ordena por nome
        unicas.sort((a, b) => a.nome.localeCompare(b.nome));

        setCategoriasDB(unicas);
      } catch (e) {
        console.error(e);
        setCategoriasDB([]);
      } finally {
        setLoadingCategorias(false);
      }
    }

    carregarCategorias();
  }, []);

  // ✅ Slides do carrossel: só Promoções (do banco)
  const slidesPromocoes = useMemo(() => {
    const promos = (listaProdutos || []).filter((p) => ehPromocao(p.categoria));

    if (!promos.length) {
      return [
        {
          id: "banner",
          tipo: "banner",
          imagem: "/banner.jpg",
          titulo: "Promoções PrimeFit",
          subtitulo: "Cadastre produtos na categoria Promoções no /admin",
          link: "/produtos",
        },
      ];
    }

    return promos.map((p) => ({
      id: p.id,
      tipo: "produto",
      imagem: p.imagem || "/banner.jpg",
      titulo: p.nome,
      preco: Number(p.preco || 0),
      link: `/produto/${p.id}`,
    }));
  }, [listaProdutos]);

  useEffect(() => {
    setSlideAtivo(0);
  }, [slidesPromocoes.length]);

  useEffect(() => {
    if (!slidesPromocoes || slidesPromocoes.length <= 1) return;

    const t = setInterval(() => {
      setSlideAtivo((s) => (s + 1) % slidesPromocoes.length);
    }, 3500);

    return () => clearInterval(t);
  }, [slidesPromocoes.length]);

  function prevSlide() {
    setSlideAtivo((s) => (s === 0 ? slidesPromocoes.length - 1 : s - 1));
  }

  function nextSlide() {
    setSlideAtivo((s) => (s + 1) % slidesPromocoes.length);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="border-b border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="PrimeFit Suplementos" className="h-14 sm:h-16" />
            <span className="font-black tracking-widest text-yellow-400 text-lg sm:text-2xl">
              PRIMEFIT SUPLEMENTOS
            </span>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-full border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition text-sm font-semibold"
            >
              Início
            </Link>

            <Link
              href="/produtos"
              className="px-4 py-2 rounded-full border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition text-sm font-semibold"
            >
              Produtos
            </Link>

            {/* ✅ BOTÃO DO CARRINHO */}
            <CartButton />

            <Link
              href="/admin"
              className="px-4 py-2 rounded-full bg-yellow-400 text-black hover:bg-yellow-300 transition text-sm font-bold"
            >
              Área do vendedor
            </Link>
          </nav>
        </div>
      </header>

      {/* ✅ CARROSSEL */}
<section className="max-w-7xl mx-auto px-4 py-6">
  <div className="relative rounded-2xl overflow-hidden border border-yellow-400 bg-black">
    <img
      src={slidesPromocoes[slideAtivo]?.imagem || "/banner.jpg"}
      alt="Promoções PrimeFit"
      className="w-full h-[260px] sm:h-[320px] md:h-[360px] object-cover"
    />

    {/* overlay mais leve, igual antes */}
    <div className="absolute inset-0 bg-black/25" />

    {/* BOTÕES TOPO (Promoções / Oferta do dia) */}
    <div className="absolute top-4 left-4 flex gap-3 z-10">
      <button className="bg-yellow-400 text-black text-sm font-black px-5 py-2 rounded-full">
        🔥 Promoções
      </button>

      <button className="border border-yellow-400 text-yellow-400 text-sm font-black px-5 py-2 rounded-full bg-black/40">
        Oferta do dia
      </button>
    </div>

    {/* CONTEÚDO DO BANNER (mais à esquerda, como antes) */}
    <div className="absolute left-6 bottom-6 z-10 max-w-xl">
      <h2 className="text-3xl sm:text-4xl font-black text-white">
        {slidesPromocoes[slideAtivo]?.tipo === "produto"
          ? slidesPromocoes[slideAtivo]?.titulo
          : "Promoções PrimeFit"}
      </h2>

      {slidesPromocoes[slideAtivo]?.tipo === "produto" && (
        <p className="mt-2 text-yellow-400 text-2xl font-black">
          R$ {Number(slidesPromocoes[slideAtivo]?.preco || 0)
            .toFixed(2)
            .replace(".", ",")}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <Link
          href={slidesPromocoes[slideAtivo]?.link || "/produtos"}
          className="bg-yellow-400 text-black px-6 py-3 rounded-xl font-black hover:bg-yellow-300 transition"
        >
          Ver oferta
        </Link>

        <Link
          href={slidesPromocoes[slideAtivo]?.link || "/produtos"}
          className="border-2 border-yellow-400 text-yellow-400 px-6 py-3 rounded-xl font-black hover:bg-yellow-400 hover:text-black transition"
        >
          Comprar agora
        </Link>
      </div>

      <p className="mt-2 text-sm text-gray-200">
        Pagamento e entrega via WhatsApp
      </p>
    </div>

    {/* setas */}
    {slidesPromocoes.length > 1 && (
      <>
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 border border-yellow-400 text-yellow-400 w-10 h-10 rounded-full font-black hover:bg-yellow-400 hover:text-black transition z-10"
          aria-label="Anterior"
        >
          ‹
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 border border-yellow-400 text-yellow-400 w-10 h-10 rounded-full font-black hover:bg-yellow-400 hover:text-black transition z-10"
          aria-label="Próximo"
        >
          ›
        </button>
      </>
    )}

    {/* pontinhos */}
    {slidesPromocoes.length > 1 && (
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
        {slidesPromocoes.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlideAtivo(i)}
            className={`h-2 rounded-full transition ${
              i === slideAtivo ? "w-8 bg-yellow-400" : "w-2 bg-white/50"
            }`}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>
    )}
  </div>
</section>

      {/* ✅ CATEGORIAS (AGORA SOMENTE DO BANCO) */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-center text-yellow-400 font-extrabold tracking-widest text-xl sm:text-2xl">
          CATEGORIAS
        </h2>

        {loadingCategorias ? (
          <p className="text-center text-gray-400 mt-6">Carregando categorias...</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categoriasDB.map((c) => (
              <Link
                key={c.id || c.nome}
                href={`/produtos?cat=${encodeURIComponent(c.nome)}`}
                className="text-center py-3 rounded-xl font-bold border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition"
              >
                {c.nome}
              </Link>
            ))}
          </div>
        )}

        {!loadingCategorias && categoriasDB.length === 0 && (
          <p className="text-center text-gray-400 mt-6">Nenhuma categoria cadastrada ainda.</p>
        )}
      </section>

      {/* OFERTAS */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-center text-yellow-400 font-extrabold tracking-widest text-xl sm:text-2xl">
          OFERTAS ESPECIAIS
        </h2>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {ofertas.map((p) => (
            <div
              key={p.id}
              className="bg-[#111] border border-yellow-400 rounded-2xl hover:scale-[1.03] transition overflow-hidden"
            >
              <div className="relative p-4">
                {p.destaque && (
                  <div className="absolute top-3 left-3 bg-yellow-400 text-black text-xs font-extrabold px-3 py-1 rounded-full">
                    {p.destaque}
                  </div>
                )}

                <div className="bg-black rounded-xl p-3">
                  <img src={p.imagem} alt={p.nome} className="w-full h-40 object-contain" />
                </div>
              </div>

              <div className="px-4 pb-4">
                <p className="text-xs text-gray-300 uppercase tracking-wide min-h-[36px]">{p.nome}</p>

                <p className="mt-3 text-center text-2xl font-extrabold text-yellow-400">
                  R$ {Number(p.preco || 0).toFixed(2).replace(".", ",")}
                </p>

                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/produto/${p.id}`}
                    className="flex-1 text-center bg-yellow-400 text-black py-2 rounded-xl font-bold text-sm hover:bg-yellow-300"
                  >
                    Ver
                  </Link>

                  <Link
                    href={`/produto/${p.id}`}
                    className="flex-1 text-center border border-yellow-400 text-yellow-400 py-2 rounded-xl font-bold text-sm hover:bg-yellow-400 hover:text-black"
                  >
                    Comprar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {ofertas.length === 0 && (
          <p className="text-center text-gray-400 mt-10">Nenhum produto cadastrado ainda.</p>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-yellow-400 py-4 text-center text-sm text-gray-400">
        ©️ {new Date().getFullYear()} PrimeFit Suplementos
      </footer>

      {/* WHATSAPP FIXO */}
      <a
        href="https://wa.me/5598999614108"
        target="_blank"
        className="fixed bottom-5 right-5 bg-yellow-400 text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition"
        aria-label="WhatsApp"
      >
        💬
      </a>
    </div>
  );
}