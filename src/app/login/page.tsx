import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Sign in | Orchid One" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
