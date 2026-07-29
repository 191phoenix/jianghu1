<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBattleStore } from '@/stores/battleStore'
import { useGameStore } from '@/stores/gameStore'
import { GRADE_LABEL } from '@/config/equipmentConfig'
import type { BattleFighter, BattleResult, BattleAction } from '@/types/game'

const battle = useBattleStore()
const game = useGameStore()

const b = computed(() => battle.battle)
const active = computed(() => battle.active)
const isPlayerTurn = computed(() => b.value?.phase === 'player' && !!active.value?.isPlayer)
const selectingTarget = computed(() => !!b.value?.pendingAction)
const recentLog = computed(() => b.value?.log.slice(-6) || [])

const finalResult = ref<BattleResult | null>(null)

// 战斗结束时结算一次
watch(
  () => b.value?.phase,
  (phase) => {
    if (phase === 'ended' && !finalResult.value && b.value?.result) {
      finalResult.value = game.settleBattle(b.value.levelId, b.value.result)
    }
  }
)

function hpPct(f: BattleFighter): number {
  return f.maxHp > 0 ? Math.max(0, (f.hp / f.maxHp) * 100) : 0
}
function skillReady(f: BattleFighter): boolean {
  return !!f.skill && f.skillCd <= 0
}
function chooseAction(action: BattleAction) {
  battle.playerChooseAction(action)
}
function chooseTarget(idx: number) {
  battle.playerChooseTarget(idx)
}
function cancel() {
  battle.cancelAction()
}
function finish() {
  finalResult.value = null
  battle.reset()
}

const dropText = computed(() =>
  finalResult.value?.drops.map((d) => `${d.name}(${GRADE_LABEL[d.grade]})`).join('、') || ''
)
</script>

<template>
  <div v-if="b" class="fixed inset-0 z-50 flex flex-col bg-bg">
    <!-- 顶部：敌方 -->
    <div class="p-3">
      <div class="text-xs text-muted">
        第 {{ b.round }} 回合 ·
        {{ b.phase === 'player' ? '你的回合' : b.phase === 'enemy' ? '敌方回合' : '战斗结束' }}
      </div>
      <div class="mt-1 space-y-1">
        <div
          v-for="(f, i) in b.enemies"
          :key="f.id"
          class="flex items-center gap-2"
          :class="{ 'opacity-30': f.hp <= 0 }"
        >
          <span
            class="w-20 text-sm text-fg"
            :class="{ 'font-bold text-primary': selectingTarget && f.hp > 0 }"
          >
            {{ f.name }}
          </span>
          <div class="h-2 flex-1 overflow-hidden rounded bg-surface">
            <div class="h-full bg-red-700 transition-all" :style="{ width: hpPct(f) + '%' }"></div>
          </div>
          <span class="w-16 text-right text-xs text-muted">{{ f.hp }}/{{ f.maxHp }}</span>
          <button
            v-if="selectingTarget && f.hp > 0"
            class="text-xs text-primary underline"
            @click="chooseTarget(i)"
          >
            选
          </button>
        </div>
      </div>
    </div>

    <!-- 中间：日志 -->
    <div class="flex-1 overflow-y-auto p-3 text-xs">
      <div v-for="(line, i) in recentLog" :key="i" class="text-muted">
        <span class="text-gold">[{{ line.round }}]</span>
        {{ line.attacker }} -> {{ line.target }}
        <span :class="line.crit ? 'text-primary' : 'text-fg'">{{ line.dmg }}</span>
        <span v-if="line.crit" class="text-primary">暴击</span>
        <span v-if="line.skillName" class="text-gold">【{{ line.skillName }}】</span>
      </div>
    </div>

    <!-- 底部：玩家方 + 行动菜单 -->
    <div class="border-t border-border p-3">
      <div class="space-y-1">
        <div
          v-for="f in b.allies"
          :key="f.id"
          class="flex items-center gap-2"
          :class="{ 'opacity-30': f.hp <= 0 }"
        >
          <span class="w-20 text-sm text-fg">{{ f.name }}</span>
          <div class="h-2 flex-1 overflow-hidden rounded bg-surface">
            <div class="h-full bg-primary transition-all" :style="{ width: hpPct(f) + '%' }"></div>
          </div>
          <span class="w-16 text-right text-xs text-muted">{{ f.hp }}/{{ f.maxHp }}</span>
        </div>
      </div>

      <!-- 行动菜单 -->
      <div v-if="b.phase !== 'ended'" class="mt-3 flex gap-2">
        <template v-if="selectingTarget">
          <div class="flex-1 text-xs text-muted">请在上方点「选」指定目标</div>
          <button class="rounded border border-border px-3 py-1 text-xs text-fg" @click="cancel">
            取消
          </button>
        </template>
        <template v-else-if="isPlayerTurn && active">
          <button class="flex-1 rounded bg-primary py-2 text-primary-fg" @click="chooseAction('attack')">
            普攻
          </button>
          <button
            v-if="active.skill"
            class="flex-1 rounded py-2"
            :class="skillReady(active) ? 'bg-gold text-bg' : 'bg-surface text-muted'"
            :disabled="!skillReady(active)"
            @click="skillReady(active) && chooseAction('skill')"
          >
            {{ active.skill.name }}{{ skillReady(active) ? '' : `(CD${active.skillCd})` }}
          </button>
        </template>
        <div v-else class="flex-1 text-center text-xs text-muted">敌方行动中…</div>
      </div>

      <!-- 结束结算 -->
      <div v-else-if="finalResult" class="mt-3 text-center">
        <div :class="finalResult.win ? 'text-gold' : 'text-primary'" class="text-lg">
          {{ finalResult.win ? '胜利！' : '失败…' }} {{ finalResult.rounds }} 回合
        </div>
        <div v-if="finalResult.win" class="mt-1 text-xs text-muted">
          经验 +{{ finalResult.expGained }}
          <span v-if="finalResult.silverGained">· 银两 +{{ finalResult.silverGained }}</span>
          <span v-if="finalResult.stonesGained">· 强化石 +{{ finalResult.stonesGained }}</span>
          <span v-if="dropText">· 掉落：{{ dropText }}</span>
        </div>
        <div v-if="finalResult.acquiredHeroes.length" class="text-xs text-gold">
          结识侠客：{{ finalResult.acquiredHeroes.join('、') }}
        </div>
        <div v-if="finalResult.acquiredInnerSkills.length" class="text-xs text-gold">
          习得内功：{{ finalResult.acquiredInnerSkills.join('、') }}
        </div>
        <button class="mt-2 rounded bg-primary px-6 py-2 text-primary-fg" @click="finish">继续</button>
      </div>
    </div>
  </div>
</template>
