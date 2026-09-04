import { UNASSIGNED, type DimensionGroup, type PivotDimension } from './filters'

// Brand palette, extended with tints so a plan with many platforms still gets
// distinct slices. Matches the sequence the budget charts have always used.
export const DEFAULT_COLORS = [
  '#1A8A7D', '#C45A2C', '#D4A34A', '#7A94A8', '#4A3728',
  '#2CB5A5', '#D97B56', '#E0BD6E', '#95AEC0', '#6B5444',
]

// Funnel stages are ordered and comparable across campaigns, so they get a
// fixed reading rather than whatever color their spend rank lands on: teal
// (top of funnel) → gold → rust (closest to conversion).
const FUNNEL_STAGE_COLORS: Record<string, string> = {
  Awareness: '#1A8A7D',
  Consideration: '#D4A34A',
  Conversion: '#C45A2C',
}

// "Unassigned" is an absence, not a category — a muted neutral keeps it from
// competing with real values for attention in either chart.
const UNASSIGNED_COLOR = '#B9AE9C'

interface ChannelRef {
  name: string
  color?: string | null
}

/**
 * One color per group key, built once and shared by every chart on the page.
 *
 * Building the map from a single grouped array (rather than letting each
 * chart resolve colors by its own render index) is what keeps "Paid Social"
 * the same color in the bar chart and the mix donut.
 */
export function buildDimensionColorMap(
  groups: DimensionGroup[],
  dimension: PivotDimension,
  channels: ChannelRef[] = []
): Map<string, string> {
  const map = new Map<string, string>()

  groups.forEach((group, index) => {
    map.set(group.key, resolveColor(group, dimension, index, channels))
  })

  return map
}

function resolveColor(
  group: DimensionGroup,
  dimension: PivotDimension,
  index: number,
  channels: ChannelRef[]
): string {
  if (group.key === UNASSIGNED) return UNASSIGNED_COLOR

  if (dimension === 'funnel_stage') {
    return FUNNEL_STAGE_COLORS[group.key] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  }

  if (dimension === 'channel') {
    const channel = channels.find((c) => c.name.toLowerCase() === group.key.toLowerCase())
    if (channel?.color) return channel.color
  }

  return DEFAULT_COLORS[index % DEFAULT_COLORS.length]
}
