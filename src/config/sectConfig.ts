import type { Sect } from '@/types/game'

export const SECTS: Record<string, Sect> = {
  huashan: {
    id: 'huashan',
    name: '华山',
    desc: '剑法卓绝，攻守均衡，长于以快打慢。',
    skill: {
      name: '夺命连三剑',
      desc: '每 3 回合连刺三剑，造成 1.8 倍伤害',
      trigger: { type: 'every-n-rounds', n: 3 },
      multiplier: 1.8
    }
  }
}

export const DEFAULT_SECT = 'huashan'
