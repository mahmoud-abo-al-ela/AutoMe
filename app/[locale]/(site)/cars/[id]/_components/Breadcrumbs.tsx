import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";
import type { CarDetail } from "../_lib/car-detail-types";

const Breadcrumbs = ({ car }: { car: CarDetail }) => {
    const label = car.title || `${car.year} ${car.make} ${car.model}`;

    return (
        <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6"
        >
            <Link
                href="/"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Home</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
                href="/cars"
                className="hover:text-foreground transition-colors"
            >
                Cars
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-[300px]">
                {label}
            </span>
        </nav>
    );
};

export default Breadcrumbs;
