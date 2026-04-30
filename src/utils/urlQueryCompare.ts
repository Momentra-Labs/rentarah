/**
 * Compare two `location.search` strings (with or without leading `?`) independent of parameter order,
 * so we can skip redundant {@link react-router-dom setSearchParams} calls that churn `history` + `location.key`.
 */
export function areUrlSearchQueriesEqual(a: string, b: string): boolean {
  const trim = (s: string) => (s.startsWith('?') ? s.slice(1) : s)
  const pa = new URLSearchParams(trim(a))
  const pb = new URLSearchParams(trim(b))
  const keys = new Set<string>([...pa.keys(), ...pb.keys()])
  for (const k of [...keys].sort()) {
    const va = pa.getAll(k).sort().join('\0')
    const vb = pb.getAll(k).sort().join('\0')
    if (va !== vb) return false
  }
  return true
}
