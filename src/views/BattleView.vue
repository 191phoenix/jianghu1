<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBattleStore } from '@/stores/battleStore'
import { useGameStore } from '@/stores/gameStore'
import { usePathStore } from '@/stores/pathStore'
import { GRADE_LABEL } from '@/config/equipmentConfig'
import { HEROES } from '@/config/heroConfig'
import { WEAPON_TYPE_LABEL, WEAPON_TYPE_SHAPE, attackPatternCells } from '@/logic/battleLogic'
import type { BattleFighter, BattleResult, BattleAction, WeaponType } from '@/types/game'

const battle = useBattleStore()
const game = useGameStore()
const path = usePathStore()

const b = computed(() => battle.battle)
const active = computed(() => battle.active)
const isPlayerTurn = computed(() => b.value?.phase === 'player' && !!active.value?.isPlayer)
const selectingTarget = computed(() => !!b.value?.pendingAction)
const recentLog = computed(() => b.value?.log.slice(-6) || [])

const finalResult = ref<BattleResult | null>(null)

// 战斗结束时结算一次（路径战斗走 settlePathBattle，其余兜底 settleBattle）
watch(
  () => b.value?.phase,
  (phase) => {
    if (phase === 'ended' && !finalResult.value && b.value?.result) {
      finalResult.value = path.active
        ? game.settlePathBattle(b.value.result)
        : game.settleBattle(b.value.levelId, b.value.result)
    }
  }
)

// 九宫格显示行：敌方自上而下 0,1,2/3,4,5/6,7,8（6,7,8 为前排靠我方）
// 我方自上而下 6,7,8/3,4,5/0,1,2（6,7,8 为前排靠敌方），两前排在中线相对
const ENEMY_ROWS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8]
]
const PLAYER_ROWS = [
  [6, 7, 8],
  [3, 4, 5],
  [0, 1, 2]
]

function hpPct(f: BattleFighter): number {
  return f.maxHp > 0 ? Math.max(0, (f.hp / f.maxHp) * 100) : 0
}
function skillReady(f: BattleFighter): boolean {
  return !!f.skill && f.skillCd <= 0
}
function fighterAt(list: BattleFighter[], cell: number): BattleFighter | undefined {
  return list.find((f) => f.pos === cell)
}
function weaponLabel(w: WeaponType): string {
  return WEAPON_TYPE_LABEL[w]
}
function weaponShape(w: WeaponType): string {
  return WEAPON_TYPE_SHAPE[w]
}

function chooseAction(action: BattleAction) {
  battle.playerChooseAction(action)
}
function cancel() {
  battle.cancelAction()
  previewCell.value = null
}
function finish() {
  finalResult.value = null
  battle.reset()
}

// 目标格选择 + AoE 预览
const previewCell = ref<number | null>(null)
const previewCells = computed<number[]>(() => {
  if (!selectingTarget.value || previewCell.value == null || !active.value) return []
  return attackPatternCells(active.value.weaponType, previewCell.value)
})
function onTargetCell(cell: number) {
  if (!selectingTarget.value || !b.value) return
  const enemy = fighterAt(b.value.enemies, cell)
  if (!enemy || enemy.hp <= 0) return
  previewCell.value = null
  battle.playerChooseTargetCell(cell)
}
function onHoverCell(cell: number) {
  if (selectingTarget.value) previewCell.value = cell
}
function onLeaveCell() {
  previewCell.value = null
}

// —— 布阵阶段 ——
const pickedKey = ref<string | null>(null) // 当前拾起的角色 key（'main' 或侠客 id）

const acquiredHeroes = computed(() => HEROES.filter((h) => game.player.heroes.includes(h.id)))
const mainWeapon = computed(() => game.sectInfo.weaponType)

function isChosen(id: string) {
  return !!b.value?.setupChosen.includes(id)
}
function isPlaced(key: string) {
  return !!b.value?.setupGrid.includes(key)
}
function cellKey(cell: number): string | null {
  return b.value?.setupGrid[cell] ?? null
}
function nameOfKey(key: string): string {
  return key === 'main' ? game.player.name : HEROES.find((h) => h.id === key)?.name ?? key
}
function weaponOfKey(key: string): WeaponType {
  return key === 'main' ? mainWeapon.value : HEROES.find((h) => h.id === key)?.weaponType ?? 'fist'
}
function toggleHero(id: string) {
  battle.setupToggleHero(id)
  if (pickedKey.value === id && !isChosen(id)) pickedKey.value = null
}
function pickKey(key: string) {
  pickedKey.value = pickedKey.value === key ? null : key
}
function clickSetupCell(cell: number) {
  if (!b.value) return
  if (pickedKey.value) {
    battle.setupPlace(pickedKey.value, cell)
    pickedKey.value = null
  } else {
    const k = b.value.setupGrid[cell]
    if (k) {
      battle.setupClearCell(cell)
      pickedKey.value = k
    }
  }
}
const canBegin = computed(() => {
  const g = b.value?.setupGrid
  if (!g || !g.includes('main')) return false
  return b.value!.setupChosen.every((id) => g.includes(id))
})
function begin() {
  if (!canBegin.value) return
  game.beginSetupCombat()
}
function exitSetup() {
  battle.reset()
}

