import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/session";

export default async function Home() {
  try {
    const { user } = await getRequiredSession();
    if (user.role === "ADMIN") {
      redirect("/admin/dashboard");
    } else {
      redirect("/client/dashboard");
    }
  } catch {
    redirect("/login");
  }
}
