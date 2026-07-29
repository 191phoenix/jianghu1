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
  },
  shaolin: {
    id: 'shaolin',
    name: '少林',
    desc: '外功刚猛，体魄过人，金刚不坏。',
    skill: {
      name: '金刚不坏',
      desc: '每 4 回合激发金钟罩，造成 1.6 倍伤害',
      trigger: { type: 'every-n-rounds', n: 4 },
      multiplier: 1.6
    }
  },
  gaibang: {
    id: 'gaibang',
    name: '丐帮',
    desc: '拳脚凌厉，群战之长，打狗棒法。',
    skill: {
      name: '打狗棒法',
      desc: '每 3 回合连环棒击，造成 1.9 倍伤害',
      trigger: { type: 'every-n-rounds', n: 3 },
      multiplier: 1.9
    }
  }
}

export const DEFAULT_SECT = 'huashan'
