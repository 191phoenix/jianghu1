<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { GRADE_LABEL, ALL_SLOTS, SLOT_LABEL } from '@/config/equipmentConfig'
import { enhanceCost, MAX_STAR } from '@/logic/equipmentLogic'
import { formatStatsLine } from '@/utils/format'
import type { Equipment } from '@/types/game'

const game = useGameStore()

const slots = ALL_SLOTS.map((slot) => ({ slot, label: SLOT_LABEL[slot] }))

const GRADE_COLOR: Record<string, string> = {
  white: 'text-fg',
  green: 'text-green-500',
  blue: 'text-blue-400',
  purple: 'text-purple-400'
}
function gradeColor(eq: Equipment): string {
  return GRADE_COLOR[eq.grade] ?? 'text-fg'
}
function canEnhance(eq: Equipment): boolean {
  return eq.star < MAX_STAR && game.player.stones >= enhanceCost(eq.star)
}
</script>

<template>
  <div class="space-y-4 p-4">
    <h1 class="text-2xl text-gold">背包</h1>
    <div class="text-sm text-muted">强化石：<span class="text-gold">{{ game.player.stones }}</span></div>

    <div class="rounded-lg border border-border bg-surface p-4">
      <h2 class="mb-2 text-gold">已装备</h2>
      <div class="grid grid-cols-3 gap-2">
        <div v-for="s in slots" :key="s.slot" class="rounded border border-border bg-bg p-2 text-center">
          <div class="text-xs text-muted">{{ s.label }}</div>
          <div v-if="game.player.equipped[s.slot]" class="mt-1">
            <div :class="gradeColor(game.player.equipped[s.slot]!)">
              {{ game.player.equipped[s.slot]!.name }}
              <span class="text-gold">★{{ game.player.equipped[s.slot]!.star }}</span>
            </div>
            <div class="text-xs text-muted">
              {{ formatStatsLine(game.player.equipped[s.slot]!.stats) }}
            </div>
            <div class="mt-1 flex justify-center gap-2 text-xs">
              <button class="text-primary underline" @click="game.unequip(s.slot)">卸下</button>
              <button
                class="text-gold underline disabled:opacity-30"
                :disabled="!canEnhance(game.player.equipped[s.slot]!)"
                @click="game.enhanceEquipment(game.player.equipped[s.slot]!.id)"
              >
                强化({{ enhanceCost(game.player.equipped[s.slot]!.star) }})
              </button>
            </div>
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
            <span class="text-gold">★{{ eq.star }}</span>
            <span class="ml-1 text-xs text-muted">({{ GRADE_LABEL[eq.grade] }})</span>
            <span class="ml-2 text-xs text-muted">{{ formatStatsLine(eq.stats) }}</span>
          </span>
          <span class="flex gap-1">
            <button class="rounded bg-primary px-2 py-0.5 text-xs text-primary-fg" @click="game.equipItem(eq.id)">穿</button>
            <button
              class="rounded border border-gold px-2 py-0.5 text-xs text-gold disabled:opacity-30"
              :disabled="!canEnhance(eq)"
              @click="game.enhanceEquipment(eq.id)"
            >
              强化
            </button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
