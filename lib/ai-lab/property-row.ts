export type PropertyRowForAiLab = {
  id: string;
  title: string;
  type: string;
  transaction: string;
  price: number;
  surface: number;
  rooms: number;
  bedrooms: number;
  address: string;
  city: string;
  zip_code: string;
  description: string | null;
  status: string;
};

export function formatPropertyForPrompt(p: PropertyRowForAiLab): string {
  return [
    `Titre : ${p.title}`,
    `Type / transaction : ${p.type} · ${p.transaction}`,
    `Prix : ${p.price} €`,
    `Surface : ${p.surface} m²`,
    `Pièces / chambres : ${p.rooms} / ${p.bedrooms}`,
    `Adresse : ${p.address}, ${p.zip_code} ${p.city}`,
    `Statut : ${p.status}`,
    p.description?.trim()
      ? `Description :\n${p.description.trim()}`
      : "Description : (vide)",
  ].join("\n");
}
