export function getApiBase(): string {
  const pathname = window.location.pathname;
  const base = pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname.replace(/\/[^/]*$/, '');
  return base || '';
}

export function apiUrl(path: string): string {
  return `${getApiBase()}${path}`;
}

export async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path));
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `请求失败 (${res.status})`);
  }
  return res.json() as Promise<T>;
}
