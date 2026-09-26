import type { Metadata } from "next";
import { CollectionFailures } from "@/components/admin/collection-failures";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: "급식 수집 작업 | AllerMeal" };
export default function CollectionJobsPage() { return <AdminShell><CollectionFailures /></AdminShell>; }
