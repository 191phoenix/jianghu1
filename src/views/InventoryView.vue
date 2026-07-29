<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { GRADE_LABEL } from '@/config/equipmentConfig'
import { formatStatsLine } from '@/utils/format'
import type { EquipSlot, Equipment } from '@/types/game'

const game = useGameStore()

const slots: { slot: EquipSlot; label: string }[] = [
  { slot: 'weapon', label: '武器' },
  { slot: 'armor', label: '防具' },
  { slot: 'accessory', label: '饰品' }
]

const GRADE_COLOR: Record<string, string> = {
  white: 'text-fg',
  green: 'text-green-500',
  blue: 'text-blue-400',
  purple: 'text-purple-400'
}

function gradeColor(eq: Equipment): string {
  return GRADE_COLOR[eq.grade] ?? 'text-fg'
}
</script>

<template>
  <div class="space-y-4 p-4">
    <h1 class="text-2xl text-gold">背包</h1>

    <div class="rounded-lg border border-border bg-surface p-4">
      <h2 class="mb-2 text-gold">已装备</h2>
      <div class="grid grid-cols-3 gap-2">
        <div v-for="s in slots" :key="s.slot" class="rounded border border-border bg-bg p-2 text-center">
          <div class="text-xs text-muted">{{ s.label }}</div>
          <div v-if="game.player.equipped[s.slot]" class="mt-1">
            <div :class="gradeColor(game.player.equipped[s.slot]!)">
              {{ game.player.equipped[s.slot]!.name }}
            </div>
            <div class="text-xs text-muted">
              {{ formatStatsLine(game.player.equipped[s.slot]!.stats) }}
            </div>
            <button class="mt-1 text-xs text-primary underline" @click="game.unequip(s.slot)">
              卸下
            </button>
          </div>
          <div v-else class="mt-1 text-xs text-muted">空</div>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-border bg-surface p-4">
      <h2 class="mb-2 text-gold">背包 ({{ game.player.bag.length }})</h2>
      <div v-if="game.player.bag.length === 0" class="text-sm text-muted">空空如也</div>
      <div class="space-y-1">
        <div
          v-for="eq in game.player.bag"
          :key="eq.id"
          class="flex items-center justify-between rounded bg-bg px-2 py-1 text-sm"
        >
          <span>
            <span :class="gradeColor(eq)">{{ eq.name }}</span>
            <span class="ml-1 text-xs text-muted">({{ GRADE_LABEL[eq.grade] }})</span>
            <span class="ml-2 text-xs text-muted">{{ formatStatsLine(eq.stats) }}</span>
          </span>
          <button class="rounded bg-primary px-2 py-0.5 text-xs text-primary-fg" @click="game.equipItem(eq.id)">
            穿
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
