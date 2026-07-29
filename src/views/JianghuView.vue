<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { LEVELS, FIRST_LEVEL_ID, getLevel } from '@/config/levelConfig'
import { computePlayerStats } from '@/logic/statsLogic'
import { formationHeroes } from '@/logic/heroLogic'
import BattlePanel from '@/components/BattlePanel.vue'
import type { BattleResult, LevelDef } from '@/types/game'

const game = useGameStore()

const result = ref<BattleResult | null>(null)
const battleAllies = ref<{ name: string; hp: number }[]>([])
const battleEnemies = ref<{ name: string; hp: number }[]>([])

function isUnlocked(levelId: string): boolean {
  if (levelId === FIRST_LEVEL_ID) return true
  return game.player.clearedLevelIds.includes(levelId) || game.player.currentLevelId === levelId
}

function challenge(levelId: string) {
  const level = getLevel(levelId)
  if (!level) return
  const allies = [{ name: game.player.name, hp: computePlayerStats(game.player).hp }]
  for (const h of formationHeroes(game.player)) allies.push({ name: h.name, hp: h.stats.hp })
  battleAllies.value = allies
  battleEnemies.value = level.enemies.map((e) => ({ name: e.name, hp: e.stats.hp }))
  result.value = game.challengeLevel(levelId)
}

const CHAPTER_LABEL = ['一', '二', '三', '四', '五']
const chapters = computed(() => {
  const map = new Map<number, LevelDef[]>()
  for (const l of LEVELS) {
    if (!map.has(l.chapter)) map.set(l.chapter, [])
    map.get(l.chapter)!.push(l)
  }
  return [...map.entries()]
})
</script>

<template>
  <div class="space-y-3 p-4">
    <h1 class="text-2xl text-gold">江湖</h1>

    <div v-for="[ch, levels] in chapters" :key="ch" class="space-y-1">
      <div class="text-sm text-gold">第{{ CHAPTER_LABEL[ch - 1] || ch }}章</div>
      <div
        v-for="lvl in levels"
        :key="lvl.id"
        class="flex items-center justify-between rounded border border-border bg-surface px-3 py-2"
        :class="{ 'opacity-40': !isUnlocked(lvl.id) }"
      >
        <div class="text-sm">
          <span class="text-fg">{{ lvl.name }}</span>
          <span class="ml-2 text-xs text-muted">{{ lvl.enemies.map((e) => e.name).join('/') }}</span>
          <span v-if="lvl.enemies.length > 1" class="ml-1 text-xs text-primary">x{{ lvl.enemies.length }}</span>
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

    <BattlePanel v-if="result" :result="result" :allies="battleAllies" :enemies="battleEnemies" />
  </div>
</template>
