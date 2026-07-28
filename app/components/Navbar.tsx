"use client";

import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { scrollToHash } from "../lib/scrollToHash";
import { NAV_ITEMS, NAV_CTA, NAV_CTA_MODEL } from "../lib/constants";
import type { SiteData } from "../lib/types";

interface NavbarProps {
  site: SiteData;
}

export default function Navbar({ site }: NavbarProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isAdminPage = pathname.startsWith("/admin");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (isAdminPage) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isAdminPage]);

  // Hide navbar on admin pages
  if (isAdminPage) return null;

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isHomePage || !href.startsWith("/#")) {
      return;
    }

    event.preventDefault();
    window.history.replaceState(null, "", href);
    scrollToHash(href.slice(1));
  };

  const navClass = `navbar ${!isHomePage || isScrolled ? "scrolled" : ""}`;

  return (
    <nav className={navClass}>
      <div className="navbar-shell">
        <Link href="/" className="logo-brand" aria-label={`${site.name} home`}>
          <Image
            src={site.logo}
            alt={`${site.name} Logo`}
            width={48}
            height={48}
            priority
            sizes="48px"
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        </Link>

        <ul className="nav-links">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="nav-link"
                onClick={(event) => handleNavClick(event, item.href)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          {pathname === "/contact" || pathname === "/submissionform" ? (
            <Link
              href="/"
              className="flex items-center justify-center p-2 rounded-full transition-transform hover:-translate-x-1"
              style={{ color: "#0F0F0F", background: "white", width: "40px", height: "40px" }}
              aria-label="Go back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </Link>
          ) : (
            <>
              {/* <Link href={NAV_CTA_MODEL.href} className="btn-premium nav-cta nav-cta-model">
                {NAV_CTA_MODEL.label}
              </Link> */}
              <Link href={NAV_CTA.href} className="btn-premium nav-cta">
                {NAV_CTA.label}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
