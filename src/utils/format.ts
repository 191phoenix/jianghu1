import type { Stats } from '@/types/game'

const STAT_LABEL: Record<keyof Stats, string> = {
  hp: '气血',
  atk: '攻击',
  def: '防御',
  spd: '速度',
  critRate: '暴击',
  critDmg: '暴伤'
}

export function statLabel(key: keyof Stats): string {
  return STAT_LABEL[key]
}

export function formatStatValue(key: keyof Stats, value: number): string {
  if (key === 'critRate' || key === 'critDmg') return `${(value * 100).toFixed(0)}%`
  return `${value}`
}

/** 把属性对象格式化为一行，如「攻击+8 防御+3」 */
export function formatStatsLine(stats: Partial<Stats>): string {
  return (Object.entries(stats) as [keyof Stats, number][])
    .map(([k, v]) => `${STAT_LABEL[k]}+${formatStatValue(k, v)}`)
    .join(' ')
}
