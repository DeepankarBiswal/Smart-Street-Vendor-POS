// app.js
import { formatINR } from "./money.js";
import { loadCatalog, setCategory, setQuery, onItemClick } from "./catalog.js";
import { Cart } from "./cart.js";
import { createOrderFromCart, totalsFromCart, config } from "./orders.js";
import { exportAll, importAll } from "./orders.js";

import { setDiscountPercent, setTaxPercent } from "./orders.js";

const inpDiscount = document.getElementById("inp-discount");
const inpTax = document.getElementById("inp-tax");

inpDiscount.value = String(config.discountPercent);
inpTax.value = String(config.taxPercent);

const subtotalEl = document.getElementById("cart-subtotal");
const discountPctEl = document.getElementById("cart-discount-pct");
const discountEl = document.getElementById("cart-discount");
const taxPctEl = document.getElementById("cart-tax-pct");
const taxEl = document.getElementById("cart-tax");
const cartTotalEl = document.getElementById("cart-total");
const payCashBtn = document.getElementById("pay-cash");
const payUpiBtn = document.getElementById("pay-upi");

const posDateEl = document.getElementById("pos-date");
const posTotalEl = document.getElementById("pos-total");
const openCartBtn = document.getElementById("open-cart");
const cartDrawer = document.getElementById("cart-drawer");
const cartListEl = cartDrawer.querySelector(".max-h-64");
const searchEl = document.getElementById("search");

const cart = new Cart();

// clock
function updateClock() {
  const now = new Date();
  const opts = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  posDateEl.textContent = now.toLocaleString("en-IN", opts);
}
setInterval(updateClock, 1000);
updateClock();

// totals + cart render
function renderTotals() {
  const t = totalsFromCart(cart);
  posTotalEl.textContent = formatINR(t.total);
  openCartBtn.textContent = `Cart • ${formatINR(t.total)}`;

  subtotalEl.textContent = formatINR(t.subtotal);
  discountEl.textContent = `- ${formatINR(t.discount)}`;
  taxEl.textContent = formatINR(t.tax);
  cartTotalEl.textContent = formatINR(t.total);
}

function clampPct(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}
inpDiscount.addEventListener("input", () => {
  const v = clampPct(inpDiscount.value);
  if (String(v) !== inpDiscount.value) inpDiscount.value = String(v);
  setDiscountPercent(v);
  renderTotals();
});
inpTax.addEventListener("input", () => {
  const v = clampPct(inpTax.value);
  if (String(v) !== inpTax.value) inpTax.value = String(v);
  setTaxPercent(v);
  renderTotals();
});

function renderCart() {
  if (cart.lines.length === 0) {
    cartListEl.innerHTML = `<div class="p-3 text-slate-500 text-sm">No items yet</div>`;
    renderTotals();
    return;
  }
  cartListEl.innerHTML = cart.lines
    .map(
      (l) => `
    <div class="p-3 flex items-center justify-between">
      <div>
        <p class="font-medium">${l.name}</p>
        <p class="text-xs text-slate-500">x${l.qty} • ${formatINR(
        l.unitPaise
      )}</p>
      </div>
      <div class="flex items-center gap-2">
        <button data-dec="${
          l.id
        }" class="px-2 py-1 rounded bg-slate-100">-</button>
        <button data-inc="${
          l.id
        }" class="px-2 py-1 rounded bg-slate-100">+</button>
        <button data-rem="${
          l.id
        }" class="px-2 py-1 rounded bg-rose-100 text-rose-700">Remove</button>
      </div>
    </div>
  `
    )
    .join("");
  renderTotals();
}

// cart list actions
cartListEl.addEventListener("click", (e) => {
  const dec = e.target.closest("[data-dec]");
  const inc = e.target.closest("[data-inc]");
  const rem = e.target.closest("[data-rem]");
  if (dec) {
    cart.dec(dec.dataset.dec);
    renderCart();
  }
  if (inc) {
    cart.add({
      id: inc.dataset.inc,
      name: cart.lines.find((l) => l.id === inc.dataset.inc)?.name,
      pricePaise: cart.lines.find((l) => l.id === inc.dataset.inc)?.unitPaise,
    });
    renderCart();
  }
  if (rem) {
    cart.remove(rem.dataset.rem);
    renderCart();
  }
});

// catalog wiring
await loadCatalog();
onItemClick((item) => {
  cart.add(item);
  renderCart();
});

// category tabs
document.querySelectorAll("nav [data-category]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll("nav [data-category]")
      .forEach((b) => b.classList.remove("bg-slate-900", "text-white"));
    btn.classList.add("bg-slate-900", "text-white");
    setCategory(btn.dataset.category);
  });
});

// search
searchEl.addEventListener("input", (e) => setQuery(e.target.value));

// checkout handler
// function doCheckout(method) {
//   if (cart.lines.length === 0) return;
//   const order = createOrderFromCart(cart, method);
//   // Simple receipt preview
//   alert(
//     `Order ${order.id}\nItems: ${order.items.length}\nTotal: ${formatINR(
//       order.total
//     )}\nPaid: ${method}`
//   );
//   cart.clear();
//   renderCart();
//   // Close drawer after checkout
//   //   cartDrawer.classList.add('translate-y-full');
// }
function doCheckout(method) {
  if (cart.lines.length === 0) return;
  const order = createOrderFromCart(cart, method);
  // Optional: open receipt in new tab
  // After createOrderFromCart(cart, method)
  window.open(`./receipt.html?id=${encodeURIComponent(order.id)}`, "_blank");

  cart.clear();
  renderCart();
  cartDrawer.classList.add("translate-y-full");
}

payCashBtn.addEventListener("click", () => doCheckout("CASH"));
payUpiBtn.addEventListener("click", () => doCheckout("UPI"));

// initial render
renderCart();

//Handlers
const btnBackup = document.getElementById("btn-backup");
const fileRestore = document.getElementById("file-restore");

if (btnBackup) {
  btnBackup.addEventListener("click", () => {
    const data = exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `svpos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

if (fileRestore) {
  fileRestore.addEventListener("change", async () => {
    const file = fileRestore.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      importAll(payload);
      // refresh UI with new config and empty cart
      inpDiscount && (inpDiscount.value = String(config.discountPercent));
      inpTax && (inpTax.value = String(config.taxPercent));
      cart.clear();
      renderCart();
      alert("Restore complete");
    } catch (e) {
      alert("Restore failed: " + e.message);
    } finally {
      fileRestore.value = "";
    }
  });
}
