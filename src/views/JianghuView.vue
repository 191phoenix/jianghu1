<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { LEVELS, FIRST_LEVEL_ID } from '@/config/levelConfig'
import type { LevelDef } from '@/types/game'

const game = useGameStore()

function isUnlocked(levelId: string): boolean {
  if (levelId === FIRST_LEVEL_ID) return true
  return game.player.clearedLevelIds.includes(levelId) || game.player.currentLevelId === levelId
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
    <p class="text-xs text-muted">点「进入」走路径推图，沿途遇剧情与怪，击败关主通关。</p>

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
            @click="game.enterPath(lvl.id)"
          >
            进入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
