"use client";

import Link from "next/link";
import type { SiteData, SocialLink, ContactSectionData } from "../lib/types";

interface ContactSectionProps {
  site: SiteData;
  socialLinks: SocialLink[];
  contactSection: ContactSectionData;
  contactFormInterests: string[];
}

export default function ContactSection({
  site,
  socialLinks,
  contactSection,
}: ContactSectionProps) {
  return (
    <section className="section bg-white anchor-section" id="contact">
      <div className="page-container">
        <div className="contact-grid-main">
          {/* Left Info Panel */}
          <div className="contact-info-panel">
            <span className="section-label">{contactSection.label}</span>
            <h2 className="section-title mb-12">
              {contactSection.title} <br />
              <span className="metallic-gold">{contactSection.titleAccent}</span>
            </h2>

            <div className="contact-links-list">
              <div className="contact-link-item">
                <span className="tiny-label">ENQUIRIES</span>
                <a href={`mailto:${site.email}`} className="contact-value">
                  {site.email}
                </a>
              </div>
              {socialLinks.length > 0 && (
                <div className="contact-link-item">
                  <span className="tiny-label">INSTAGRAM</span>
                  <a
                    href={socialLinks[0].href}
                    target="_blank"
                    rel="noreferrer"
                    className="contact-value"
                  >
                    {socialLinks[0].handle}
                  </a>
                </div>
              )}
              
            </div>
          </div>

          {/* Right CTA Container */}
          <div
            className="contact-form-premium"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              padding: "4rem 3.5rem",
              background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
              borderRadius: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              color: "#fff",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                letterSpacing: "0.25em",
                color: "var(--accent-gold, #c5a059)",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: "1.2rem",
              }}
            >
              TALENT REPRESENTATION
            </span>

            <h3
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
                fontWeight: 500,
                lineHeight: 1.2,
                color: "#ffffff",
                marginBottom: "1.5rem",
              }}
            >
              BECOME PART OF <br />
              <span className="metallic-gold">THE FOURTH FRAME</span> ROSTER
            </h3>

            <p
              style={{
                fontSize: "1rem",
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.7,
                marginBottom: "2.5rem",
                maxWidth: "500px",
              }}
            >
              We are actively looking for fresh faces, high-fashion models, and commercial talent across Pan-India. Submit your photos and video introduction directly to our casting team.
            </p>

            <Link
              href="/contactus"
              className="btn-premium nav-cta"
              style={{
                borderColor: "var(--accent-gold, #c5a059)",
                color: "var(--accent-gold, #c5a059)",
              }}
            >
              CONTACT US →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
