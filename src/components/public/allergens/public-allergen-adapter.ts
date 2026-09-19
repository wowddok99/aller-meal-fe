import type { AllergenResponse } from "@/generated/api/public/models/allergenResponse";

export type PublicAllergen = {
  code: number;
  name: string;
};

export function toPublicAllergens(
  allergens: AllergenResponse[],
): PublicAllergen[] {
  return allergens
    .filter((allergen): allergen is AllergenResponse & { code: number } =>
      Number.isFinite(allergen.code),
    )
    .map((allergen) => ({
      code: allergen.code,
      name: allergen.name?.trim() || "알레르기 정보 없음",
    }))
    .sort((left, right) => left.code - right.code);
}
