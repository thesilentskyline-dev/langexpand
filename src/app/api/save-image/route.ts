import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, filename } = body;

    if (!imageData) {
      return NextResponse.json({ success: false, error: "缺少图片数据" }, { status: 400 });
    }

    // Handle base64 image data
    let buffer: Buffer;
    let ext = "png";

    if (imageData.startsWith("data:")) {
      const match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (match) {
        ext = match[1];
        buffer = Buffer.from(match[2], "base64");
      } else {
        return NextResponse.json({ success: false, error: "图片格式不支持" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ success: false, error: "图片格式不支持" }, { status: 400 });
    }

    // Save to /tmp/generated (Vercel serverless writable directory)
    const outputDir = "/tmp/generated";
    await mkdir(outputDir, { recursive: true });

    const timestamp = Date.now();
    const safeName = filename
      ? filename.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, "_").slice(0, 50)
      : `generated_${timestamp}`;
    const outputFilename = `${safeName}.${ext}`;
    const filepath = path.join(outputDir, outputFilename);

    await writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      url: `/api/generated/${outputFilename}`,
      filename: outputFilename,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `保存图片失败：${err.message || "服务器错误"}` },
      { status: 500 }
    );
  }
}
