export interface BoundingBox {
  x: number;      // percentage 0-100 from left
  y: number;      // percentage 0-100 from top
  width: number;  // percentage 0-100
  height: number; // percentage 0-100
}

export interface TextBlock {
  id: number;
  text: string;
  isLogo: boolean;
  description: string;
  selected: boolean;
  bbox?: BoundingBox;
}

export interface TranslationMap {
  [langCode: string]: {
    [blockId: string]: string;
  };
}

// Per-language per-block translation checkbox state
export interface TranslationCheckMap {
  [langCode: string]: {
    [blockId: string]: boolean; // true = translate, false = skip
  };
}

export interface GenerationResult {
  language: string;
  languageName: string;
  imageUrl: string;
  status: "pending" | "generating" | "success" | "error";
  error?: string;
}

export interface ServiceConfig {
  ocrModel: string;
  translateModel: string;
  imageModel: string;
  fileNameRule: "default" | "custom";
  customFileNamePattern?: string;
  activityName?: string;
}

export const LANGUAGES = [
  { code: "en", name: "英语", flag: "🇬🇧" },
  { code: "id", name: "印尼语", flag: "🇮🇩" },
  { code: "ja", name: "日语", flag: "🇯🇵" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "pt", name: "葡萄牙语", flag: "🇧🇷" },
  { code: "fil", name: "菲律宾语", flag: "🇵🇭" },
  { code: "vi", name: "越南语", flag: "🇻🇳" },
  { code: "th", name: "泰语", flag: "🇹🇭" },
  { code: "es", name: "西班牙语", flag: "🇪🇸" },
  { code: "ko", name: "韩语", flag: "🇰🇷" },
  { code: "ar", name: "阿拉伯语", flag: "🇸🇦" },
  { code: "hi", name: "印地语", flag: "🇮🇳" },
  { code: "ms", name: "马来语", flag: "🇲🇾" },
  { code: "ru", name: "俄语", flag: "🇷🇺" },
  { code: "fr", name: "法语", flag: "🇫🇷" },
  { code: "de", name: "德语", flag: "🇩🇪" },
  { code: "it", name: "意大利语", flag: "🇮🇹" },
  { code: "tr", name: "土耳其语", flag: "🇹🇷" },
  { code: "pl", name: "波兰语", flag: "🇵🇱" },
  { code: "nl", name: "荷兰语", flag: "🇳🇱" },
] as const;

export interface ModelOption {
  id: string;
  name: string;
  requiresApiKey?: boolean;
  apiKeyLabel?: string;
  apiProvider?: string;
  description?: string;
}

export type Step =
  | "upload"
  | "ocr"
  | "language"
  | "translate"
  | "generate"
  | "result"
