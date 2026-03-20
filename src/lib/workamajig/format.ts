export function formatWorkamajigCode(year: number, clientCode: string, expenseNumber: string): string {
  const yy = String(year).slice(-2)
  const code = clientCode.toUpperCase()
  const expense = expenseNumber.padStart(4, '0')
  return `${yy}-${code}-${expense}`
}
