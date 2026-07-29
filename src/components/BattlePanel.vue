<script setup lang="ts">
import { computed } from 'vue'
import type { BattleResult } from '@/types/game'
import { GRADE_LABEL } from '@/config/equipmentConfig'

const props = defineProps<{
  result: BattleResult
  playerHp: number
  playerName: string
  enemyName: string
  enemyHp: number
}>()

const playerDmgTaken = computed(() =>
  props.result.log.filter((l) => l.target === props.playerName).reduce((s, l) => s + l.dmg, 0)
)
const enemyDmgTaken = computed(() =>
  props.result.log.filter((l) => l.target === props.enemyName).reduce((s, l) => s + l.dmg, 0)
)
const playerHpPct = computed(() =>
  props.playerHp > 0 ? Math.max(0, (1 - playerDmgTaken.value / props.playerHp) * 100) : 0
)
const enemyHpPct = computed(() =>
  props.enemyHp > 0 ? Math.max(0, (1 - enemyDmgTaken.value / props.enemyHp) * 100) : 0
)
const dropText = computed(() =>
  props.result.drops.map((d) => `${d.name}(${GRADE_LABEL[d.grade]})`).join('、')
)
</script>

<template>
  <div class="space-y-2 rounded-lg border border-border bg-surface p-3">
    <!-- HP 条 -->
    <div class="flex justify-between gap-4 text-sm">
      <div class="flex-1">
        <div class="text-fg">{{ playerName }}</div>
        <div class="mt-1 h-2 overflow-hidden rounded bg-bg">
          <div class="h-full bg-primary transition-all" :style="{ width: playerHpPct + '%' }"></div>
        </div>
      </div>
      <div class="flex-1 text-right">
        <div class="text-fg">{{ enemyName }}</div>
        <div class="mt-1 ml-auto h-2 w-full overflow-hidden rounded bg-bg">
          <div class="h-full bg-red-700 transition-all" :style="{ width: enemyHpPct + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 回合日志 -->
    <div class="max-h-44 space-y-0.5 overflow-y-auto rounded bg-bg p-2 text-xs">
      <div v-for="(line, i) in result.log" :key="i" class="text-muted">
        <span class="text-gold">[{{ line.round }}]</span>
        {{ line.attacker }} → {{ line.target }}
        <span :class="line.crit ? 'text-primary' : 'text-fg'">{{ line.dmg }}</span>
        <span v-if="line.crit" class="text-primary">暴击</span>
        <span v-if="line.skillName" class="text-gold">【{{ line.skillName }}】</span>
      </div>
    </div>

    <!-- 结果 -->
    <div class="pt-1 text-center">
      <div v-if="result.win" class="text-gold">胜利！{{ result.rounds }} 回合</div>
      <div v-else class="text-primary">失败…坚持了 {{ result.rounds }} 回合</div>
      <div v-if="result.win" class="mt-1 text-xs text-muted">
        经验 +{{ result.expGained }}
        <span v-if="dropText">· 掉落：{{ dropText }}</span>
      </div>
    </div>
  </div>
</template>
