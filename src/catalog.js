// catalog.js
import { formatINR } from './money.js';

const grid = document.querySelector('main');
const tabs = Array.from(document.querySelectorAll('nav ul button'));
let allItems = [];
let activeCategory = 'All';
let currentQuery = '';

export async function loadCatalog() {
  const res = await fetch('./assets/items.json');
  allItems = await res.json();
  render();
}

export function setCategory(cat) {
  activeCategory = cat;
  render();
}

export function setQuery(q) {
  currentQuery = q.toLowerCase();
  render();
}

export function onItemClick(handler) {
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const id = btn.dataset.id;
    const item = allItems.find(i => i.id === id);
    if (item) handler(item);
  });
}

function render() {
  const items = allItems.filter(i => {
    const catOk = activeCategory === 'All' || i.category === activeCategory;
    const qOk = !currentQuery || i.name.toLowerCase().includes(currentQuery);
    return catOk && qOk;
  });

  grid.innerHTML = items.map(i => {
    return `
      <button data-id="${i.id}" class="rounded-lg bg-white border border-slate-200 p-3 text-left shadow-sm active:scale-[0.99]">
        <p class="font-medium">${i.name}</p>
        <p class="text-sm text-slate-600">${formatINR(i.pricePaise)}</p>
      </button>
    `;
  }).join('');
}
