import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCarrinho } from "../../context/CarrinhoContext";
import { flyToCart } from "../../lib/flyToCart";
import CartButton from "../../components/CartButton";
import Head from "next/head";

function brl(valor) {
  const n = Number(valor || 0);
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

function quebraLinhas(texto) {
  if (!texto) return [];
  return String(texto).split("\n").filter(Boolean);
}

/** ✅ garante que "imagens" vire array (mesmo se vier string JSON do banco) */
function parseImagens(valor) {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor.filter(Boolean);

  if (typeof valor === "string") {
    try {
      const parsed = JSON.parse(valor);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // se não for JSON, ignora
    }
  }
  return [];
}

export default function ProdutoDetalhe() {
  const router = useRouter();
  const { id } = router.query;

  const { adicionarProduto } = useCarrinho();

  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState([]);

  const [qtd, setQtd] = useState(1);
  const [sabor, setSabor] = useState("Padrão");

  // ✅ galeria
  const [imgAtiva, setImgAtiva] = useState(0);
  const imgRef = useRef(null);

  // ✅ Busca todos os produtos do BANCO via API pública
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);

        const r = await fetch("/api/produtos");
        const data = await r.json();

        if (!r.ok) throw new Error(data?.error || "Erro ao buscar produtos");

        const lista = (Array.isArray(data) ? data : []).map((p) => {
          const imagensArr = parseImagens(p.imagens);
          const imagemPrincipal =
            p.imagem_url || p.imagem || p.image || "/produtos/whey.png";

          const galeria =
            imagensArr.length > 0 ? imagensArr : imagemPrincipal ? [imagemPrincipal] : [];

          return {
            id: p.id,
            nome: p.nome ?? "Produto",
            preco: Number(p.preco ?? 0),

            // ✅ IMPORTANTE: manter imagem_url e também imagem (para não quebrar layout)
            imagem_url: p.imagem_url || null,
            imagem: imagemPrincipal,

            // ✅ galeria
            imagens: galeria,

            marca: p.marca || "PrimeFit",
            categoria: p.categoria || "Suplementos",
            unidade: p.unidade || "Unidade",
            condicao: p.condicao || "Novo",
            destaque: p.destaque || "",
            descricao: p.descricao || "",
            descricaoLonga: p.descricaoLonga || "",
            sabores:
              Array.isArray(p.sabores) && p.sabores.length ? p.sabores : ["Padrão"],
            ativo: p.ativo !== false,
          };
        });

        setProdutos(lista);
      } catch (e) {
        console.error(e);
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const produto = useMemo(() => {
    if (!id) return null;
    return produtos.find((p) => String(p.id) === String(id)) || null;
  }, [id, produtos]);

  // ✅ reset quando trocar produto
  useEffect(() => {
    if (!produto) return;
    setQtd(1);
    setImgAtiva(0);
    if (produto?.sabores?.length) setSabor(produto.sabores[0]);
  }, [produto]);

  const precoNumero = Number(produto?.preco ?? 0);
  const total = precoNumero * qtd;

  const whatsappLink = useMemo(() => {
    if (!produto) return "#";

    const msg =
      `Olá! Gostaria de fazer um pedido:\n\n` +
      `Produto: ${produto.nome}\n` +
      `Sabor: ${sabor}\n` +
      `Quantidade: ${qtd}\n` +
      `Valor unitário: ${brl(precoNumero)}\n` +
      `Total: ${brl(total)}\n\n` +
      `Link do produto: ${typeof window !== "undefined" ? window.location.href : ""}`;

    return `https://wa.me/5598999614108?text=${encodeURIComponent(msg)}`;
  }, [produto, qtd, precoNumero, total, sabor]);

  if (!id || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-yellow-400 font-bold">Carregando...</p>
      </div>
    );
  }

  // Produto não encontrado
  if (!produto) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-yellow-400 font-bold text-lg">Produto não encontrado</p>
          <p className="text-gray-400 text-sm mt-2">Ele pode estar inativo ou não existe no banco.</p>
          <Link
            href="/produtos"
            className="inline-block mt-4 px-6 py-2 rounded-xl bg-yellow-400 text-black font-bold"
          >
            Voltar para produtos
          </Link>
        </div>
      </div>
    );
  }

  const sugestoes = produtos
    .filter((p) => p.id !== produto.id && p.ativo !== false)
    .slice(0, 6);

  const linhasDescricao = quebraLinhas(produto.descricaoLonga || produto.descricao);

  const imagens = Array.isArray(produto.imagens) ? produto.imagens : [];
  const imagemPrincipal = imagens[imgAtiva] || produto.imagem || "/produtos/whey.png";

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>{produto ? `${produto.nome} | PrimeFit Suplementos` : "Produto | PrimeFit Suplementos"}</title>

        <meta
          name="description"
          content={produto?.descricao || `Compre ${produto?.nome} com preço especial na PrimeFit Suplementos.`}
        />

        {/* Open Graph */}
        <meta property="og:title" content={`${produto?.nome || "Produto"} | PrimeFit`} />
        <meta
          property="og:description"
          content={produto?.descricao || `Confira ${produto?.nome} com preço especial na PrimeFit.`}
        />
        <meta property="og:image" content={imagemPrincipal} />
        <meta property="og:type" content="product" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${produto?.nome || "Produto"} | PrimeFit`} />
        <meta
          name="twitter:description"
          content={produto?.descricao || `Compre ${produto?.nome} na PrimeFit Suplementos.`}
        />
        <meta name="twitter:image" content={imagemPrincipal} />
      </Head>

      {/* HEADER */}
      <header className="border-b border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <img src="/logo.png" alt="PrimeFit" className="h-14 sm:h-16" />
            <span className="font-black tracking-widest text-yellow-400 text-lg sm:text-2xl">
              PRIMEFIT SUPLEMENTOS
            </span>
          </Link>

          {/* ✅ sem nav duplicado */}
          <nav className="flex items-center gap-3">
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

      {/* CONTEÚDO */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-semibold"
          >
            ← Voltar
          </Link>

          <span className="text-xs text-gray-400">
            Código: <b className="text-yellow-400">#{produto.id}</b>
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* IMAGEM */}
          <div className="bg-[#111] border border-yellow-400 rounded-2xl p-4">
            <div className="bg-black rounded-xl p-6 flex items-center justify-center relative">
              {produto.destaque && (
                <div className="absolute top-4 left-4 bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full">
                  {produto.destaque}
                </div>
              )}

              <img
                ref={imgRef}
                src={imagemPrincipal}
                alt={produto.nome}
                className="w-full max-w-md h-[380px] object-contain"
              />
            </div>

            {/* ✅ THUMBS fora do container preto (pra não quebrar layout) */}
            {imagens.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-2">
                {imagens.slice(0, 10).map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setImgAtiva(i)}
                    className={`bg-black border rounded-xl p-2 transition ${
                      i === imgAtiva
                        ? "border-yellow-400"
                        : "border-yellow-400/30 hover:border-yellow-400/80"
                    }`}
                    aria-label={`Imagem ${i + 1}`}
                    type="button"
                  >
                    <img src={src} alt={`thumb-${i}`} className="w-full h-14 object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DETALHES */}
          <div className="bg-[#111] border border-yellow-400 rounded-2xl p-6">
            <h1 className="text-2xl sm:text-3xl font-black leading-tight">{produto.nome}</h1>

            {produto.descricao && <p className="mt-2 text-gray-300">{produto.descricao}</p>}

            <div className="mt-5 text-yellow-400 text-3xl font-black">{brl(precoNumero)}</div>

            {/* Sabor */}
            <div className="mt-6">
              <p className="text-gray-300 font-semibold text-sm mb-2">Sabor</p>
              <div className="flex flex-wrap gap-2">
                {(produto.sabores || ["Padrão"]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSabor(s)}
                    className={`px-3 py-1 rounded-full text-sm font-bold border transition ${
                      sabor === s
                        ? "bg-yellow-400 text-black border-yellow-400"
                        : "border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                    }`}
                    type="button"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantidade */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-gray-300 font-semibold">Quantidade</span>

              <div className="flex items-center bg-black border border-yellow-400 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQtd((v) => Math.max(1, v - 1))}
                  className="px-4 py-2 text-yellow-400 font-black hover:bg-yellow-400 hover:text-black transition"
                  type="button"
                >
                  –
                </button>

                <div className="px-5 py-2 font-bold">{qtd}</div>

                <button
                  onClick={() => setQtd((v) => v + 1)}
                  className="px-4 py-2 text-yellow-400 font-black hover:bg-yellow-400 hover:text-black transition"
                  type="button"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="mt-4 text-gray-300">
              <span className="font-semibold">Total: </span>
              <span className="text-yellow-400 font-black">{brl(total)}</span>
            </div>

            {/* Botões */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  // ✅ animação voando: usa a IMG real da página
                  flyToCart(imgRef.current);
                  adicionarProduto({ ...produto, preco: precoNumero, qtd, sabor });
                }}
                className="bg-yellow-400 text-black py-3 rounded-xl font-black hover:bg-yellow-300 transition"
                type="button"
              >
                Adicionar ao pedido
              </button>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="border border-green-500 text-green-400 py-3 rounded-xl font-black text-center hover:bg-green-500 hover:text-black transition"
              >
                Pedir pelo WhatsApp
              </a>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              * Pagamento e entrega são combinados via WhatsApp.
            </p>
          </div>
        </div>

        {/* Descrição */}
        <section className="mt-10 bg-[#111] border border-yellow-400 rounded-2xl p-6">
          <h2 className="text-lg font-black text-yellow-400">Descrição</h2>

          {linhasDescricao.length ? (
            <ul className="mt-3 space-y-2 text-gray-300">
              {linhasDescricao.map((linha, idx) => (
                <li key={idx} className="leading-relaxed">
                  {linha.startsWith("-") ? "✅ " + linha.replace(/^-+\s?/, "") : linha}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-gray-300">Produto sem descrição detalhada.</p>
          )}
        </section>

        {/* Sugestões */}
        <section className="mt-10">
          <h3 className="text-yellow-400 font-black text-xl">Você também pode gostar</h3>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {sugestoes.map((p) => (
              <div key={p.id} className="bg-[#111] border border-yellow-400 rounded-2xl p-3">
                <div className="bg-black rounded-xl p-3">
                  <img
                    src={p.imagem || p.imagem_url || "/produtos/whey.png"}
                    alt={p.nome}
                    className="w-full h-24 object-contain"
                  />
                </div>

                <p className="mt-3 text-xs text-gray-300 uppercase min-h-[32px]">{p.nome}</p>

                <p className="mt-2 text-center font-black text-yellow-400">
                  {brl(Number(p.preco || 0))}
                </p>

                <Link
                  href={`/produto/${p.id}`}
                  className="mt-3 block text-center bg-yellow-400 text-black py-2 rounded-xl font-black text-sm hover:bg-yellow-300 transition"
                >
                  Ver
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* WHATSAPP FIXO */}
      <a
        href="https://wa.me/5598999614108"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 bg-yellow-400 text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition"
        aria-label="WhatsApp"
      >
        💬
      </a>
    </div>
  );
}