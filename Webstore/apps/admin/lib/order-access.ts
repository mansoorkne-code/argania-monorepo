import "server-only";
import { redirect } from "next/navigation";
import { OrderAccessError } from "./order-data";

export function handleOrderAccessError(error: unknown): void {
  if (!(error instanceof OrderAccessError)) return;
  if (error.status === 401) redirect("/login?next=%2Fadmin%2Forders");
  redirect("/login?error=unauthorized");
}
