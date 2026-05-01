"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit-log";
import { branchFormSchema, parseFormData, zodErrorMessage } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createBranch(formData: FormData) {
  const supabase = await getSupabaseServerClient();

  try {
    const values = branchFormSchema.parse({
      ...Object.fromEntries(formData.entries()),
      is_headquarters: formData.get("is_headquarters") === "true",
      status: "active",
    });
    // Check if branch code already exists
    const { count: existingCount } = await supabase
      .from("branches")
      .select("*", { count: "exact", head: true })
      .eq("code", values.code);

    if (existingCount && existingCount > 0) {
      return { error: "A branch with this code already exists" };
    }

    const insertData = {
      ...values,
    };

    const { data: createdBranch, error } = await supabase
      .from("branches")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error("Branch creation error:", error);
      return { error: error.message || "Failed to create branch" };
    }

    if (createdBranch?.id) {
      await writeAuditLog(supabase, {
        entityType: "branch",
        entityId: createdBranch.id,
        action: "create",
        newValues: insertData,
      });
    }

    revalidatePath("/branches", "layout");
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("Unexpected error creating branch:", err);
    return { error: zodErrorMessage(err) };
  }

  redirect("/branches");
}

export async function updateBranch(id: string, formData: FormData) {
  const supabase = await getSupabaseServerClient();

  try {
    const values = branchFormSchema.parse({
      ...Object.fromEntries(formData.entries()),
      is_headquarters: false,
      status: formData.get("status") === "true" ? "active" : "inactive",
    });
    // Check if code already exists on another branch
    const { data: existingBranch } = await supabase
      .from("branches")
      .select("id")
      .eq("code", values.code)
      .single();

    if (existingBranch && existingBranch.id !== id) {
      return { error: "A branch with this code already exists" };
    }

    const { data: oldBranch } = await supabase.from("branches").select("*").eq("id", id).single();

    const updateData = {
      ...values,
      updated_at: new Date().toISOString(),
    };
    delete (updateData as Partial<typeof updateData>).is_headquarters;

    const { error } = await supabase
      .from("branches")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Branch update error:", error);
      return { error: error.message || "Failed to update branch" };
    }

    await writeAuditLog(supabase, {
      entityType: "branch",
      entityId: id,
      action: "update",
      oldValues: oldBranch || null,
      newValues: updateData,
    });

    revalidatePath("/branches", "layout");
    revalidatePath(`/branches/${id}`, "layout");
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("Unexpected error updating branch:", err);
    return { error: zodErrorMessage(err) };
  }

  redirect("/branches");
}

export async function deleteBranch(id: string) {
  try {
    const supabase = await getSupabaseServerClient();

    // Get the branch to check if it's headquarters
    const { data: branch, error: branchError } = await supabase
      .from("branches")
      .select("name, is_headquarters")
      .eq("id", id)
      .single();

    if (branchError || !branch) {
      return { error: "Branch not found" };
    }

    if (branch.is_headquarters) {
      return { error: "Cannot delete the headquarters branch" };
    }

    // Check if branch has assets
    const { count } = await supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("branch_id", id);

    if (count && count > 0) {
      return {
        error: `Cannot delete branch with ${count} existing asset(s). Transfer or dispose assets first.`,
      };
    }

    const { error } = await supabase.from("branches").delete().eq("id", id);

    if (error) {
      console.error("Branch deletion error:", error);
      return { error: error.message || "Failed to delete branch" };
    }

    await writeAuditLog(supabase, {
      entityType: "branch",
      entityId: id,
      action: "delete",
      oldValues: branch,
    });

    revalidatePath("/branches", "layout");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("Unexpected error deleting branch:", err);
    return {
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
