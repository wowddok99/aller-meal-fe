import { AdminShell } from "@/components/admin/admin-shell";
import { CollectionFailures } from "@/components/admin/collection-failures";

export default function CollectionFailuresPreviewPage() {
  return <AdminShell><CollectionFailures review /></AdminShell>;
}
