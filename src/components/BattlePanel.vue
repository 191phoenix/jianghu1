<script setup lang="ts">
import { computed } from 'vue'
import type { BattleResult } from '@/types/game'
import { GRADE_LABEL } from '@/config/equipmentConfig'

interface HpInfo {
  name: string
  hp: number
}

const props = defineProps<{
  result: BattleResult
  allies: HpInfo[]
  enemies: HpInfo[]
}>()

function dmgTaken(name: string): number {
  return props.result.log.filter((l) => l.target === name).reduce((s, l) => s + l.dmg, 0)
}
function hpPct(info: HpInfo): number {
  if (info.hp <= 0) return 0
  return Math.max(0, (1 - dmgTaken(info.name) / info.hp) * 100)
}
const dropText = computed(() =>
  props.result.drops.map((d) => `${d.name}(${GRADE_LABEL[d.grade]})`).join('、')
)
</script>

<template>
  <div class="space-y-2 rounded-lg border border-border bg-surface p-3">
    <div class="flex justify-between gap-4 text-sm">
      <div class="flex-1 space-y-1">
        <div v-for="a in allies" :key="a.name">
          <div class="text-xs text-fg">{{ a.name }}</div>
          <div class="mt-0.5 h-2 overflow-hidden rounded bg-bg">
            <div class="h-full bg-primary transition-all" :style="{ width: hpPct(a) + '%' }"></div>
          </div>
        </div>
      </div>
      <div class="flex-1 space-y-1">
        <div v-for="e in enemies" :key="e.name">
          <div class="text-right text-xs text-fg">{{ e.name }}</div>
          <div class="mt-0.5 h-2 overflow-hidden rounded bg-bg">
            <div class="h-full bg-red-700 transition-all" :style="{ width: hpPct(e) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-h-44 space-y-0.5 overflow-y-auto rounded bg-bg p-2 text-xs">
      <div v-for="(line, i) in result.log" :key="i" class="text-muted">
        <span class="text-gold">[{{ line.round }}]</span>
        {{ line.attacker }} -> {{ line.target }}
        <span :class="line.crit ? 'text-primary' : 'text-fg'">{{ line.dmg }}</span>
        <span v-if="line.crit" class="text-primary">暴击</span>
        <span v-if="line.skillName" class="text-gold">【{{ line.skillName }}】</span>
      </div>
    </div>

    <div class="pt-1 text-center">
      <div v-if="result.win" class="text-gold">胜利！{{ result.rounds }} 回合</div>
      <div v-else class="text-primary">失败…坚持了 {{ result.rounds }} 回合</div>
      <div v-if="result.win" class="mt-1 text-xs text-muted">
        经验 +{{ result.expGained }}
        <span v-if="result.stonesGained">· 强化石 +{{ result.stonesGained }}</span>
        <span v-if="result.silverGained">· 银两 +{{ result.silverGained }}</span>
        <span v-if="dropText">· 掉落：{{ dropText }}</span>
      </div>
      <div v-if="result.acquiredHeroes.length" class="mt-1 text-xs text-gold">
        结识侠客：{{ result.acquiredHeroes.join('、') }}
      </div>
      <div v-if="result.acquiredInnerSkills.length" class="mt-1 text-xs text-gold">
        习得内功：{{ result.acquiredInnerSkills.join('、') }}
      </div>
    </div>
  </div>
</template>
