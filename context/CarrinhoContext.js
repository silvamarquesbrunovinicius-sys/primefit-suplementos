// context/CarrinhoContext.js
import { createContext, useContext, useMemo, useState } from "react";

const CarrinhoContext = createContext(null);

export function CarrinhoProvider({ children }) {
  const [itens, setItens] = useState([]);
  const [lastAddedAt, setLastAddedAt] = useState(0);

  const totalItens = useMemo(
    () => (itens || []).reduce((acc, i) => acc + Number(i.qtd || 0), 0),
    [itens]
  );

  const totalValor = useMemo(
    () =>
      (itens || []).reduce(
        (acc, i) => acc + Number(i.preco || 0) * Number(i.qtd || 0),
        0
      ),
    [itens]
  );

  function adicionarProduto(produto) {
    const id = produto?.id;
    if (!id) return;

    const qtdAdd = Math.max(1, Number(produto.qtd || 1));
    const saborAdd = produto.sabor ?? "";

    setItens((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const idx = arr.findIndex(
        (p) => String(p.id) === String(id) && String(p.sabor || "") === String(saborAdd)
      );

      if (idx >= 0) {
        const novo = [...arr];
        novo[idx] = {
          ...novo[idx],
          qtd: Number(novo[idx].qtd || 0) + qtdAdd,
          sabor: saborAdd,
        };
        return novo;
      }

      return [
        ...arr,
        {
          id,
          nome: produto.nome || "Produto",
          preco: Number(produto.preco || 0),
          imagem: produto.imagem || produto.imagem_url || "/produtos/whey.png",
          qtd: qtdAdd,
          sabor: saborAdd,
        },
      ];
    });

    setLastAddedAt(Date.now());
  }

  // alias (mantém compatibilidade com páginas antigas)
  const adicionarItem = adicionarProduto;

  function alterarQtd(id, novaQtd, sabor = "") {
    const q = Number(novaQtd || 0);

    setItens((prev) => {
      const arr = Array.isArray(prev) ? prev : [];

      if (q <= 0) {
        return arr.filter(
          (p) =>
            !(
              String(p.id) === String(id) &&
              String(p.sabor || "") === String(sabor || "")
            )
        );
      }

      return arr.map((p) => {
        const mesmaLinha =
          String(p.id) === String(id) && String(p.sabor || "") === String(sabor || "");
        return mesmaLinha ? { ...p, qtd: q } : p;
      });
    });
  }

  function removerItem(id, sabor = "") {
    setItens((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.filter(
        (p) =>
          !(
            String(p.id) === String(id) &&
            String(p.sabor || "") === String(sabor || "")
          )
      );
    });
  }

  function limparCarrinho() {
    setItens([]);
  }

  const value = useMemo(
    () => ({
      itens,
      adicionarProduto,
      adicionarItem,
      alterarQtd,
      removerItem,
      limparCarrinho,
      totalItens,
      totalValor,
      lastAddedAt,
    }),
    [itens, totalItens, totalValor, lastAddedAt]
  );

  return (
    <CarrinhoContext.Provider value={value}>
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error("useCarrinho deve ser usado dentro de <CarrinhoProvider>");
  return ctx;
}