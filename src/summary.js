import { formatINR } from "./money.js";
import { getOrdersByDate } from "./orders.js";

const dateEl = document.getElementById("date");
const refreshBtn = document.getElementById("refresh");
const kOrders = document.getElementById("kpi-orders");
const kRevenue = document.getElementById("kpi-revenue");
const kAvg = document.getElementById("kpi-avg");
const kItems = document.getElementById("kpi-items");
const topList = document.getElementById("top-list");

function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
dateEl.value = todayStr();

function compute(orders) {
  const count = orders.length;
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const itemsSold = orders.reduce(
    (s, o) => s + o.items.reduce((t, l) => t + l.qty, 0),
    0
  );
  const avg = count ? Math.round(revenue / count) : 0;

  const byItem = new Map();
  orders.forEach((o) => {
    o.items.forEach((l) => {
      const entry = byItem.get(l.itemId) || { name: l.name, qty: 0, sales: 0 };
      entry.qty += l.qty;
      entry.sales += l.unitPaise * l.qty;
      byItem.set(l.itemId, entry);
    });
  });
  const top = Array.from(byItem.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  return { count, revenue, itemsSold, avg, top };
}

function render(data) {
  kOrders.textContent = String(data.count);
  kRevenue.textContent = formatINR(data.revenue);
  kAvg.textContent = formatINR(data.avg);
  kItems.textContent = String(data.itemsSold);
  topList.innerHTML = data.top
    .map(
      (t) => `
    <li class="p-3 flex items-center justify-between">
      <div>
        <p class="font-medium">${t.name}</p>
        <p class="text-xs text-slate-500">${t.qty} sold</p>
      </div>
      <div class="text-right">
        <p class="text-sm text-slate-600">${formatINR(t.sales)}</p>
      </div>
    </li>
  `
    )
    .join("");
}

function refresh() {
  const orders = getOrdersByDate(dateEl.value);
  render(compute(orders));
}

refreshBtn.addEventListener("click", refresh);
window.addEventListener("load", refresh);
