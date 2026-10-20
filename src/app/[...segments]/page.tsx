import { notFound } from "next/navigation";

/** Match the implicit children slot too, so unknown soft navigations cannot
 * retain the previous page while the catch-all ticker slot changes. */
export default function UnmatchedRoute() {
  notFound();
}
