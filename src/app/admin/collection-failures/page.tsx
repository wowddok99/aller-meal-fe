import { redirect } from "next/navigation";

export default function CollectionFailuresPage() {
  redirect("/admin/collection-jobs?status=FAILED");
}
