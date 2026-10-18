import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import enCommon from "@/messages/en/common.json";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

// A menu item that opens a dialog, as the super-admin row menus do. Each Radix layer locks the
// page with body pointer-events; if the menu and the dialog run separate copies of that code,
// closing the dialog restores the menu's lock and the page stops taking clicks.
function MenuThatOpens({ kind }: { kind: "alert" | "dialog" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setOpen(true)}>Change role</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {kind === "alert" ? (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>Change role?</AlertDialogTitle>
            <AlertDialogDescription>Confirm</AlertDialogDescription>
            <AlertDialogCancel>Keep</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogTitle>Sign in as</DialogTitle>
            <DialogDescription>Confirm</DialogDescription>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

let root: Root;
let host: HTMLDivElement;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  document.body.style.pointerEvents = "";
});

const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

function key(target: Element, k: string) {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
}

async function openDialogFromMenu(kind: "alert" | "dialog") {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root.render(
      <NextIntlClientProvider locale="en" messages={{ common: enCommon }}>
        <MenuThatOpens kind={kind} />
      </NextIntlClientProvider>
    )
  );

  const trigger = host.querySelector("button")!;
  act(() => key(trigger, "Enter"));
  await flush();
  const item = document.querySelector('[role="menuitem"]')!;
  expect(item).not.toBeNull();
  act(() => key(item, "Enter"));
  await flush();
  expect(document.querySelector(kind === "alert" ? '[role="alertdialog"]' : '[role="dialog"]')).not.toBeNull();
}

describe("a dialog opened from a menu item", () => {
  it("gives the page back its clicks when an alert dialog closes", async () => {
    await openDialogFromMenu("alert");
    act(() => (document.querySelector('[role="alertdialog"] button') as HTMLButtonElement).click());
    await flush();
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    expect(document.body.style.pointerEvents).toBe("");
  });

  it("gives the page back its clicks when a dialog closes", async () => {
    await openDialogFromMenu("dialog");
    act(() => key(document.querySelector('[role="dialog"]')!, "Escape"));
    await flush();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.pointerEvents).toBe("");
  });
});
