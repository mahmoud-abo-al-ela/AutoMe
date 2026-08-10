"use client";

import {
  FormFields,
  LocationFields,
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
    location,
    updateLocation,
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

  // Name is paired with the logo above; the rest fill a single two-column grid
  // in reading order: contact, then location, with the optional street line
  // last so it does not sit alone in a half-empty row.
  const [nameField, emailField, phoneField, addressField] = inputFields;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo sits beside the name: they are the same decision (how the
          dealership presents itself), and pairing them removes the dead
          column the old 1fr/2fr split left under the dropzone. */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="shrink-0">
          <LogoUpload value={logo} onChange={setLogo} error={logoError} compact />
        </div>

        <div className="flex-1 min-w-0">
          <FormFields
            fields={[nameField]}
            register={register}
            errors={errors}
            columns={1}
            footerSlot={
              <SlugPreview slug={generatedSlug} status={slugStatus} />
            }
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormFields
          fields={[emailField, phoneField]}
          register={register}
          errors={errors}
          bare
        />
        <LocationFields value={location} onChange={updateLocation} />
        <FormFields
          fields={[addressField]}
          register={register}
          errors={errors}
          bare
        />
      </div>

      <OrgDetailsFooter
        disabled={isDisabled}
        hint={
          slugStatus === "checking"
            ? "Checking name availability…"
            : slugStatus === "taken"
              ? "Choose an available dealership name"
              : null
        }
      />
    </form>
  );
}
