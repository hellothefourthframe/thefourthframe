"use client";

import { type FormEvent, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { uploadFile } from "@/app/lib/upload";
import { isAllowedVideoType } from "@/app/lib/video";
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const images = formData.getAll("images").filter((item) => item instanceof File && item.size > 0);
    const video = formData.get("video");

    setError("");

    if (images.length === 0 || images.length > 5) {
      setError("Please upload between 1 and 5 images.");
      return;
    }

    if (!(video instanceof File) || video.size === 0) {
      setError("Please upload one short video.");
      return;
    }

    if (!isAllowedVideoType(video.type)) {
      setError("Only MP4, WEBM, MOV, AVI, or OGG videos are allowed.");
      return;
    }

    if (video.size > 20 * 1024 * 1024) {
      setError("Video must be 20 MB or smaller.");
      return;
    }

    setSubmitting(true);

    try {
      const imagePaths: string[] = [];
      for (const image of images) {
        const uploaded = await uploadFile(image as File, "image", "/api/upload");
        imagePaths.push(uploaded.path);
      }

      const uploadedVideo = await uploadFile(video, "video", "/api/upload");

      const response = await fetch("/api/model-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: formData.get("fullname"),
          email: formData.get("email"),
          contact: formData.get("contact"),
          age: formData.get("age"),
          height: formData.get("height"),
          city: formData.get("city"),
          images: imagePaths,
          video: uploadedVideo.path,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Submission failed");
      }

      form.reset();
      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section bg-white anchor-section" id="contact">
      <div className="page-container">
        <div className="contact-grid-main">
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
              <div className="contact-link-item">
                <span className="tiny-label">LOCATION</span>
                <p className="contact-value">
                  {site.location.studio}, <br />
                  {site.location.city}, {site.location.country}
                </p>
              </div>
            </div>
          </div>

          <div className="contact-form-premium">
            <form className="agency-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="model-fullname">FULL NAME</label>
                  <input id="model-fullname" name="fullname" type="text" placeholder="Your full name" required />
                </div>
                <div className="input-group">
                  <label htmlFor="model-email">EMAIL ADDRESS</label>
                  <input id="model-email" name="email" type="email" placeholder="you@example.com" required />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="model-contact">CONTACT</label>
                  <input id="model-contact" name="contact" type="tel" placeholder="+91 98765 43210" required />
                </div>
                <div className="input-group">
                  <label htmlFor="model-age">AGE</label>
                  <input id="model-age" name="age" type="number" min="1" max="120" placeholder="22" required />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="model-height">HEIGHT</label>
                  <input id="model-height" name="height" type="text" placeholder="5'8&quot; / 173 cm" required />
                </div>
                <div className="input-group">
                  <label htmlFor="model-city">CITY</label>
                  <input id="model-city" name="city" type="text" placeholder="Bikaner" required />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="model-images">IMAGES</label>
                <input
                  id="model-images"
                  name="images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  required
                />
                <span className="form-hint">Upload 1 to 5 clear photos.</span>
              </div>

              <div className="input-group">
                <label htmlFor="model-video">SHORT VIDEO</label>
                <input id="model-video" name="video" type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/ogg,.mp4,.webm,.mov,.avi,.ogv" required />
                <span className="form-hint">Upload one short video (MP4, WEBM, MOV, AVI, or OGG), max 20 MB.</span>
              </div>

              {error ? <div className="contact-status contact-status-error">{error}</div> : null}

              <div className="form-actions mt-8">
                <button type="submit" className="btn-premium w-full text-center" disabled={submitting}>
                  {submitting ? "Submitting..." : contactSection.submitButtonText}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-6 cursor-pointer"
            style={{ backgroundColor: "rgba(10, 10, 10, 0.95)" }}
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white p-12 md:p-16 max-w-lg md:max-w-2xl w-full text-center flex flex-col items-center gap-10 shadow-2xl"
              style={{ borderRadius: "var(--radius-xl)" }}
            >
              <div className="relative w-32 h-32 overflow-hidden" style={{ borderRadius: "50%" }}>
                <Image
                  src={site.logo}
                  alt={`${site.name} Logo`}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-3xl font-serif" style={{ color: "var(--bg-dark)" }}>
                  {contactSection.successTitle}
                </h3>
                <p className="text-gray-600 leading-relaxed font-sans text-xl">
                  {contactSection.successMessage}
                </p>
              </div>

              <span className="text-xs uppercase tracking-widest text-gray-400 opacity-70">
                Click anywhere to close
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
