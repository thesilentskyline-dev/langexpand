"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface PlatformAdvantageProps {
  className?: string;
}

export function PlatformAdvantage({ className = "" }: PlatformAdvantageProps) {
  const [expanded, setExpanded] = useState(false);

  const advantages = [
    {
      dimension: "单张翻译",
      human: { status: "ok", note: "可做，但操作繁琐" },
      general: { status: "ok", note: "可做，但不稳定" },
      platform: { status: "check", note: "稳定流程" },
    },
    {
      dimension: "批量处理",
      human: { status: "ok", note: "可做，但操作繁琐" },
      general: { status: "fail", note: "每次都要重新对话" },
      platform: { status: "check", note: "核心能力" },
    },
    {
      dimension: "多语言一次生成",
      human: { status: "ok", note: "协作麻烦，容易出错" },
      general: { status: "fail", note: "需多次调用" },
      platform: { status: "check", note: "一次选、批量出" },
    },
    {
      dimension: "选择性翻译",
      human: { status: "ok", note: "可做" },
      general: { status: "fail", note: "全图无差别识别" },
      platform: { status: "check", note: "业务可控，自动识别+手动勾选" },
    },
    {
      dimension: "AI自动翻译",
      human: { status: "fail", note: "需手动操作" },
      general: { status: "ok", note: "通用" },
      platform: { status: "check", note: "且可配模型" },
    },
    {
      dimension: "人工校准",
      human: { status: "ok", note: "可支持" },
      general: { status: "warn", note: "事后改prompt" },
      platform: { status: "check", note: "修改 + 保留" },
    },
    {
      dimension: "下载按规则命名",
      human: { status: "ok", note: "可做，但操作繁琐" },
      general: { status: "fail", note: "手动" },
      platform: { status: "check", note: "自动 + 规则可配" },
    },
    {
      dimension: "对接OMC/配置系统",
      human: { status: "fail", note: "无" },
      general: { status: "fail", note: "无" },
      platform: { status: "check", note: "二阶段输出JSON" },
    },
  ];

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "check":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "ok":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`rounded-xl border border-zinc-200 bg-white shadow-sm ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-zinc-50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-800">平台优势</h3>
            <p className="text-sm text-zinc-500">对比人工与通用Agent的效率提升</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-zinc-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-zinc-400" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-zinc-100">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-500">
            <div>能力维度</div>
            <div className="text-center">人工</div>
            <div className="text-center">通用Agent</div>
            <div className="text-center bg-emerald-50 text-emerald-700 rounded px-2 py-1">
              运营视觉平台
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-zinc-50">
            {advantages.map((item, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 px-4 py-2.5 text-xs">
                <div className="font-medium text-zinc-700">{item.dimension}</div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <StatusIcon status={item.human.status} />
                  <span className="truncate">{item.human.note}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <StatusIcon status={item.general.status} />
                  <span className="truncate">{item.general.note}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50/50 rounded px-1 py-0.5">
                  <StatusIcon status={item.platform.status} />
                  <span className="truncate text-emerald-700 font-medium">{item.platform.note}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 border-t border-zinc-100 bg-zinc-50 px-4 py-2 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              <span>支持</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              <span>不支持</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span>有局限</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
