// pages/_app.js
import "../styles/globals.css";
import { CarrinhoProvider, useCarrinho } from "../context/CarrinhoContext";
import Toast from "../components/Toast";

function ToastGlobal() {
  const { toast } = useCarrinho();
  return <Toast toast={toast} />;
}

export default function App({ Component, pageProps }) {
  return (
    <CarrinhoProvider>
      <ToastGlobal />
      <Component {...pageProps} />
    </CarrinhoProvider>
  );
}