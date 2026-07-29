/** 角色核心数据（阶段 0 占位，阶段 1 扩展属性/装备/侠客等） */
export interface Player {
  name: string
  level: number
  exp: number
  sect: string
  createdAt: number
}
