import React from 'react'
import { Page, View, Text } from '@react-pdf/renderer'
import { styles, COLORS } from './styles'
import { generatePeriods, type Period } from '@/lib/budget/periods'
import { allocateBudget } from '@/lib/budget/allocate'
import { format } from 'date-fns'

interface Tactic {
  id: string
  name: string
  channel?: string | null
  platform?: string | null
  budget: number
  flight_start?: string | null
  flight_end?: string | null
}

interface FlowchartPageProps {
  campaignName: string
  campaignStart: Date
  campaignEnd: Date
  tactics: Tactic[]
}

function formatCurrency(amount: number): string {
  if (amount === 0) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPeriodLabel(period: Period): string {
  return format(period.start, 'M/d')
}

// Group tactics by channel
function groupByChannel(tactics: Tactic[]): Map<string, Tactic[]> {
  const map = new Map<string, Tactic[]>()
  for (const tactic of tactics) {
    const ch = tactic.channel || 'Unassigned'
    if (!map.has(ch)) map.set(ch, [])
    map.get(ch)!.push(tactic)
  }
  return map
}

// Split periods into chunks for page overflow
const MAX_PERIOD_COLS_PER_PAGE = 10

interface FlowchartTableProps {
  groups: Map<string, Tactic[]>
  periods: Period[]
  allPeriods: Period[]
  periodOffset: number
  isFirstPage: boolean
  campaignName: string
}

function FlowchartTable({ groups, periods, allPeriods, periodOffset, isFirstPage, campaignName }: FlowchartTableProps) {
  // Build pre-computed allocations: tacticId -> periodIndex -> amount
  const allocations = new Map<string, number[]>()
  const tactics = Array.from(groups.values()).flat()

  for (const tactic of tactics) {
    const start = tactic.flight_start ? new Date(tactic.flight_start) : new Date(0)
    const end = tactic.flight_end ? new Date(tactic.flight_end) : new Date(8640000000000000)
    const fullAllocs = allocateBudget(tactic.budget, start, end, allPeriods)
    allocations.set(tactic.id, fullAllocs.map(a => a.amount))
  }

  // Column totals for visible periods
  const colTotals = periods.map((_, pIdx) => {
    const absIdx = periodOffset + pIdx
    return tactics.reduce((sum, t) => {
      const ta = allocations.get(t.id) ?? []
      return sum + (ta[absIdx] ?? 0)
    }, 0)
  })

  const grandTotal = colTotals.reduce((a, b) => a + b, 0)

  // Width calculations
  const tacticColWidth = 110
  const totalColWidth = 52
  const numPeriodCols = periods.length
  const periodColWidth = (595 - 48 - tacticColWidth - totalColWidth) / numPeriodCols

  const channelColorList = COLORS.channelColors
  const channelKeys = Array.from(groups.keys())

  return (
    <Page size="LETTER" orientation="landscape" style={styles.flowchartPage}>
      {isFirstPage && (
        <Text style={styles.flowchartTitle}>
          Media Flowchart — {campaignName}
        </Text>
      )}

      <View style={styles.tableContainer}>
        {/* Header row */}
        <View style={styles.tableHeaderRow}>
          <View style={[styles.tableHeaderCell, { width: tacticColWidth }]}>
            <Text>Tactic / Platform</Text>
          </View>
          {periods.map((p, i) => (
            <View key={i} style={[styles.tableHeaderCell, { width: periodColWidth, textAlign: 'center' }]}>
              <Text>{formatPeriodLabel(p)}</Text>
            </View>
          ))}
          <View style={[styles.tableHeaderCell, { width: totalColWidth, textAlign: 'right' }]}>
            <Text>Total</Text>
          </View>
        </View>

        {/* Channel groups */}
        {channelKeys.map((channel, chIdx) => {
          const channelTactics = groups.get(channel)!
          const bgColor = channelColorList[chIdx % channelColorList.length]

          // Channel subtotal for visible periods
          const channelSubtotal = channelTactics.reduce((sum, t) => {
            const ta = allocations.get(t.id) ?? []
            return sum + periods.reduce((s, _, pIdx) => s + (ta[periodOffset + pIdx] ?? 0), 0)
          }, 0)
          // Channel row total (full flight)
          const channelTotal = channelTactics.reduce((sum, t) => sum + t.budget, 0)

          return (
            <React.Fragment key={channel}>
              {/* Channel header row */}
              <View style={[styles.channelHeaderRow, { backgroundColor: bgColor }]}>
                <View style={[styles.channelHeaderCell, { width: tacticColWidth }]}>
                  <Text>{channel}</Text>
                </View>
                {periods.map((_, pIdx) => {
                  const absIdx = periodOffset + pIdx
                  const amt = channelTactics.reduce((sum, t) => {
                    const ta = allocations.get(t.id) ?? []
                    return sum + (ta[absIdx] ?? 0)
                  }, 0)
                  return (
                    <View key={pIdx} style={[styles.channelHeaderCell, { width: periodColWidth, textAlign: 'right' }]}>
                      <Text>{amt > 0 ? formatCurrency(amt) : ''}</Text>
                    </View>
                  )
                })}
                <View style={[styles.channelHeaderCell, { width: totalColWidth, textAlign: 'right' }]}>
                  <Text>{formatCurrency(channelTotal)}</Text>
                </View>
              </View>

              {/* Tactic rows */}
              {channelTactics.map((tactic, tIdx) => {
                const ta = allocations.get(tactic.id) ?? []
                const rowTotal = tactic.budget
                const isAlt = tIdx % 2 === 1

                return (
                  <View key={tactic.id} style={isAlt ? styles.tableRowAlt : styles.tableRow}>
                    <View style={[styles.tableCell, { width: tacticColWidth }]}>
                      <Text>{tactic.name || '(Unnamed)'}</Text>
                      {tactic.platform ? (
                        <Text style={{ fontSize: 6, color: COLORS.muted, marginTop: 1 }}>{tactic.platform}</Text>
                      ) : null}
                    </View>
                    {periods.map((_, pIdx) => {
                      const absIdx = periodOffset + pIdx
                      const amt = ta[absIdx] ?? 0
                      return (
                        <View key={pIdx} style={[styles.tableCell, { width: periodColWidth, textAlign: 'right' }]}>
                          <Text>{amt > 0 ? formatCurrency(amt) : ''}</Text>
                        </View>
                      )
                    })}
                    <View style={[styles.tableCell, { width: totalColWidth, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
                      <Text>{formatCurrency(rowTotal)}</Text>
                    </View>
                  </View>
                )
              })}
            </React.Fragment>
          )
        })}

        {/* Column totals row */}
        <View style={styles.totalRow}>
          <View style={[styles.totalCell, { width: tacticColWidth }]}>
            <Text>TOTAL</Text>
          </View>
          {colTotals.map((amt, i) => (
            <View key={i} style={[styles.totalCell, { width: periodColWidth, textAlign: 'right' }]}>
              <Text>{formatCurrency(amt)}</Text>
            </View>
          ))}
          <View style={[styles.totalCell, { width: totalColWidth, textAlign: 'right' }]}>
            <Text>{formatCurrency(grandTotal)}</Text>
          </View>
        </View>
      </View>

      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  )
}

export function FlowchartPages({ campaignName, campaignStart, campaignEnd, tactics }: FlowchartPageProps) {
  const allPeriods = generatePeriods(campaignStart, campaignEnd)
  const groups = groupByChannel(tactics)

  // Chunk periods for overflow
  const chunks: Period[][] = []
  for (let i = 0; i < allPeriods.length; i += MAX_PERIOD_COLS_PER_PAGE) {
    chunks.push(allPeriods.slice(i, i + MAX_PERIOD_COLS_PER_PAGE))
  }

  if (chunks.length === 0) chunks.push([])

  return (
    <>
      {chunks.map((chunk, chunkIdx) => (
        <FlowchartTable
          key={chunkIdx}
          groups={groups}
          periods={chunk}
          allPeriods={allPeriods}
          periodOffset={chunkIdx * MAX_PERIOD_COLS_PER_PAGE}
          isFirstPage={chunkIdx === 0}
          campaignName={campaignName}
        />
      ))}
    </>
  )
}
