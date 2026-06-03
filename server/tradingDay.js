function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toCompact(dateStr) {
  return dateStr.replace(/-/g, '');
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getLastTradingDay(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() - 1);

  while (isWeekend(d)) {
    d.setDate(d.getDate() - 1);
  }

  return formatDate(d);
}

function getPreviousTradingDay(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() - 1);

  while (isWeekend(d)) {
    d.setDate(d.getDate() - 1);
  }

  return formatDate(d);
}

module.exports = {
  formatDate,
  toCompact,
  getLastTradingDay,
  getPreviousTradingDay,
};
