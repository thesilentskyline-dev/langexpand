# 项目上下文 - 运营视觉一键延展平台

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI) + Tailwind CSS 4 手写样式
- **Styling**: Tailwind CSS 4
- **AI 集成**: coze-coding-dev-sdk (LLM + ImageGeneration + S3Storage)
- **批量下载**: JSZip

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ocr/route.ts         # OCR文字识别 (LLM Vision) + 位置坐标
│   │   │   ├── translate/route.ts   # 多语言翻译 (LLM)
│   │   │   ├── generate/route.ts    # AI图片重绘 (SeeDream/OpenAI/Ideogram/Replicate/Gemini)
│   │   │   ├── upload/route.ts      # 图片上传到S3存储
│   │   │   └── save-image/route.ts  # 生成图片转存到S3
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                 # 主页面（全流程单页应用）
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/
│   ├── lib/
│   │   ├── models.ts        # 模型配置（IMAGE_MODELS, OCR_MODELS, TRANSLATE_MODELS）
│   │   ├── types.ts        # 全局类型定义（TextBlock, BoundingBox, TranslationMap, TranslationCheckMap等）
│   │   └── utils.ts
│   └── server.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 功能模块

### API 接口
| 路径 | 方法 | 功能 | 关键参数 |
|------|------|------|----------|
| `/api/ocr` | POST | OCR识别图片文字 + 位置坐标 | `imageUrl`, `model` |
| `/api/translate` | POST | AI多语言翻译 | `textBlocks`, `targetLanguages`, `model` |
| `/api/generate` | POST/GET | AI图片重绘（图生图）+ API Key校验 | `imageUrl`, `sourceTexts`, `targetTexts`, `language`, `model`, `apiKey` (GET: `action=validate&provider&apiKey`) |
| `/api/upload` | POST | 上传图片到S3 | FormData: `file` |
| `/api/save-image` | POST | 转存生成图片到S3 | `imageUrl`, `fileName` |

### 前端流程（6步骤）
1. **上传图片** - 拖拽/点击上传，自动触发OCR
2. **识别文字** - 图片上绘制标注框，Logo打标，悬停文字列表与图片高亮联动
3. **选择语言** - 英语/印尼语/日语/中文/葡萄牙语/菲律宾语/越南语/泰语/西班牙语，支持全选
4. **翻译校对** - AI自动翻译 + 每条支持勾选/取消（取消置灰不翻译，输入内容保留） + 手动编辑
5. **AI生成** - 并行多语言图片重绘（仅翻译勾选项），支持重试
6. **预览下载** - 左侧大卡片点击全屏，原文/译文对照表，单张下载/JSZip批量下载

### 图片标注（ImageAnnotator）
- SVG覆盖层绘制文字块边界框（百分比坐标）
- Logo文字块用琥珀色标记 + LOGO标签
- 选中文字块用绿色，未选中用灰色
- 悬停文字列表时对应框高亮，双向联动
- 每个框显示编号标识

### 翻译校对（TranslationCheckMap）
- 每条翻译默认勾选（翻译）
- 取消勾选：该行置灰，不参与翻译和图片重绘
- 用户输入的译文在取消勾选后仍保留，重新勾选即可恢复
- 未勾选的条目在生成时保持原文不变

### 预览区域
- 左侧结果卡片占 3/5 宽度，图片区域 h-72，单列布局（更大展示）
- 点击图片/全屏按钮打开 FullscreenModal
- 全屏展示：点击背景或关闭按钮退出
- 原图也可全屏查看
- 翻译对照表最大高度 300px

### 服务配置
- 右上角"服务配置"弹窗，可切换OCR模型、翻译模型、图片生成模型
- OCR模型：Doubao-Seed-Vision、Doubao-Seed-1.8、Kimi K2.5、Qwen 3.5 Plus
- 翻译模型：Doubao-Seed-1.8/2.0 Pro/2.0 Lite、DeepSeek V3.2、Kimi K2.5、Qwen 3.5 Plus (东亚/东南亚优化)
- 图片生成模型：SeeDream v5.0/v4.5 (内置)、GPT-4o Image (需OpenAI API Key)、Ideogram 2.0 (需Ideogram API Key)、Flux Kontext Pro (需Replicate API Token)、Gemini 3.1 Flash Image (需Google AI API Key)
- 选中需要API Key的模型时，自动展示API Key输入框（掩码显示，点击校验）
- 每个生成结果卡片有"重试"按钮

## 包管理规范

**仅允许使用 pnpm** 作为包管理器。
- 安装依赖：`pnpm add <package>`
- 安装所有依赖：`pnpm install`

## 开发规范

- TypeScript strict 模式，禁止隐式 any
- coze-coding-dev-sdk 只在服务端代码使用
- S3Storage: 上传后必须使用返回的 key，访问URL必须通过 generatePresignedUrl 生成
- 图片使用 `<img>` 标签（因动态外部URL无法使用 Next.js Image 优化）
- BoundingBox 使用百分比坐标（0-100），适配不同图片显示尺寸

## 构建与验证

- 静态检查: `pnpm lint` + `pnpm ts-check`
- 开发: `pnpm dev` (端口5000)
- 构建: `pnpm build`
- 生产: `pnpm start`

## Coze 平台配置

### 项目结构
- **工作区根目录**: `/workspace/projects`
- **技术项目根目录**: `/workspace/projects/projects` (子目录形式)
- **sub_id**: `71662ff0`

### .coze 配置
- 根 `.coze`: `/workspace/projects/.coze` (平台唯一入口)
- 子项目 `.coze`: `/workspace/projects/projects/.coze`
- `[subprojects].path`: `["projects"]`

### 预览链路
- **preview_enable**: `enabled` (web 类型)
- **dev.build**: 安装依赖 (`pnpm install`)
- **dev.run**: 启动 Next.js 开发服务器 (端口 5000)
- **包装脚本**:
  - `/workspace/projects/coze-preview-build.sh`
  - `/workspace/projects/coze-preview-run.sh`
  - `/workspace/projects/coze-preview-validate.sh`

### 部署链路
- **deploy.profile.kind**: `service`
- **deploy.profile.flavor**: `web`
- **deploy.backend.enabled**: `true`
- **包装脚本**:
  - `/workspace/projects/coze-deploy-build.sh` (依赖安装 + Next.js build + tsup 打包)
  - `/workspace/projects/coze-deploy-run.sh` (启动 node dist/server.js, 端口 5000)

### 运行时
- **requires**: `nodejs-24`
- **package.json scripts**: dev/build/start/validate
