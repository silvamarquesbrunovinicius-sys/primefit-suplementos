export function flyToCart(fromImgEl) {
  const cart = document.querySelector("#cart-button");
  if (!fromImgEl || !cart) return;

  const imgRect = fromImgEl.getBoundingClientRect();
  const cartRect = cart.getBoundingClientRect();

  const clone = fromImgEl.cloneNode(true);
  clone.style.position = "fixed";
  clone.style.left = imgRect.left + "px";
  clone.style.top = imgRect.top + "px";
  clone.style.width = imgRect.width + "px";
  clone.style.height = imgRect.height + "px";
  clone.style.objectFit = "contain";
  clone.style.zIndex = 9999;
  clone.style.pointerEvents = "none";
  clone.style.transition =
    "transform 650ms cubic-bezier(.2,.8,.2,1), opacity 650ms ease";
  clone.style.borderRadius = "14px";

  document.body.appendChild(clone);

  const dx = cartRect.left + cartRect.width / 2 - (imgRect.left + imgRect.width / 2);
  const dy = cartRect.top + cartRect.height / 2 - (imgRect.top + imgRect.height / 2);

  requestAnimationFrame(() => {
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.15) rotate(10deg)`;
    clone.style.opacity = "0.2";
  });

  setTimeout(() => {
    clone.remove();
  }, 700);
}