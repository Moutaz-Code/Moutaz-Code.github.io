/**
 * Build a URL path with query parameters, omitting undefined values.
 * Parameters are sorted for stable URLs (status before tag).
 */
export function buildUrl(
  path: string,
  params: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();

  // Stable ordering: status, tag, then anything else alphabetically
  const ordered = Object.entries(params).sort(([a], [b]) => {
    const order: Record<string, number> = { status: 0, tag: 1 };
    return (order[a] ?? 99) - (order[b] ?? 99) || a.localeCompare(b);
  });

  for (const [key, value] of ordered) {
    if (value != null && value !== "") {
      search.set(key, value);
    }
  }

  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}
