import { z } from "zod"

/** API 回傳給前端的解析結果 */
export const parseInventoryResponseSchema = z.object({
  name: z.string(),
  quantity: z.number().nonnegative(),
  unit: z.string(),
  fridge_id: z.string().uuid().nullable(),
  zone_id: z.string().uuid().nullable(),
  purchase_date: z.string().nullable(),
  notes: z.string().nullable(),
  hint: z.string().nullable(),
})

export type ParseInventoryResponse = z.infer<typeof parseInventoryResponseSchema>

const zoneSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
})

export const parseInventoryRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  fridges: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      zones: z.array(zoneSchema),
    })
  ),
})

export type ParseInventoryRequest = z.infer<typeof parseInventoryRequestSchema>

export function validateFridgeZonePair(
  fridges: { id: string; zones: { id: string }[] }[],
  fridgeId: string | null,
  zoneId: string | null
): { fridge_id: string; zone_id: string } | null {
  if (!fridgeId || !zoneId) return null
  const f = fridges.find((x) => x.id === fridgeId)
  if (!f) return null
  const z = f.zones.find((z) => z.id === zoneId)
  if (!z) return null
  return { fridge_id: fridgeId, zone_id: zoneId }
}
