// pages/admin.js
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { corrigirUrlImagem } from "../lib/imagem";

function brl(valor) {
  const n = Number(valor || 0);
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * ✅ GARANTE que SEMPRE exista "Outro" e "Promoções" na lista,
 * mesmo se o banco ainda não tiver nenhuma categoria cadastrada.
 */
function garantirCategoriasMinimas(arr) {
  const lista = Array.isArray(arr) ? arr : [];

  const temOutro = lista.some(
    (c) => String(c?.slug || "").toLowerCase().trim() === "outro"
  );
  const temPromo = lista.some(
    (c) => String(c?.slug || "").toLowerCase().trim() === "promocoes"
  );

  const base = [];
  if (!temOutro) base.push({ id: "outro", nome: "Outro", slug: "outro", ativo: true });
  if (!temPromo) base.push({ id: "promocoes", nome: "Promoções", slug: "promocoes", ativo: true });

  // remove duplicados por slug
  const seen = new Set();
  const final = [];
  for (const c of [...base, ...lista]) {
    const slug = String(c?.slug || "").toLowerCase().trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    final.push(c);
  }

  final.sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
  return final;
}

export default function Admin() {
  // ===== AUTH / LISTA =====
  const [autorizado, setAutorizado] = useState(false);
  const [senha, setSenha] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [produtos, setProdutos] = useState([]);

  // ===== CATEGORIAS (BANCO) =====
  const [categorias, setCategorias] = useState([]); // [{id,nome,slug}]
  const [novaCategoria, setNovaCategoria] = useState("");

  // ===== IMAGENS UI (ordem/preview) =====
  // item: { key, src, isNew, file }
  const [imagensUI, setImagensUI] = useState([]);

  // ===== FORM =====
  const [form, setForm] = useState({
    id: null,
    nome: "",
    preco: "",
    destaque: "",
    categoria: "Outro",
    descricao: "",
    ativo: true,
    imagem_url: "",
    imagens: [],
  });

  const modoEdicao = useMemo(() => !!form.id, [form.id]);

  // ===== API =====
  async function carregarProdutos(pass = senha) {
    setLoading(true);
    try {
      const r = await fetch("/api/produtos?admin=1", {
        headers: { "x-admin-password": pass },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Erro ao carregar produtos");

      // ✅ normaliza imagens (evita quebrar por URL estranha / duplicada)
      const lista = (Array.isArray(data) ? data : []).map((p) => {
        const imagem_url = corrigirUrlImagem(p.imagem_url || p.imagem || "");
        const imagens = Array.isArray(p.imagens)
          ? p.imagens.map((u) => corrigirUrlImagem(u)).filter(Boolean)
          : [];
        return { ...p, imagem_url, imagens };
      });

      setProdutos(lista);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function carregarCategorias() {
    try {
      const r = await fetch("/api/categorias");
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Erro ao carregar categorias");

      const listaFinal = garantirCategoriasMinimas(data);
      setCategorias(listaFinal);

      // ✅ se a categoria atual do form não existir (ex: banco vazio), volta para "Outro"
      const existe = listaFinal.some((c) => c.nome === form.categoria);
      if (!existe) {
        setForm((f) => ({ ...f, categoria: "Outro" }));
      }
    } catch (e) {
      console.error(e);
      const fallback = garantirCategoriasMinimas([]);
      setCategorias(fallback);

      // ✅ garante que o select sempre tenha "Outro"
      setForm((f) => ({ ...f, categoria: "Outro" }));
    }
  }

  useEffect(() => {
    if (!autorizado) return;
    carregarProdutos();
    carregarCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorizado]);

  async function fazerLogin(e) {
    e.preventDefault();
    if (!senha) return alert("Digite a senha.");

    try {
      const r = await fetch("/api/produtos?admin=1", {
        headers: { "x-admin-password": senha },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Senha inválida");

      const lista = (Array.isArray(data) ? data : []).map((p) => {
        const imagem_url = corrigirUrlImagem(p.imagem_url || p.imagem || "");
        const imagens = Array.isArray(p.imagens)
          ? p.imagens.map((u) => corrigirUrlImagem(u)).filter(Boolean)
          : [];
        return { ...p, imagem_url, imagens };
      });

      setAutorizado(true);
      setProdutos(lista);

      // ✅ carrega categorias ao logar
      carregarCategorias();
    } catch (err) {
      alert(err.message);
    }
  }

  function sair() {
    setAutorizado(false);
    setSenha("");
  }

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function limparFormulario() {
    // limpa blobs pra evitar leak
    imagensUI.forEach((it) => {
      if (it.isNew && it.src?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(it.src);
        } catch {}
      }
    });

    setForm({
      id: null,
      nome: "",
      preco: "",
      destaque: "",
      categoria: "Outro",
      descricao: "",
      ativo: true,
      imagem_url: "",
      imagens: [],
    });

    setImagensUI([]);
  }

  function editarProduto(p) {
    const galeria = Array.isArray(p.imagens) ? p.imagens.filter(Boolean) : [];
    const principal = p.imagem_url ? [p.imagem_url] : [];
    const urls = [...new Set([...principal, ...galeria])]
      .map((u) => corrigirUrlImagem(u))
      .filter(Boolean);

    setForm({
      id: p.id,
      nome: p.nome || "",
      preco: String(p.preco ?? ""),
      destaque: p.destaque || "",
      categoria: p.categoria || "Outro",
      descricao: p.descricao || "",
      ativo: p.ativo !== false,
      imagem_url: corrigirUrlImagem(p.imagem_url || ""),
      imagens: galeria.map((u) => corrigirUrlImagem(u)).filter(Boolean),
    });

    setImagensUI(
      urls.map((src) => ({
        key: uid(),
        src,
        isNew: false,
        file: null,
      }))
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removerProduto(id) {
    if (!confirm("Remover este produto?")) return;

    try {
      const r = await fetch(`/api/produtos?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-password": senha },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Erro ao remover");
      setProdutos((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  // ===== CATEGORIAS (criar/remover no banco) =====
  async function adicionarCategoria() {
    const nome = String(novaCategoria || "").trim();
    if (!nome) return;

    try {
      const r = await fetch("/api/categorias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": senha,
        },
        body: JSON.stringify({ nome }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Erro ao criar categoria");

      const listaFinal = garantirCategoriasMinimas([...categorias, data]);
      setCategorias(listaFinal);

      setForm((f) => ({ ...f, categoria: data.nome }));
      setNovaCategoria("");
    } catch (e) {
      alert(e.message);
    }
  }

  async function removerCategoria(cat) {
    if (!cat?.id) return;
    if (!confirm(`Remover a categoria "${cat.nome}"?`)) return;

    try {
      const r = await fetch(`/api/categorias?id=${encodeURIComponent(cat.id)}`, {
        method: "DELETE",
        headers: { "x-admin-password": senha },
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Erro ao remover categoria");

      const listaFinal = garantirCategoriasMinimas(
        categorias.filter((c) => c.id !== cat.id)
      );
      setCategorias(listaFinal);

      setForm((f) => ({
        ...f,
        categoria: f.categoria === cat.nome ? "Outro" : f.categoria,
      }));
    } catch (e) {
      alert(e.message);
    }
  }

  // ===== UPLOAD: envia apenas os NOVOS, mantendo ordem =====
  async function uploadImagensOrdenadas(produtoIdParaPasta, filesOrdenados) {
    if (!filesOrdenados || filesOrdenados.length === 0) return { publicUrls: [] };

    setUploading(true);
    try {
      const fd = new FormData();
      filesOrdenados.forEach((file) => fd.append("files", file));
      if (produtoIdParaPasta) fd.append("produtoId", String(produtoIdParaPasta));

      const r = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-password": senha },
        body: fd,
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Erro no upload");

      // ✅ corrige retorno do backend (ex: .webp.webp)
      const publicUrls = (data.publicUrls || [])
        .map((u) => corrigirUrlImagem(u))
        .filter(Boolean);

      return { publicUrls };
    } finally {
      setUploading(false);
    }
  }

  async function adicionarOuSalvar(e) {
    e.preventDefault();

    const nome = String(form.nome || "").trim();
    const preco = Number(String(form.preco || "").replace(",", "."));

    if (!nome) return alert("Informe o nome do produto.");
    if (!preco || preco <= 0) return alert("Informe um preço válido.");

    const criando = !form.id;
    if (criando && imagensUI.length === 0) {
      return alert("Selecione pelo menos 1 imagem antes de salvar.");
    }

    try {
      setLoading(true);

      // 1) arquivos novos na ordem atual
      const novosOrdenados = imagensUI
        .filter((i) => i.isNew && i.file)
        .map((i) => i.file);

      // 2) upload só dos novos
      const { publicUrls: urlsNovas } = await uploadImagensOrdenadas(
        form.id || "novo",
        novosOrdenados
      );

      // 3) monta URLs finais respeitando a ordem da UI
      let idxNova = 0;
      const urlsFinais = imagensUI
        .map((item) => {
          if (item.isNew) {
            const u = urlsNovas[idxNova++];
            return u || null;
          }
          return item.src;
        })
        .map((u) => corrigirUrlImagem(u))
        .filter(Boolean);

      const imagemPrincipalFinal =
        urlsFinais[0] || corrigirUrlImagem(form.imagem_url) || null;

      const payload = {
        id: form.id,
        nome,
        preco,
        categoria: form.categoria || "Outro",
        destaque: (form.destaque || "").trim() || null,
        descricao: (form.descricao || "").trim() || null,
        ativo: form.ativo !== false,
        imagem_url: imagemPrincipalFinal,
        imagens: urlsFinais.length ? urlsFinais : null,
      };

      const method = form.id ? "PUT" : "POST";

      const r = await fetch("/api/produtos", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": primefit123,
        },
        body: JSON.stringify(payload),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Erro ao salvar");

      const itemSalvo = {
        ...data,
        imagem_url: corrigirUrlImagem(data.imagem_url || ""),
        imagens: Array.isArray(data.imagens)
          ? data.imagens.map((u) => corrigirUrlImagem(u)).filter(Boolean)
          : [],
      };

      setProdutos((prev) => {
        if (form.id) return prev.map((p) => (p.id === itemSalvo.id ? itemSalvo : p));
        return [itemSalvo, ...prev];
      });

      limparFormulario();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ===== LOGIN =====
  if (!autorizado) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#111] border border-yellow-400 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="PrimeFit" className="h-14" />
            <div>
              <h1 className="text-yellow-400 font-black text-xl tracking-widest">ADMIN</h1>
              <p className="text-gray-400 text-sm">Acesso restrito</p>
            </div>
          </div>

          <form onSubmit={fazerLogin} className="mt-6">
            <label className="text-sm text-gray-300 font-semibold">
              Senha do administrador
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full mt-2 bg-black border border-yellow-400/60 rounded-xl px-4 py-2 outline-none"
              placeholder="Digite a senha"
            />

            <button
              type="submit"
              className="w-full mt-4 bg-yellow-400 text-black py-3 rounded-xl font-black hover:bg-yellow-300 transition"
            >
              Entrar
            </button>

            <Link
              href="/"
              className="block text-center mt-4 text-yellow-400 hover:text-yellow-300 font-semibold"
            >
              Voltar para Home
            </Link>
          </form>
        </div>
      </div>
    );
  }

  // ===== PAINEL =====
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="PrimeFit" className="h-14 sm:h-16" />
            <span className="font-black tracking-widest text-yellow-400 text-lg sm:text-2xl">
              PRIMEFIT • ADMIN
            </span>
          </div>

          <nav className="flex items-center gap-2 flex-wrap">
            <Link
              href="/"
              className="px-4 py-2 rounded-full border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition text-sm font-semibold"
            >
              Home
            </Link>

            <Link
              href="/produtos"
              className="px-4 py-2 rounded-full border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition text-sm font-semibold"
            >
              Vitrine
            </Link>

            <button
              onClick={sair}
              className="px-4 py-2 rounded-full bg-yellow-400 text-black hover:bg-yellow-300 transition text-sm font-black"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-yellow-400 font-black text-2xl">Cadastro de Produtos</h1>

          <button
            onClick={() => {
              carregarProdutos();
              carregarCategorias();
            }}
            className="px-4 py-2 rounded-xl border border-yellow-400 text-yellow-400 font-black hover:bg-yellow-400 hover:text-black transition"
          >
            {loading ? "Atualizando..." : "Atualizar lista"}
          </button>
        </div>

        <form
          onSubmit={adicionarOuSalvar}
          className="mt-6 bg-[#111] border border-yellow-400 rounded-2xl p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 font-semibold">Nome</label>
              <input
                name="nome"
                value={form.nome}
                onChange={onChange}
                className="w-full mt-1 bg-black border border-yellow-400/60 rounded-xl px-4 py-2 outline-none"
                placeholder="Ex: Whey Protein 900g"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 font-semibold">Preço</label>
              <input
                name="preco"
                value={form.preco}
                onChange={onChange}
                className="w-full mt-1 bg-black border border-yellow-400/60 rounded-xl px-4 py-2 outline-none"
                placeholder="Ex: 89.90"
              />
            </div>

            {/* CATEGORIA (BANCO) */}
            <div>
              <label className="text-sm text-gray-300 font-semibold">Categoria</label>

              <select
                name="categoria"
                value={form.categoria}
                onChange={onChange}
                className="w-full mt-1 bg-black border border-yellow-400/60 rounded-xl px-4 py-2 outline-none"
              >
                {categorias.map((c) => (
                  <option key={c.id || c.slug} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
                {!categorias.length && <option value="Outro">Outro</option>}
              </select>

              <div className="mt-3 flex gap-2">
                <input
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                  className="flex-1 bg-black border border-yellow-400/60 rounded-xl px-4 py-2 outline-none"
                  placeholder="Nova categoria (ex: Barras...)"
                />
                <button
                  type="button"
                  onClick={adicionarCategoria}
                  className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-black hover:bg-yellow-300 transition"
                >
                  Adicionar
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {categorias
                  .filter((c) => c.slug !== "promocoes" && c.slug !== "outro")
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => removerCategoria(c)}
                      className="text-xs px-3 py-1 rounded-full border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black transition"
                      title="Remover categoria"
                    >
                      {c.nome} ✕
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300 font-semibold">Destaque (opcional)</label>
              <input
                name="destaque"
                value={form.destaque}
                onChange={onChange}
                className="w-full mt-1 bg-black border border-yellow-400/60 rounded-xl px-4 py-2 outline-none"
                placeholder="Ex: 🔥 Mais vendido"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-300 font-semibold">Descrição</label>
              <input
                name="descricao"
                value={form.descricao}
                onChange={onChange}
                className="w-full mt-1 bg-black border border-yellow-400/60 rounded-xl px-4 py-2 outline-none"
                placeholder="Ex: Creatina pura 300g"
              />
            </div>

            {/* IMAGENS */}
            <div className="md:col-span-2">
              <label className="text-sm text-gray-300 font-semibold">
                Imagens do produto (JPG/PNG/WEBP) — pode selecionar várias
              </label>

              <div className="mt-2">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;

                    const novos = files.map((file) => ({
                      key: uid(),
                      src: URL.createObjectURL(file),
                      file,
                      isNew: true,
                    }));

                    setImagensUI((prev) => [...prev, ...novos]);
                    e.target.value = "";
                  }}
                  className="w-full bg-black border border-yellow-400/60 rounded-xl px-4 py-2 outline-none"
                />

                {!!imagensUI.length && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {imagensUI.map((img, index) => (
                      <div
                        key={img.key}
                        draggable
                        onDragStart={(ev) => {
                          ev.dataTransfer.setData("text/plain", String(index));
                        }}
                        onDragOver={(ev) => ev.preventDefault()}
                        onDrop={(ev) => {
                          ev.preventDefault();
                          const from = Number(ev.dataTransfer.getData("text/plain"));
                          const to = index;
                          if (Number.isNaN(from) || from === to) return;

                          setImagensUI((prev) => {
                            const arr = [...prev];
                            const [moved] = arr.splice(from, 1);
                            arr.splice(to, 0, moved);
                            return arr;
                          });
                        }}
                        className={`bg-black border rounded-xl p-2 relative ${
                          index === 0 ? "border-yellow-400" : "border-yellow-400/40"
                        }`}
                        title="Arraste para ordenar • Clique para tornar principal"
                      >
                        {index === 0 && (
                          <span className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-full">
                            PRINCIPAL
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setImagensUI((prev) => {
                              const alvo = prev[index];
                              if (alvo?.isNew && alvo?.src?.startsWith("blob:")) {
                                try {
                                  URL.revokeObjectURL(alvo.src);
                                } catch {}
                              }
                              return prev.filter((_, i) => i !== index);
                            });
                          }}
                          className="absolute top-2 right-2 bg-black/70 border border-red-500 text-red-400 w-8 h-8 rounded-full font-black hover:bg-red-500 hover:text-black transition"
                          aria-label="Remover imagem"
                          title="Remover"
                        >
                          ×
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setImagensUI((prev) => {
                              const arr = [...prev];
                              const [item] = arr.splice(index, 1);
                              arr.unshift(item);
                              return arr;
                            });
                          }}
                          className="block w-full"
                        >
                          <img
                            src={img.src}
                            alt={`preview-${index}`}
                            className="w-full h-24 object-contain"
                          />
                          <p className="mt-2 text-[10px] text-gray-500 text-center">
                            {index === 0 ? "Principal" : "Clique p/ principal"} • Arraste p/ ordenar
                          </p>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                As imagens serão enviadas para o Supabase Storage (bucket <b>produtos</b>). A primeira vira a imagem principal.
              </p>
            </div>

            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <input type="checkbox" name="ativo" checked={!!form.ativo} onChange={onChange} />
              <span className="text-sm text-gray-300">Produto ativo (aparece no site)</span>
            </div>
          </div>

          <div className="mt-5 flex gap-3 flex-wrap">
            <button
              type="submit"
              disabled={loading || uploading}
              className="bg-yellow-400 text-black px-6 py-3 rounded-xl font-black hover:bg-yellow-300 transition disabled:opacity-60"
            >
              {uploading ? "Enviando..." : modoEdicao ? "Salvar alterações" : "Adicionar produto"}
            </button>

            <button
              type="button"
              onClick={limparFormulario}
              className="px-6 py-3 rounded-xl border border-yellow-400 text-yellow-400 font-black hover:bg-yellow-400 hover:text-black transition"
            >
              Limpar formulário
            </button>
          </div>
        </form>

        <section className="mt-10">
          <h2 className="text-yellow-400 font-black text-xl mb-4">
            Produtos cadastrados ({produtos.length})
          </h2>

          {loading && <p className="text-gray-400 mb-4">Carregando...</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {produtos.map((p) => (
              <div key={p.id} className="bg-[#111] border border-yellow-400 rounded-2xl p-4">
                <div className="bg-black rounded-xl p-3 flex items-center justify-center">
                  <img
                    src={corrigirUrlImagem(p.imagem_url) || "/produtos/whey.png"}
                    alt={p.nome}
                    className="h-32 object-contain"
                  />
                </div>

                <div className="mt-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="inline-block border border-yellow-400 text-yellow-400 text-xs font-black px-3 py-1 rounded-full">
                      {p.categoria || "Outro"}
                    </span>

                    {p.destaque ? (
                      <span className="inline-block bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full">
                        {p.destaque}
                      </span>
                    ) : null}

                    {p.ativo === false ? (
                      <span className="inline-block border border-red-500 text-red-400 text-xs font-black px-3 py-1 rounded-full">
                        INATIVO
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-2 font-black">{p.nome}</h3>
                  <p className="text-yellow-400 font-black text-lg mt-1">{brl(p.preco)}</p>
                  {p.descricao ? (
                    <p className="text-sm text-gray-300 mt-1">{p.descricao}</p>
                  ) : null}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => editarProduto(p)}
                    className="flex-1 bg-yellow-400 text-black py-2 rounded-xl font-black hover:bg-yellow-300 transition"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => removerProduto(p.id)}
                    className="flex-1 border border-red-500 text-red-400 py-2 rounded-xl font-black hover:bg-red-500 hover:text-black transition"
                  >
                    Remover
                  </button>
                </div>

                <Link
                  href={`/produto/${p.id}`}
                  className="mt-3 block text-center border border-yellow-400 text-yellow-400 py-2 rounded-xl font-black hover:bg-yellow-400 hover:text-black transition"
                >
                  Ver no site
                </Link>
              </div>
            ))}
          </div>

          {produtos.length === 0 && !loading && (
            <p className="text-gray-400 mt-6">Nenhum produto cadastrado ainda.</p>
          )}
        </section>
      </main>
    </div>
  );
}