import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../../../lib/auth";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    let userId: string;
    try {
      const auth = await requireAuth(req);
      userId = auth.userId;
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } catch (err) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    // Validate required fields
    const required = ["title", "description", "price", "location", "propertyType", "bedrooms", "bathrooms", "squareFootage", "attestation", "images"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }
    // Enforce image limits (example: max 10 images for premium, 3 for basic)
    const plan = body.subscriptionPlan || "basic";
    const maxImages = plan === "premium" ? 10 : 3;
    if (body.images.length > maxImages) {
      return NextResponse.json({ error: `Image limit exceeded (${maxImages} allowed)` }, { status: 400 });
    }
    // Upload images to Supabase Storage
    const imageUrls: string[] = [];
    for (const file of body.images) {
      try {
        const { data, error } = await supabase.storage.from("property-images").upload(`${userId}/${Date.now()}-${file.name}`, file.data, {
          contentType: file.type,
          upsert: false,
        });
        if (error || !data?.path) throw error;
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(data.path);
        if (!urlData?.publicUrl) throw new Error("Failed to get public URL");
        imageUrls.push(urlData.publicUrl);
      } catch (err) {
        return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
      }
    }
    // Insert property into DB
    const { error: dbError } = await supabase.from("properties").insert({
      ...body,
      images: imageUrls,
      user_id: userId,
      status: "pending",
    });
    if (dbError) {
      return NextResponse.json({ error: dbError.message || "Database error" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
