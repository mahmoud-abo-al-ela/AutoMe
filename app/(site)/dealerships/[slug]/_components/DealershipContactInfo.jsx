import { MapPin, Phone, Mail, Globe, ExternalLink } from "lucide-react";

const ContactCard = ({ icon: Icon, iconBgClass, iconColorClass, label, value, href, external = false }) => {
    const linkProps = external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {};

    return (
        <a
            href={href}
            className="group flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 hover:shadow-sm transition-all duration-200"
            {...linkProps}
        >
            <div className={`flex-shrink-0 p-2.5 rounded-lg bg-gradient-to-br ${iconBgClass}`}>
                <Icon className={`h-5 w-5 ${iconColorClass}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                    {label}
                </p>
                <p className="text-sm font-medium text-slate-900 truncate group-hover:text-primary transition-colors">
                    {value}
                </p>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
        </a>
    );
};

export const DealershipContactInfo = ({ dealership }) => {
    const contacts = [];

    if (dealership.phone) {
        contacts.push({
            icon: Phone,
            iconBgClass: "from-green-100 to-green-50",
            iconColorClass: "text-green-600",
            label: "Call Now",
            value: dealership.phone,
            href: `tel:${dealership.phone}`,
            external: false,
        });
    }

    if (dealership.email) {
        contacts.push({
            icon: Mail,
            iconBgClass: "from-blue-100 to-blue-50",
            iconColorClass: "text-blue-600",
            label: "Send Email",
            value: dealership.email,
            href: `mailto:${dealership.email}`,
            external: false,
        });
    }

    if (dealership.website) {
        contacts.push({
            icon: Globe,
            iconBgClass: "from-purple-100 to-purple-50",
            iconColorClass: "text-purple-600",
            label: "Visit Website",
            value: dealership.website.replace(/^https?:\/\//, ""),
            href: dealership.website,
            external: true,
        });
    }

    if (dealership.address) {
        contacts.push({
            icon: MapPin,
            iconBgClass: "from-red-100 to-red-50",
            iconColorClass: "text-red-500",
            label: "Get Directions",
            value: dealership.address,
            href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dealership.address)}`,
            external: true,
        });
    }

    if (contacts.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No contact information available.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contacts.map((contact, index) => (
                <ContactCard key={index} {...contact} />
            ))}
        </div>
    );
};
