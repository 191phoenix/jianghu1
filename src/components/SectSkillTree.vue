<script setup lang="ts">
import { computed } from 'vue'
import { SECTS } from '@/config/sectConfig'
import { SKILL_LEVEL_COST, prereqMet, skillLevel } from '@/logic/sectSkillLogic'
import type { SectSkill } from '@/types/game'

const props = withDefaults(
  defineProps<{
    sectId: string
    levels: Record<string, number>
    active: string | null
    silver: number
    allowSignature?: boolean
  }>(),
  { allowSignature: false }
)

const emit = defineEmits<{
  levelup: [skillId: string]
  setactive: [skillId: string | null]
}>()

const sect = computed(() => SECTS[props.sectId])
function lvl(id: string) {
  return skillLevel(props.levels, id)
}
function effMult(s: SectSkill) {
  return (s.multiplier + (lvl(s.id) - 1) * 0.15).toFixed(2)
}
function cost(s: SectSkill) {
  return SKILL_LEVEL_COST(lvl(s.id))
}
function canLearn(s: SectSkill) {
  return lvl(s.id) === 0 && prereqMet(s, props.levels)
}
function canLevel(s: SectSkill) {
  return lvl(s.id) >= 1 && lvl(s.id) < s.maxLevel
}
function prereqName(s: SectSkill): string {
  if (!s.prereq) return ''
  return sect.value?.skills.find((x) => x.id === s.prereq!.skillId)?.name ?? ''
}
</script>

<template>
  <div class="space-y-1">
    <div
      v-if="allowSignature"
      class="flex items-center justify-between rounded bg-bg px-2 py-1 text-xs"
    >
      <span :class="active === null ? 'text-gold' : 'text-muted'">自带武功</span>
      <button v-if="active !== null" class="text-primary underline" @click="emit('setactive', null)">
        设为主动
      </button>
      <span v-else class="text-gold">使用中</span>
    </div>

    <div v-for="s in sect?.skills" :key="s.id" class="rounded bg-bg px-2 py-1.5 text-xs">
      <div class="flex items-center justify-between">
        <span :class="active === s.id ? 'text-gold' : 'text-fg'">
          {{ s.name }}
          <span class="text-muted">Lv.{{ lvl(s.id) }}/{{ s.maxLevel }}</span>
        </span>
        <span v-if="lvl(s.id) >= 1" class="text-muted">倍率 {{ effMult(s) }}</span>
      </div>
      <div class="text-muted">{{ s.desc }}</div>
      <div class="mt-1 flex items-center gap-3">
        <template v-if="lvl(s.id) === 0">
          <button
            v-if="canLearn(s)"
            class="text-primary underline disabled:opacity-30"
            :disabled="silver < cost(s)"
            @click="emit('levelup', s.id)"
          >
            习得({{ cost(s) }}银)
          </button>
          <span v-else class="text-muted">需 {{ prereqName(s) }} 达 Lv.{{ s.prereq?.level }}</span>
        </template>
        <template v-else>
          <button
            v-if="canLevel(s)"
            class="text-primary underline disabled:opacity-30"
            :disabled="silver < cost(s)"
            @click="emit('levelup', s.id)"
          >
            升级({{ cost(s) }}银)
          </button>
          <span v-else-if="lvl(s.id) >= s.maxLevel" class="text-muted">已满级</span>
          <button v-if="active !== s.id" class="text-gold underline" @click="emit('setactive', s.id)">
            设为主动
          </button>
          <span v-else class="text-gold">使用中</span>
        </template>
      </div>
    </div>
  </div>
</template>
