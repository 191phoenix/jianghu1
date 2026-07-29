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
  star: number // 0-5 强化星数
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
  stonesGained: number // 本次通关获得的强化石
  silverGained: number // 本次通关获得的银两
  acquiredInnerSkills: string[] // 本次通关新获得的内功名
}

/** 战斗中的角色 */
export interface BattleFighter {
  id: string
  name: string
  stats: Stats
  hp: number
  maxHp: number
  isPlayer: boolean
  skill: SkillDef | null
  skillCd: number
}

export type BattleAction = 'attack' | 'skill'
export type BattlePhase = 'player' | 'enemy' | 'ended'

/** 战斗状态（手动回合制） */
export interface BattleState {
  levelId: string
  allies: BattleFighter[]
  enemies: BattleFighter[]
  round: number
  actorIdx: number
  order: string[] // fighter ids，按速度排序
  phase: BattlePhase
  log: BattleLine[]
  result: BattleResult | null
  pendingAction: BattleAction | null // 玩家选了行动，待选目标
}

/** 离线挂机收益 */
export interface OfflineReward {
  duration: number // 实际结算秒数
  exp: number
  drops: Equipment[]
  stones: number
  levelId: string
}

/** 玩家（阶段 3 扩展） */
export interface Player {
  name: string
  sect: string
  level: number
  exp: number
  equipped: Record<EquipSlot, Equipment | null>
  bag: Equipment[]
  heroes: string[] // 已获侠客 id
  formation: (string | null)[] // 上阵位（2 个），存侠客 id 或 null
  talents: Record<string, number> // 已分配天赋级数
  innerSkill: string | null // 当前装备的内功 id
  innerSkills: string[] // 已获内功 id
  stones: number // 强化石
  heroLevels: Record<string, number> // 侠客等级
  heroExp: Record<string, number> // 侠客经验
  heroEquipped: Record<string, Equipment | null> // 侠客装备（1 槽）
  seenEquipment: string[] // 见过的装备 slot-grade
  seenEnemies: string[] // 见过的敌人 id
  silver: number // 银两
  enhanceCount: number // 强化总次数
  shopItems: Equipment[] // 商店装备摊
  tasksClaimed: string[] // 已领奖的任务 id
  currentLevelId: string
  clearedLevelIds: string[]
  createdAt: number
  lastActiveTime: number
}
