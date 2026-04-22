export function formatPeso(amount: number): string {
  try {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `₱${Math.round(amount).toLocaleString('en-PH')}`
  }
}
