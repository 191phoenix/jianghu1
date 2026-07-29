/** 升到下一级所需经验：100 × level^1.5 */
export function expToNext(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}
