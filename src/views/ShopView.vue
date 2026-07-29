<script setup lang="ts">
import { onMounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { GRADE_LABEL } from '@/config/equipmentConfig'
import { EQUIP_PRICE, STONE_PRICE, REFRESH_PRICE } from '@/config/shopConfig'
import { formatStatsLine } from '@/utils/format'
import type { Equipment } from '@/types/game'

const game = useGameStore()
onMounted(() => game.initShopIfEmpty())

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
    <h1 class="text-2xl text-gold">商店</h1>
    <div class="text-sm text-muted">银两：<span class="text-gold">{{ game.player.silver }}</span></div>

    <div class="rounded-lg border border-border bg-surface p-4">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-gold">装备摊</h2>
        <button
          class="text-xs text-primary underline disabled:opacity-30"
          :disabled="game.player.silver < REFRESH_PRICE"
          @click="game.refreshShop()"
        >
          刷新({{ REFRESH_PRICE }}银)
        </button>
      </div>
      <div v-if="game.player.shopItems.length === 0" class="text-sm text-muted">装备售罄，刷新看看</div>
      <div class="space-y-1">
        <div
          v-for="(eq, idx) in game.player.shopItems"
          :key="eq.id"
          class="flex items-center justify-between rounded bg-bg px-2 py-1 text-sm"
        >
          <span>
            <span :class="gradeColor(eq)">{{ eq.name }}</span>
            <span class="ml-1 text-xs text-muted">
              ({{ GRADE_LABEL[eq.grade] }}) {{ formatStatsLine(eq.stats) }}
            </span>
          </span>
          <button
            class="rounded bg-primary px-2 py-0.5 text-xs text-primary-fg disabled:opacity-30"
            :disabled="game.player.silver < EQUIP_PRICE[eq.grade]"
            @click="game.buyShopEquip(idx)"
          >
            买({{ EQUIP_PRICE[eq.grade] }})
          </button>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-border bg-surface p-4">
      <h2 class="mb-2 text-gold">杂物</h2>
      <div class="flex items-center justify-between rounded bg-bg px-2 py-1 text-sm">
        <span class="text-fg">强化石</span>
        <button
          class="rounded bg-primary px-2 py-0.5 text-xs text-primary-fg disabled:opacity-30"
          :disabled="game.player.silver < STONE_PRICE"
          @click="game.buyStones()"
        >
          买 1 颗({{ STONE_PRICE }}银)
        </button>
      </div>
    </div>
  </div>
</template>
