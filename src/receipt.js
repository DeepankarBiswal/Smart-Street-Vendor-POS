import { formatINR } from "./money.js";

// Storage key (must match orders.js)
const ORDERS_KEY = "svpos.orders.v1";

// Helpers
function getLastOrderById(id) {
  const all = safeJson(localStorage.getItem(ORDERS_KEY), []);
  return all.find((o) => o && o.id === id) || null;
}
function safeJson(text, fallback) {
  try {
    return JSON.parse(text ?? "");
  } catch {
    return fallback;
  }
}
const $ = (id) => document.getElementById(id);

// Read id from URL
const qs = new URLSearchParams(location.search);
const id = qs.get("id");

// Normalize a line to ensure unitPaise exists
function normalizeLine(l) {
  if (!l) return null;
  const unit = Number.isFinite(l.unitPaise)
    ? l.unitPaise
    : Number.isFinite(l.pricePaise)
    ? l.pricePaise
    : 0;
  const qty = Number.isFinite(l.qty) ? l.qty : 0;
  const name = l.name ?? "";
  const itemId = l.itemId ?? l.id ?? "";
  return { itemId, name, unitPaise: unit, qty };
}

// Normalize an order to guarantee integer totals
function normalizeOrder(o) {
  if (!o) return null;
  const items = Array.isArray(o.items)
    ? o.items.map(normalizeLine).filter(Boolean)
    : [];
  const subtotal = toInt(o.subtotal);
  const discount = toInt(o.discount);
  const tax = toInt(o.tax);
  const total = toInt(o.total);

  // If totals are zero but items exist, recompute basic totals from lines.
  if ((subtotal === 0 || total === 0) && items.length > 0) {
    const sub = items.reduce((acc, l) => acc + l.unitPaise * l.qty, 0);
    const disc = toInt(o.discount);
    const taxable = sub - disc;
    const t = toInt(o.tax) || Math.round(Math.max(taxable, 0) * 0); // keep as provided or 0
    const tot = Math.max(taxable + t, 0);
    return {
      ...o,
      items,
      subtotal: sub,
      discount: disc,
      tax: t,
      total: tot,
    };
  }
  return { ...o, items, subtotal, discount, tax, total };
}
function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function render(o) {
  if (!o) {
    document.body.innerHTML = '<p class="p-4">Order not found.</p>';
    return;
  }

  const ord = normalizeOrder(o);

  $("rcpt-id").textContent = ord.id ?? "-";
  $("rcpt-pay").textContent = ord.paymentMethod ?? "-";
  $("rcpt-time").textContent = ord.createdAt
    ? new Date(ord.createdAt).toLocaleString()
    : "-";

  $("rcpt-sub").textContent = formatINR(ord.subtotal);
  $("rcpt-disc").textContent = "- " + formatINR(ord.discount);
  $("rcpt-tax").textContent = formatINR(ord.tax);
  $("rcpt-total").textContent = formatINR(ord.total);

  const linesHtml = (ord.items || [])
    .map(
      (l) => `
    <div class="flex justify-between">
      <span>${l.name} × ${l.qty}</span>
      <span>${formatINR(l.unitPaise * l.qty)}</span>
    </div>
  `
    )
    .join("");
  $("rcpt-lines").innerHTML = linesHtml;

  if (ord.paymentMethod === "UPI") {
    $("rcpt-note").textContent = "Paid via UPI.";
  } else {
    $("rcpt-note").textContent = "";
  }
}

// Do the render
render(getLastOrderById(id));

// Buttons (guarded)
const btnPrint = document.getElementById("btn-print");
const btnShare = document.getElementById("btn-share");

if (btnPrint) {
  btnPrint.addEventListener("click", () => window.print());
}
if (btnShare) {
  btnShare.addEventListener("click", async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Receipt " + id, url: location.href });
      } else {
        await navigator.clipboard.writeText(location.href);
        alert("Link copied.");
      }
    } catch {}
  });
}
