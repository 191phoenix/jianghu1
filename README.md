# 江湖 (jianghu1)

一个文字武侠放置游戏,纯单机,PWA 可加到手机主屏离线游玩。

**🌐 在线玩:https://191phoenix.github.io/jianghu1/**

## 技术栈

Vite + Vue 3 + TypeScript + Pinia + Vue Router(hash) + Tailwind CSS v4 + vite-plugin-pwa。
架构参考 [setube/ogame-vue-ts](https://github.com/setube/ogame-vue-ts) 的分层(`logic/`/`config/`/`stores/`/`views/`)。

## 玩法

- **战斗**:自动回合制,主角 + 侠客组队 vs 多敌人,各自技能触发
- **成长**:升级、6 部位装备、4 天赋、4 内功、装备强化(0-5 星)
- **侠客**:3 侠客剧情获取、升级、穿装备
- **关卡**:2 章 20 关 + BOSS,部分多敌人关
- **商店/任务**:银两 economy、装备摊、10 个成就任务
- **图鉴**:装备/侠客/内功/怪物收集
- **离线挂机**:扫荡已通关卡,上限 8 小时

## 开发

```bash
npm install
npm run dev      # 本机 + 局域网(--host)
npm run build
npm run preview
```

## 部署

push `main` 自动触发 GitHub Actions 构建并部署到 GitHub Pages。
`vite.config.ts` 的 `base` 按环境区分(CI 用 `/jianghu1/`,本地用 `./`)。

## 进度

- [x] 阶段 0:脚手架 + PWA + 存档
- [x] 阶段 1:核心战斗 + 成长循环
- [x] 阶段 2:侠客 + 多门派 + 6 部位装备
- [x] 阶段 3:天赋 + 内功 + 装备强化 + 侠客养成 + 图鉴
- [x] 商店 + 任务
- [x] GitHub Pages 部署
