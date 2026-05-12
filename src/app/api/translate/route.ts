import { NextRequest, NextResponse } from "next/server";

interface TextBlockInput {
  id: number;
  text: string;
}

// ==================== Gemini 翻译 ====================
async function callGeminiTranslate(
  textBlocks: TextBlockInput[],
  targetLanguages: string[],
  apiKey?: string
): Promise<{ success: boolean; translations?: Record<string, Record<string, string>>; error?: string }> {
  const key = apiKey || process.env.GOOGLE_API_KEY || "";
  const baseUrl = process.env.GOOGLE_API_PROXY || "https://generativelanguage.googleapis.com";

  const model = "gemini-2.5-flash";
  const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${key}`;

  const sourceJson = JSON.stringify(textBlocks);
  const langList = targetLanguages.join(", ");

  const prompt = `You are a professional translator. Translate the following text blocks into these languages: ${langList}.

Input text blocks (JSON array):
${sourceJson}

For each language, translate each block's "text" field while preserving the "id".

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanation.
Format:
{
  "ko": { "1": "번역된 텍스트", "2": "..." },
  "ja": { "1": "翻訳されたテキスト", "2": "..." },
  ...
}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown error");
      return { success: false, error: `翻译失败 (${res.status}): ${errText}` };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return { success: true, translations: parsed };
      } catch {
        // JSON parse failed
      }
    }

    return { success: false, error: "翻译失败：无法解析 AI 返回结果" };
  } catch (err: any) {
    return { success: false, error: `翻译失败：${err.message || "网络错误"}` };
  }
}

// ==================== POST Handler ====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { textBlocks, targetLanguages } = body;

    if (!textBlocks || textBlocks.length === 0) {
      return NextResponse.json({ success: false, error: "缺少待翻译文本" }, { status: 400 });
    }
    if (!targetLanguages || targetLanguages.length === 0) {
      return NextResponse.json({ success: false, error: "缺少目标语言" }, { status: 400 });
    }

    const result = await callGeminiTranslate(textBlocks, targetLanguages);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `翻译失败：${err.message || "服务器错误"}` },
      { status: 500 }
    );
  }
}
