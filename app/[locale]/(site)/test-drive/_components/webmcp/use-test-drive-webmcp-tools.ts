"use client";

import type { RefObject } from "react";
import { useWebMcpTools } from "@/hooks/use-webmcp-tools";
import type { useTestDriveForm } from "../hooks/useTestDriveForm";
import { testDrivePageTools } from "./test-drive-tools";

/**
 * Offer the test-drive form's tools (./test-drive-tools.ts) to a browser
 * agent while the form is on the page. Showing the prepared form scrolls it
 * into view and puts focus on Submit, where the person decides.
 */
export function useTestDriveWebMcpTools(
  form: Pick<ReturnType<typeof useTestDriveForm>, "checkDay" | "prepareBooking">,
  formRef: RefObject<HTMLFormElement | null>
): void {
  useWebMcpTools(
    testDrivePageTools({
      checkDay: form.checkDay,
      prepareBooking: form.prepareBooking,
      showForm: () => {
        const element = formRef.current;
        if (!element) return;
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus({ preventScroll: true });
      },
    })
  );
}