const dropText = computed(() =>
  finalResult.value?.drops.map((d) => `${d.name}(${GRADE_LABEL[d.grade]})`).join('、') || ''
)
</script>

<template>
  <div v-if="b" class="fixed inset-0 z-50 flex flex-col bg-bg">
    <!-- ===== 布阵阶段 ===== -->
    <template v-if="b.phase === 'setup'">
      <div class="flex-1 overflow-y-auto p-3">
        <div class="flex items-center justify-between">
          <h1 class="text-lg text-gold">布阵</h1>
          <button class="text-xs text-muted underline" @click="exitSetup">返回</button>
        </div>
        <p class="mt-0.5 text-xs text-muted">
          主角必上，最多再选 2 名侠客。点角色再点九宫格放置；点已放角色可取回。
        </p>

        <!-- 敌方 preview -->
        <div class="mt-2 text-xs text-muted">敌方</div>
        <div class="mt-1 grid grid-cols-3 gap-1">
          <div
            v-for="cell in ENEMY_ROWS.flat()"
            :key="'e' + cell"
            class="rounded border border-border bg-surface p-1 text-center"
          >
            <template v-if="fighterAt(b.enemies, cell)">
              <div class="truncate text-[10px] text-fg">{{ fighterAt(b.enemies, cell)!.name }}</div>
              <div class="text-[9px] text-primary">
                {{ weaponLabel(fighterAt(b.enemies, cell)!.weaponType) }}·{{
                  weaponShape(fighterAt(b.enemies, cell)!.weaponType)
                }}
              </div>
            </template>
            <div v-else class="h-7"></div>
          </div>
        </div>

        <!-- 我方布阵格 -->
        <div class="mt-3 text-xs text-muted">我方（{{ weaponLabel(mainWeapon) }}=主角）</div>
        <div class="mt-1 grid grid-cols-3 gap-1">
          <div
            v-for="cell in PLAYER_ROWS.flat()"
            :key="'p' + cell"
            class="flex min-h-[3rem] cursor-pointer flex-col items-center justify-center rounded border p-1 text-center"
            :class="
              cellKey(cell)
                ? 'border-gold bg-surface'
                : pickedKey
                  ? 'border-primary bg-surface'
                  : 'border-border border-dashed bg-surface/40'
            "
            @click="clickSetupCell(cell)"
          >
            <template v-if="cellKey(cell)">
              <div class="truncate text-[11px] text-fg">{{ nameOfKey(cellKey(cell)!) }}</div>
              <div class="text-[9px] text-gold">{{ weaponLabel(weaponOfKey(cellKey(cell)!)) }}</div>
            </template>
            <div v-else class="text-[10px] text-muted">空</div>
          </div>
        </div>

        <!-- 候选角色 -->
        <div class="mt-3 text-xs text-muted">可上场</div>
        <div class="mt-1 space-y-1">
          <!-- 主角 -->
          <div
            class="flex items-center justify-between rounded border p-2"
            :class="
              pickedKey === 'main'
                ? 'border-gold bg-surface'
                : isPlaced('main')
                  ? 'border-border bg-surface/60'
                  : 'border-primary bg-surface'
            "
          >
            <span class="text-xs text-fg">
              {{ game.player.name }}（主角·{{ weaponLabel(mainWeapon) }}）
            </span>
            <button class="text-xs text-primary underline" @click="pickKey('main')">
              {{ isPlaced('main') ? '已放' : '放置' }}
            </button>
          </div>
          <!-- 侠客 -->
          <div
            v-for="h in acquiredHeroes"
            :key="h.id"
            class="flex items-center justify-between rounded border border-border bg-surface p-2"
            :class="{ 'border-gold': pickedKey === h.id }"
          >
            <span class="text-xs text-fg">
              {{ h.name }}（{{ weaponLabel(h.weaponType) }}·{{ weaponShape(h.weaponType) }}）
            </span>
            <span class="flex gap-2">
              <button
                class="text-xs underline"
                :class="isChosen(h.id) ? 'text-muted' : 'text-primary'"
                @click="toggleHero(h.id)"
              >
                {{ isChosen(h.id) ? '撤下' : '上阵' }}
              </button>
              <button
                v-if="isChosen(h.id)"
                class="text-xs text-primary underline"
                @click="pickKey(h.id)"
              >
                {{ isPlaced(h.id) ? '已放' : '放置' }}
              </button>
            </span>
          </div>
        </div>
      </div>

      <div class="border-t border-border p-3">
        <button
          class="w-full rounded py-2 text-primary-fg disabled:opacity-40"
          :class="canBegin ? 'bg-primary' : 'bg-surface'"
          :disabled="!canBegin"
          @click="begin"
        >
          开战
        </button>
        <div v-if="!canBegin" class="mt-1 text-center text-[10px] text-muted">
          请将主角与已上阵侠客都放上九宫格
        </div>
      </div>
    </template>

    <!-- ===== 战斗阶段 ===== -->
    <template v-else>
      <!-- 顶部：敌方九宫格 -->
      <div class="p-3">
        <div class="text-xs text-muted">
          第 {{ b.round }} 回合 ·
          {{ b.phase === 'player' ? '你的回合' : b.phase === 'enemy' ? '敌方回合' : '战斗结束' }}
        </div>
        <div class="mt-1 grid grid-cols-3 gap-1">
          <div
            v-for="cell in ENEMY_ROWS.flat()"
            :key="'be' + cell"
            class="flex min-h-[3.2rem] cursor-pointer flex-col justify-center rounded border p-1 text-center"
            :class="[
              fighterAt(b.enemies, cell)
                ? fighterAt(b.enemies, cell)!.hp > 0
                  ? 'border-border bg-surface'
                  : 'border-border bg-surface/30 opacity-40'
                : 'border-border border-dashed bg-surface/20',
              selectingTarget && fighterAt(b.enemies, cell) && fighterAt(b.enemies, cell)!.hp > 0
                ? 'border-primary'
                : '',
              previewCells.includes(cell) ? 'ring-1 ring-primary' : ''
            ]"
            @click="onTargetCell(cell)"
            @mouseenter="onHoverCell(cell)"
            @mouseleave="onLeaveCell()"
          >
            <template v-if="fighterAt(b.enemies, cell)">
              <div class="truncate text-[10px] text-fg">{{ fighterAt(b.enemies, cell)!.name }}</div>
              <div class="text-[9px] text-primary">
                {{ weaponLabel(fighterAt(b.enemies, cell)!.weaponType) }}
              </div>
              <div class="mx-auto mt-0.5 h-1 w-12 overflow-hidden rounded bg-bg">
                <div class="h-full bg-red-700" :style="{ width: hpPct(fighterAt(b.enemies, cell)!) + '%' }"></div>
              </div>
              <div class="text-[9px] text-muted">
                {{ Math.max(0, fighterAt(b.enemies, cell)!.hp) }}/{{ fighterAt(b.enemies, cell)!.maxHp }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 中间：日志 -->
      <div class="flex-1 overflow-y-auto px-3 text-xs">
        <div v-for="(line, i) in recentLog" :key="i" class="text-muted">
          <span class="text-gold">[{{ line.round }}]</span>
          {{ line.attacker }} -> {{ line.target }}
          <span :class="line.crit ? 'text-primary' : 'text-fg'">{{ line.dmg }}</span>
          <span v-if="line.crit" class="text-primary">暴击</span>
          <span v-if="line.skillName" class="text-gold">【{{ line.skillName }}】</span>
        </div>
      </div>

      <!-- 底部：我方九宫格 + 行动菜单 -->
      <div class="border-t border-border p-3">
        <div class="grid grid-cols-3 gap-1">
          <div
            v-for="cell in PLAYER_ROWS.flat()"
            :key="'bp' + cell"
            class="flex min-h-[3rem] flex-col justify-center rounded border p-1 text-center"
            :class="[
              fighterAt(b.allies, cell)
                ? fighterAt(b.allies, cell)!.hp > 0
                  ? active && active.id === fighterAt(b.allies, cell)!.id
                    ? 'border-gold bg-surface'
                    : 'border-border bg-surface'
                  : 'border-border bg-surface/30 opacity-40'
                : 'border-border border-dashed bg-surface/20'
            ]"
          >
            <template v-if="fighterAt(b.allies, cell)">
              <div class="truncate text-[10px] text-fg">{{ fighterAt(b.allies, cell)!.name }}</div>
              <div class="text-[9px] text-gold">
                {{ weaponLabel(fighterAt(b.allies, cell)!.weaponType) }}
              </div>
              <div class="mx-auto mt-0.5 h-1 w-12 overflow-hidden rounded bg-bg">
                <div class="h-full bg-primary" :style="{ width: hpPct(fighterAt(b.allies, cell)!) + '%' }"></div>
              </div>
              <div class="text-[9px] text-muted">
                {{ Math.max(0, fighterAt(b.allies, cell)!.hp) }}/{{ fighterAt(b.allies, cell)!.maxHp }}
              </div>
            </template>
          </div>
        </div>

        <!-- 行动菜单 -->
        <div v-if="b.phase !== 'ended'" class="mt-3 flex gap-2">
          <template v-if="selectingTarget">
            <div class="flex-1 text-xs text-muted">
              点选敌方目标格（{{ active ? weaponLabel(active.weaponType) : '' }}·{{
                active ? weaponShape(active.weaponType) : ''
              }}）
            </div>
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
    </template>
  </div>
</template>
