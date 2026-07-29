import { defineStore } from 'pinia'
import type { Player } from '@/types/game'

/** 角色存档 store。持久化到 localStorage（key: jianghu1-save） */
export const useGameStore = defineStore('game', {
  state: () => ({
    player: {
      name: '无名侠客',
      level: 1,
      exp: 0,
      sect: '',
      createdAt: 0
    } as Player,
    lastSaveTime: 0
  }),
  actions: {
    setPlayerName(name: string) {
      this.player.name = name
    },
    touchSave() {
      this.lastSaveTime = Date.now()
    }
  },
  persist: {
    key: 'jianghu1-save',
    storage: localStorage
  }
})
