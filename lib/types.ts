export type Fridge = {
  id: string
  name: string
}

export type Zone = {
  id: string
  fridge_id: string
  name: string
}

export type FridgeWithZones = Fridge & {
  zones: Zone[]
}

export type ItemRow = {
  id: string
  name: string
  quantity: number
  unit: string
  fridge_id: string
  zone_id: string
  purchase_date: string | null
  notes: string | null
  fridges: { name: string } | null
  zones: { name: string } | null
}
