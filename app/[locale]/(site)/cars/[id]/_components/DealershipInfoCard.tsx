import { Link } from "@/i18n/navigation";
import { Building2, MapPin, Phone, ChevronRight, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CarDetailOrganization } from "../_lib/car-detail-types";

const DealershipInfoCard = ({
    organization,
}: {
    organization: CarDetailOrganization | null | undefined;
}) => {
    if (!organization) return null;

    const { name, logo, slug, phone, address } = organization;
    const initials = name
        ? name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "D";

    return (
        <Card className="relative overflow-hidden border border-slate-200 shadow-sm bg-gradient-to-br from-white via-white to-blue-50/30 p-0">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <CardContent className="relative p-4 sm:p-5">
                {/* Header row: Logo + Info + CTA */}
                <div className="flex items-start gap-3 sm:gap-4">
                    {/* Dealership Logo / Avatar */}
                    <Link href={`/dealerships/${slug}`} className="flex-shrink-0 group">
                        <Avatar className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl border border-slate-100 shadow-sm transition-shadow group-hover:shadow-md">
                            {logo ? (
                                <AvatarImage src={logo} alt={name} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-base">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Link>

                    {/* Dealership Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Listed by
                            </span>
                        </div>
                        <Link
                            href={`/dealerships/${slug}`}
                            className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                            {name}
                        </Link>

                        {/* Contact Details */}
                        {(address || phone) && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                                {address && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                                                <span className="truncate max-w-[180px] sm:max-w-[250px]">
                                                    {address}
                                                </span>
                                            </a>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Get directions</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {phone && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <a
                                                href={`tel:${phone}`}
                                                className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Phone className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                                                <span>{phone}</span>
                                            </a>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Call dealership</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action buttons row */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1 gap-2 bg-white/80 hover:bg-white cursor-pointer text-xs sm:text-sm"
                    >
                        <Link href={`/dealerships/${slug}`}>
                            <Car className="h-3.5 w-3.5" />
                            View All Cars
                            <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                        </Link>
                    </Button>
                    {phone && (
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="gap-2 bg-white/80 hover:bg-white cursor-pointer text-xs sm:text-sm"
                        >
                            <a href={`tel:${phone}`}>
                                <Phone className="h-3.5 w-3.5 text-green-600" />
                                <span className="hidden sm:inline">Call</span>
                            </a>
                        </Button>
                    )}
                    {address && (
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="gap-2 bg-white/80 hover:bg-white cursor-pointer text-xs sm:text-sm"
                        >
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <MapPin className="h-3.5 w-3.5 text-red-500" />
                                <span className="hidden sm:inline">Directions</span>
                            </a>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default DealershipInfoCard;
