// money.js
export function toPaise(valueRupees) {
  return Math.round(Number(valueRupees) * 100);
}
export function fromPaise(paise) {
  return paise / 100;
}
export function formatINR(paise) {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(rupees);
}
