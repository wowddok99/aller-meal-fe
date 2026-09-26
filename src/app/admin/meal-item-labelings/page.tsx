import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { MealItemLabelings } from "@/components/admin/meal-item-labelings";

export const metadata: Metadata = { title: "알레르기 라벨링 작업 | AllerMeal" };
export default function MealItemLabelingsPage() { return <AdminShell><MealItemLabelings /></AdminShell>; }
