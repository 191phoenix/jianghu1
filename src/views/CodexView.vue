<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { ALL_SLOTS, SLOT_LABEL, GRADE_ORDER, GRADE_LABEL } from '@/config/equipmentConfig'
import { HEROES } from '@/config/heroConfig'
import { INNER_SKILLS } from '@/config/innerSkillConfig'
import { LEVELS } from '@/config/levelConfig'

const game = useGameStore()

function seenEq(slot: string, grade: string): boolean {
  return game.player.seenEquipment.includes(`${slot}-${grade}`)
}

/** 所有关卡敌人去重 */
const allEnemies: [string, string][] = (() => {
  const map = new Map<string, string>()
  for (const l of LEVELS) for (const e of l.enemies) map.set(e.id, e.name)
  return [...map.entries()]
})()

function seenEnemy(id: string): boolean {
  return game.player.seenEnemies.includes(id)
}
</script>

<template>
  <div class="space-y-4 p-4">
    <h1 class="text-2xl text-gold">图鉴</h1>

    <div class="rounded-lg border border-border bg-surface p-4">
      <h2 class="mb-2 text-gold">
        装备图鉴 {{ game.player.seenEquipment.length }}/{{ ALL_SLOTS.length * GRADE_ORDER.length }}
      </h2>
      <div class="space-y-1">
        <div v-for="slot in ALL_SLOTS" :key="slot" class="flex items-center gap-1 text-xs">
          <span class="w-10 text-muted">{{ SLOT_LABEL[slot] }}</span>
          <span
            v-for="g in GRADE_ORDER"
            :key="g"
            class="rounded px-2 py-0.5"
            :class="seenEq(slot, g) ? 'bg-bg text-fg' : 'bg-bg text-muted opacity-30'"
          >
            {{ GRADE_LABEL[g] }}
          </span>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-border bg-surface p-4">
      <h2 class="mb-2 text-gold">侠客图鉴 {{ game.player.heroes.length }}/{{ HEROES.length }}</h2>
      <div class="flex flex-wrap gap-2 text-xs">
        <span
          v-for="h in HEROES"
          :key="h.id"
          class="rounded px-2 py-0.5"
          :class="game.player.heroes.includes(h.id) ? 'bg-bg text-fg' : 'bg-bg text-muted opacity-30'"
        >
          {{ h.name }}
        </span>
      </div>
    </div>

    <div class="rounded-lg border border-border bg-surface p-4">
      <h2 class="mb-2 text-gold">内功图鉴 {{ game.player.innerSkills.length }}/{{ INNER_SKILLS.length }}</h2>
      <div class="flex flex-wrap gap-2 text-xs">
        <span
          v-for="s in INNER_SKILLS"
          :key="s.id"
          class="rounded px-2 py-0.5"
          :class="game.player.innerSkills.includes(s.id) ? 'bg-bg text-fg' : 'bg-bg text-muted opacity-30'"
        >
          {{ s.name }}
        </span>
      </div>
    </div>

    <div class="rounded-lg border border-border bg-surface p-4">
      <h2 class="mb-2 text-gold">怪物图鉴 {{ game.player.seenEnemies.length }}/{{ allEnemies.length }}</h2>
      <div class="flex flex-wrap gap-2 text-xs">
        <span
          v-for="[id, name] in allEnemies"
          :key="id"
          class="rounded px-2 py-0.5"
          :class="seenEnemy(id) ? 'bg-bg text-fg' : 'bg-bg text-muted opacity-30'"
        >
          {{ name }}
        </span>
      </div>
    </div>
  </div>
</template>
