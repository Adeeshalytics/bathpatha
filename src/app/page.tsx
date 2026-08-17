import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.role === "chef" ? "/reports" : "/dashboard");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-primary">බත්පත</h1>
        <p className="mt-2 text-muted-foreground">Bathpatha · Boarding meal tracker</p>
      </div>
      <LoginForm />
    </div>
  );
}
