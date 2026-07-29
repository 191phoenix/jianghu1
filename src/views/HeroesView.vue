<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { HEROES } from '@/config/heroConfig'
import { computeHeroStats, heroExpToNext } from '@/logic/heroLogic'
import { GRADE_LABEL } from '@/config/equipmentConfig'
import { formatStatsLine } from '@/utils/format'
import type { Hero } from '@/types/game'

const game = useGameStore()
const equipping = ref<string | null>(null)

function isAcquired(id: string) {
  return game.player.heroes.includes(id)
}
function inFormation(id: string) {
  return game.player.formation.includes(id)
}
function heroLevel(id: string) {
  return game.player.heroLevels[id] || 1
}
function heroExp(id: string) {
  return game.player.heroExp[id] || 0
}
function heroEquip(id: string) {
  return game.player.heroEquipped[id] || null
}
function expPct(id: string) {
  return Math.min(100, (heroExp(id) / heroExpToNext(heroLevel(id))) * 100)
}
function statsOf(h: Hero) {
  return computeHeroStats(h, heroLevel(h.id), heroEquip(h.id))
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
function pickEq(heroId: string, eqId: string) {
  game.equipHero(heroId, eqId)
  equipping.value = null
}
</script>

<template>
  <div class="space-y-3 p-4">
    <h1 class="text-2xl text-gold">侠客</h1>
    <p class="text-xs text-muted">主角 + 最多 2 侠客上阵。挑战得经验升级，可穿 1 件装备。</p>

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
          <span v-if="isAcquired(h.id)" class="ml-2 text-xs text-gold">Lv.{{ heroLevel(h.id) }}</span>
        </div>
        <button
          v-if="isAcquired(h.id)"
          class="rounded px-2 py-0.5 text-xs"
          :class="inFormation(h.id) ? 'bg-primary text-primary-fg' : 'border border-border text-fg'"
          @click="toggle(h.id)"
        >
          {{ inFormation(h.id) ? '撤下' : '上阵' }}
        </button>
        <span v-else class="text-xs text-muted">未结识</span>
      </div>

      <template v-if="isAcquired(h.id)">
        <div class="mt-2">
          <div class="mb-0.5 flex justify-between text-xs text-muted">
            <span>经验</span>
            <span>{{ heroExp(h.id) }} / {{ heroExpToNext(heroLevel(h.id)) }}</span>
          </div>
          <div class="h-1.5 overflow-hidden rounded bg-bg">
            <div class="h-full bg-gold" :style="{ width: expPct(h.id) + '%' }"></div>
          </div>
        </div>
        <div class="mt-1 text-xs text-muted">{{ formatStatsLine(statsOf(h)) }}</div>
        <div class="mt-0.5 text-xs text-gold">【{{ h.skill.name }}】{{ h.skill.desc }}</div>

        <div class="mt-2 flex items-center gap-2 text-xs">
          <span class="text-muted">装备：</span>
          <span v-if="heroEquip(h.id)" class="text-fg">
            {{ heroEquip(h.id)!.name }} ★{{ heroEquip(h.id)!.star }}
          </span>
          <span v-else class="text-muted">无</span>
          <button class="text-primary underline" @click="equipping = equipping === h.id ? null : h.id">
            换
          </button>
          <button v-if="heroEquip(h.id)" class="text-primary underline" @click="game.unequipHero(h.id)">
            卸
          </button>
        </div>

        <div v-if="equipping === h.id" class="mt-1 space-y-1 rounded bg-bg p-2">
          <div v-if="game.player.bag.length === 0" class="text-xs text-muted">背包空</div>
          <div v-for="eq in game.player.bag" :key="eq.id" class="flex justify-between text-xs">
            <span class="text-fg">
              {{ eq.name }} ★{{ eq.star }} ({{ GRADE_LABEL[eq.grade] }})
              {{ formatStatsLine(eq.stats) }}
            </span>
            <button class="text-primary underline" @click="pickEq(h.id, eq.id)">穿</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
