# Color Interaction - 手势互动彩色画面

## 项目概述

通过摄像头 + MediaPipe Hands 手势识别，实现黑白画面中手势触发局部彩色和手绘轨迹。
- 双手拍照手势 → 矩形区域恢复彩色
- 识别食指，大拇指捏合启用粉色手绘 → 粉色手绘轨迹

## 标准文件指引

- **需求文档**：[docs/requirements.md](docs/requirements.md) — 完整功能需求
- **技术规范**：[docs/tech-spec.md](docs/tech-spec.md) — 技术栈选型、架构决策
- **设计规范**：[docs/design-standards.md](docs/design-standards.md) — 颜色、字体、间距、Canvas 尺寸
- **组件接口**：[docs/component-api.md](docs/component-api.md) — 所有组件/Hook 的 API 定义
- **执行计划**：[docs/execution-plan.md](docs/execution-plan.md) — 分阶段执行计划

## 开发日志

- 每日记录在 [dev-logs/](dev-logs/) 文件夹，按日期命名 `YYYY-MM-DD.md`
- 每个工作阶段完成后自动更新

## 工作约定

- 技术栈：React + Vite + TypeScript + MediaPipe Hands (@mediapipe/tasks-vision) + Canvas 2D
- 架构：三层 Canvas 叠放 + 分层 Hooks + Context 状态管理
- 使用 Superpowers 工作流（brainstorming → writing-plans → implementation → review）
- 按 [执行计划](docs/execution-plan.md) 分阶段推进，每个阶段完成后验证再进入下一阶段
- 遵循 [设计规范](docs/design-standards.md) 中的所有标准
- 组件和 Hook 接口需与 [组件接口](docs/component-api.md) 保持一致

## 开发命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run preview  # 预览生产构建
```
