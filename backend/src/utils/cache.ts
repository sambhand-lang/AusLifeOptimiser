const cache: Map<string, { value: any; expires: number }> = new Map();

function get(key: string): any | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function set(key: string, value: any, ttl: number): void {
  cache.set(key, { value, expires: Date.now() + ttl });
}

export default { get, set };
