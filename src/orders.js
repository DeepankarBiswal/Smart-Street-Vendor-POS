// orders.js
const ORDERS_KEY = "svpos.orders.v1";
const CONFIG_KEY = "svpos.config.v1";

// persistent config
function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}
const defaultConfig = { taxPercent: 5, discountPercent: 0 };
export const config = { ...defaultConfig, ...loadConfig() };

export function setDiscountPercent(p) {
  config.discountPercent = Math.max(0, Math.min(100, Number(p) || 0));
  saveConfig(config);
}
export function setTaxPercent(p) {
  config.taxPercent = Math.max(0, Math.min(100, Number(p) || 0));
  saveConfig(config);
}

// read/write orders
function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveAll(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

// id
function newId() {
  return (
    "ord_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 6)
  );
}

// totals
export function totalsFromCart(cart) {
  const subtotal = cart.subtotalPaise;
  const discount = Math.round(subtotal * (config.discountPercent / 100));
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * (config.taxPercent / 100));
  const total = taxable + tax;
  return { subtotal, discount, tax, total };
}

// persist order
export function createOrderFromCart(cart, paymentMethod = "CASH") {
  const id = newId();
  const ts = new Date().toISOString();
  const totals = totalsFromCart(cart);
  const lines = cart.lines.map((l) => ({
    itemId: l.id,
    name: l.name,
    unitPaise: l.unitPaise,
    qty: l.qty,
  }));
  const order = { id, createdAt: ts, paymentMethod, items: lines, ...totals };
  const all = loadAll();
  all.push(order);
  saveAll(all);
  return order;
}

// query
export function getOrdersByDate(yyyyMmDd) {
  const all = loadAll();
  return all.filter((o) => o.createdAt.startsWith(yyyyMmDd));
}

//helpers

export function exportAll() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    orders: JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]"),
    config,
  };
}

export function importAll(payload) {
  if (!payload || typeof payload !== "object")
    throw new Error("Invalid backup");
  const orders = Array.isArray(payload.orders) ? payload.orders : [];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  if (payload.config && typeof payload.config === "object") {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(payload.config));
    Object.assign(config, payload.config);
  }
}
