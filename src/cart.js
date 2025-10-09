// cart.js
export class Cart {
  constructor() {
    this.lines = []; // { id, name, unitPaise, qty }
  }
  add(item) {
    const found = this.lines.find((l) => l.id === item.id);
    if (found) found.qty += 1;
    else
      this.lines.push({
        id: item.id,
        name: item.name,
        unitPaise: item.pricePaise,
        qty: 1,
      });
  }
  dec(id) {
    const found = this.lines.find((l) => l.id === id);
    if (!found) return;
    found.qty -= 1;
    if (found.qty <= 0) this.lines = this.lines.filter((l) => l.id !== id);
  }
  remove(id) {
    this.lines = this.lines.filter((l) => l.id !== id);
  }
  clear() {
    this.lines = [];
  }
  get subtotalPaise() {
    return this.lines.reduce((sum, l) => sum + l.unitPaise * l.qty, 0);
  }
}
