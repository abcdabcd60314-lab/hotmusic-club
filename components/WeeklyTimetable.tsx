'use client'

import { Button } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'

export type CellStatus = 'available' | 'mine' | 'taken' | 'partial'

export interface TimetableCell {
  status: CellStatus
  label?: string
}

interface Props {
  weekStart: Dayjs
  onWeekChange: (d: Dayjs) => void
  cells: Record<string, TimetableCell> // key: `${day}-${hour}`, day=0(Mon)..6(Sun)
  onCellClick?: (day: number, hour: number) => void
  hourStart?: number
  hourEnd?: number
}

const DAYS = ['一', '二', '三', '四', '五', '六', '日']

const CELL_STYLE: Record<CellStatus, React.CSSProperties> = {
  available: { background: '#0f2a0f', border: '1px solid #16a34a', cursor: 'pointer' },
  mine:      { background: '#2a1a0a', border: '1px solid #f97316', cursor: 'default' },
  taken:     { background: '#1a0f0f', border: '1px solid #3f1515', cursor: 'not-allowed' },
  partial:   { background: '#0f1a2a', border: '1px solid #3b82f6', cursor: 'pointer' },
}

export function getMonday(d: Dayjs = dayjs()) {
  const dow = d.day()
  return d.subtract(dow === 0 ? 6 : dow - 1, 'day').startOf('day')
}

export default function WeeklyTimetable({
  weekStart, onWeekChange, cells, onCellClick, hourStart = 9, hourEnd = 22,
}: Props) {
  const hours = Array.from({ length: hourEnd - hourStart }, (_, i) => hourStart + i)
  const days  = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))
  const today = dayjs()

  const allCells: React.ReactNode[] = [
    <div key="corner" />,
    ...days.map((d, i) => (
      <div key={`h${i}`} style={{
        textAlign: 'center', fontSize: 12, padding: '4px 2px', fontWeight: 500,
        color: d.isSame(today, 'day') ? '#f97316' : '#9ca3af',
      }}>
        週{DAYS[i]}<br />
        <span style={{ fontSize: 10, fontWeight: 400 }}>{d.format('M/D')}</span>
      </div>
    )),
    ...hours.flatMap(hour => [
      <div key={`t${hour}`} style={{ fontSize: 11, color: '#6b7280', textAlign: 'right', paddingRight: 4, paddingTop: 10 }}>
        {String(hour).padStart(2, '0')}:00
      </div>,
      ...Array.from({ length: 7 }, (_, day) => {
        const cell = cells[`${day}-${hour}`] ?? { status: 'available' as CellStatus }
        const clickable = cell.status === 'available' || cell.status === 'partial'
        return (
          <div
            key={`${day}-${hour}`}
            style={{
              ...CELL_STYLE[cell.status],
              minHeight: 38,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: '#d1d5db',
              userSelect: 'none',
              opacity: clickable ? 1 : 0.7,
            }}
            onClick={() => clickable && onCellClick?.(day, hour)}
          >
            {cell.label}
          </div>
        )
      }),
    ]),
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Button size="small" icon={<LeftOutlined />} onClick={() => onWeekChange(weekStart.subtract(7, 'day'))} />
        <span style={{ color: '#f3f4f6', fontWeight: 500, minWidth: 170, textAlign: 'center' }}>
          {weekStart.format('YYYY/MM/DD')} – {weekStart.add(6, 'day').format('MM/DD')}
        </span>
        <Button size="small" icon={<RightOutlined />} onClick={() => onWeekChange(weekStart.add(7, 'day'))} />
        <Button size="small" onClick={() => onWeekChange(getMonday())}>本週</Button>
      </div>

      <div className="flex gap-4 mb-2 text-xs" style={{ color: '#9ca3af' }}>
        {([['#16a34a', '可預約'], ['#f97316', '我的'], ['#3f1515', '已滿'], ['#3b82f6', '部分可用']] as const).map(([c, l]) => (
          <span key={l}><span style={{ color: c }}>■</span> {l}</span>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '44px repeat(7, minmax(56px, 1fr))',
          gap: 1,
        }}>
          {allCells}
        </div>
      </div>
    </div>
  )
}
