<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'

const game = useGameStore()
</script>

<template>
  <div class="space-y-4 p-4">
    <h1 class="text-2xl text-gold">主城</h1>

    <div class="rounded-lg border border-border bg-surface p-4">
      <div class="text-lg text-fg">{{ game.player.name }}</div>
      <div class="text-sm text-muted">
        {{ game.sectInfo.name }} · 等级 {{ game.player.level }}
      </div>
      <div class="mt-1 text-xs text-muted">
        已通关 {{ game.player.clearedLevelIds.length }} 关 · 银两 {{ game.player.silver }} · 强化石 {{ game.player.stones }}
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <RouterLink to="/codex" class="rounded-lg border border-border bg-surface p-3 text-center">
        <div class="text-fg">图鉴</div>
      </RouterLink>
      <RouterLink to="/shop" class="rounded-lg border border-border bg-surface p-3 text-center">
        <div class="text-fg">商店</div>
      </RouterLink>
      <RouterLink to="/task" class="rounded-lg border border-border bg-surface p-3 text-center">
        <div class="text-fg">任务</div>
      </RouterLink>
    </div>

    <div v-if="game.pendingOffline" class="rounded-lg border border-gold bg-surface p-4">
      <h2 class="text-gold">离线挂机收益</h2>
      <p class="mt-1 text-sm text-muted">
        离线 {{ Math.floor(game.pendingOffline.duration / 60) }} 分钟，扫荡已通关卡
      </p>
      <p class="text-sm text-fg">经验 +{{ game.pendingOffline.exp }}</p>
      <p v-if="game.pendingOffline.stones" class="text-sm text-fg">
        强化石 +{{ game.pendingOffline.stones }}
      </p>
      <p v-if="game.pendingOffline.drops.length" class="text-sm text-fg">
        掉落 {{ game.pendingOffline.drops.length }} 件
      </p>
      <button class="mt-2 rounded bg-primary px-4 py-2 text-primary-fg" @click="game.claimOffline()">
        领取
      </button>
    </div>
  </div>
</template>
