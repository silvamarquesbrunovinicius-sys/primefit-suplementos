export default function Toast({ toast }) {
  if (!toast?.show) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999]">
      <div className="bg-black/90 border border-yellow-400 text-white px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm flex items-center gap-3 animate-[toastIn_.25s_ease-out]">
        <div className="w-9 h-9 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black">
          ✓
        </div>

        <div className="leading-tight">
          <p className="font-black text-yellow-400 text-sm">{toast.title || "Adicionado!"}</p>
          <p className="text-xs text-gray-200">{toast.message || ""}</p>
        </div>
      </div>
    </div>
  );
}