import type { Player } from '@/types/game'
import { TASKS, type TaskDef } from '@/config/taskConfig'

export { TASKS, type TaskDef }

/** 任务当前进度 */
export function taskProgress(player: Player, task: TaskDef): number {
  switch (task.type) {
    case 'clear':
      return player.clearedLevelIds.length
    case 'level':
      return player.level
    case 'enhance':
      return player.enhanceCount
    case 'hero':
      return player.heroes.length
    case 'inner':
      return player.innerSkills.length
  }
}

export function isTaskDone(player: Player, task: TaskDef): boolean {
  return taskProgress(player, task) >= task.target
}

export function isTaskClaimed(player: Player, task: TaskDef): boolean {
  return player.tasksClaimed.includes(task.id)
}
