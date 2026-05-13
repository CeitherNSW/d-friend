# 🐾 d-friend

A desktop pet that lives on your screen — walks, jumps, idles, and reacts to your mouse.

Built with Electron + TypeScript. Lightweight, extensible, and always by your side.

---

## ✨ Features

- **自由漫步** — 宠物在屏幕上自主行走、跳跃，感知屏幕边缘与任务栏
- **拖拽互动** — 抓起宠物丢到任意位置，松手后自然坠落
- **点击反馈** — 单击摸头、双击跳跃、右键菜单
- **插件式行为** — 每个动作是独立模块，一个文件 + 一行注册即可扩展
- **轻量常驻** — 空闲 CPU < 2%，不打扰你的工作

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Electron (透明置顶窗口)         │
├─────────────────────────────────────────┤
│  AutoScheduler ←→ BehaviorStateMachine  │
│         ↕              ↕                │
│    EventBus ←→ BehaviorRegistry         │
├─────────────────────────────────────────┤
│  Idle │ Walk │ Jump │ Drag │ Fall │ ... │
├─────────────────────────────────────────┤
│        AnimationPlayer (Lottie)         │
└─────────────────────────────────────────┘
```

行为通过统一接口注册，状态机按优先级调度，事件总线解耦通信。添加新行为无需修改核心代码。

## 🚀 Quick Start

```bash
# 安装依赖
npm install

# 开发模式启动
npm run dev

# 运行测试
npm run test

# 构建生产包
npm run build
```

## 🧩 添加自定义行为

```typescript
// src/behaviors/sit/sit-behavior.ts
import { Behavior, BehaviorContext } from '../../core/types';

export const SitBehavior: Behavior = {
  id: 'sit',
  priority: 1,

  enter(ctx: BehaviorContext) {
    ctx.animationPlayer.play('sit');
  },

  update(ctx: BehaviorContext, dt: number) {
    // 坐 10 秒后起身
    if (ctx.elapsed > 10000) {
      ctx.stateMachine.requestTransition('idle', 'sit-timeout');
    }
  },

  exit(ctx: BehaviorContext) {},

  canTransitionTo(nextId: string) {
    return true;
  }
};
```

注册一行搞定：

```typescript
registry.register(SitBehavior);
```

## 📋 Roadmap

- [x] PRD & 架构设计
- [ ] Electron 项目骨架
- [ ] 动画渲染层
- [ ] 行为状态机 & 插件系统
- [ ] 核心行为：Idle / Walk / Jump / Drag / Fall
- [ ] 屏幕边缘感知 & 任务栏交互
- [ ] 自动行为调度
- [ ] 配置持久化 & 系统托盘

## 🛠️ Tech Stack

| 层 | 技术 |
|----|------|
| 运行时 | Electron |
| 语言 | TypeScript (strict) |
| 构建 | Vite + vite-plugin-electron |
| 动画 | Lottie (lottie-web) |
| 测试 | Vitest |
| 打包 | electron-builder |

## 📄 License

MIT
