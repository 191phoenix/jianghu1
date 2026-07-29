<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { LEVELS, FIRST_LEVEL_ID } from '@/config/levelConfig'
import { computePlayerStats } from '@/logic/statsLogic'
import BattlePanel from '@/components/BattlePanel.vue'
import type { BattleResult } from '@/types/game'

const game = useGameStore()
const playerStats = computed(() => computePlayerStats(game.player))

const result = ref<BattleResult | null>(null)
const battlePlayerHp = ref(0)
const battlePlayerName = ref('')
const battleEnemyName = ref('')
const battleEnemyHp = ref(0)

function isUnlocked(levelId: string): boolean {
  if (levelId === FIRST_LEVEL_ID) return true
  return game.player.clearedLevelIds.includes(levelId) || game.player.currentLevelId === levelId
}

function challenge(levelId: string) {
  const level = LEVELS.find((l) => l.id === levelId)
  if (!level) return
  battlePlayerHp.value = playerStats.value.hp
  battlePlayerName.value = game.player.name
  battleEnemyName.value = level.enemies[0].name
  battleEnemyHp.value = level.enemies[0].stats.hp
  result.value = game.challengeLevel(levelId)
}
</script>

<template>
  <div class="space-y-3 p-4">
    <h1 class="text-2xl text-gold">江湖</h1>

    <div class="space-y-1">
      <div
        v-for="lvl in LEVELS"
        :key="lvl.id"
        class="flex items-center justify-between rounded border border-border bg-surface px-3 py-2"
        :class="{ 'opacity-40': !isUnlocked(lvl.id) }"
      >
        <div class="text-sm">
          <span class="text-fg">{{ lvl.name }}</span>
          <span class="ml-2 text-xs text-muted">{{ lvl.enemies[0].name }}</span>
          <span v-if="lvl.isBoss" class="ml-1 text-xs text-primary">BOSS</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span v-if="game.player.clearedLevelIds.includes(lvl.id)" class="text-green-500">已通关</span>
          <span v-else-if="!isUnlocked(lvl.id)" class="text-muted">未解锁</span>
          <button
            v-if="isUnlocked(lvl.id)"
            class="rounded bg-primary px-3 py-1 text-primary-fg"
            @click="challenge(lvl.id)"
          >
            挑战
          </button>
        </div>
      </div>
    </div>

    <BattlePanel
      v-if="result"
      :result="result"
      :player-hp="battlePlayerHp"
      :player-name="battlePlayerName"
      :enemy-name="battleEnemyName"
      :enemy-hp="battleEnemyHp"
    />
  </div>
</template>
