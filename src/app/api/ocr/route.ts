import { NextRequest, NextResponse } from "next/server";

// ==================== Gemini OCR ====================
async function callGeminiOCR(
  imageUrl: string,
  apiKey?: string
): Promise<{ success: boolean; textBlocks?: any[]; error?: string }> {
  const key = apiKey || process.env.GOOGLE_API_KEY || "";
  const baseUrl = process.env.GOOGLE_API_PROXY || "https://generativelanguage.googleapis.com";

  // Convert base64 image to inline data
  let inlineData: { mimeType: string; data: string } | null = null;

  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      inlineData = { mimeType: match[1], data: match[2] };
    }
  }

  if (!inlineData) {
    return { success: false, error: "OCR 识别失败：图片格式不支持，请上传 PNG/JPG/WebP 格式" };
  }

  const model = "gemini-2.5-flash";
  const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${key}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: `You are an OCR expert. Extract all visible text from this image.

For each text element, provide:
1. The exact text content
2. Whether it's a logo/brand (isLogo: true/false)
3. A short description of the text's role (e.g. "headline", "subtitle", "button text", "product name", "price", "logo/brand name", "body text")
4. The bounding box as x,y,width,height percentages (0-100) relative to the image dimensions

IMPORTANT: Return ONLY valid JSON array. No markdown, no code blocks, no explanation.
Format:
[
  {
    "text": "exact text",
    "isLogo": false,
    "description": "role description",
    "bbox": { "x": 0, "y": 0, "width": 100, "height": 20 }
  }
]` },
          { inlineData },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
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
      return { success: false, error: `OCR 识别失败 (${res.status}): ${errText}` };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse JSON from response
    let jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      jsonMatch = text.match(/\{[\s\S]*\}/);
    }

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const blocks = Array.isArray(parsed) ? parsed : [parsed];

        const textBlocks = blocks
          .filter((b: any) => b.text && b.text.trim())
          .map((b: any, idx: number) => ({
            id: idx + 1,
            text: b.text.trim(),
            isLogo: !!b.isLogo,
            description: b.description || "",
            selected: !b.isLogo,
            bbox: b.bbox || { x: 0, y: 0, width: 100, height: 10 },
          }));

        return { success: true, textBlocks };
      } catch {
        // JSON parse failed, fall through to raw text
      }
    }

    // Fallback: treat entire text as one block
    return {
      success: true,
      textBlocks: [
        {
          id: 1,
          text: text.trim(),
          isLogo: false,
          description: "OCR 识别文字",
          selected: true,
          bbox: { x: 0, y: 0, width: 100, height: 100 },
        },
      ],
    };
  } catch (err: any) {
    return { success: false, error: `OCR 识别失败：${err.message || "网络错误"}` };
  }
}

// ==================== POST Handler ====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "缺少图片 URL" }, { status: 400 });
    }

    const result = await callGeminiOCR(imageUrl);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `OCR 识别失败：${err.message || "服务器错误"}` },
      { status: 500 }
    );
  }
}
