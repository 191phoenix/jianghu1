# 江湖 (jianghu1)

一个文字武侠放置游戏，纯单机，PWA 可加到手机主屏离线游玩。

## 技术栈

Vite + Vue 3 + TypeScript + Pinia + Vue Router(hash) + Tailwind CSS v4 + vite-plugin-pwa。

架构参考 [setube/ogame-vue-ts](https://github.com/setube/ogame-vue-ts)：`logic/`(游戏逻辑) / `config/`(静态数据) / `stores/`(状态) / `workers/`(重计算，阶段1引入) / `views/`+`components/`(UI) 分层。

## 开发

```bash
npm install
npm run dev      # 本机 + 局域网手机访问（--host）
npm run build    # 产出 dist/，含 PWA manifest + service worker
npm run preview  # 预览生产构建
```

## 存档

- 本地：Pinia 持久化到 `localStorage`（key `jianghu1-save`）。
- 备份：角色页「导出存档」下载加密 JSON；清浏览器后「导入存档」恢复。

## 进度

- [x] 阶段 0：脚手架 + PWA 空壳 + 存档层
- [ ] 阶段 1：核心战斗 + 成长循环
- [ ] 阶段 2：门派 / 侠客 / 装备
- [ ] 阶段 3：天赋 / 内功 / 图鉴
