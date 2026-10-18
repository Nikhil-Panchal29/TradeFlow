const API_URL = import.meta.env.VITE_API_URL;

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error ?? `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

export function getTrades(page = 1, options = {}) {
  const url = new URL('/api/trades', API_URL);
  url.searchParams.set('page', String(page));
  url.searchParams.set('pageSize', '50');
  if (options.search) {
    url.searchParams.set('search', options.search);
  }
  if (options.symbol) {
    url.searchParams.set('symbol', options.symbol);
  }
  if (options.sortBy) {
    url.searchParams.set('sortBy', options.sortBy);
  }
  if (options.order) {
    url.searchParams.set('order', options.order);
  }
  return fetch(url).then(parseJsonResponse);
}

export function getStats() {
  return fetch(new URL('/api/stats', API_URL)).then(parseJsonResponse);
}

export function getCurrentPull() {
  return fetch(new URL('/api/pulls/current', API_URL)).then(parseJsonResponse);
}

export function startPull() {
  return fetch(new URL('/api/pulls', API_URL), { method: 'POST' }).then(
    parseJsonResponse
  );
}

export function getSymbols() {
  return fetch(new URL('/api/trades/symbols', API_URL)).then(parseJsonResponse);
}

export function exportTradesCsv(options = {}) {
  const url = new URL('/api/trades/export.csv', API_URL);
  if (options.search) {
    url.searchParams.set('search', options.search);
  }
  if (options.symbol) {
    url.searchParams.set('symbol', options.symbol);
  }
  if (options.sortBy) {
    url.searchParams.set('sortBy', options.sortBy);
  }
  if (options.order) {
    url.searchParams.set('order', options.order);
  }
  return fetch(url);
}
