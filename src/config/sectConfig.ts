import type { Sect } from '@/types/game'

export const SECTS: Record<string, Sect> = {
  huashan: {
    id: 'huashan',
    name: '华山',
    desc: '剑法卓绝，攻守均衡，长于以快打慢。',
    skills: [
      { id: 'huashan-base', name: '华山剑法', desc: '华山入门剑法，迅捷灵动', tier: 1, prereq: null, maxLevel: 5, multiplier: 1.6, cdN: 3 },
      { id: 'huashan-duoming', name: '夺命连三剑', desc: '连刺三剑，势若夺命', tier: 2, prereq: { skillId: 'huashan-base', level: 3 }, maxLevel: 5, multiplier: 1.8, cdN: 3 },
      { id: 'huashan-zixia', name: '紫霞剑气', desc: '剑气透体，绵长难防', tier: 2, prereq: { skillId: 'huashan-base', level: 3 }, maxLevel: 5, multiplier: 1.6, cdN: 4 }
    ],
    weaponType: 'sword',
    inner: { name: '紫霞神功', desc: '紫霞内息，攻击 +8', stats: { atk: 8 } }
  },
  shaolin: {
    id: 'shaolin',
    name: '少林',
    desc: '外功刚猛，体魄过人，金刚不坏。',
    skills: [
      { id: 'shaolin-base', name: '罗汉拳', desc: '少林入门拳法，朴实刚健', tier: 1, prereq: null, maxLevel: 5, multiplier: 1.5, cdN: 3 },
      { id: 'shaolin-jingang', name: '金刚不坏', desc: '激发金钟罩，硬如金刚', tier: 2, prereq: { skillId: 'shaolin-base', level: 3 }, maxLevel: 5, multiplier: 1.6, cdN: 4 },
      { id: 'shaolin-dali', name: '大力金刚掌', desc: '掌力沉雄，开碑裂石', tier: 2, prereq: { skillId: 'shaolin-base', level: 3 }, maxLevel: 5, multiplier: 1.9, cdN: 4 }
    ],
    weaponType: 'fist',
    inner: { name: '罗汉伏魔功', desc: '罗汉伏魔，气血 +50 防御 +6', stats: { hp: 50, def: 6 } }
  },
  gaibang: {
    id: 'gaibang',
    name: '丐帮',
    desc: '拳脚凌厉，群战之长，打狗棒法。',
    skills: [
      { id: 'gaibang-base', name: '丐帮棒法', desc: '丐帮入门棒法，灵巧多变', tier: 1, prereq: null, maxLevel: 5, multiplier: 1.6, cdN: 3 },
      { id: 'gaibang-dagou', name: '打狗棒法', desc: '连环棒击，招招夺机', tier: 2, prereq: { skillId: 'gaibang-base', level: 3 }, maxLevel: 5, multiplier: 1.9, cdN: 3 },
      { id: 'gaibang-qinlong', name: '擒龙功', desc: '隔空擒拿，控敌于外', tier: 2, prereq: { skillId: 'gaibang-base', level: 3 }, maxLevel: 5, multiplier: 1.7, cdN: 4 }
    ],
    weaponType: 'staff',
    inner: { name: '混天功', desc: '混天一气，气血 +60 速度 +2', stats: { hp: 60, spd: 2 } }
  },
  liandao: {
    id: 'liandao',
    name: '炼刀门',
    desc: '刀法刚猛，以力破巧，势如烈阳。',
    skills: [
      { id: 'liandao-base', name: '炼刀术', desc: '炼刀入门刀法，势大力沉', tier: 1, prereq: null, maxLevel: 5, multiplier: 1.6, cdN: 3 },
      { id: 'liandao-kuangfeng', name: '狂风刀法', desc: '狂风骤雨般连斩', tier: 2, prereq: { skillId: 'liandao-base', level: 3 }, maxLevel: 5, multiplier: 1.9, cdN: 3 },
      { id: 'liandao-lieyan', name: '烈焰刀', desc: '刀意如焰，灼敌于无形', tier: 2, prereq: { skillId: 'liandao-base', level: 3 }, maxLevel: 5, multiplier: 1.8, cdN: 4 }
    ],
    weaponType: 'saber',
    inner: { name: '烈阳刀煞', desc: '刀意如阳，攻击 +10 暴击 +5%', stats: { atk: 10, critRate: 0.05 } }
  }
}

export const DEFAULT_SECT = 'huashan'
