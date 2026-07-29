export interface TaskDef {
  id: string
  desc: string
  type: 'clear' | 'level' | 'enhance' | 'hero' | 'inner'
  target: number
  reward: { silver: number; stones: number }
}

/** 成就式任务（一次性，达成可领奖） */
export const TASKS: TaskDef[] = [
  { id: 'clear5', desc: '通关 5 关', type: 'clear', target: 5, reward: { silver: 100, stones: 3 } },
  { id: 'clear10', desc: '通关 10 关', type: 'clear', target: 10, reward: { silver: 200, stones: 5 } },
  { id: 'clear20', desc: '通关全部 20 关', type: 'clear', target: 20, reward: { silver: 500, stones: 10 } },
  { id: 'level10', desc: '升到 10 级', type: 'level', target: 10, reward: { silver: 150, stones: 3 } },
  { id: 'level20', desc: '升到 20 级', type: 'level', target: 20, reward: { silver: 300, stones: 6 } },
  { id: 'enhance5', desc: '强化装备 5 次', type: 'enhance', target: 5, reward: { silver: 100, stones: 2 } },
  { id: 'enhance15', desc: '强化装备 15 次', type: 'enhance', target: 15, reward: { silver: 250, stones: 5 } },
  { id: 'hero2', desc: '结识 2 位侠客', type: 'hero', target: 2, reward: { silver: 120, stones: 2 } },
  { id: 'hero3', desc: '结识全部 3 位侠客', type: 'hero', target: 3, reward: { silver: 200, stones: 4 } },
  { id: 'inner2', desc: '习得 2 部内功', type: 'inner', target: 2, reward: { silver: 120, stones: 2 } }
]
