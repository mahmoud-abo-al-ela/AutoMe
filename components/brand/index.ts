// Public-site design-system pieces (Figma: AutoMe — Design System & Public
// Screens). Shared primitives stay in components/ui.
export { PricePlate } from "./PricePlate";
export {
  FairPriceGauge,
  PriceVerdictLine,
  priceVerdict,
  usePriceVerdictText,
  type MarketPositionProps,
  type PriceVerdict,
} from "./FairPriceGauge";
export { Logo } from "./Logo";
export { SpecGrid, type SpecItem } from "./SpecGrid";
export { RoadDashes } from "./RoadDashes";
export { SiteEmptyState } from "./SiteEmptyState";
export { MarketReadout, type MarketSummary } from "./MarketReadout";
export { PageHeader } from "./PageHeader";
export { FaqAccordion, type FaqItem } from "./FaqAccordion";
export { RoadLoader } from "./RoadLoader";
export { SiteBrandProvider, useSiteBrandName } from "./SiteBrand";
export { DealerPitchProvider, DealerPitchOnly } from "./DealerPitch";
