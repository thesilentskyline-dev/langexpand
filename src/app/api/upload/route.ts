import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "缺少文件" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to /tmp/uploads (Vercel serverless writable directory)
    const uploadDir = "/tmp/uploads";
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "png";
    const filename = `upload_${timestamp}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      url: `/api/uploads/${filename}`,
      filename: filename,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `上传失败：${err.message || "服务器错误"}` },
      { status: 500 }
    );
  }
}
