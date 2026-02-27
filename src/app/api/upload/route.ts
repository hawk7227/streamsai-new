import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 100MB." }, { status: 400 });
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "video/mp4", "video/webm", "audio/mpeg", "audio/wav", "audio/mp4"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    }

    const admin = createAdminClient();
    const ext = file.name.split(".").pop() || "bin";
    const path = `uploads/${user.id}/${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from("generations")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("[Upload] Storage error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage.from("generations").getPublicUrl(path);

    return NextResponse.json({ url: publicUrl, path, name: file.name, size: file.size, type: file.type });
  } catch (e) {
    console.error("[Upload] Error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
