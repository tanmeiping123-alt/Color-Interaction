# 分阶段执行计划

## 阶段 0：项目脚手架 ✅
- [x] Vite + React + TypeScript 初始化
- [x] 安装依赖（@mediapipe/tasks-vision）
- [x] 创建目录结构
- [x] 创建 CLAUDE.md、docs/、dev-logs/

## 阶段 1：摄像头 + 黑白滤镜
- [ ] useCamera hook
- [ ] videoRenderer 灰度转换
- [ ] CanvasStack 响应式布局
- **验证**：黑白摄像头画面正常显示

## 阶段 2：手势识别
- [ ] useHandGesture hook + MediaPipe 加载
- [ ] detector.ts 手势判断
- [ ] smoothing.ts 关键点平滑
- **验证**：控制台输出手势类型

## 阶段 3：双手拍照 → 局部彩色
- [ ] gestureRenderer 彩色蒙版
- [ ] 矩形边缘羽化
- [ ] 手势消失恢复黑白
- **验证**：双手拍照手势触发彩色矩形

## 阶段 4：单手捏 → 手绘轨迹
- [ ] useDrawingStore 轨迹管理
- [ ] drawingRenderer 平滑曲线
- [ ] 速度自适应粗细
- [ ] 握拳橡皮擦
- **验证**：捏手势画线，握拳擦除

## 阶段 5：UI 交互层
- [ ] PromptOverlay 提示文字
- [ ] Toolbar 工具栏
- [ ] 动画/视觉反馈
- **验证**：完整交互流程

## 阶段 6：优化与打磨
- [ ] 检测降频
- [ ] 移动端优化
- [ ] 可选扩展
