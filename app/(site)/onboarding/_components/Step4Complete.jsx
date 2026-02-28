"use client";

import {
  CompletionHeader,
  SuccessMessage,
  DealershipUrlCard,
  ActionButtons,
  NextStepsSection,
  SupportSection,
  useConfetti,
} from "./completion";

export default function Step4Complete({ createdOrg }) {
  useConfetti();

  const adminUrl = createdOrg ? `/org/${createdOrg.slug}/dashboard` : "#";
  const siteUrl = createdOrg ? `/org/${createdOrg.slug}` : "#";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <CompletionHeader />

        <SuccessMessage orgName={createdOrg?.name} />

        <DealershipUrlCard slug={createdOrg?.slug} siteUrl={siteUrl} />

        <ActionButtons siteUrl={siteUrl} adminUrl={adminUrl} />

        <NextStepsSection />

        <SupportSection />
      </div>
    </div>
  );
}
