import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  redirect((await getCurrentUser()) ? "/app" : "/login");
}
