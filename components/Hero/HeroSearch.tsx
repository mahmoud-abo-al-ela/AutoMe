"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Camera, Loader2, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { describeSearch } from "@/actions/home";
import { describedSearchParams, hasFilters, readsLikeSentence } from "@/lib/search/describe";
import { useImageSearch } from "./useImageSearch";
import ImageSearchPanel from "./ImageSearchPanel";

/**
 * The hero search, drawn as a licence plate (Figma: Plate search): the light-
 * blue band carries the live count, the body holds the field, and the yellow
 * key is the page's one primary action.
 *
 * A short query goes straight to /cars?search=… as it always has; one that
 * reads like a description ("automatic SUV under 1.5 million") is first turned
 * into filters by the model (describeSearch). If that fails or finds no filter,
 * it is the plain text search after all — the buyer is never stopped. A photo
 * (picked or dropped anywhere on the field) runs the AI photo search in
 * useImageSearch.
 */
const HeroSearch = ({ bandLabel }: { bandLabel: string }) => {
  const t = useTranslations("home.hero");
  const tActions = useTranslations("common.actions");
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const image = useImageSearch();
  const described = useMutation({ mutationFn: describeSearch });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      toast.error(t("emptySearch"));
      return;
    }
    const plain = () => router.push(`/cars?search=${encodeURIComponent(query)}`);
    if (!readsLikeSentence(query)) return plain();

    try {
      const result = await described.mutateAsync({ query });
      if (!result.success || !hasFilters(result.data)) return plain();
      router.push(`/cars?${describedSearchParams(result.data).toString()}`);
    } catch {
      plain();
    }
  };

  if (image.isActive) {
    return (
      <ImageSearchPanel
        imagePreview={image.imagePreview}
        fileName={image.fileName}
        loading={image.loading}
        changeImageRef={image.changeImageRef}
        onFileInputChange={image.onFileInputChange}
        onCancel={image.reset}
        onChangeImage={image.openChangePicker}
        onSearch={image.search}
      />
    );
  }

  return (
    <form
      role="search"
      onSubmit={handleSearch}
      {...image.dragProps}
      className={cn(
        "relative w-full max-w-[600px] overflow-hidden rounded-control border-[3px] border-marker bg-field text-foreground",
        image.isDragging && "ring-4 ring-marker/40"
      )}
    >
      <div className="flex items-center justify-between gap-3 bg-plate-band px-3 py-0.5 text-micro font-bold">
        <span>{bandLabel}</span>
        <span aria-hidden dir="ltr">
          EGYPT · مصر
        </span>
      </div>
      <div className="flex items-center gap-1.5 p-1.5 ps-3">
        <Search aria-hidden className="size-5 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="h-12 w-0 min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xl"
          onClick={image.openPicker}
          title={t("searchByPhoto")}
          aria-label={t("searchByPhoto")}
          className={cn(searchQuery.trim() && "max-sm:hidden")}
        >
          <Camera />
        </Button>
        <Button
          type="submit"
          variant="marker"
          size="xl"
          disabled={image.loading || described.isPending}
          aria-busy={described.isPending}
          className="shrink-0 max-sm:px-3.5"
        >
          {described.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Search className="sm:hidden" />}
          <span className="max-sm:sr-only">{described.isPending ? t("describing") : tActions("search")}</span>
        </Button>
        <input
          ref={image.fileInputRef}
          id="imageUpload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={image.onFileInputChange}
        />
      </div>

      {image.isDragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-field/95 text-caption font-semibold">
          <Upload aria-hidden className="size-5" />
          {t("dropImage")}
        </div>
      )}
    </form>
  );
};

export default HeroSearch;
