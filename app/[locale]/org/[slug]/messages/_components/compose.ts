import type { Channel } from "stream-chat";

/**
 * Put text in the conversation's writing box, for the dealer to read, edit
 * and send — never sent on their behalf. Works from anywhere on the desk,
 * the deal panel included, through the channel's own composer; then focuses
 * the box so typing carries on from there.
 */
export function compose(channel: Channel, text: string) {
  channel.messageComposer.textComposer.setText(text);
  requestAnimationFrame(() => {
    const box = document.querySelector<HTMLTextAreaElement>(".str-chat__textarea textarea, textarea.str-chat__textarea__textarea");
    box?.focus();
    box?.setSelectionRange(box.value.length, box.value.length);
  });
}

/** The page where a buyer books a drive with this car. No locale: the buyer lands in their own. */
export const testDriveLink = (carId: string) => `${window.location.origin}/test-drive?carId=${carId}`;
