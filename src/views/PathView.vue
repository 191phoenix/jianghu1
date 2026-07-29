<script setup lang="ts">
import { computed } from 'vue'
import { usePathStore } from '@/stores/pathStore'
import { useGameStore } from '@/stores/gameStore'
import { getLevel } from '@/config/levelConfig'
import { NODE_ICON } from '@/logic/pathLogic'
import { WEAPON_TYPE_LABEL } from '@/logic/battleLogic'
import type { PathReward, PathNodeType } from '@/types/game'

const path = usePathStore()
const game = useGameStore()

const run = computed(() => path.run)
const level = computed(() => (run.value ? getLevel(run.value.levelId) : undefined))
const current = computed(() => path.current)
const isCleared = computed(() => path.isCleared)
const recentLog = computed(() => run.value?.log.slice(-8) || [])

function nodeIcon(type: PathNodeType): string {
  return NODE_ICON[type]
}
function rewardText(r?: PathReward): string {
  if (!r) return ''
  const parts: string[] = []
  if (r.exp) parts.push(`经验+${r.exp}`)
  if (r.silver) parts.push(`银两${r.silver > 0 ? '+' : ''}${r.silver}`)
  if (r.stones) parts.push(`强化石+${r.stones}`)
  if (r.drops?.length) parts.push(`装备×${r.drops.length}`)
  return parts.join(' ')
}
function enemyText(): string {
  const e = current.value?.enemies
  if (!e) return ''
  return e.map((x) => `${x.name}·${WEAPON_TYPE_LABEL[x.weaponType]}`).join(' / ')
}
function goForward() {
  const node = current.value
  if (!node) return
  if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
    game.startPathBattle()
  } else if (node.type === 'story' || node.type === 'treasure') {
    game.resolvePathNonBattle()
  }
}
function chooseEvent(i: number) {
  game.resolvePathEvent(i)
}
function exitPath() {
  path.exit()
}
</script>

<template>
  <div v-if="run" class="fixed inset-0 z-40 flex flex-col bg-bg">
    <!-- 顶部 -->
    <div class="flex items-center justify-between border-b border-border p-3">
      <div>
        <div class="text-gold">{{ level?.name ?? '江湖' }}</div>
        <div class="text-xs text-muted">
          已通过 {{ run.idx }} / {{ run.nodes.length }} 节点
        </div>
      </div>
      <button class="text-xs text-muted underline" @click="exitPath">返回江湖</button>
    </div>

    <!-- 通关总结 -->
    <div v-if="isCleared" class="flex-1 overflow-y-auto p-4 text-center">
      <div class="mt-6 text-2xl text-gold">通关！</div>
      <p class="mt-2 text-sm text-muted">你已击败关主，闯过此关。</p>
      <button class="mt-4 rounded bg-primary px-6 py-2 text-primary-fg" @click="exitPath">
        返回江湖
      </button>
    </div>

    <!-- 路径进行中 -->
    <template v-else>
      <!-- 节点时间线 -->
      <div class="overflow-y-auto p-3">
        <div class="space-y-1">
          <div
            v-for="(n, i) in run.nodes"
            :key="i"
            class="flex items-center gap-2 rounded px-2 py-1 text-sm"
            :class="{
              'bg-surface': i === run.idx,
              'opacity-50': i < run.idx
            }"
          >
            <span class="w-5 text-center">{{ i < run.idx ? '✓' : i === run.idx ? nodeIcon(n.type) : '❓' }}</span>
            <span :class="i === run.idx ? 'text-gold' : 'text-muted'">
              {{ i < run.idx ? n.label + '·已通过' : i === run.idx ? n.label : '未知' }}
            </span>
          </div>
        </div>

        <!-- 当前节点详情 -->
        <div v-if="current" class="mt-3 rounded-lg border border-border bg-surface p-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ nodeIcon(current.type) }}</span>
            <span class="text-fg">{{ current.label }}</span>
          </div>

          <!-- 剧情/宝箱 -->
          <template v-if="current.type === 'story' || current.type === 'treasure'">
            <p class="mt-2 text-sm text-muted">{{ current.storyText }}</p>
            <p v-if="current.reward" class="mt-1 text-xs text-gold">获得：{{ rewardText(current.reward) }}</p>
            <button class="mt-3 w-full rounded bg-primary py-2 text-primary-fg" @click="goForward">
              {{ current.type === 'treasure' ? '拾取' : '继续' }}
            </button>
          </template>

          <!-- 事件 -->
          <template v-else-if="current.type === 'event'">
            <p class="mt-2 text-sm text-muted">{{ current.storyText }}</p>
            <div class="mt-3 space-y-2">
              <button
                v-for="(c, i) in current.choices"
                :key="i"
                class="w-full rounded border border-border bg-bg py-2 text-sm text-fg"
                @click="chooseEvent(i)"
              >
                {{ c.label }}
              </button>
            </div>
          </template>

          <!-- 战斗/精英/关主 -->
          <template v-else>
            <p class="mt-2 text-xs text-muted">遭遇：{{ enemyText() }}</p>
            <button class="mt-3 w-full rounded bg-primary py-2 text-primary-fg" @click="goForward">
              {{ current.type === 'boss' ? '挑战关主' : '前往战斗' }}
            </button>
          </template>
        </div>
      </div>

      <!-- 日志 -->
      <div class="border-t border-border p-3 text-xs">
        <div class="mb-1 text-muted">历程</div>
        <div class="space-y-0.5">
          <div v-for="(line, i) in recentLog" :key="i" class="text-muted">· {{ line }}</div>
        </div>
      </div>
    </template>
  </div>
</template>
