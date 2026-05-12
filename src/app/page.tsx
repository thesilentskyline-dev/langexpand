"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import type {
  TextBlock,
  TranslationMap,
  TranslationCheckMap,
  GenerationResult,
  ServiceConfig,
  Step,
} from "@/lib/types";
import { LANGUAGES } from "@/lib/types";
import {
  OCR_MODELS,
  TRANSLATE_MODELS,
  IMAGE_MODELS,
} from "@/lib/models";
import type { ModelOption } from "@/lib/types";
import JSZip from "jszip";
import { PlatformAdvantage } from "@/components/platform-advantage";
import { Footer, VersionModal } from "@/components/footer";

// ==================== Step Indicator ====================
function StepIndicator({ steps, currentStep }: { steps: { key: Step; label: string; num: number }[]; currentStep: Step }) {
  const currentIdx = steps.findIndex((s) => s.key === currentStep);
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {steps.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;
        return (
          <React.Fragment key={step.key}>
            {idx > 0 && (
              <div
                className={`h-0.5 w-6 rounded transition-colors ${
                  isDone ? "bg-emerald-500" : "bg-zinc-200"
                }`}
              />
            )}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md"
                  : isDone
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-zinc-100 text-zinc-400"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : isDone
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-300 text-white"
                }`}
              >
                {isDone ? "✓" : step.num}
              </span>
              {step.label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ==================== Model Selector ====================
function ModelSelector({
  label,
  models,
  value,
  onChange,
}: {
  label: string;
  models: readonly ModelOption[];
  value: string;
  onChange: (modelId: string) => void;
}) {
  const selectedModel = models.find((m) => m.id === value);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-600">
        {label}
      </label>
      <select
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      {selectedModel?.description && (
        <p className="mt-1 text-xs text-zinc-400">{selectedModel.description}</p>
      )}
    </div>
  );
}

// ==================== Config Dialog ====================
function ConfigPanel({
  config,
  onChange,
  open,
  onClose,
}: {
  config: ServiceConfig;
  onChange: (c: ServiceConfig) => void;
  open: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"model" | "naming">("model");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h3 className="text-lg font-bold text-zinc-800">配置</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-100">
          <button
            onClick={() => setActiveTab("model")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "model"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            模型
          </button>
          <button
            onClick={() => setActiveTab("naming")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "naming"
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            命名
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "model" && (
            <div className="space-y-4">
              <ModelSelector
                label="OCR 识别模型"
                models={OCR_MODELS}
                value={config.ocrModel}
                onChange={(modelId) => onChange({ ...config, ocrModel: modelId })}
              />

              <ModelSelector
                label="翻译模型"
                models={TRANSLATE_MODELS}
                value={config.translateModel}
                onChange={(modelId) => onChange({ ...config, translateModel: modelId })}
              />

              <ModelSelector
                label="图片生成模型"
                models={IMAGE_MODELS}
                value={config.imageModel}
                onChange={(modelId) => onChange({ ...config, imageModel: modelId })}
              />

              <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                已预置 Gemini 免费模型，通过环境变量 GOOGLE_API_KEY 配置 API Key 即可使用。Gemini 2.5 Flash 在 OCR 和翻译上表现均衡，Gemini 3 Pro Image Preview 提供最佳生图质量。
              </div>
            </div>
          )}

          {activeTab === "naming" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-600">
                  活动英文名
                  <span className="ml-1 text-xs text-zinc-400">（用于文件命名）</span>
                </label>
                <input
                  type="text"
                  value={config.activityName || ""}
                  onChange={(e) => onChange({ ...config, activityName: e.target.value })}
                  placeholder="如：summer_sale"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-600">
                  命名规则
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fileNameRule"
                      checked={config.fileNameRule === "default"}
                      onChange={() => onChange({ ...config, fileNameRule: "default" })}
                      className="text-emerald-600"
                    />
                    <span className="text-sm text-zinc-700">{config.activityName || "活动英文名"}_poster_{"{lang}"}_{"{date}"}.png</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="fileNameRule"
                      checked={config.fileNameRule === "custom"}
                      onChange={() => onChange({ ...config, fileNameRule: "custom" })}
                      className="text-emerald-600"
                    />
                    <span className="text-sm text-zinc-700">自定义</span>
                  </label>
                </div>
              </div>

              {config.fileNameRule === "custom" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-600">
                    自定义命名规则
                  </label>
                  <input
                    type="text"
                    value={config.customFileNamePattern || "{name}_poster_{lang}_{date}.png"}
                    onChange={(e) => onChange({ ...config, customFileNamePattern: e.target.value })}
                    placeholder="{name}_poster_{lang}_{date}.png"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                  <div className="mt-2 text-xs text-zinc-500 space-y-1">
                    <p>可用变量：</p>
                    <ul className="ml-2 space-y-0.5">
                      <li><code className="bg-zinc-100 px-1 rounded">{"{name}"}</code> - 活动英文名（AI识别生成）</li>
                      <li><code className="bg-zinc-100 px-1 rounded">{"{lang}"}</code> - 语言代码</li>
                      <li><code className="bg-zinc-100 px-1 rounded">{"{date}"}</code> - 年月日（格式：20260507）</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-xs text-zinc-600">
                  <strong>示例：</strong><br />
                  预设规则命名结果：<code className="bg-zinc-100 px-1 rounded">summer_sale_poster_en_20260507.png</code>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Image Annotator (CSS overlay) ====================
function ImageAnnotator({
  imageUrl,
  textBlocks,
  hoveredBlockId,
  onHoverBlock,
  onBlockClick,
}: {
  imageUrl: string;
  textBlocks: TextBlock[];
  hoveredBlockId: number | null;
  onHoverBlock: (id: number | null) => void;
  onBlockClick?: (id: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number; offsetX: number; offsetY: number } | null>(null);

  // Track the actual rendered img position relative to the container
  const updateImgDimensions = useCallback(() => {
    if (containerRef.current && imgRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const imgRect = imgRef.current.getBoundingClientRect();
      setImgDimensions({
        width: imgRect.width,
        height: imgRect.height,
        offsetX: imgRect.left - containerRect.left,
        offsetY: imgRect.top - containerRect.top,
      });
    }
  }, []);

  // Update on image load and window resize
  useEffect(() => {
    updateImgDimensions();
    window.addEventListener("resize", updateImgDimensions);
    return () => window.removeEventListener("resize", updateImgDimensions);
  }, [updateImgDimensions]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ minHeight: 200 }}>
      <img
        ref={imgRef}
        src={imageUrl}
        alt="上传的图片"
        className="mx-auto block h-auto max-h-[520px] w-full object-contain"
        draggable={false}
        onLoad={updateImgDimensions}
      />
      {/* CSS positioned overlay boxes using percentage coordinates */}
      {/* The overlay is positioned to exactly match the rendered image area */}
      {imgDimensions && imgDimensions.width > 0 && imgDimensions.height > 0 && textBlocks.map((block) => {
        if (!block.bbox) return null;
        const isHovered = hoveredBlockId === block.id;
        const isSelected = block.selected;
        return (
          <div
            key={block.id}
            className="absolute cursor-pointer"
            style={{
              left: imgDimensions.offsetX + (block.bbox.x / 100) * imgDimensions.width,
              top: imgDimensions.offsetY + (block.bbox.y / 100) * imgDimensions.height,
              width: (block.bbox.width / 100) * imgDimensions.width,
              height: (block.bbox.height / 100) * imgDimensions.height,
            }}
            onMouseEnter={() => onHoverBlock(block.id)}
            onMouseLeave={() => onHoverBlock(null)}
            onClick={() => onBlockClick?.(block.id)}
          >
            {/* Border box */}
            <div
              className={`absolute inset-0 rounded-sm transition-colors ${
                isHovered
                  ? "border-2 border-emerald-500 bg-emerald-500/15"
                  : block.isLogo
                  ? "border-2 border-amber-400 bg-amber-400/10"
                  : isSelected
                  ? "border-2 border-emerald-400 bg-emerald-400/8"
                  : "border border-zinc-300 bg-transparent"
              }`}
            />
            {/* LOGO tag */}
            {block.isLogo && (
              <div className="absolute -top-5 left-0 z-10 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-tight text-white shadow-sm">
                LOGO
              </div>
            )}
            {/* Block ID badge */}
            <div
              className={`absolute -right-2.5 -top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${
                isHovered
                  ? "bg-emerald-500"
                  : block.isLogo
                  ? "bg-amber-500"
                  : "bg-zinc-400"
              }`}
            >
              {block.id}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== Upload Step ====================
function UploadStep({
  onUploaded,
  onBatchUploaded,
  batchMode,
  onBatchModeChange,
}: {
  onUploaded: (file: File) => void;
  onBatchUploaded: (files: File[]) => void;
  batchMode: boolean;
  onBatchModeChange: (batch: boolean) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  // 直接传 File 对象，不上传到服务器存储
  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setUploading(true);
      try {
        // 直接把 File 对象传给父组件处理（转为 Base64）
        onUploaded(file);
      } catch {
        alert("处理图片失败，请重试");
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
      if (imageFiles.length === 0) return;
      onBatchUploaded(imageFiles);
    },
    [onBatchUploaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (batchMode) {
        handleFiles(e.dataTransfer.files);
      } else {
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }
    },
    [handleFile, handleFiles, batchMode]
  );

  return (
    <div>
      {/* Mode Toggle */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <button
          onClick={() => onBatchModeChange(false)}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
            !batchMode
              ? "bg-emerald-600 text-white shadow-md"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          单个图片
        </button>
        <button
          onClick={() => onBatchModeChange(true)}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
            batchMode
              ? "bg-emerald-600 text-white shadow-md"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          批量处理
        </button>
      </div>

      {/* Upload Area */}
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all ${
          dragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-zinc-200 bg-zinc-50/50 hover:border-emerald-300 hover:bg-emerald-50/30"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <input
          ref={batchInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <p className="mb-1 text-base font-semibold text-zinc-700">
          {uploading ? "正在上传..." : batchMode ? "拖拽或点击上传多张营销图片" : "拖拽或点击上传营销图片"}
        </p>
        <p className="mb-4 text-sm text-zinc-400">
          {batchMode ? "支持 PNG、JPG、WebP 格式，可一次选择多张" : "支持 PNG、JPG、WebP 格式"}
        </p>
        <button
          disabled={uploading}
          onClick={() => batchMode ? batchInputRef.current?.click() : inputRef.current?.click()}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
        >
          {uploading ? "上传中..." : batchMode ? "选择多张图片" : "选择图片"}
        </button>
      </div>
    </div>
  );
}

// ==================== OCR Step ====================
function OCRStep({
  textBlocks,
  imageUrl,
  onToggle,
  onToggleAll,
  onConfirm,
  onBack,
  loading,
}: {
  textBlocks: TextBlock[];
  imageUrl: string;
  onToggle: (id: number) => void;
  onToggleAll: (selected: boolean) => void;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [hoveredBlockId, setHoveredBlockId] = useState<number | null>(null);
  const selectedCount = textBlocks.filter((b) => b.selected).length;
  const allSelected = textBlocks.length > 0 && selectedCount === textBlocks.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Image Preview with Annotations */}
        <div className="lg:w-1/2 shrink-0">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden">
            <ImageAnnotator
              imageUrl={imageUrl}
              textBlocks={textBlocks}
              hoveredBlockId={hoveredBlockId}
              onHoverBlock={setHoveredBlockId}
            />
          </div>
          <p className="mt-2 text-center text-xs text-zinc-400">
            悬停文字列表可在图中高亮对应位置
          </p>
        </div>
        {/* Text Blocks */}
        <div className="flex-1">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-700">
              识别到的文字 ({textBlocks.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleAll(!allSelected)}
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                {allSelected ? "取消全选" : "全选"}
              </button>
              <span className="text-xs text-zinc-400">
                已选 {selectedCount}/{textBlocks.length}
              </span>
            </div>
          </div>
          <div className="max-h-[450px] space-y-2 overflow-y-auto pr-1">
            {textBlocks.map((block) => (
              <div
                key={block.id}
                onMouseEnter={() => setHoveredBlockId(block.id)}
                onMouseLeave={() => setHoveredBlockId(null)}
                className={`flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                  hoveredBlockId === block.id
                    ? "border-emerald-400 bg-emerald-50 shadow-sm"
                    : block.selected
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-zinc-100 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={block.selected}
                  onChange={() => onToggle(block.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-600">
                      {block.id}
                    </span>
                    <span className="text-sm font-medium text-zinc-800 truncate">
                      {block.text}
                    </span>
                    {block.isLogo && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        LOGO
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400">
                    {block.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-xl border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          上一步
        </button>
        <button
          disabled={selectedCount === 0 || loading}
          onClick={onConfirm}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "处理中..." : "下一步：选择语言"}
        </button>
      </div>
    </div>
  );
}

// ==================== Language Step ====================
function LanguageStep({
  selectedLanguages,
  onToggle,
  onToggleAll,
  onConfirm,
  onBack,
  batchMode,
  batchLanguage,
  batchImages,
  batchResults,
  loading,
}: {
  selectedLanguages: string[];
  onToggle: (code: string) => void;
  onToggleAll: () => void;
  onConfirm: () => void;
  onBack: () => void;
  batchMode?: boolean;
  batchLanguage?: string;
  batchImages?: { url: string; filename: string }[];
  batchResults?: { imageUrl: string; filename: string; status: string; resultUrl?: string; error?: string }[];
  loading?: boolean;
}) {
  const allSelected = selectedLanguages.length === LANGUAGES.length;
  
  // Batch mode UI
  if (batchMode) {
    return (
      <div className="space-y-6">
        {/* Batch Mode Info */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">批量模式</span>
            <span className="text-sm text-emerald-700">已上传 {batchImages?.length || 0} 张图片</span>
          </div>
          <h3 className="text-sm font-semibold text-emerald-800 mb-3">请选择单一目标语言</h3>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-6">
            {LANGUAGES.map((lang) => {
              const isSelected = batchLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => onToggle(lang.code)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 shadow-md"
                      : "border-zinc-200 bg-white hover:border-emerald-200"
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-emerald-700" : "text-zinc-600"
                    }`}
                  >
                    {lang.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Batch Results */}
        {batchResults && batchResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-700">处理进度</h3>
            <div className="space-y-2">
              {batchResults.map((result, index) => (
                <div key={index} className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-3">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                    {result.imageUrl ? (
                      <Image src={result.imageUrl} alt={result.filename || "image"} fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full bg-zinc-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-700">{result.filename}</p>
                    <p className={`text-xs ${
                      result.status === "success" ? "text-emerald-600" :
                      result.status === "error" ? "text-red-500" :
                      result.status === "processing" ? "text-amber-600" : "text-zinc-400"
                    }`}>
                      {result.status === "pending" && "等待处理"}
                      {result.status === "processing" && "处理中..."}
                      {result.status === "success" && "处理完成"}
                      {result.status === "error" && (result.error || "处理失败")}
                    </p>
                  </div>
                  {result.status === "success" && result.resultUrl && (
                    <a
                      href={result.resultUrl}
                      download={`${result.filename.replace(/\.[^.]+$/, "")}_${batchLanguage}.png`}
                      className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                    >
                      下载
                    </a>
                  )}
                  {result.status === "processing" && (
                    <svg className="h-5 w-5 animate-spin text-emerald-600" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="rounded-xl border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            上一步
          </button>
          <button
            disabled={!batchLanguage || loading}
            onClick={onConfirm}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "处理中..." : `开始处理 ${batchLanguage ? LANGUAGES.find(l => l.code === batchLanguage)?.name : ""}`}
          </button>
        </div>
      </div>
    );
  }

  // Single mode UI
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">选择目标语言</h3>
        <button
          onClick={onToggleAll}
          className="text-xs text-emerald-600 hover:text-emerald-700"
        >
          {allSelected ? "取消全选" : "全选"}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-6">
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLanguages.includes(lang.code);
          return (
            <button
              key={lang.code}
              onClick={() => onToggle(lang.code)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50 shadow-md"
                  : "border-zinc-200 bg-white hover:border-emerald-200"
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span
                className={`text-sm font-medium ${
                  isSelected ? "text-emerald-700" : "text-zinc-600"
                }`}
              >
                {lang.name}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-xl border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          上一步
        </button>
        <button
          disabled={selectedLanguages.length === 0 || loading}
          onClick={onConfirm}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
        >
          下一步：翻译校对
        </button>
      </div>
    </div>
  );
}

// ==================== Translate Step ====================
function TranslateStep({
  textBlocks,
  translations,
  translationChecks,
  selectedLanguages,
  onTranslationChange,
  onTranslationCheckChange,
  onConfirm,
  onBack,
  loading,
}: {
  textBlocks: TextBlock[];
  translations: TranslationMap;
  translationChecks: TranslationCheckMap;
  selectedLanguages: string[];
  onTranslationChange: (lang: string, blockId: string, value: string) => void;
  onTranslationCheckChange: (lang: string, blockId: string, checked: boolean) => void;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [activeLang, setActiveLang] = useState(selectedLanguages[0] || "en");

  const activeBlocks = textBlocks.filter((b) => b.selected);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">
          翻译校对 - 检查并修改AI翻译结果
        </h3>
        {loading && (
          <span className="flex items-center gap-2 text-sm text-emerald-600">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            AI翻译中...
          </span>
        )}
      </div>

      {/* Language Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1">
        {selectedLanguages.map((code) => {
          const lang = LANGUAGES.find((l) => l.code === code);
          return (
            <button
              key={code}
              onClick={() => setActiveLang(code)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeLang === code
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {lang?.flag} {lang?.name}
            </button>
          );
        })}
      </div>

      {/* Translation Table with Checkboxes */}
      <div className="max-h-[400px] overflow-y-auto rounded-xl border border-zinc-200">
        <table className="w-full">
          <thead className="sticky top-0 bg-zinc-50 z-10">
            <tr>
              <th className="w-10 px-2 py-2 text-center text-xs font-semibold text-zinc-500">
                译
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">
                原文
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">
                译文
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {activeBlocks.map((block) => {
              const blockId = String(block.id);
              const isChecked = translationChecks[activeLang]?.[blockId] !== false; // default true
              const translatedText = translations[activeLang]?.[blockId] || "";
              return (
                <tr
                  key={block.id}
                  className={`transition-all ${
                    isChecked ? "hover:bg-zinc-50/50" : "bg-zinc-50/80 opacity-50"
                  }`}
                >
                  <td className="px-2 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        onTranslationCheckChange(activeLang, blockId, e.target.checked)
                      }
                      className="h-4 w-4 accent-emerald-600"
                    />
                  </td>
                  <td className={`px-4 py-2.5 text-sm ${isChecked ? "text-zinc-700" : "text-zinc-400"}`}>
                    {block.text}
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      value={translatedText}
                      onChange={(e) =>
                        onTranslationChange(
                          activeLang,
                          blockId,
                          e.target.value
                        )
                      }
                      disabled={!isChecked}
                      className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        isChecked
                          ? "border-zinc-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          : "border-transparent bg-transparent text-zinc-400"
                      }`}
                      placeholder={isChecked ? "等待翻译..." : "已跳过"}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-400">
        取消勾选的条目将不会被翻译和替换，输入的内容在取消勾选后仍然保留
      </p>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-xl border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          上一步
        </button>
        <button
          disabled={loading}
          onClick={onConfirm}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "翻译中..." : "开始生成图片"}
        </button>
      </div>
    </div>
  );
}

// ==================== Generate Step ====================
function GenerateStep({
  results,
  onRetry,
  onBack,
  onViewResult,
}: {
  results: GenerationResult[];
  onRetry: (lang: string) => void;
  onBack: () => void;
  onViewResult: () => void;
}) {
  const allDone = results.every(
    (r) => r.status === "success" || r.status === "error"
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">
          图片生成进度
        </h3>
        {!allDone && (
          <span className="flex items-center gap-2 text-sm text-emerald-600">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            生成中...
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {results.map((result) => (
          <div
            key={result.language}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5">
              <span className="text-sm font-semibold text-zinc-700">
                {result.languageName}
              </span>
              <div className="flex items-center gap-2">
                {result.status === "generating" && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    生成中
                  </span>
                )}
                {result.status === "success" && (
                  <span className="text-xs font-medium text-emerald-600">
                    完成
                  </span>
                )}
                {result.status === "error" && (
                  <span className="text-xs text-red-500">失败</span>
                )}
                {(result.status === "success" || result.status === "error") && (
                  <button
                    onClick={() => onRetry(result.language)}
                    className="rounded-lg border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-50"
                  >
                    重试
                  </button>
                )}
              </div>
            </div>
            <div className="flex h-48 items-center justify-center bg-zinc-50">
              {result.status === "generating" || result.status === "pending" ? (
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <svg className="h-8 w-8 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  <span className="text-xs">等待生成</span>
                </div>
              ) : result.status === "success" && result.imageUrl ? (
                <img
                  src={result.imageUrl}
                  alt={result.languageName}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-red-400">
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span className="text-xs">{result.error || "生成失败"}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-xl border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          上一步
        </button>
        {allDone && (
          <button
            onClick={onViewResult}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-md hover:bg-emerald-700"
          >
            查看结果
          </button>
        )}
      </div>
    </div>
  );
}

// ==================== Fullscreen Image Modal ====================
function FullscreenModal({
  imageUrl,
  title,
  onClose,
}: {
  imageUrl: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-h-[95vh] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
        <div className="absolute -top-10 left-0 text-sm font-medium text-white/80">
          {title}
        </div>
        <div className="absolute -top-10 right-0">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <img
          src={imageUrl}
          alt={title}
          className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}

// ==================== Result Step ====================
function ResultStep({
  results,
  textBlocks,
  translations,
  translationChecks,
  originalImageUrl,
  onBack,
  config,
}: {
  results: GenerationResult[];
  textBlocks: TextBlock[];
  translations: TranslationMap;
  translationChecks: TranslationCheckMap;
  originalImageUrl: string;
  onBack: () => void;
  config: ServiceConfig;
}) {
  const [selectedResult, setSelectedResult] = useState<GenerationResult | null>(
    results.find((r) => r.status === "success") || null
  );
  const [downloading, setDownloading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; title: string } | null>(null);

  const selectedBlocks = textBlocks.filter((b) => b.selected);

  // Generate filename based on config
  const generateFileName = (languageCode: string, languageName: string): string => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const activityName = config.activityName || "activity";
    
    if (config.fileNameRule === "custom" && config.customFileNamePattern) {
      return config.customFileNamePattern
        .replace("{name}", activityName)
        .replace("{lang}", languageCode)
        .replace("{date}", dateStr)
        + ".png";
    }
    
    // Default: activityName_poster_lang_date.png
    return `${activityName}_poster_${languageCode}_${dateStr}.png`;
  };

  const downloadFile = async (url: string, filename: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(blobUrl);
  };

  const handleBatchDownload = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      const successResults = results.filter((r) => r.status === "success");
      for (const result of successResults) {
        if (result.imageUrl) {
          const response = await fetch(result.imageUrl);
          const blob = await response.blob();
          const fileName = generateFileName(result.language, result.languageName);
          zip.file(fileName, blob);
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = "visual_extension_batch.zip";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("批量下载失败，请重试");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {fullscreenImage && (
        <FullscreenModal
          imageUrl={fullscreenImage.url}
          title={fullscreenImage.title}
          onClose={() => setFullscreenImage(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">生成结果预览</h3>
        <div className="flex gap-2">
          <button
            onClick={handleBatchDownload}
            disabled={downloading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {downloading ? "打包中..." : "批量下载 ZIP"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Result Cards - Larger */}
        <div className="lg:w-3/5 space-y-3">
          <div className="grid grid-cols-1 gap-4">
            {results
              .filter((r) => r.status === "success")
              .map((result) => {
                const fileName = generateFileName(result.language, result.languageName);
                return (
                <div
                  key={result.language}
                  onClick={() => setSelectedResult(result)}
                  className={`cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                    selectedResult?.language === result.language
                      ? "border-emerald-500 shadow-md"
                      : "border-zinc-200 hover:border-emerald-200"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 sm:px-4 sm:py-2.5">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-zinc-700 truncate">
                        {result.languageName}
                      </span>
                      <span className="text-[10px] sm:text-xs text-zinc-400 truncate font-mono">
                        {fileName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (result.imageUrl) {
                            setFullscreenImage({ url: result.imageUrl, title: fileName });
                          }
                        }}
                        className="rounded-lg border border-zinc-200 px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-50 sm:px-2"
                        title="全屏查看"
                      >
                        <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (result.imageUrl) {
                            downloadFile(result.imageUrl, fileName);
                          }
                        }}
                        className="rounded-lg border border-zinc-200 px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-50 sm:px-2"
                        title="下载"
                      >
                        <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="h-64 sm:h-72 bg-zinc-50" onClick={() => {
                    if (result.imageUrl) {
                      setFullscreenImage({ url: result.imageUrl, title: fileName });
                    }
                  }}>
                    {result.imageUrl && (
                      <img
                        src={result.imageUrl}
                        alt={result.languageName}
                        className="h-full w-full object-contain cursor-zoom-in"
                      />
                    )}
                  </div>
                </div>
              );
              })}
          </div>
        </div>

        {/* Comparison Panel */}
        <div className="lg:w-2/5 space-y-4">
          {/* Original Image */}
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-3 py-2">
              <span className="text-xs font-semibold text-zinc-500">
                原图
              </span>
              <button
                onClick={() => setFullscreenImage({ url: originalImageUrl, title: "原图" })}
                className="rounded-lg border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-50"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </button>
            </div>
            <div className="h-56 bg-zinc-50">
              <img
                src={originalImageUrl}
                alt="原图"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          {/* Translation Comparison Table */}
          {selectedResult && (
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <div className="border-b border-zinc-100 bg-zinc-50 px-3 py-2">
                <span className="text-xs font-semibold text-zinc-500">
                  原文 vs {selectedResult.languageName} 译文
                </span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-zinc-50">
                    <tr>
                      <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-zinc-400">
                        原文
                      </th>
                      <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-zinc-400">
                        译文
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {selectedBlocks.map((block) => {
                      const blockId = String(block.id);
                      const isChecked = translationChecks[selectedResult.language]?.[blockId] !== false;
                      return (
                        <tr key={block.id} className={`hover:bg-zinc-50/50 ${!isChecked ? "opacity-40" : ""}`}>
                          <td className="px-3 py-1.5 text-xs text-zinc-600">
                            {block.text}
                          </td>
                          <td className="px-3 py-1.5 text-xs font-medium text-emerald-700">
                            {isChecked
                              ? (translations[selectedResult.language]?.[blockId] || "-")
                              : "(跳过)"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-xl border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          上一步
        </button>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-md hover:bg-emerald-700"
        >
          开始新任务
        </button>
      </div>
    </div>
  );
}

// ==================== Main Page ====================
const STEPS = [
  { key: "upload" as Step, label: "上传图片", num: 1 },
  { key: "ocr" as Step, label: "识别文字", num: 2 },
  { key: "language" as Step, label: "选择语言", num: 3 },
  { key: "translate" as Step, label: "翻译校对", num: 4 },
  { key: "generate" as Step, label: "AI生成", num: 5 },
  { key: "result" as Step, label: "预览下载", num: 6 },
];

export default function HomePage() {
  const [step, setStep] = useState<Step>("upload");
  const [configOpen, setConfigOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);

  const [config, setConfig] = useState<ServiceConfig>({
    ocrModel: "gemini-2.5-flash",
    translateModel: "gemini-2.5-flash",
    imageModel: "gemini-3-pro-image-preview",
    fileNameRule: "default",
  });

  // Batch mode state
  const [batchMode, setBatchMode] = useState(false);
  const [batchImages, setBatchImages] = useState<{ url: string; filename: string }[]>([]);
  const [batchResults, setBatchResults] = useState<{
    imageUrl: string;
    filename: string;
    status: "pending" | "processing" | "success" | "error";
    resultUrl?: string;
    error?: string;
  }[]>([]);
  const [batchLanguage, setBatchLanguage] = useState("");

  // Data state
  const [imageUrl, setImageUrl] = useState("");
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [translations, setTranslations] = useState<TranslationMap>({});
  const [translationChecks, setTranslationChecks] = useState<TranslationCheckMap>({});
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [loading, setLoading] = useState(false);

  // 辅助函数：将 File 转换为 Base64 Data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Step 1: Upload (single mode) - 直接传 Base64，不经过服务器存储
  const handleUploaded = useCallback(async (file: File) => {
    setImageUrl("");
    setBatchImages([]);
    setBatchResults([]);
    setBatchLanguage("");
    setLoading(true);
    
    // 将图片转为 Base64
    const base64Data = await fileToBase64(file);
    
    // 直接传给 OCR API（Base64 格式）
    fetch("/api/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: base64Data,
        model: config.ocrModel,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.textBlocks) {
          setTextBlocks(
            data.textBlocks.map((b: TextBlock) => ({
              ...b,
              selected: !b.isLogo,
            }))
          );
          // 保存 Base64 数据用于后续显示
          setImageUrl(base64Data);
          setStep("ocr");
        } else {
          alert("OCR识别失败: " + (data.error || "未知错误"));
        }
      })
      .catch(() => alert("OCR识别失败，请重试"))
      .finally(() => setLoading(false));
  }, [config.ocrModel]);

  // Step 1: Upload (batch mode) - 批量处理，直接传 Base64
  const handleBatchUploaded = useCallback(async (files: File[]) => {
    setImageUrl("");
    setBatchImages([]);
    setBatchResults([]);
    setBatchLanguage("");
    setLoading(true);
    
    // 将所有文件转为 Base64
    const base64Images: { url: string; filename: string }[] = [];
    for (const file of files) {
      try {
        const base64Data = await fileToBase64(file);
        base64Images.push({ url: base64Data, filename: file.name });
      } catch (err) {
        console.error(`转换失败 ${file.name}:`, err);
      }
    }
    
    if (base64Images.length === 0) {
      setLoading(false);
      return;
    }
    
    setBatchImages(base64Images);
    setBatchResults(base64Images.map(img => ({ 
      imageUrl: img.url, 
      filename: img.filename,
      status: "pending" as const,
      resultUrl: undefined,
      error: undefined
    })));
    setLoading(false);
    setStep("language");
  }, [setImageUrl, setBatchImages, setBatchResults, setBatchLanguage, setLoading, setStep]);

  // Step 2: OCR toggle
  const toggleBlock = useCallback((id: number) => {
    setTextBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, selected: !b.selected } : b))
    );
  }, []);

  const toggleAllBlocks = useCallback((selected: boolean) => {
    setTextBlocks((prev) => prev.map((b) => ({ ...b, selected })));
  }, []);

  // Step 3: Language selection
  const toggleLanguage = useCallback((code: string) => {
    if (batchMode) {
      // Batch mode: only one language allowed
      setBatchLanguage(prev => prev === code ? "" : code);
    } else {
      // Single mode: multiple languages allowed
      setSelectedLanguages((prev) =>
        prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
      );
    }
  }, [batchMode]);

  const toggleAllLanguages = useCallback(() => {
    if (batchMode) return; // Batch mode doesn't support select all
    setSelectedLanguages((prev) =>
      prev.length === LANGUAGES.length
        ? []
        : LANGUAGES.map((l) => l.code)
    );
  }, []);

  // Step 4: Translation
  const handleTranslationChange = useCallback(
    (lang: string, blockId: string, value: string) => {
      setTranslations((prev) => ({
        ...prev,
        [lang]: { ...prev[lang], [blockId]: value },
      }));
    },
    []
  );

  const handleTranslationCheckChange = useCallback(
    (lang: string, blockId: string, checked: boolean) => {
      setTranslationChecks((prev) => ({
        ...prev,
        [lang]: { ...prev[lang], [blockId]: checked },
      }));
    },
    []
  );

  const doTranslate = useCallback(async () => {
    setLoading(true);
    try {
      const blocksToTranslate = textBlocks.filter((b) => b.selected);
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textBlocks: blocksToTranslate,
          targetLanguages: selectedLanguages,
          model: config.translateModel,
        }),
      });
      const data = await res.json();
      if (data.success && data.translations) {
        // Merge new translations into existing (preserve user edits)
        setTranslations((prev) => {
          const merged: TranslationMap = { ...prev };
          for (const [lang, blocks] of Object.entries(data.translations)) {
            merged[lang] = {
              ...(prev[lang] || {}),
              ...(blocks as Record<string, string>),
            };
          }
          return merged;
        });
        // Initialize all checks as true (default checked)
        const initialChecks: TranslationCheckMap = {};
        for (const lang of selectedLanguages) {
          initialChecks[lang] = {};
          for (const block of blocksToTranslate) {
            initialChecks[lang][String(block.id)] = true;
          }
        }
        setTranslationChecks(initialChecks);
        setStep("translate");
      } else {
        alert("翻译失败: " + (data.error || "未知错误"));
      }
    } catch {
      alert("翻译失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [textBlocks, selectedLanguages, config.translateModel]);

  // Batch mode: Process all images with OCR -> Translate -> Generate
  const processBatch = useCallback(async () => {
    if (!batchLanguage || batchImages.length === 0) {
      alert("请选择目标语言并确保有图片");
      return;
    }

    setLoading(true);
    const langInfo = LANGUAGES.find((l) => l.code === batchLanguage);
    // Create a copy of current results for processing
    type BatchItem = { imageUrl: string; filename: string; status: "pending" | "processing" | "success" | "error"; resultUrl?: string; error?: string };
    const currentResults: BatchItem[] = [...batchResults] as BatchItem[];
    // Ensure all images are in processing state
    const updatedResults: BatchItem[] = currentResults.map(r => ({ ...r, status: "processing" as const }));
    setBatchResults([...updatedResults]);

    // Process each image sequentially
    for (let i = 0; i < batchImages.length; i++) {
      const img = batchImages[i];
      
      // Make sure the result exists
      if (!updatedResults[i]) {
        updatedResults[i] = { imageUrl: img.url, filename: img.filename, status: "processing" as const, resultUrl: undefined, error: undefined };
      }
      updatedResults[i].status = "processing";
      setBatchResults([...updatedResults]);

      try {
        // 1. OCR
        const ocrRes = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: img.url,
            model: config.ocrModel,
          }),
        });
        const ocrData = await ocrRes.json();
        
        if (!ocrData.success || !ocrData.textBlocks) {
          updatedResults[i] = { imageUrl: img.url, filename: img.filename, status: "error" as const, error: "OCR失败: " + (ocrData.error || "未知错误") };
          setBatchResults([...updatedResults]);
          continue;
        }

        // Filter non-Logo blocks for translation
        const blocksToTranslate = ocrData.textBlocks.filter((b: TextBlock) => !b.isLogo);
        
        if (blocksToTranslate.length === 0) {
          // No text to translate, just copy original image
          updatedResults[i] = { imageUrl: img.url, filename: img.filename, status: "success" as const, resultUrl: img.url };
          setBatchResults([...updatedResults]);
          continue;
        }

        // 2. Translate
        const translateRes = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          textBlocks: blocksToTranslate.map((b: TextBlock) => ({
              id: b.id,
              text: b.text,
              bbox: b.bbox,
              isLogo: b.isLogo,
            })),
            targetLanguages: [batchLanguage],
            model: config.translateModel,
          }),
        });
        const translateData = await translateRes.json();
        
        if (!translateData.success || !translateData.translations) {
          updatedResults[i] = { imageUrl: img.url, filename: img.filename, status: "error" as const, error: "翻译失败: " + (translateData.error || "未知错误") };
          setBatchResults([...updatedResults]);
          continue;
        }

        // 3. Generate
        const translationsForLang = translateData.translations[batchLanguage] || {};
        const sourceTexts: Record<string, string> = {};
        const targetTexts: Record<string, string> = {};
        blocksToTranslate.forEach((b: TextBlock) => {
          const blockId = String(b.id);
          sourceTexts[blockId] = b.text;
          targetTexts[blockId] = translationsForLang[blockId] || b.text;
        });

        const generateRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: img.url,
            sourceTexts,
            targetTexts,
            language: langInfo?.name || batchLanguage,
            model: config.imageModel,
          }),
        });
        const generateData = await generateRes.json();

        if (generateData.success && generateData.imageUrl) {
          updatedResults[i] = { imageUrl: img.url, filename: img.filename, status: "success" as const, resultUrl: generateData.imageUrl };
        } else {
          updatedResults[i] = { imageUrl: img.url, filename: img.filename, status: "error" as const, error: "生成失败: " + (generateData.error || "未知错误") };
        }
      } catch (err) {
        updatedResults[i] = { imageUrl: img.url, filename: img.filename, status: "error" as const, error: "处理失败" };
      }
      setBatchResults([...updatedResults]);
    }

    setLoading(false);
  }, [batchLanguage, batchImages, batchResults, config.ocrModel, config.translateModel, config.imageModel]);

  // Step 5: Generate images
  const generateForLanguage = useCallback(
    async (langCode: string) => {
      const langInfo = LANGUAGES.find((l) => l.code === langCode);
      setResults((prev) =>
        prev.map((r) =>
          r.language === langCode
            ? { ...r, status: "generating" as const }
            : r
        )
      );

      try {
        const selectedBlocks = textBlocks.filter((b) => b.selected);
        const sourceTexts: Record<string, string> = {};
        const targetTexts: Record<string, string> = {};
        selectedBlocks.forEach((b) => {
          const blockId = String(b.id);
          // Only include checked translations
          const isChecked = translationChecks[langCode]?.[blockId] !== false;
          sourceTexts[blockId] = b.text;
          targetTexts[blockId] = isChecked
            ? (translations[langCode]?.[blockId] || b.text)
            : b.text; // unchecked = keep original
        });

        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            sourceTexts,
            targetTexts,
            language: langInfo?.name || langCode,
            model: config.imageModel,
          }),
        });
        const data = await res.json();

        if (data.success && data.imageUrl) {
          setResults((prev) =>
            prev.map((r) =>
              r.language === langCode
                ? {
                    ...r,
                    status: "success" as const,
                    imageUrl: data.imageUrl,
                  }
                : r
            )
          );
        } else {
          setResults((prev) =>
            prev.map((r) =>
              r.language === langCode
                ? {
                    ...r,
                    status: "error" as const,
                    error: data.error || "生成失败",
                  }
                : r
            )
          );
        }
      } catch {
        setResults((prev) =>
          prev.map((r) =>
            r.language === langCode
              ? { ...r, status: "error" as const, error: "网络错误" }
              : r
          )
        );
      }
    },
    [textBlocks, translations, translationChecks, imageUrl, config.imageModel]
  );

  // Auto-advance to result step when all generations complete (only once per generation batch)
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);
  React.useEffect(() => {
    if (step === "generate") {
      const allDone = results.length > 0 && results.every(
        (r) => r.status === "success" || r.status === "error"
      );
      if (allDone && !hasAutoAdvanced) {
        setHasAutoAdvanced(true);
        setStep("result");
      }
    }
  }, [results, step, hasAutoAdvanced]);

  // Reset auto-advance flag when a new generation starts
  const startGeneration = useCallback(async () => {
    setHasAutoAdvanced(false);
    const initialResults: GenerationResult[] = selectedLanguages.map((code) => {
      const lang = LANGUAGES.find((l) => l.code === code);
      return {
        language: code,
        languageName: lang?.name || code,
        imageUrl: "",
        status: "pending" as const,
      };
    });
    setResults(initialResults);
    setStep("generate");

    // For third-party API models, generate sequentially to avoid rate limits
    const selectedImageModel = IMAGE_MODELS.find((m) => m.id === config.imageModel);
    const isThirdParty = selectedImageModel?.requiresApiKey;
    if (isThirdParty) {
      for (const code of selectedLanguages) {
        await generateForLanguage(code);
        // Delay between requests to avoid rate limiting
        if (selectedLanguages.indexOf(code) < selectedLanguages.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    } else {
      // Built-in models: generate in parallel
      await Promise.allSettled(
        selectedLanguages.map((code) => generateForLanguage(code))
      );
    }
  }, [selectedLanguages, generateForLanguage, config.imageModel]);

  const handleRetry = useCallback(
    (lang: string) => {
      generateForLanguage(lang);
    },
    [generateForLanguage]
  );

  // Navigation helpers
  const goToGenerate = () => {
    startGeneration();
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 via-white to-emerald-50/30">
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
              <svg className="h-4 w-4 text-white sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-800 sm:text-base">
                PayerMax视觉多语言延展工具
              </h1>
              <p className="hidden text-[11px] text-zinc-400 sm:block">
                AI驱动的营销图片多语言延展
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setConfigOpen(true)}
              className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 sm:px-3 sm:py-1.5"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">配置</span>
            </button>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-4 sm:px-6 sm:py-6">
        {step === "upload" && (
          <div className="mx-auto max-w-2xl pt-4 sm:pt-8">
            <PlatformAdvantage className="mb-6" />
            <div className="mb-4 text-center sm:mb-6">
              <h2 className="mb-2 text-lg font-bold text-zinc-800 sm:text-xl">
                上传营销图片
              </h2>
              <p className="text-xs text-zinc-400 sm:text-sm">
                支持拖拽上传，AI将自动识别图片中的文字并标注Logo
              </p>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-8 sm:p-12">
                <svg className="mb-3 h-8 w-8 animate-spin text-emerald-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm font-medium text-emerald-600">
                  正在进行AI文字识别...
                </p>
              </div>
            ) : (
              <UploadStep 
                onUploaded={handleUploaded} 
                onBatchUploaded={handleBatchUploaded}
                batchMode={batchMode}
                onBatchModeChange={setBatchMode}
              />
            )}
          </div>
        )}

        {step === "ocr" && (
          <OCRStep
            textBlocks={textBlocks}
            imageUrl={imageUrl}
            onToggle={toggleBlock}
            onToggleAll={toggleAllBlocks}
            onConfirm={() => setStep("language")}
            onBack={() => setStep("upload")}
            loading={loading}
          />
        )}

        {step === "language" && (
          <LanguageStep
            selectedLanguages={selectedLanguages}
            onToggle={toggleLanguage}
            onToggleAll={toggleAllLanguages}
            onConfirm={() => {
              if (batchMode) {
                processBatch();
              } else {
                doTranslate();
              }
            }}
            onBack={() => setStep(batchMode ? "upload" : "ocr")}
            batchMode={batchMode}
            batchLanguage={batchLanguage}
            batchImages={batchImages}
            batchResults={batchResults}
            loading={loading}
          />
        )}

        {step === "translate" && (
          <TranslateStep
            textBlocks={textBlocks}
            translations={translations}
            translationChecks={translationChecks}
            selectedLanguages={selectedLanguages}
            onTranslationChange={handleTranslationChange}
            onTranslationCheckChange={handleTranslationCheckChange}
            onConfirm={goToGenerate}
            onBack={() => setStep("language")}
            loading={false}
          />
        )}

        {step === "generate" && (
          <GenerateStep
            results={results}
            onRetry={handleRetry}
            onBack={() => setStep("translate")}
            onViewResult={() => setStep("result")}
          />
        )}

        {step === "result" && (
          <ResultStep
            results={results}
            textBlocks={textBlocks}
            translations={translations}
            translationChecks={translationChecks}
            originalImageUrl={imageUrl}
            onBack={() => setStep("generate")}
            config={config}
          />
        )}
      </main>

      {/* Config Dialog */}
      <ConfigPanel
        config={config}
        onChange={setConfig}
        open={configOpen}
        onClose={() => setConfigOpen(false)}
      />

      <Footer onVersionClick={() => setVersionOpen(true)} />
      <VersionModal open={versionOpen} onClose={() => setVersionOpen(false)} />
    </div>
  );
}
