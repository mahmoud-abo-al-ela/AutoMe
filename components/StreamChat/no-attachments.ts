import type { StreamChat } from "stream-chat";

/**
 * Chat is text only (owner's decision, 2026-09-29): no files, photos, polls
 * or location sharing.
 *
 * Two halves, because Stream offers attachments two ways. The "+" menu is
 * replaced by nothing — pass this as `AttachmentSelector` to every
 * `<Channel>`. And `disableAttachmentUploads` turns files off in the message
 * composer itself, so a pasted or dropped image is not uploaded either.
 */
export function NoAttachmentSelector() {
  return null;
}

export function disableAttachmentUploads(client: StreamChat) {
  client.setMessageComposerSetupFunction(({ composer }) => {
    composer.updateConfig({
      attachments: {
        acceptedFiles: [],
        maxNumberOfFilesPerMessage: 0,
        fileUploadFilter: () => false,
      },
    });
  });
}
