# 技术规范

## 技术栈

| 类别 | 选型 | 版本 |
|------|------|------|
| 前端框架 | React + TypeScript | 19.x |
| 构建工具 | Vite | 6.x |
| 手势识别 | @mediapipe/tasks-vision | latest |
| 渲染 | Canvas 2D API | — |
| 状态管理 | React Context + useReducer | — |
| 样式 | CSS (无预处理) | — |
| 包管理 | npm | — |

## 架构

```
App
├── CameraProvider (Context + useReducer)
│   ├── useCamera        → 摄像头启停、视频流
│   ├── useHandGesture   → MediaPipe 检测、关键点平滑
│   └── useDrawingStore  → 轨迹存储、撤销
└── CanvasStack (三层绝对定位叠放)
    ├── <canvas> 视频层 → 黑白滤镜
    ├── <canvas> 手势层 → 彩色矩形蒙版 + feather
    └── <canvas> 绘制层 → 粉色轨迹
```

## 数据流

1. `useCamera` 获取视频流 → `<video>` 元素（隐藏）
2. `useHandGesture` 从 `<video>` 读取帧 → MediaPipe → 手势类型 + 关键点坐标
3. 手势数据存入 Context
4. CanvasStack 订阅 Context，每帧分别渲染三层

## 手势判定

### 拍照手势（双手）
- 双手均检测到 + 每只手四指伸展 + 矩形面积合理
- 关键点：拇指尖(4)、食指尖(8) 界定矩形四角
- 稳定性检查：矩形中心帧间位移 < 6%（防止跳动误触）
- 5 帧确认进入，8 帧确认退出

### 捏手势（单手）
- 拇指尖(4) 到食指尖(8) 距离 < 手部尺度 × 0.25（进入）/ 0.40（退出）
- z 轴深度验证：拇指尖(4) 和食指尖(8) z 差值 < 0.06（确保两指在同一深度平面）
- 食指中间关节(6) 须伸展（距离手腕 > 手部尺度 × 0.65）
- 其余三指（中/无名/小）指尖到手腕距离 > 手部尺度 × 0.72（进入）/ 0.52（退出）
- 迟滞阈值防抖
- **draw arm**：捏合须持续 10 帧后才输出 drawReady = true
- **cooldown**：松手后 15 帧内禁止重新进入 pinch（过滤手势切换过渡帧）

## 关键点平滑

- EMA (指数移动平均)，α = 0.4
- 在平滑度和响应速度间平衡

## 性能策略

- 手势检测：每 2 帧检测一次 (~30fps)
- 渲染：requestAnimationFrame (~60fps)
- Canvas 尺寸适配设备，移动端降低分辨率
