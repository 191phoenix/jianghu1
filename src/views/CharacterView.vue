<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { SECTS } from '@/config/sectConfig'
import { TALENTS } from '@/config/talentConfig'
import { INNER_SKILLS } from '@/config/innerSkillConfig'
import { availableTalentPoints } from '@/logic/talentLogic'
import { computePlayerStats, baseStatsByLevel } from '@/logic/statsLogic'
import { expToNext } from '@/logic/growthLogic'
import { WEAPON_TYPE_LABEL, WEAPON_TYPE_SHAPE } from '@/logic/battleLogic'
import { statLabel, formatStatValue } from '@/utils/format'
import type { Stats } from '@/types/game'
import SaveManager from '@/components/SaveManager.vue'

const game = useGameStore()
const nameInput = ref(game.player.name)

const total = computed(() => computePlayerStats(game.player))
const base = computed(() => baseStatsByLevel(game.player.level))
const expNeed = computed(() => expToNext(game.player.level))
const expPct = computed(() => Math.min(100, (game.player.exp / expNeed.value) * 100))
const availPoints = computed(() => availableTalentPoints(game.player))
const acquiredInner = computed(() => INNER_SKILLS.filter((s) => game.player.innerSkills.includes(s.id)))

const statRows = computed(() => {
  const keys: (keyof Stats)[] = ['hp', 'atk', 'def', 'spd', 'critRate', 'critDmg']
  return keys.map((k) => {
    const bonus = total.value[k] - base.value[k]
    return {
      label: statLabel(k),
      total: formatStatValue(k, total.value[k]),
      bonusStr: bonus !== 0 ? '+' + formatStatValue(k, bonus) : ''
    }
  })
})

function saveName() {
  game.setPlayerName(nameInput.value)
  game.touchSave()
}
</script>

<template>
  <div class="space-y-4 p-4">
    <h1 class="text-2xl text-gold">角色</h1>

    <div class="rounded-lg border border-border bg-surface p-4">
      <label class="mb-1 block text-sm text-muted">角色名</label>
      <div class="flex gap-2">
        <input v-model="nameInput" class="flex-1 rounded border border-border bg-bg px-2 py-1 text-fg" />
        <button class="rounded bg-primary px-3 text-primary-fg" @click="saveName">保存</button>
      </div>
      <div class="mt-3 text-sm text-muted">等级 <span class="text-fg">{{ game.player.level }}</span></div>
      <div class="mt-2">
        <div class="mb-1 flex justify-between text-xs text-muted">
          <span>经验</span>
          <span>{{ game.player.exp }} / {{ expNeed }}</span>
        </div>
        <div class="h-2 overflow-hidden rounded bg-bg">
          <div class="h-full bg-gold" :style="{ width: expPct + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-border bg-surface p-4">
      <h2 class="mb-2 text-gold">门派</h2>
      <div class="space-y-1">
        <div
          v-for="s in SECTS"
          :key="s.id"
          class="cursor-pointer rounded p-2"
          :class="game.player.sect === s.id ? 'border border-gold bg-bg' : 'bg-bg'"
          @click="game.changeSect(s.id)"
        >
          <div class="flex justify-between">
            <span class="text-fg">{{ s.name }}</span>
            <span v-if="game.player.sect === s.id" class="text-xs text-gold">当前</span>
          </div>
          <div class="text-xs text-muted">{{ s.desc }}</div>
          <div class="text-xs text-primary">
            兵器：{{ WEAPON_TYPE_LABEL[s.weaponType] }}（{{ WEAPON_TYPE_SHAPE[s.weaponType] }}）
          </div>
          <div class="mt-0.5 text-xs text-gold">【{{ s.skill.name }}】{{ s.skill.desc }}</div>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-border bg-surface p-4">
      <h2 class="mb-2 text-gold">天赋 <span class="text-xs text-muted">可用 {{ availPoints }} 点</span></h2>
      <div class="space-y-1">
        <div v-for="t in TALENTS" :key="t.key" class="flex items-center justify-between rounded bg-bg p-2">
          <div>
            <span class="text-fg">{{ t.label }}</span>
            <span class="ml-1 text-xs text-muted">{{ t.desc }}</span>
            <span class="ml-2 text-xs text-gold">Lv.{{ game.player.talents[t.key] || 0 }}</span>
          </div>
          <button
            class="rounded bg-primary px-3 py-0.5 text-xs text-primary-fg disabled:opacity-30"
            :disabled="availPoints <= 0"
            @click="game.addTalent(t.key)"
          >
            +
          </button>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-border bg-surface p-4">
      <h2 class="mb-2 text-gold">内功</h2>
      <div v-if="acquiredInner.length === 0" class="text-sm text-muted">尚未习得内功</div>
      <div class="space-y-1">
        <div
          v-for="s in acquiredInner"
          :key="s.id"
          class="cursor-pointer rounded p-2"
          :class="game.player.innerSkill === s.id ? 'border border-gold bg-bg' : 'bg-bg'"
          @click="game.equipInner(s.id)"
        >
          <div class="flex justify-between">
            <span class="text-fg">{{ s.name }}</span>
            <span v-if="game.player.innerSkill === s.id" class="text-xs text-gold">已装备</span>
          </div>
          <div class="text-xs text-muted">{{ s.desc }}</div>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-border bg-surface p-4">
      <h2 class="mb-2 text-gold">属性</h2>
      <div class="space-y-1 text-sm">
        <div v-for="r in statRows" :key="r.label" class="flex justify-between">
          <span class="text-muted">{{ r.label }}</span>
          <span>
            <span class="text-fg">{{ r.total }}</span>
            <span v-if="r.bonusStr" class="ml-1 text-green-500">{{ r.bonusStr }}</span>
          </span>
        </div>
      </div>
    </div>

    <SaveManager />
  </div>
</template>
