import { z } from "zod"

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))

const requiredText = (field: string) =>
  z.string().trim().min(1, `${field} is required`)

const optionalMoney = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.coerce.number().min(0, "Amount cannot be negative").nullable(),
)

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Enter a valid date")
  .transform((value) => (value.length > 0 ? value : null))

export const assetStatusSchema = z.enum([
  "active",
  "in_repair",
  "disposed",
  "transferred",
  "lost",
  "stolen",
])

export const assetConditionSchema = z.enum(["excellent", "good", "fair", "poor"])

export const assetFormSchema = z.object({
  name: requiredText("Asset name"),
  description: optionalText,
  category_id: requiredText("Category"),
  branch_id: requiredText("Branch"),
  serial_number: optionalText,
  model: optionalText,
  manufacturer: optionalText,
  purchase_date: optionalDate,
  purchase_price: optionalMoney,
  current_value: optionalMoney,
  warranty_expiry: optionalDate,
  status: assetStatusSchema.default("active"),
  condition: assetConditionSchema.default("good"),
  location: optionalText,
  notes: optionalText,
})

export const branchFormSchema = z.object({
  name: requiredText("Branch name"),
  code: requiredText("Branch code")
    .max(10, "Branch code must be 10 characters or less")
    .transform((code) => code.toUpperCase()),
  address: optionalText,
  city: optionalText,
  phone: optionalText,
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.string().email().safeParse(value).success, "Enter a valid email")
    .transform((value) => (value.length > 0 ? value : null)),
  manager_name: optionalText,
  is_headquarters: z.boolean().default(false),
  status: z.enum(["active", "inactive"]).default("active"),
})

export const transferFormSchema = z.object({
  asset_id: requiredText("Asset"),
  to_branch_id: requiredText("Destination branch"),
  reason: optionalText,
  transferred_by: optionalText,
})

export const maintenanceFormSchema = z.object({
  asset_id: requiredText("Asset"),
  maintenance_type: z.enum(["preventive", "corrective", "emergency"]),
  description: requiredText("Description"),
  cost: optionalMoney,
  performed_by: optionalText,
  performed_date: optionalDate.transform((value) => value || new Date().toISOString().split("T")[0]),
  next_maintenance_date: optionalDate,
  notes: optionalText,
})

export const auditFormSchema = z.object({
  branch_id: requiredText("Branch"),
  audit_date: requiredText("Audit date").refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid audit date"),
  auditor_name: requiredText("Auditor name"),
  notes: optionalText,
})

export const categoryFormSchema = z.object({
  name: requiredText("Category name"),
  description: optionalText,
  depreciation_rate: z.coerce
    .number()
    .min(0, "Depreciation rate cannot be negative")
    .max(100, "Depreciation rate cannot exceed 100"),
  useful_life_years: z.coerce
    .number()
    .int("Useful life must be a whole number")
    .min(1, "Useful life must be at least 1 year")
    .max(100, "Useful life cannot exceed 100 years"),
})

export const disposalFormSchema = z.object({
  asset_id: requiredText("Asset"),
  disposal_date: requiredText("Disposal date").refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid disposal date"),
  disposal_method: z.enum(["sold", "donated", "scrapped", "written_off"]),
  disposal_value: optionalMoney,
  reason: requiredText("Reason"),
  approved_by: optionalText,
})

export function parseFormData<T extends z.ZodTypeAny>(schema: T, formData: FormData): z.infer<T> {
  const values = Object.fromEntries(formData.entries())
  return schema.parse(values)
}

export function zodErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.errors.map((issue) => issue.message).join(". ")
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: string
      details?: string
      hint?: string
      code?: string
    }
    return maybeError.message || maybeError.details || maybeError.hint || maybeError.code || "The request failed"
  }

  return error instanceof Error ? error.message : "An unexpected error occurred"
}
