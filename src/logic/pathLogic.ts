import type {
  LevelDef,
  PathNode,
  PathNodeType,
  PathReward,
  PathChoice,
  Equipment
} from '@/types/game'
import { makePathEnemy } from '@/config/levelConfig'
import { rollEquipment, ALL_SLOTS, randomDropGrade } from '@/config/equipmentConfig'
import { genId } from '@/utils/id'

/** 节点图标 */
export const NODE_ICON: Record<PathNodeType, string> = {
  battle: '⚔️',
  elite: '👹',
  treasure: '🎁',
  story: '📜',
  event: '❓',
  boss: '🐉'
}

/** 非关主节点随机权重 */
const NODE_WEIGHTS: { type: PathNodeType; w: number }[] = [
  { type: 'battle', w: 45 },
  { type: 'treasure', w: 20 },
  { type: 'story', w: 20 },
  { type: 'event', w: 10 },
  { type: 'elite', w: 5 }
]

const STORY_POOL = [
  '山道旁一位老叟歇脚，见你行色匆匆，递来一壶浊酒与几两碎银。',
  '林间传出兵刃相击之声，赶至时人已散去，地上散落几枚铜钱。',
  '路遇樵夫，言前方山贼出没，赠你干粮与些许银两以壮行色。',
  '破庙避雨时偶遇游方道士，相谈甚欢，临别授你几句吐纳口诀。',
  '溪边见一渔翁垂钓，赠你一条鲜鱼，换了些许银子。'
]

/** 事件池：choices 为工厂，每次生成新对象（避免掉落物引用共享） */
const EVENT_POOL: { prompt: string; choices: () => PathChoice[] }[] = [
  {
    prompt: '路遇赌坊，有人拉你赌一把。',
    choices: () => [
      { label: '赌一把', outcomeText: '你时来运转，赢了一笔银两。', reward: { silver: 25 } },
      { label: '婉拒离开', outcomeText: '你不为所动，继续赶路。', reward: {} }
    ]
  },
  {
    prompt: '见一受伤旅人倒卧路旁。',
    choices: () => [
      { label: '施以援手', outcomeText: '他感激不尽，赠你一件随身之物。', reward: { drops: [randDrop()] } },
      { label: '不管闲事', outcomeText: '你绕道而行，省下药材。', reward: { silver: 5 } }
    ]
  },
  {
    prompt: '山涧发现一株异草，似有毒香。',
    choices: () => [
      { label: '冒险采摘', outcomeText: '异草入手，卖得几两银子，似有所悟。', reward: { silver: 15, exp: 20 } },
      { label: '小心避开', outcomeText: '你谨慎绕开，平安无事。', reward: {} }
    ]
  },
  {
    prompt: '夜宿客栈，隔壁喧哗有人斗殴。',
    choices: () => [
      { label: '出头制止', outcomeText: '你出手镇场，反被讹去几两汤药钱。', reward: { silver: -12 } },
      { label: '闭门不出', outcomeText: '你充耳不闻，安然睡到天明。', reward: { exp: 10 } }
    ]
  }
]

/** 随机生成一件低品掉落 */
function randDrop(): Equipment {
  const slot = ALL_SLOTS[Math.floor(Math.random() * ALL_SLOTS.length)]
  return rollEquipment(slot, randomDropGrade(0), genId('eq'))
}

function pickType(): PathNodeType {
  const total = NODE_WEIGHTS.reduce((s, n) => s + n.w, 0)
  let r = Math.random() * total
  for (const n of NODE_WEIGHTS) {
    if (r < n.w) return n.type
    r -= n.w
  }
  return 'battle'
}

function makeRandomNode(levelIdx: number, chapter: number): PathNode {
  const type = pickType()
  switch (type) {
    case 'battle': {
      const count = Math.random() < 0.25 ? 2 : 1
      const enemies = Array.from({ length: count }, () => makePathEnemy(levelIdx, false, chapter))
      return { type, label: '战斗', resolved: false, enemies }
    }
    case 'elite': {
      const count = Math.random() < 0.4 ? 2 : 1
      const enemies = Array.from({ length: count }, () => makePathEnemy(levelIdx, true, chapter))
      return { type, label: '精英', resolved: false, enemies }
    }
    case 'treasure': {
      const reward: PathReward = { silver: 10 + Math.floor(Math.random() * 20) }
      if (Math.random() < 0.4) reward.stones = 1
      if (Math.random() < 0.5) reward.drops = [randDrop()]
      return { type, label: '宝箱', resolved: false, storyText: '你发现一只落满灰尘的木箱。', reward }
    }
    case 'story': {
      const text = STORY_POOL[Math.floor(Math.random() * STORY_POOL.length)]
      const reward: PathReward = {
        exp: 10 + Math.floor(Math.random() * 15),
        silver: 5 + Math.floor(Math.random() * 10)
      }
      return { type, label: '剧情', resolved: false, storyText: text, reward }
    }
    case 'event': {
      const e = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)]
      return { type, label: '事件', resolved: false, storyText: e.prompt, choices: e.choices() }
    }
    default: {
      const enemies = [makePathEnemy(levelIdx, false, chapter)]
      return { type: 'battle', label: '战斗', resolved: false, enemies }
    }
  }
}

/** 生成一条路径：长度 5+chapter，末节点为关主(用本关 enemies) */
export function generatePath(level: LevelDef): PathNode[] {
  const levelIdx = (level.chapter - 1) * 10 + level.index
  const len = 5 + level.chapter
  const nodes: PathNode[] = []
  for (let i = 0; i < len - 1; i++) {
    nodes.push(makeRandomNode(levelIdx, level.chapter))
  }
  nodes.push({ type: 'boss', label: '关主', resolved: false, enemies: level.enemies })
  return nodes
}
