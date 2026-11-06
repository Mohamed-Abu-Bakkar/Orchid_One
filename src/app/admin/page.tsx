import { AdminAccessGuard } from "@/components/admin/admin-access-guard";

export default function AdminPage() {
  return <AdminAccessGuard />;
}
