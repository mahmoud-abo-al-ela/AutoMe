"use client";

import {
  OrgDetailsHeader,
  FormFields,
  SlugStatus,
  SlugPreview,
  OrgDetailsFooter,
  LogoUpload,
  useOrgDetails,
  getInputFields,
} from "./org-details";

export default function Step1OrgDetails({ formData, updateFormData, onNext }) {
  const {
    register,
    handleSubmit,
    errors,
    slugStatus,
    generatedSlug,
    onSubmit,
    isDisabled,
    watchedName,
    watchedEmail,
    watchedPhone,
    watchedAddress,
    logo,
    setLogo,
    logoError,
  } = useOrgDetails({ formData, updateFormData, onNext });

  const inputFields = getInputFields({
    name: watchedName,
    email: watchedEmail,
    phone: watchedPhone,
    address: watchedAddress,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <OrgDetailsHeader />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Logo Upload - Left Column */}
        <div>
          <LogoUpload value={logo} onChange={setLogo} error={logoError} />
        </div>

        {/* Form Fields - Right Column */}
        <div>
          <FormFields
            fields={inputFields}
            register={register}
            errors={errors}
            slugStatus={slugStatus}
            SlugStatusComponent={SlugStatus}
          />
        </div>
      </div>

      <OrgDetailsFooter disabled={isDisabled} />
    </form>
  );
}
