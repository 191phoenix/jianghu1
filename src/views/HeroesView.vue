<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { HEROES } from '@/config/heroConfig'
import { formatStatsLine } from '@/utils/format'

const game = useGameStore()

function isAcquired(id: string): boolean {
  return game.player.heroes.includes(id)
}
function inFormation(id: string): boolean {
  return game.player.formation.includes(id)
}
function toggle(id: string) {
  if (!isAcquired(id)) return
  const slot = game.player.formation.indexOf(id)
  if (slot >= 0) {
    game.setFormation(slot, null)
  } else {
    const empty = game.player.formation.indexOf(null)
    if (empty >= 0) game.setFormation(empty, id)
  }
}
</script>

<template>
  <div class="space-y-3 p-4">
    <h1 class="text-2xl text-gold">侠客</h1>
    <p class="text-xs text-muted">主角 + 最多 2 侠客上阵。通关特定关卡结识新侠客。</p>

    <div
      v-for="h in HEROES"
      :key="h.id"
      class="rounded-lg border border-border bg-surface p-3"
      :class="{ 'opacity-50': !isAcquired(h.id) }"
    >
      <div class="flex items-center justify-between">
        <div>
          <span class="text-fg">{{ h.name }}</span>
          <span class="ml-1 text-xs text-muted">{{ h.title }}</span>
        </div>
        <button
          v-if="isAcquired(h.id)"
          class="rounded px-2 py-0.5 text-xs"
          :class="inFormation(h.id) ? 'bg-primary text-primary-fg' : 'border border-border text-fg'"
          @click="toggle(h.id)"
        >
          {{ inFormation(h.id) ? '上阵中·撤下' : '上阵' }}
        </button>
        <span v-else class="text-xs text-muted">未结识</span>
      </div>
      <div v-if="isAcquired(h.id)" class="mt-1 text-xs text-muted">
        {{ formatStatsLine(h.stats) }}
      </div>
      <div class="mt-1 text-xs text-gold">【{{ h.skill.name }}】{{ h.skill.desc }}</div>
    </div>
  </div>
</template>
