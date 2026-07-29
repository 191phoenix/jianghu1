import type { Hero } from '@/types/game'

/** 3 个侠客，分别通关第 3 关、第 6 关、第一章 BOSS 后获得 */
export const HEROES: Hero[] = [
  {
    id: 'yegucheng',
    name: '叶孤城',
    title: '剑客·攻',
    acquireLevelId: '1-3',
    stats: { hp: 140, atk: 22, def: 6, spd: 16, critRate: 0.12, critDmg: 1.6 },
    skill: {
      name: '天外飞仙',
      desc: '每 4 回合一剑封喉，造成 2.5 倍伤害',
      trigger: { type: 'every-n-rounds', n: 4 },
      multiplier: 2.5
    }
  },
  {
    id: 'huyidao',
    name: '胡一刀',
    title: '刀客·均衡',
    acquireLevelId: '1-6',
    stats: { hp: 220, atk: 18, def: 12, spd: 11, critRate: 0.08, critDmg: 1.5 },
    skill: {
      name: '霸王刀',
      desc: '每 3 回合力劈华山，造成 1.8 倍伤害',
      trigger: { type: 'every-n-rounds', n: 3 },
      multiplier: 1.8
    }
  },
  {
    id: 'chenglinsu',
    name: '程灵素',
    title: '毒医·持续',
    acquireLevelId: '1-10',
    stats: { hp: 180, atk: 14, def: 14, spd: 13, critRate: 0.06, critDmg: 1.4 },
    skill: {
      name: '万毒噬心',
      desc: '每 2 回合施毒，造成 1.4 倍伤害',
      trigger: { type: 'every-n-rounds', n: 2 },
      multiplier: 1.4
    }
  }
]

export function getHero(id: string): Hero | undefined {
  return HEROES.find((h) => h.id === id)
}
