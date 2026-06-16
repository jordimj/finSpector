type FetchJsonOptions = RequestInit & {
  path: string;
};

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const apiBaseUrl =
  typeof rawApiBaseUrl === 'string' && rawApiBaseUrl.length > 0
    ? rawApiBaseUrl.replace(/\/$/, '')
    : '';

export async function fetchJson<TResponse>({
  path,
  ...init
}: FetchJsonOptions): Promise<TResponse> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${apiBaseUrl}${normalizedPath}`, {
    headers: {
      Accept: 'application/json',
      ...init.headers,
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
