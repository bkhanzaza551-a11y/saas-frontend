const CURRENCY_SYMBOLS = {
  INR: "\u20B9",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
  AED: "AED",
  SAR: "SAR",
  SGD: "S$",
  AUD: "A$",
  CAD: "C$",
  JPY: "\u00A5",
};

export function formatDuration(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function formatPrice(amount, currency = "INR") {
  const num = Number(amount);
  if (isNaN(num)) return `${currency} 0.00`;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${symbol} ${num.toFixed(2)}`;
  }
}

export function getServicePrice(service) {
  const sale = Number(service.salePrice);
  const price = Number(service.price);
  if (sale > 0 && sale < price) return sale;
  return price;
}

export function getServiceOriginalPrice(service) {
  return Number(service.price);
}

export function hasSalePrice(service) {
  const sale = Number(service.salePrice);
  const price = Number(service.price);
  return sale > 0 && sale < price;
}
