<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { HEROES } from '@/config/heroConfig'
import { SECTS } from '@/config/sectConfig'
import { computeHeroStats, heroExpToNext, emptyHeroEquipped } from '@/logic/heroLogic'
import { GRADE_LABEL, ALL_SLOTS, SLOT_LABEL } from '@/config/equipmentConfig'
import { WEAPON_TYPE_LABEL, WEAPON_TYPE_SHAPE } from '@/logic/battleLogic'
import { formatStatsLine } from '@/utils/format'
import type { Hero, EquipSlot, SkillDef } from '@/types/game'

const game = useGameStore()
const equipping = ref<string | null>(null) // `${heroId}:${slot}`

const slots = ALL_SLOTS.map((slot) => ({ slot, label: SLOT_LABEL[slot] }))

const GRADE_COLOR: Record<string, string> = {
  white: 'text-fg',
  green: 'text-green-500',
  blue: 'text-blue-400',
  purple: 'text-purple-400'
}
function gradeColor(eq: { grade: string }): string {
  return GRADE_COLOR[eq.grade] ?? 'text-fg'
}

function isAcquired(id: string) {
  return game.player.heroes.includes(id)
}
function heroLevel(id: string) {
  return game.player.heroLevels[id] || 1
}
function heroExp(id: string) {
  return game.player.heroExp[id] || 0
}
function heroSlots(id: string) {
  return game.player.heroEquipped[id] || emptyHeroEquipped()
}
function expPct(id: string) {
  return Math.min(100, (heroExp(id) / heroExpToNext(heroLevel(id))) * 100)
}
function statsOf(h: Hero) {
  return computeHeroStats(h, heroLevel(h.id), heroSlots(h.id), game.player.heroSects[h.id] || null)
}
function heroSectInfo(id: string) {
  const sid = game.player.heroSects[id]
  return sid ? SECTS[sid] : undefined
}
function useSectSkill(id: string) {
  return !!heroSectInfo(id) && game.player.heroUseSectSkill[id] !== false
}
function currentSkill(h: Hero): SkillDef {
  const sect = heroSectInfo(h.id)
  return useSectSkill(h.id) && sect ? sect.skill : h.skill
}
function onSectChange(heroId: string, value: string) {
  game.setHeroSect(heroId, value || null)
}
function bagForSlot(slot: EquipSlot) {
  return game.player.bag.filter((eq) => eq.slot === slot)
}
function eqKey(heroId: string, slot: EquipSlot) {
  return `${heroId}:${slot}`
}
function toggleEqPicker(heroId: string, slot: EquipSlot) {
  const k = eqKey(heroId, slot)
  equipping.value = equipping.value === k ? null : k
}
function pickEq(heroId: string, eqId: string) {
  game.equipHero(heroId, eqId)
  equipping.value = null
}
function unequip(heroId: string, slot: EquipSlot) {
  game.unequipHero(heroId, slot)
}
</script>

<template>
  <div class="space-y-3 p-4">
    <h1 class="text-2xl text-gold">侠客</h1>
    <p class="text-xs text-muted">主角 + 最多 2 侠客上阵。挑战得经验升级，每人可穿 6 件装备。</p>

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
        <span class="text-xs text-primary">
          {{ WEAPON_TYPE_LABEL[h.weaponType] }}·{{ WEAPON_TYPE_SHAPE[h.weaponType] }}
        </span>
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
        <div class="mt-0.5 text-xs text-gold">【{{ currentSkill(h).name }}】{{ currentSkill(h).desc }}</div>

        <!-- 门派 -->
        <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span class="text-muted">门派：</span>
          <select
            class="rounded border border-border bg-bg px-1 py-0.5 text-fg"
            :value="game.player.heroSects[h.id] || ''"
            @change="onSectChange(h.id, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">无</option>
            <option v-for="s in SECTS" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
          <span v-if="heroSectInfo(h.id)" class="text-gold">
            心法：{{ heroSectInfo(h.id)!.inner.name }}（{{ heroSectInfo(h.id)!.inner.desc }}）
          </span>
        </div>
        <div v-if="heroSectInfo(h.id)" class="mt-1 flex items-center gap-2 text-xs">
          <span class="text-muted">武功：</span>
          <button class="text-primary underline" @click="game.toggleHeroSectSkill(h.id)">
            {{ useSectSkill(h.id) ? heroSectInfo(h.id)!.skill.name : h.skill.name }}（切换）
          </button>
          <span class="text-muted">{{ useSectSkill(h.id) ? '门派武功' : '自带武功' }}</span>
        </div>

        <!-- 6 槽装备 -->
        <div class="mt-2 grid grid-cols-3 gap-1">
          <div
            v-for="s in slots"
            :key="s.slot"
            class="rounded border border-border bg-bg p-1.5 text-center"
          >
            <div class="text-[10px] text-muted">{{ s.label }}</div>
            <template v-if="heroSlots(h.id)[s.slot]">
              <div :class="gradeColor(heroSlots(h.id)[s.slot]!)">
                <span class="text-[11px]">{{ heroSlots(h.id)[s.slot]!.name }}</span>
                <span class="text-gold">★{{ heroSlots(h.id)[s.slot]!.star }}</span>
              </div>
              <div class="flex justify-center gap-2 text-[10px]">
                <button class="text-primary underline" @click="toggleEqPicker(h.id, s.slot)">换</button>
                <button class="text-primary underline" @click="unequip(h.id, s.slot)">卸</button>
              </div>
            </template>
            <template v-else>
              <div class="my-1 text-[10px] text-muted">空</div>
              <button class="text-[10px] text-primary underline" @click="toggleEqPicker(h.id, s.slot)">
                穿
              </button>
            </template>
          </div>
        </div>

        <!-- 背包选择（按槽过滤） -->
        <div
          v-if="equipping && equipping.startsWith(h.id + ':')"
          class="mt-1 space-y-1 rounded bg-bg p-2"
        >
          <div v-if="bagForSlot((equipping.split(':')[1] as EquipSlot)).length === 0" class="text-xs text-muted">
            背包无此部位装备
          </div>
          <div
            v-for="eq in bagForSlot((equipping.split(':')[1] as EquipSlot))"
            :key="eq.id"
            class="flex justify-between text-xs"
          >
            <span class="text-fg">
              <span :class="gradeColor(eq)">{{ eq.name }}</span>
              <span class="text-gold">★{{ eq.star }}</span>
              <span class="ml-1 text-muted">({{ GRADE_LABEL[eq.grade] }})</span>
              <span class="ml-2 text-muted">{{ formatStatsLine(eq.stats) }}</span>
            </span>
            <button class="text-primary underline" @click="pickEq(h.id, eq.id)">
              穿
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
