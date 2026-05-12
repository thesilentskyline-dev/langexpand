"use client";

import { X } from "lucide-react";

interface VersionRecord {
  version: string;
  date: string;
  changes: string[];
}

interface FooterProps {
  onVersionClick: () => void;
}

const VERSION_RECORDS: VersionRecord[] = [
  {
    version: "v1.0.0",
    date: "2026-05-07",
    changes: [
      "初始版本发布",
      "支持图片上传和OCR文字识别",
      "支持多语言翻译",
      "支持AI图片生成",
      "支持批量下载",
      "集成SeeDream、GPT-4o、Ideogram、Flux、Gemini等多种图像生成模型",
    ],
  },
];

interface VersionModalProps {
  open: boolean;
  onClose: () => void;
}

export function VersionModal({ open, onClose }: VersionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <h2 className="font-semibold text-zinc-800">版本记录</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {VERSION_RECORDS.map((record, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  {record.version}
                </span>
                <span className="text-xs text-zinc-400">{record.date}</span>
              </div>
              <ul className="space-y-1.5 pl-4">
                {record.changes.map((change, changeIndex) => (
                  <li key={changeIndex} className="flex items-start gap-2 text-sm text-zinc-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Footer({ onVersionClick }: FooterProps) {
  return (
    <footer className="shrink-0 border-t border-zinc-100 bg-white/80 py-3">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-1 text-center text-xs text-zinc-400 sm:flex-row sm:justify-between sm:text-left">
          <div>
            <span>© 2026 Zheng Huachong. All rights reserved.</span>
          </div>
          <button
            onClick={onVersionClick}
            className="hover:text-emerald-600 transition-colors"
          >
            v1.0.0
          </button>
        </div>
      </div>
    </footer>
  );
}
