/** 6 维属性 */
export interface Stats {
  hp: number
  atk: number
  def: number
  spd: number
  critRate: number // 0-1
  critDmg: number // 倍数，如 1.5
}

export type EquipSlot = 'weapon' | 'armor' | 'head' | 'foot' | 'accessory' | 'neck'
export type EquipGrade = 'white' | 'green' | 'blue' | 'purple'

/** 装备 */
export interface Equipment {
  id: string
  name: string
  slot: EquipSlot
  grade: EquipGrade
  stats: Partial<Stats>
}

/** 敌人 */
export interface Enemy {
  id: string
  name: string
  stats: Stats
  expReward: number
  dropRate: number // 0-1
}

/** 关卡定义 */
export interface LevelDef {
  id: string
  chapter: number
  index: number
  name: string
  enemies: Enemy[]
  isBoss: boolean
}

/** 门派技能 */
export interface SkillDef {
  name: string
  desc: string
  trigger: { type: 'every-n-rounds'; n: number }
  multiplier: number
}

/** 门派 */
export interface Sect {
  id: string
  name: string
  desc: string
  skill: SkillDef
}

/** 侠客 */
export interface Hero {
  id: string
  name: string
  title: string
  stats: Stats
  skill: SkillDef
  acquireLevelId: string // 通关此关后获得
}

/** 一条战斗日志 */
export interface BattleLine {
  round: number
  attacker: string
  target: string
  dmg: number
  crit: boolean
  skillName?: string
}

/** 一场战斗结果 */
export interface BattleResult {
  win: boolean
  rounds: number
  log: BattleLine[]
  expGained: number
  drops: Equipment[]
  acquiredHeroes: string[] // 本次通关新获得的侠客名
}

/** 离线挂机收益 */
export interface OfflineReward {
  duration: number // 实际结算秒数
  exp: number
  drops: Equipment[]
  levelId: string
}

/** 玩家（阶段 2 扩展） */
export interface Player {
  name: string
  sect: string
  level: number
  exp: number
  equipped: Record<EquipSlot, Equipment | null>
  bag: Equipment[]
  heroes: string[] // 已获侠客 id
  formation: (string | null)[] // 上阵位（2 个），存侠客 id 或 null
  currentLevelId: string
  clearedLevelIds: string[]
  createdAt: number
  lastActiveTime: number
}
