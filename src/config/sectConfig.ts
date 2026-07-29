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
    },
    weaponType: 'sword',
    inner: { name: '紫霞神功', desc: '紫霞内息，攻击 +8', stats: { atk: 8 } }
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
    },
    weaponType: 'fist',
    inner: { name: '罗汉伏魔功', desc: '罗汉伏魔，气血 +50 防御 +6', stats: { hp: 50, def: 6 } }
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
    },
    weaponType: 'staff',
    inner: { name: '混天功', desc: '混天一气，气血 +60 速度 +2', stats: { hp: 60, spd: 2 } }
  },
  liandao: {
    id: 'liandao',
    name: '炼刀门',
    desc: '刀法刚猛，以力破巧，势如烈阳。',
    skill: {
      name: '狂风刀法',
      desc: '每 3 回合狂风骤雨般连斩，造成 1.9 倍伤害',
      trigger: { type: 'every-n-rounds', n: 3 },
      multiplier: 1.9
    },
    weaponType: 'saber',
    inner: { name: '烈阳刀煞', desc: '刀意如阳，攻击 +10 暴击 +5%', stats: { atk: 10, critRate: 0.05 } }
  }
}

export const DEFAULT_SECT = 'huashan'
