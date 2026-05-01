"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit-log";
import { assetFormSchema, parseFormData, zodErrorMessage } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function generateAssetTag(branchCode: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `FP-${branchCode}-${timestamp}${random}`;
}

export async function createAsset(formData: FormData) {
  const supabase = await getSupabaseServerClient();

  try {
    const values = parseFormData(assetFormSchema.omit({ status: true }), formData);

    // Get branch code for asset tag
    const { data: branch, error: branchError } = await supabase
      .from("branches")
      .select("code")
      .eq("id", values.branch_id)
      .single();

    if (branchError || !branch) {
      return { error: "Invalid branch selected" };
    }

    const assetTag = generateAssetTag(branch.code || "XX");

    const insertData = {
      asset_tag: assetTag,
      ...values,
      status: "active",
    };

    const { data: createdAsset, error } = await supabase
      .from("assets")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error("Asset creation error:", error);
      return { error: error.message || "Failed to create asset" };
    }

    if (createdAsset?.id) {
      await writeAuditLog(supabase, {
        entityType: "asset",
        entityId: createdAsset.id,
        action: "create",
        newValues: insertData,
      });
    }

    revalidatePath("/assets", "layout");
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("Unexpected error creating asset:", err);
    return { error: zodErrorMessage(err) };
  }

  redirect("/assets");
}

export async function updateAsset(id: string, formData: FormData) {
  const supabase = await getSupabaseServerClient();

  try {
    const values = parseFormData(assetFormSchema, formData);
    const updateData = {
      ...values,
      updated_at: new Date().toISOString(),
    };

    const { data: oldAsset } = await supabase.from("assets").select("*").eq("id", id).single();

    const { error } = await supabase
      .from("assets")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Asset update error:", error);
      return { error: error.message || "Failed to update asset" };
    }

    await writeAuditLog(supabase, {
      entityType: "asset",
      entityId: id,
      action: "update",
      oldValues: oldAsset || null,
      newValues: updateData,
    });

    revalidatePath("/assets", "layout");
    revalidatePath(`/assets/${id}`, "layout");
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("Unexpected error updating asset:", err);
    return { error: zodErrorMessage(err) };
  }

  redirect("/assets");
}

export async function deleteAsset(id: string) {
  const supabase = await getSupabaseServerClient();

  const { data: oldAsset } = await supabase.from("assets").select("*").eq("id", id).single();
  const { error } = await supabase.from("assets").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await writeAuditLog(supabase, {
    entityType: "asset",
    entityId: id,
    action: "delete",
    oldValues: oldAsset || null,
  });

  revalidatePath("/assets", "layout");
  revalidatePath("/", "layout");
}
