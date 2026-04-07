import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name) || ".png";
  const filename = `${Date.now()}${ext}`;
  const filepath = path.join(process.cwd(), "public", "images", filename);

  await writeFile(filepath, buffer);

  return NextResponse.json({ url: `/images/${filename}` });
}
