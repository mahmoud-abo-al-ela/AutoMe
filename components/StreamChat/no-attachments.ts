import type { StreamChat } from "stream-chat";

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
