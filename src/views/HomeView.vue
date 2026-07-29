<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'

const game = useGameStore()
</script>

<template>
  <div class="p-4">
    <h1 class="mb-2 text-2xl text-gold">主城</h1>
    <p class="text-muted">
      少侠 <span class="text-fg">{{ game.player.name }}</span>，欢迎回城。
    </p>
    <p class="mt-1 text-muted">等级 {{ game.player.level }} · 经验 {{ game.player.exp }}</p>
  </div>
</template>
