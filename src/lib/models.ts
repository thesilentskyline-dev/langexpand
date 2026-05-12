import type { ModelOption } from "./types";

// ==================== OCR 模型 ====================
export const OCR_MODELS: readonly ModelOption[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Google Gemini 2.5 Flash，支持多模态识别，免费额度充足",
  },
] as const;

// ==================== 翻译模型 ====================
export const TRANSLATE_MODELS: readonly ModelOption[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Google Gemini 2.5 Flash，支持多语言翻译，免费额度充足",
  },
] as const;

// ==================== 图片生成模型（按质量排序）====================
export const IMAGE_MODELS: readonly ModelOption[] = [
  {
    id: "gemini-3-pro-image-preview",
    name: "Gemini 3 Pro Image Preview（质量最佳）",
    description: "Google Gemini 3 Pro 预览版，原生图片生成质量最高的模型（~990KB/图）",
  },
  {
    id: "gemini-3.1-flash-image-preview",
    name: "Gemini 3.1 Flash Image Preview",
    description: "Google Gemini 3.1 Flash 预览版图片生成，质量与速度均衡",
  },
  {
    id: "gemini-2.5-flash-image",
    name: "Gemini 2.5 Flash Image",
    description: "Google Gemini 2.5 Flash 原生图片生成，快速轻量",
  },
] as const;
