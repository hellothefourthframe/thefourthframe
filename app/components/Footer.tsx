"use client";

import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { scrollToHash } from "../lib/scrollToHash";
import { NAV_ITEMS, NAV_CTA } from "../lib/constants";
import type { SiteData, SocialLink, FooterData } from "../lib/types";

interface FooterProps {
  site: SiteData;
  socialLinks: SocialLink[];
  footer: FooterData;
}

export default function Footer({ site, socialLinks, footer }: FooterProps) {
  const year = new Date().getFullYear();
  const pathname = usePathname();
  const isContactPage = pathname === "/contact";
  const isHomePage = pathname === "/";
  const isAdminPage = pathname.startsWith("/admin");
  const ctaBandRef = useRef<HTMLDivElement>(null);
  const [shouldLoadBandVideo, setShouldLoadBandVideo] = useState(false);

  useEffect(() => {
    if (isAdminPage || isContactPage || shouldLoadBandVideo) {
      return;
    }

    const band = ctaBandRef.current;

    if (!band) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        setShouldLoadBandVideo(true);
        observer.disconnect();
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(band);

    return () => {
      observer.disconnect();
    };
  }, [isAdminPage, isContactPage, shouldLoadBandVideo]);

  // Hide footer on admin pages
  if (isAdminPage) return null;

  const handleAgencyClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isHomePage || !href.startsWith("/#")) {
      return;
    }

    event.preventDefault();
    window.history.replaceState(null, "", href);
    scrollToHash(href.slice(1));
  };

  return (
    <footer className="footer footer-reimagined">
      <div className="footer-backdrop" aria-hidden="true" />
      <div className="footer-watermark">FOURTH FRAME</div>

      {!isContactPage && (
        <div
          ref={ctaBandRef}
          className="footer-top-band flex-center-vertical"
          style={{ position: "relative", overflow: "hidden" }}
        >
          {shouldLoadBandVideo && footer.ctaVideoSrc ? (
            <video
              key={footer.ctaVideoSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                zIndex: 0,
              }}
            >
              <source src={footer.ctaVideoSrc} type="video/mp4" />
            </video>
          ) : (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--bg-dark)",
                zIndex: 0,
              }}
            />
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.6) 100%)",
              zIndex: 1,
            }}
          />

          <div className="footer-top-copy" style={{ position: "relative", zIndex: 2 }}>
            <h2>{footer.ctaHeadline}</h2>
          </div>
        </div>
      )}

      <div className="page-container">
        <div className="footer-main-v5">
          <div className="footer-left-v5">
            <h2 className="footer-heading-v5">{footer.heading[0]}<br />{footer.heading[1]}<br />{footer.heading[2]}<br />{footer.heading[3]}</h2>
            <div className="footer-info-v5">
              <p className="footer-desc-v5">{footer.description}</p>
              
              <div className="footer-team-section" style={{ marginTop: '2.5rem', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <span className="footer-label-v5" style={{ color: 'var(--accent-gold)' }}>
                  {footer.team.title}
                </span>
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  {footer.team.members.map((member) => (
                    <div key={member.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#fff', letterSpacing: '0.05em' }}>{member.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>— {member.role}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em', marginTop: '0.5rem' }}>
                  {footer.team.marketing}
                </div>
              </div>

              <a href={site.footerEmailHref} className="footer-email-v5">
                {site.footerEmail}
              </a>
            </div>
          </div>

          <div className="footer-right-v5">
            <div className="footer-nav-section-v5">
              <span className="footer-label-v5">SOCIALS</span>
              <div className="footer-links-v5">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="footer-link-v5"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="footer-nav-section-v5">
              <span className="footer-label-v5">STUDIO</span>
              <div className="footer-links-v5">
                {footer.studioLocations.map((location) => (
                  <div key={location.city} className="footer-location-v5">
                    <strong>{location.city}</strong>
                    <span>{location.note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="footer-nav-section-v5">
              <span className="footer-label-v5">AGENCY</span>
              <div className="footer-links-v5">
                {NAV_ITEMS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="footer-link-v5"
                    onClick={(event) => handleAgencyClick(event, link.href)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom-v5">
          <div className="footer-badges-v5">
            {site.badges.map((badge) => (
              <span key={badge} className="badge-v5">{badge}</span>
            ))}
          </div>
          <p className="copyright-v5">
            &copy; {year} {site.name}. OPERATED BY {site.operatedBy}.
          </p>
        </div>
      </div>
    </footer>
  );
}
