import type { SupabaseClient } from "@supabase/supabase-js";
import type { PropertyRowForAiLab } from "./property-row";

export async function loadPropertyForAgency(
  supabase: SupabaseClient,
  propertyId: string,
  agencyId: string
): Promise<{ property: PropertyRowForAiLab | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, title, type, transaction, price, surface, rooms, bedrooms, address, city, zip_code, description, status"
    )
    .eq("id", propertyId)
    .eq("agency_id", agencyId)
    .maybeSingle();

  if (error) {
    return { property: null, error: new Error(error.message) };
  }

  if (!data) {
    return { property: null, error: null };
  }

  return { property: data as PropertyRowForAiLab, error: null };
}
