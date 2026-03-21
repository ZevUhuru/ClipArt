import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

async function verifyAdmin() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin === true;
}

function getR2(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

const BUCKET = process.env.R2_BUCKET_NAME || "clip-art-images";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://images.clip.art";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("generations")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ image: data });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const admin = createSupabaseAdmin();

  const { data: existing } = await admin
    .from("generations")
    .select("image_url, category")
    .eq("id", params.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.slug !== undefined) updates.slug = body.slug;
  if (body.is_public !== undefined) updates.is_public = body.is_public;

  if (body.category !== undefined && body.category !== existing.category) {
    updates.category = body.category;

    try {
      const oldKey = existing.image_url.replace(`${PUBLIC_URL}/`, "");
      const filename = oldKey.split("/").pop();
      const newKey = `${body.category}/${filename}`;

      const r2 = getR2();
      await r2.send(new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${oldKey}`,
        Key: newKey,
      }));
      await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: oldKey }));

      updates.image_url = `${PUBLIC_URL}/${newKey}`;
    } catch (err) {
      console.error("R2 move failed:", err);
    }

    revalidatePath(`/${existing.category}`);
    revalidatePath(`/${body.category}`);
  }

  const { data, error } = await admin
    .from("generations")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data?.category) revalidatePath(`/${data.category}`);

  return NextResponse.json({ image: data });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();
  const { data: existing } = await admin
    .from("generations")
    .select("image_url, category")
    .eq("id", params.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const key = existing.image_url.replace(`${PUBLIC_URL}/`, "");
    const r2 = getR2();
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.error("R2 delete failed:", err);
  }

  await admin.from("generations").delete().eq("id", params.id);

  if (existing.category) revalidatePath(`/${existing.category}`);

  return NextResponse.json({ success: true });
}
