import { Twitter, Instagram, Facebook } from "lucide-react";
import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className="container mx-auto px-4 py-6 md:py-12">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div className="col-span-2 sm:col-span-2 md:col-span-1 mb-4 md:mb-0">
          <h3 className="text-lg font-semibold mb-3">AutoMe</h3>
          <p className="text-sm text-muted-foreground">
            AutoMe is a platform that helps you find your perfect vehicle match
            with smart recommendations and market insights.
          </p>
        </div>

        <div className="flex flex-col">
          <h3 className="text-sm font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link
                href="/cars"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Browse Cars
              </Link>
            </li>
            <li>
              <Link
                href="/compare"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Compare Models
              </Link>
            </li>
            <li>
              <Link
                href="/favorites"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Saved Vehicles
              </Link>
            </li>
            <li>
              <Link
                href="/faq"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex flex-col">
          <h3 className="text-sm font-semibold mb-3">Company</h3>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link
                href="/about"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex flex-col">
          <h3 className="text-sm font-semibold mb-3">Legal</h3>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Cookie Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t mt-6 md:mt-8 pt-4 md:pt-6 flex flex-col sm:flex-row items-center justify-between">
        <p className="text-xs text-muted-foreground text-center sm:text-left">
          © {new Date().getFullYear()} AutoMe. All rights reserved.
        </p>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <Link
            href="#"
            className="text-muted-foreground hover:text-primary"
            aria-label="Facebook"
          >
            <span className="sr-only">Facebook</span>
            <Facebook size={18} />
          </Link>
          <Link
            href="#"
            className="text-muted-foreground hover:text-primary"
            aria-label="Twitter"
          >
            <span className="sr-only">Twitter</span>
            <Twitter size={18} />
          </Link>
          <Link
            href="#"
            className="text-muted-foreground hover:text-primary"
            aria-label="Instagram"
          >
            <span className="sr-only">Instagram</span>
            <Instagram size={18} />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
