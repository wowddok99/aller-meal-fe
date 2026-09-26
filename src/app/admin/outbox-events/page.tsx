import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { OutboxEvents } from "@/components/admin/outbox-events";

export const metadata: Metadata = { title: "이벤트 발행 작업 | AllerMeal" };
export default function OutboxEventsPage() { return <AdminShell><OutboxEvents /></AdminShell>; }
