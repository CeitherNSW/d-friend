# 依赖清单 (Dependencies)

本文档列出 d-friend 项目的所有依赖及其用途，供开发前确认。

---

## 运行时依赖 (dependencies)

| 包名 | 版本 | 用途 |
|------|------|------|
| `electron` | ^33.0.0 | 桌面应用运行时，提供透明窗口、系统托盘、屏幕 API |
| `lottie-web` | ^5.12.2 | Lottie JSON 动画渲染引擎，用于播放宠物各行为动画 |

> 运行时依赖严格控制在 5 个以内，降低安装体积与攻击面。

---

## 开发依赖 (devDependencies)

| 包名 | 版本 | 用途 |
|------|------|------|
| `typescript` | ^5.5.0 | 类型系统，strict 模式 |
| `vite` | ^6.0.0 | Renderer 进程打包，开发热更新 |
| `vite-plugin-electron` | ^0.28.0 | Vite 集成 Electron 主进程/预加载脚本构建 |
| `vite-plugin-electron-renderer` | ^0.14.0 | Renderer 进程中使用 Node.js API 的桥接 |
| `vitest` | ^3.0.0 | 单元测试框架，兼容 Vite 配置 |
| `electron-builder` | ^25.0.0 | 打包为可分发安装包（.exe / .dmg） |
| `eslint` | ^9.0.0 | 代码风格检查 |
| `@typescript-eslint/parser` | ^8.0.0 | ESLint 的 TypeScript 解析器 |
| `@typescript-eslint/eslint-plugin` | ^8.0.0 | TypeScript 专用 lint 规则 |

---

## 依赖选型说明

### 为什么选 Lottie 而非 SVG 精灵图？

- Lottie 动画由设计师在 After Effects 中导出，表现力强且文件小
- `lottie-web` 支持 SVG/Canvas 两种渲染模式，性能可调
- 动画切换只需替换 JSON 数据，无需管理复杂的精灵图坐标

### 为什么选 Vite 而非 Webpack？

- 开发启动速度快（ESM 原生加载）
- `vite-plugin-electron` 生态成熟，一套配置同时处理 main/renderer/preload
- 配置量少，适合中小型 Electron 项目

### 为什么选 Vitest 而非 Jest？

- 与 Vite 共享配置和转换管线，无需额外 ts-jest 配置
- 兼容 Jest API（`describe`/`it`/`expect`），迁移成本低
- 原生支持 ESM 和 TypeScript

### 为什么不用 React/Vue？

- 宠物渲染层只有一个 Canvas/SVG 元素 + 少量 DOM（右键菜单）
- 引入框架增加约 40-100KB 体积，无实际收益
- 直接操作 DOM + Lottie API 更轻量、性能更可控

---

## 版本锁定策略

- 使用 `package-lock.json` 锁定完整依赖树
- 依赖版本使用 `^` 范围（允许 patch/minor 更新），但通过 lockfile 保证一致性
- Electron 大版本升级需单独评估（涉及 Chromium/Node 版本变化）

---

## 安装命令

```bash
npm install
```

首次克隆后执行即可，所有依赖通过 `package.json` 声明。
