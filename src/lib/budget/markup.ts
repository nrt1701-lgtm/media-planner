// Markup is applied on cost: gross = net x (1 + markup%). E.g. a 20% markup on
// a $1,000 net media cost bills the client $1,200.
export function toGross(net: number, markupPercentage: number): number {
  return Math.round(net * (1 + markupPercentage / 100) * 100) / 100
}

export function toNet(gross: number, markupPercentage: number): number {
  return Math.round((gross / (1 + markupPercentage / 100)) * 100) / 100
}
