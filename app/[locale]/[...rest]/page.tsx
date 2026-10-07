import { notFound } from "next/navigation";

/**
 * Any address under a locale that no route matches. Without this, Next.js
 * answers with its own bare 404 and the branded not-found page beside it
 * only ever showed when a page called notFound() itself.
 */
export default function UnmatchedRoute() {
  notFound();
}
