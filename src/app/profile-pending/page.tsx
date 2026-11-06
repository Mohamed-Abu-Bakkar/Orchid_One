import type { Metadata } from "next";
import { ProfilePendingClient } from "@/components/profile-pending-client";

export const metadata: Metadata = {
  title: "Profile not linked | Orchid One",
  description: "Your Orchid One account is signed in but not yet linked to an employee record."
};

export default function ProfilePendingPage() {
  return <ProfilePendingClient />;
}
