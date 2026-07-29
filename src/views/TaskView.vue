<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { TASKS } from '@/config/taskConfig'
import { taskProgress, isTaskDone, isTaskClaimed } from '@/logic/taskLogic'

const game = useGameStore()
</script>

<template>
  <div class="space-y-3 p-4">
    <h1 class="text-2xl text-gold">任务</h1>

    <div v-for="t in TASKS" :key="t.id" class="rounded-lg border border-border bg-surface p-3">
      <div class="flex justify-between">
        <span class="text-fg">{{ t.desc }}</span>
        <span class="text-xs text-muted">
          {{ Math.min(taskProgress(game.player, t), t.target) }}/{{ t.target }}
        </span>
      </div>
      <div class="mt-1 flex items-center justify-between">
        <span class="text-xs text-gold">奖励 {{ t.reward.silver }}银 + {{ t.reward.stones }}石</span>
        <button
          v-if="isTaskClaimed(game.player, t)"
          class="text-xs text-muted"
          disabled
        >
          已领取
        </button>
        <button
          v-else-if="isTaskDone(game.player, t)"
          class="rounded bg-primary px-3 py-0.5 text-xs text-primary-fg"
          @click="game.claimTask(t.id)"
        >
          领取
        </button>
        <span v-else class="text-xs text-muted">未达成</span>
      </div>
    </div>
  </div>
</template>
