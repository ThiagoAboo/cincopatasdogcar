import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PorteId = "pequeno" | "medio" | "grande" | "gigante";

export type PorteOption = { id: PorteId; label: string; weight: string };
export type MonthlyTier = { tier: string; freq: number; label: string; accent?: boolean };
export type WalkTimeOption = { min: number; label: string; factor: number };

export type AppSettings = {
  brand: string;
  brand_short: string;
  whatsapp_number: string;
  phone_display: string;
  instagram_handle: string;
  city_base: string;
  base_coords: { lat: number; lon: number };
  cities_covered: string[];
  schedule_display: string;
  fuel_cost_per_km: number;
  taxi_per_km_pet: number;
  taxi_per_km_human: number;
  taxi_min_price: number;
  walker_min_price: number;
  walker_travel_fee_per_km_over: number;
  walker_travel_fee_km_threshold: number;
  wait_time_free_min: number;
  wait_time_fee: number;
  wait_time_fee_min_block: number;
  hygiene_fee_min: number;
  hygiene_fee_max: number;
  combo_aventurinha_discount: number;
  combo_vip_discount: number;
  monthly_pkg_discount: number;
  second_pet_discount: number;
  cancel_free_hours: number;
  walker_price_by_porte: Record<PorteId, number>;
  porte_options: PorteOption[];
  monthly_tiers: MonthlyTier[];
  walk_time_options: WalkTimeOption[];
};

async function fetchSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings" as never)
    .select("data")
    .eq("id", "default")
    .single();
  if (error || !data) throw error ?? new Error("settings not found");
  return (data as { data: AppSettings }).data;
}

export const settingsQueryOptions = queryOptions({
  queryKey: ["app_settings"],
  queryFn: fetchSettings,
  staleTime: 5 * 60_000,
});
