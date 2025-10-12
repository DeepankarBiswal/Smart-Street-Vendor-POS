import { formatINR } from "./money.js";

// read from localStorage orders
const ORDERS_KEY = "svpos.orders.v1";
function getOrder(id) {
  const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  return all.find((o) => o.id === id) || null;
}

const qs = new URLSearchParams(location.search);
const id = qs.get("id");

const el = (id) => document.getElementById(id);

function render(o) {
  if (!o) {
    document.body.innerHTML = '<p class="p-4">Order not found.</p>';
    return;
  }
  el("rcpt-id").textContent = o.id;
  el("rcpt-pay").textContent = o.paymentMethod;
  el("rcpt-time").textContent = new Date(o.createdAt).toLocaleString();

  el("rcpt-sub").textContent = formatINR(o.subtotal);
  el("rcpt-disc").textContent = "- " + formatINR(o.discount);
  el("rcpt-tax").textContent = formatINR(o.tax);
  el("rcpt-total").textContent = formatINR(o.total);

  const lines = o.items
    .map(
      (l) => `
    <div class="flex justify-between">
      <span>${l.name} × ${l.qty}</span>
      <span>${formatINR(l.unitPaise * l.qty)}</span>
    </div>
  `
    )
    .join("");
  document.getElementById("rcpt-lines").innerHTML = lines;

  // simple note for UPI
  if (o.paymentMethod === "UPI") {
    el("rcpt-note").textContent = "Paid via UPI.";
  } else {
    el("rcpt-note").textContent = "";
  }
}

render(getOrder(id));

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

