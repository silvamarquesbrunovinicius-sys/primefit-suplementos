// lib/imagem.js

export function corrigirUrlImagem(url) {
  if (!url) return "/produtos/whey.png";

  let u = String(url).trim();

  if (u === "null" || u === "undefined") return "/produtos/whey.png";

  // espaços
  u = u.replace(/\s/g, "%20");

  // remove extensão duplicada: .webp.webp / .jpg.jpg / .png.png / .jpeg.jpeg
  u = u.replace(/(\.(webp|png|jpg|jpeg))\.\2$/i, "$1");
  // com querystring
  u = u.replace(/(\.(webp|png|jpg|jpeg))\.\2(\?.*)$/i, "$1$3");

  return u;
}

export function pegarImagemProduto(p) {
  const principal =
    p?.imagem_url ||
    p?.imagem ||
    (Array.isArray(p?.imagens) ? p.imagens[0] : "") ||
    "";

  return corrigirUrlImagem(principal);
}