import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { corrigirUrlImagem } from "../lib/imagem";
import CartButton from "../components/CartButton";

/** normaliza texto (acentos/caixa/espaços) */
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

const CATEGORIAS_FALLBACK = [
  "Whey",
  "Creatinas",
  "Pré-treino",
  "Emagrecedores",
  "Vitaminas",
  "Combos",
  "Promoções",
  "Outro",
];

export default function Home() {
  const [listaProdutos, setListaProdutos] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [slideAtivo, setSlideAtivo] = useState(0);

  const [categoriasDB, setCategoriasDB] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  const [erroCategorias, setErroCategorias] = useState("");
  const [erroProdutos, setErroProdutos] = useState("");

  // ✅ Produtos
  useEffect(() => {
    async function carregarProdutos() {
      try {
        setErroProdutos("");
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
            imagem: corrigirUrlImagem(p.imagem_url || p.imagem),
            imagens: Array.isArray(p.imagens) ? p.imagens.map(corrigirUrlImagem) : [],
          }));

        setListaProdutos(lista);
        setOfertas(lista.slice(0, 4));
      } catch (err) {
        console.error(err);
        setErroProdutos(err.message || "Erro ao carregar produtos");
        setListaProdutos([]);
        setOfertas([]);
      }
    }

    carregarProdutos();
  }, []);

  // ✅ Categorias
  useEffect(() => {
    async function carregarCategorias() {
      try {
        setLoadingCategorias(true);
        setErroCategorias("");

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

        unicas.sort((a, b) => a.nome.localeCompare(b.nome));
        setCategoriasDB(unicas);
      } catch (e) {
        console.error(e);
        setErroCategorias(e.message || "Erro ao carregar categorias");
        setCategoriasDB([]);
      } finally {
        setLoadingCategorias(false);
      }
    }

    carregarCategorias();
  }, []);

  // ✅ Slides do carrossel: só Promoções
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

  useEffect(() => setSlideAtivo(0), [slidesPromocoes.length]);

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

  // ✅ se não veio do banco, usa fallback (igual antes)
  const categoriasParaMostrar =
    !loadingCategorias && categoriasDB.length > 0
      ? categoriasDB.map((c) => c.nome)
      : CATEGORIAS_FALLBACK;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER - igual antes */}
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

      {/* CARROSSEL */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative rounded-2xl overflow-hidden border border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.15)] bg-black">
          <img
            src={slidesPromocoes[slideAtivo]?.imagem || "/banner.jpg"}
            alt="Promoções PrimeFit"
            className="w-full h-[240px] sm:h-[340px] md:h-[420px] object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="bg-yellow-400 text-black text-xs sm:text-sm font-black px-3 py-1 rounded-full">
              🔥 PROMOÇÕES
            </span>

            {slidesPromocoes[slideAtivo]?.tipo === "produto" && (
              <span className="border border-yellow-400 text-yellow-400 text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full bg-black/50">
                OFERTA DO DIA
              </span>
            )}
          </div>

          <div className="absolute inset-0 flex items-end">
            <div className="w-full p-5 sm:p-8 md:p-10">
              {slidesPromocoes[slideAtivo]?.tipo === "produto" ? (
                <>
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white max-w-3xl">
                    {slidesPromocoes[slideAtivo]?.titulo}
                  </h2>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="text-yellow-400 text-xl sm:text-3xl font-black">
                      R$ {Number(slidesPromocoes[slideAtivo]?.preco || 0).toFixed(2).replace(".", ",")}
                    </span>

                    <span className="text-xs sm:text-sm text-gray-200 bg-black/50 border border-white/10 px-3 py-1 rounded-full">
                      Pagamento e entrega via WhatsApp
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
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
                </>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white max-w-3xl">
                    {slidesPromocoes[slideAtivo]?.titulo || "Promoções PrimeFit"}
                  </h2>

                  <p className="mt-3 text-gray-200 text-sm sm:text-base max-w-2xl">
                    {slidesPromocoes[slideAtivo]?.subtitulo || "Confira nossas promoções e ofertas especiais"}
                  </p>

                  <div className="mt-5">
                    <Link
                      href={slidesPromocoes[slideAtivo]?.link || "/produtos"}
                      className="bg-yellow-400 text-black px-7 py-3 rounded-xl font-black hover:bg-yellow-300 transition"
                    >
                      Ver produtos
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {slidesPromocoes.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/70 border border-yellow-400 text-yellow-400 w-11 h-11 rounded-full font-black hover:bg-yellow-400 hover:text-black transition"
                aria-label="Anterior"
              >
                ‹
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/70 border border-yellow-400 text-yellow-400 w-11 h-11 rounded-full font-black hover:bg-yellow-400 hover:text-black transition"
                aria-label="Próximo"
              >
                ›
              </button>
            </>
          )}
        </div>
      </section>

      {/* CATEGORIAS - com fallback (não some mais) */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-center text-yellow-400 font-extrabold tracking-widest text-xl sm:text-2xl">
          CATEGORIAS
        </h2>

        {erroCategorias && (
          <p className="text-center text-red-400 mt-3 text-sm">
            {erroCategorias} (mostrando categorias padrão)
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categoriasParaMostrar.map((nome) => (
            <Link
              key={nome}
              href={`/produtos?cat=${encodeURIComponent(nome)}`}
              className="text-center py-3 rounded-xl font-bold border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition"
            >
              {nome}
            </Link>
          ))}
        </div>
      </section>

      {/* OFERTAS */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-center text-yellow-400 font-extrabold tracking-widest text-xl sm:text-2xl">
          OFERTAS ESPECIAIS
        </h2>

        {erroProdutos && (
          <p className="text-center text-red-400 mt-3 text-sm">{erroProdutos}</p>
        )}

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

        {ofertas.length === 0 && !erroProdutos && (
          <p className="text-center text-gray-400 mt-10">Nenhum produto cadastrado ainda.</p>
        )}
      </section>

      <footer className="border-t border-yellow-400 py-4 text-center text-sm text-gray-400">
        ©️ {new Date().getFullYear()} PrimeFit Suplementos
      </footer>

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