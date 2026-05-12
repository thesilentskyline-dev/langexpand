import { NextRequest, NextResponse } from "next/server";

// ==================== Gemini 图片生成 ====================
async function generateWithGemini(
  prompt: string,
  modelId: string = "gemini-3-pro-image-preview",
  imageUrl?: string,
  apiKey?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const key = apiKey || process.env.GOOGLE_API_KEY || "";
  const baseUrl = process.env.GOOGLE_API_PROXY || "https://generativelanguage.googleapis.com";

  // Strip "models/" prefix if present
  const model = modelId.replace("models/", "");
  const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${key}`;

  const parts: any[] = [{ text: prompt }];

  // If there's a reference image, include it
  if (imageUrl && imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
    }
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["Text", "Image"],
      temperature: 0.4,
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
      return { success: false, error: `图片生成失败 (${res.status}): ${errText}` };
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    if (!candidate?.content?.parts) {
      return { success: false, error: "图片生成失败：AI 无返回内容" };
    }

    // Look for inline image data in the response
    for (const part of candidate.content.parts) {
      if (part.inlineData?.mimeType?.startsWith("image/") && part.inlineData?.data) {
        const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        return { success: true, imageUrl: dataUrl };
      }
    }

    // If no image, return the text response
    const text = candidate.content.parts.map((p: any) => p.text || "").filter(Boolean).join("\n");
    return {
      success: false,
      error: `图片生成失败：未返回图片数据\n${text ? "AI 返回：" + text.slice(0, 200) : ""}`,
    };
  } catch (err: any) {
    return { success: false, error: `图片生成失败：${err.message || "网络错误"}` };
  }
}

// ==================== POST Handler ====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, sourceTexts, targetTexts, language, model } = body;

    // Build generation prompt
    let prompt = `You are a professional designer. Edit the image by replacing the original text with translated text while preserving ALL visual elements (background, colors, layout, fonts, graphics).

Original texts and their replacements:`;

    if (sourceTexts) {
      for (const [blockId, sourceText] of Object.entries(sourceTexts)) {
        const targetText = (targetTexts as Record<string, string>)?.[blockId] || sourceText;
        prompt += `\n- Replace "${sourceText}" with "${targetText}"`;
      }
    }

    if (language) {
      prompt += `\n\nThe target language is: ${language}`;
    }

    prompt += `\n\nIMPORTANT:
1. Keep the EXACT same background, colors, layout, fonts, and graphics
2. Only change the text content
3. Maintain the same font style, size, and positioning
4. The result should look exactly like the original except for the text language
5. If the text is Chinese text, replace it with the translation
6. Preserve all logos and brand marks exactly as they are
7. Return the edited image`;

    const result = await generateWithGemini(prompt, model, imageUrl);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `图片生成失败：${err.message || "服务器错误"}` },
      { status: 500 }
    );
  }
}
