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
/** 武器/招式类型，决定九宫格攻击形状 */
export type WeaponType = 'sword' | 'saber' | 'staff' | 'whip' | 'fist'

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
  weaponType: WeaponType
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
  weaponType: WeaponType
}

/** 侠客 */
export interface Hero {
  id: string
  name: string
  title: string
  stats: Stats
  skill: SkillDef
  acquireLevelId: string // 通关此关后获得
  weaponType: WeaponType
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
  pos: number // 0-8 九宫格位置
  weaponType: WeaponType
}

export type BattleAction = 'attack' | 'skill'
export type BattlePhase = 'setup' | 'player' | 'enemy' | 'ended'

/** 战斗状态（手动回合制 + 九宫格站位） */
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
  setupChosen: string[] // 布阵阶段已选上场侠客 id（不含主角，≤2）
  setupGrid: (string | null)[] // 长度 9，值 'main' | 侠客 id | null
  pendingTargetCell: number | null // 选目标时的主目标格
}

/** 路径节点类型 */
export type PathNodeType = 'battle' | 'elite' | 'story' | 'treasure' | 'event' | 'boss'

/** 节点奖励（值可为负，表示惩罚） */
export interface PathReward {
  exp?: number
  silver?: number
  stones?: number
  drops?: Equipment[]
}

/** 事件节点的选项 */
export interface PathChoice {
  label: string
  outcomeText: string
  reward: PathReward
}

/** 路径节点 */
export interface PathNode {
  type: PathNodeType
  label: string
  resolved: boolean
  enemies?: Enemy[] // battle/elite/boss
  storyText?: string // story/event 提示文案
  reward?: PathReward // story/treasure 预生成奖励
  choices?: PathChoice[] // event 选项
}

/** 一次路径推图运行态（仅内存，不持久化） */
export interface PathRun {
  levelId: string
  nodes: PathNode[]
  idx: number // 当前未解决节点下标
  status: 'ongoing' | 'cleared'
  log: string[] // 路径事件日志
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
  heroEquipped: Record<string, Record<EquipSlot, Equipment | null>> // 侠客装备（6 槽）
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
