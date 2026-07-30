"use client";

import { type FormEvent, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { uploadFile } from "@/app/lib/upload";
import { isAllowedVideoType } from "@/app/lib/video";
import type { SiteData, SocialLink, ContactSectionData } from "../lib/types";

interface SubmissionFormSectionProps {
  site: SiteData;
  socialLinks: SocialLink[];
  contactSection: ContactSectionData;
  contactFormInterests: string[];
}

export default function SubmissionFormSection({
  site,
  socialLinks,
  contactSection,
}: SubmissionFormSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number>(0);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedVideo(file);
  };

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

    // Immediately show interactive Submission Modal & Loader
    setSubmitting(true);
    setShowModal(true);
    setUploadPercent(0);

    try {
      const imagePaths: string[] = [];
      const totalImages = images.length;

      for (let i = 0; i < totalImages; i++) {
        const image = images[i] as File;
        const uploaded = await uploadFile(image, "image", "/api/upload", (ratio) => {
          const imageProgress = Math.round(((i + ratio) / (totalImages + 1)) * 100);
          setUploadPercent(imageProgress);
        });
        imagePaths.push(uploaded.path);
      }

      const uploadedVideo = await uploadFile(video, "video", "/api/upload", (ratio) => {
        const totalProgress = Math.round(((totalImages + ratio) / (totalImages + 1)) * 100);
        setUploadPercent(totalProgress);
      });

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
      setSelectedImages([]);
      setSelectedVideo(null);
      setUploadPercent(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section bg-white">
      <div className="page-container">
        <div className="contact-grid-main">
          <div className="contact-info-panel">
            <span className="section-label">TALENT SUBMISSION</span>
            <h2 className="section-title mb-12">
              APPLY TO <br />
              <span className="metallic-gold">THE ROSTER</span>
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
                  onChange={handleImageChange}
                  required
                />
                <span className="form-hint">Upload 1 to 5 clear photos.</span>

                {selectedImages.length > 0 && (
                  <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {selectedImages.map((file, idx) => (
                      <span
                        key={`${file.name}-${idx}`}
                        style={{
                          fontSize: "0.72rem",
                          padding: "0.2rem 0.5rem",
                          background: "rgba(10,10,10,0.05)",
                          border: "1px solid rgba(10,10,10,0.1)",
                          borderRadius: "4px",
                          color: "#333",
                        }}
                      >
                        📷 {file.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="model-video">SHORT VIDEO</label>
                <input
                  id="model-video"
                  name="video"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/ogg,.mp4,.webm,.mov,.avi,.ogv"
                  onChange={handleVideoChange}
                  required
                />
                <span className="form-hint">Upload one short video (MP4, WEBM, MOV, AVI, or OGG), max 20 MB.</span>

                {selectedVideo && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "0.2rem 0.5rem",
                        background: "rgba(10,10,10,0.05)",
                        border: "1px solid rgba(10,10,10,0.1)",
                        borderRadius: "4px",
                        color: "#333",
                        display: "inline-block",
                      }}
                    >
                      🎥 {selectedVideo.name}
                    </span>
                  </div>
                )}
              </div>

              {error ? <div className="contact-status contact-status-error">{error}</div> : null}

              <div className="form-actions mt-8">
                <button type="submit" className="btn-premium w-full text-center" disabled={submitting}>
                  {submitting ? "SUBMITTING..." : contactSection.submitButtonText}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Interactive Submission Loader & Success Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6"
            style={{
              backgroundColor: "rgba(8, 8, 8, 0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                width: "100%",
                maxWidth: "520px",
                borderRadius: "28px",
                background: "linear-gradient(180deg, #181818 0%, #0d0d0d 100%)",
                border: "1px solid rgba(197, 160, 89, 0.35)",
                boxShadow: "0 30px 70px -15px rgba(0,0,0,0.95), 0 0 50px rgba(197, 160, 89, 0.15)",
                color: "#ffffff",
                padding: "3.25rem 2.25rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Subtle Luxury Ambient Gold Glow */}
              <div
                style={{
                  position: "absolute",
                  top: "-60px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "280px",
                  height: "280px",
                  background: "radial-gradient(circle, rgba(197,160,89,0.22) 0%, transparent 70%)",
                  borderRadius: "50%",
                  filter: "blur(45px)",
                  pointerEvents: "none",
                }}
              />

              {submitting ? (
                /* LOADING STATE */
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", position: "relative", zIndex: 10 }}>
                  {/* Spinning Dual Gold Ring Loader */}
                  <div style={{ position: "relative", width: "90px", height: "90px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.75rem" }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        border: "2px solid rgba(197, 160, 89, 0.15)",
                        borderTopColor: "#c5a059",
                        borderRightColor: "#c5a059",
                      }}
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{
                        position: "absolute",
                        inset: "8px",
                        borderRadius: "50%",
                        border: "1.5px solid rgba(197, 160, 89, 0.1)",
                        borderBottomColor: "#e0c895",
                      }}
                    />
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(197,160,89,0.2) 0%, rgba(10,10,10,0.8) 100%)",
                        border: "1px solid rgba(197,160,89,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c5a059" strokeWidth="1.8">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      letterSpacing: "0.28em",
                      color: "#c5a059",
                      textTransform: "uppercase",
                      marginBottom: "0.4rem",
                    }}
                  >
                    SUBMITTING APPLICATION
                  </span>

                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.6rem",
                      fontWeight: 600,
                      color: "#ffffff",
                      letterSpacing: "0.02em",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Uploading Portfolio
                  </h3>

                  <p
                    style={{
                      fontSize: "0.88rem",
                      color: "rgba(255, 255, 255, 0.65)",
                      maxWidth: "340px",
                      lineHeight: "1.6",
                      marginBottom: "2rem",
                      textAlign: "center",
                    }}
                  >
                    Please wait while we upload your photos and short video securely to Google Drive...
                  </p>

                  {/* Progress Bar Container */}
                  <div style={{ width: "100%", maxWidth: "290px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                      style={{
                        width: "100%",
                        height: "5px",
                        background: "rgba(255, 255, 255, 0.08)",
                        borderRadius: "99px",
                        overflow: "hidden",
                      }}
                    >
                      <motion.div
                        animate={{ width: `${uploadPercent}%` }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{
                          height: "100%",
                          background: "linear-gradient(90deg, #c5a059 0%, #f3e5ab 100%)",
                          borderRadius: "99px",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        color: "#c5a059",
                        marginTop: "0.65rem",
                      }}
                    >
                      {uploadPercent}%
                    </span>
                  </div>
                </div>
              ) : (
                /* SUCCESS STATE */
                <motion.div
                  initial={{ scale: 0.88, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", position: "relative", zIndex: 10 }}
                >
                  {/* Animated Gold Checkmark */}
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    style={{
                      width: "86px",
                      height: "86px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(197,160,89,0.22) 0%, rgba(197,160,89,0.06) 100%)",
                      border: "2px solid #c5a059",
                      boxShadow: "0 0 35px rgba(197,160,89,0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1.75rem",
                    }}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#c5a059"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </motion.div>

                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      letterSpacing: "0.28em",
                      color: "#c5a059",
                      textTransform: "uppercase",
                      marginBottom: "0.5rem",
                    }}
                  >
                    APPLICATION RECEIVED
                  </span>

                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.75rem",
                      fontWeight: 600,
                      color: "#ffffff",
                      letterSpacing: "0.02em",
                      marginBottom: "0.85rem",
                    }}
                  >
                    {contactSection.successTitle || "Submission Successful"}
                  </h3>

                  <p
                    style={{
                      fontSize: "0.92rem",
                      color: "rgba(255, 255, 255, 0.72)",
                      lineHeight: "1.65",
                      maxWidth: "360px",
                      marginBottom: "2.25rem",
                      textAlign: "center",
                    }}
                  >
                    {contactSection.successMessage ||
                      "Your query has been submitted and our team will connect with you soon."}
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "0.9rem 3.5rem",
                      background: "linear-gradient(135deg, #c5a059 0%, #e0c895 100%)",
                      color: "#0a0a0a",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      letterSpacing: "0.22em",
                      borderRadius: "999px",
                      textTransform: "uppercase",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 8px 25px rgba(197, 160, 89, 0.35)",
                      transition: "all 0.25 ease",
                    }}
                  >
                    DONE
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
