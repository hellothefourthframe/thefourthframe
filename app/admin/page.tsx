"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ModelSubmission, SiteContent, ContactQuery } from "@/app/lib/types";
import { uploadFile as blobUpload } from "@/app/lib/upload";
import {
  formatMaxVideoSize,
  formatMediaUrl,
  formatImageUrl,
  isAllowedVideoType,
  isVideoUrl,
  MAX_ADMIN_VIDEO_BYTES,
  VIDEO_FILE_ACCEPT,
} from "@/app/lib/video";

function isManagedUploadPath(filePath: string) {
  if (!filePath) return false;
  if (filePath.startsWith("/uploads/")) {
    return true;
  }
  if (
    filePath.includes("googleusercontent.com") ||
    filePath.includes("drive.google.com") ||
    filePath.includes("/api/drive-file/")
  ) {
    return true;
  }
  try {
    const url = new URL(filePath);
    return (
      url.protocol === "https:" &&
      (url.hostname.endsWith(".blob.vercel-storage.com") ||
        url.hostname.endsWith(".public.blob.vercel-storage.com") ||
        url.hostname === "blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────
// Admin Dashboard — Single-page editor for all site content
// ─────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [activeSection, setActiveSection] = useState("site");

  // Theme State: "dark" | "light"
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Live Upload Progress State
  const [uploadProgress, setUploadProgress] = useState<{ active: boolean; percent: number; fileName: string } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("admin_theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("admin_theme", nextTheme);
  };

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Check auth
  useEffect(() => {
    fetch("/api/admin/verify")
      .then((r) => {
        if (!r.ok) throw new Error();
        setAuthenticated(true);
      })
      .catch(() => router.push("/admin/login"))
      .finally(() => setLoading(false));
  }, [router]);

  // Load content
  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((data) => setContent(data))
      .catch(() => showToast("Failed to load content", "err"));
  }, [authenticated, showToast]);

  const saveContent = async (updates: Partial<SiteContent>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      setContent((prev) => (prev ? { ...prev, ...updates } : prev));
      showToast("Saved successfully to Database!");
    } catch {
      showToast("Failed to save to Database", "err");
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (
    file: File,
    type: "image" | "video",
    oldPath?: string
  ): Promise<string | null> => {
    if (type === "video") {
      if (!isAllowedVideoType(file.type)) {
        showToast("Only MP4, WEBM, MOV, AVI, or OGG videos are allowed", "err");
        return null;
      }

      if (file.size > MAX_ADMIN_VIDEO_BYTES) {
        showToast(`Video must be ${formatMaxVideoSize(MAX_ADMIN_VIDEO_BYTES)} or smaller`, "err");
        return null;
      }
    }

    if (oldPath && isManagedUploadPath(oldPath)) {
      await deleteFile(oldPath);
    }

    setUploadProgress({ active: true, percent: 15, fileName: file.name });

    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (!prev) return null;
        const next = prev.percent + Math.floor(Math.random() * 15) + 10;
        return { ...prev, percent: next >= 92 ? 92 : next };
      });
    }, 250);

    try {
      const result = await blobUpload(file, type, "/api/admin/upload");
      clearInterval(timer);
      setUploadProgress({ active: true, percent: 100, fileName: file.name });
      setTimeout(() => setUploadProgress(null), 800);
      return result.path;
    } catch (err) {
      clearInterval(timer);
      setUploadProgress(null);
      showToast(err instanceof Error ? err.message : "Upload failed", "err");
      return null;
    }
  };

  const deleteFile = async (filePath: string) => {
    if (!isManagedUploadPath(filePath)) return;

    try {
      await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });
    } catch { /* ignore cleanup errors */ }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/verify", { method: "DELETE" });
    router.push("/admin/login");
  };

  const styles = getThemeStyles(theme);

  if (loading) {
    return (
      <div style={{ ...styles.center, background: styles.bg.background }}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!content) {
    return (
      <div style={{ ...styles.center, background: styles.bg.background }}>
        <div style={styles.spinner} />
        <p style={{ color: styles.textMuted.color, marginTop: "1rem" }}>Loading content...</p>
      </div>
    );
  }

  const sections = [
    { key: "site", label: "Site Info" },
    { key: "fonts", label: "Fonts" },
    { key: "social", label: "Social Links" },
    { key: "hero", label: "Hero Media" },
    { key: "founders", label: "Founders" },
    { key: "services", label: "Services" },
    { key: "models", label: "Models" },
    { key: "queries", label: "Contact Queries" },
    { key: "applications", label: "Model Applications" },
    { key: "footer", label: "Footer" },
  ];

  return (
    <div className="admin-layout" style={{ ...styles.layout, background: styles.bg.background, color: styles.text.color }}>
      <style jsx global>{`
        @media (max-width: 768px) {
          .admin-layout {
            flex-direction: column !important;
            min-height: auto !important;
          }
          .admin-sidebar {
            width: 100% !important;
            height: auto !important;
            position: sticky !important;
            top: 0 !important;
            z-index: 100 !important;
            border-right: none !important;
            border-bottom: 1px solid ${theme === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0"} !important;
            padding: 0.75rem 1rem !important;
            background: ${theme === "dark" ? "#121215" : "#ffffff"} !important;
          }
          .admin-sidebar-logo {
            margin-bottom: 0.6rem !important;
            padding-bottom: 0.6rem !important;
            border-bottom: 1px solid ${theme === "dark" ? "rgba(255,255,255,0.06)" : "#f1f5f9"} !important;
          }
          .admin-nav {
            flex-direction: row !important;
            overflow-x: auto !important;
            white-space: nowrap !important;
            padding-bottom: 0.25rem !important;
            gap: 0.4rem !important;
            -webkit-overflow-scrolling: touch;
          }
          .admin-nav-btn {
            white-space: nowrap !important;
            padding: 0.45rem 0.8rem !important;
            font-size: 0.78rem !important;
            flex-shrink: 0 !important;
          }
          .admin-main {
            padding: 1rem 0.85rem !important;
            max-height: none !important;
            width: 100% !important;
          }
          .admin-header {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 0.5rem !important;
            margin-bottom: 1.25rem !important;
            padding-bottom: 0.75rem !important;
          }
          .admin-header-title {
            font-size: 1.25rem !important;
          }
          .admin-content {
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Sidebar */}
      <aside className="admin-sidebar" style={styles.sidebar}>
        <div className="admin-sidebar-logo" style={styles.sidebarLogo}>
          {content.site?.logo ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <img
                src={content.site.logo}
                alt={`${content.site?.name || "The Fourth Frame"} Logo`}
                style={{
                  height: "36px",
                  width: "auto",
                  maxWidth: "140px",
                  objectFit: "contain",
                }}
              />
              <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.15em", color: "#C9A84C" }}>
                ADMIN
              </span>
            </div>
          ) : (
            <>
              <span style={styles.logoMark}>TF</span>
              <span style={styles.logoText}>ADMIN PANEL</span>
            </>
          )}
        </div>
        <nav className="admin-nav" style={styles.nav}>
          {sections.map((s) => (
            <button
              key={s.key}
              className="admin-nav-btn"
              onClick={() => setActiveSection(s.key)}
              style={{
                ...styles.navBtn,
                ...(activeSection === s.key ? styles.navBtnActive : {}),
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          LOGOUT
        </button>
      </aside>

      {/* Main content */}
      <main className="admin-main" style={styles.main}>
        <header className="admin-header" style={styles.header}>
          <h1 className="admin-header-title" style={styles.headerTitle}>
            {sections.find((s) => s.key === activeSection)?.label}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "auto" }}>
            {saving && <span style={styles.savingBadge}>Saving...</span>}
          </div>
        </header>

        <div className="admin-content" style={styles.content}>
          {activeSection === "site" && (
            <SiteSection content={content} onSave={saveContent} onUpload={uploadFile} styles={styles} />
          )}
          {activeSection === "fonts" && (
            <FontsSection content={content} onSave={saveContent} styles={styles} />
          )}
          {activeSection === "social" && (
            <SocialSection content={content} onSave={saveContent} styles={styles} />
          )}
          {activeSection === "hero" && (
            <HeroSection content={content} onSave={saveContent} onUpload={uploadFile} onDelete={deleteFile} styles={styles} />
          )}
          {activeSection === "founders" && (
            <FoundersSection content={content} onSave={saveContent} onUpload={uploadFile} onDelete={deleteFile} styles={styles} />
          )}
          {activeSection === "services" && (
            <ServicesSection content={content} onSave={saveContent} onUpload={uploadFile} onDelete={deleteFile} styles={styles} />
          )}
          {activeSection === "models" && (
            <ModelsSection content={content} onSave={saveContent} onUpload={uploadFile} onDelete={deleteFile} styles={styles} />
          )}
          {activeSection === "queries" && (
            <ContactQueriesSection showToast={showToast} styles={styles} />
          )}
          {activeSection === "applications" && (
            <ModelSubmissionsSection showToast={showToast} styles={styles} />
          )}
          {activeSection === "footer" && (
            <FooterSection content={content} onSave={saveContent} onUpload={uploadFile} onDelete={deleteFile} styles={styles} />
          )}
        </div>
      </main>

      {/* Live Upload Progress Modal Card */}
      {uploadProgress && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90%",
            maxWidth: "420px",
            background: theme === "dark" ? "#18181b" : "#ffffff",
            border: `1px solid ${theme === "dark" ? "#27272a" : "#e4e4e7"}`,
            borderRadius: "14px",
            padding: "1.25rem",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            zIndex: 99999,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: styles.text.color }}>
              Uploading {uploadProgress.fileName.length > 20 ? `${uploadProgress.fileName.slice(0, 20)}...` : uploadProgress.fileName}
            </span>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#C9A84C" }}>
              {uploadProgress.percent}%
            </span>
          </div>

          <div style={{ height: "8px", background: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                width: `${uploadProgress.percent}%`,
                height: "100%",
                background: "linear-gradient(90deg, #C9A84C 0%, #F3E5AB 100%)",
                borderRadius: "4px",
                transition: "width 0.25s ease-out",
              }}
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            background: toast.type === "err" ? "#dc2626" : "#059669",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Section Component Definitions
// ─────────────────────────────────────────────────────────

interface SectionProps {
  content: SiteContent;
  onSave: (updates: Partial<SiteContent>) => Promise<void>;
  onUpload?: (file: File, type: "image" | "video", oldPath?: string) => Promise<string | null>;
  onDelete?: (filePath: string) => Promise<void>;
  styles: AdminStyles;
}

// ── SITE INFO ──────────────────────────────────────────
function SiteSection({ content, onSave, onUpload, styles }: SectionProps) {
  const [site, setSite] = useState(content.site);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    setUploadingLogo(true);
    const uploadedUrl = await onUpload(file, "image", site.logo);
    setUploadingLogo(false);
    if (uploadedUrl) {
      setSite((prev) => ({ ...prev, logo: uploadedUrl }));
    }
  };

  return (
    <div style={styles.sectionWrap}>
      <Field label="Site Name" value={site.name} onChange={(v) => setSite({ ...site, name: v })} styles={styles} />
      <Field label="Operated By" value={site.operatedBy} onChange={(v) => setSite({ ...site, operatedBy: v })} styles={styles} />
      <Field label="Established Year" value={String(site.established)} onChange={(v) => setSite({ ...site, established: Number(v) || 2024 })} styles={styles} />
      
      {/* Site Logo Upload & Preview */}
      <div style={styles.subGroup}>
        <h3 style={styles.subTitle}>Website Logo</h3>
        {site.logo ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
            <img src={site.logo} alt="Site Logo Preview" style={{ height: "48px", width: "auto", objectFit: "contain", background: "rgba(255,255,255,0.05)", padding: "0.5rem", borderRadius: "8px" }} referrerPolicy="no-referrer" />
            <span style={{ fontSize: "0.8rem", color: styles.textMuted.color }}>Current Logo</span>
          </div>
        ) : null}
        <Field label="Logo Path / Image URL" value={site.logo} onChange={(v) => setSite({ ...site, logo: v })} styles={styles} />
        {onUpload && (
          <label style={{ ...styles.uploadLabel, width: "fit-content", marginTop: "0.5rem" }}>
            {uploadingLogo ? "Uploading Logo..." : "Upload New Logo Image"}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoUpload} disabled={uploadingLogo} />
          </label>
        )}
      </div>

      <Field label="Email" value={site.email} onChange={(v) => setSite({ ...site, email: v })} styles={styles} />
      <Field label="Footer Email" value={site.footerEmail} onChange={(v) => setSite({ ...site, footerEmail: v })} styles={styles} />
      <Field label="Footer Email Link (mailto:)" value={site.footerEmailHref} onChange={(v) => setSite({ ...site, footerEmailHref: v })} styles={styles} />

      <div style={styles.subGroup}>
        <h3 style={styles.subTitle}>Studio Location</h3>
        <Field label="Studio Name" value={site.location.studio} onChange={(v) => setSite({ ...site, location: { ...site.location, studio: v } })} styles={styles} />
        <Field label="City" value={site.location.city} onChange={(v) => setSite({ ...site, location: { ...site.location, city: v } })} styles={styles} />
        <Field label="Country" value={site.location.country} onChange={(v) => setSite({ ...site, location: { ...site.location, country: v } })} styles={styles} />
      </div>

      <div style={styles.subGroup}>
        <h3 style={styles.subTitle}>Badges</h3>
        {site.badges.map((badge, i) => (
          <div key={i} style={styles.row}>
            <input
              style={styles.inputFlex}
              value={badge}
              onChange={(e) => {
                const b = [...site.badges];
                b[i] = e.target.value;
                setSite({ ...site, badges: b });
              }}
            />
            <button style={styles.removeBtn} onClick={() => setSite({ ...site, badges: site.badges.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <button style={styles.addBtnSmall} onClick={() => setSite({ ...site, badges: [...site.badges, ""] })}>+ Add Badge</button>
      </div>

      <button style={styles.saveBtn} onClick={() => onSave({ site })}>Save Site Info</button>
    </div>
  );
}

// ── WEBSITE FONTS ───────────────────────────────────────
function FontsSection({ content, onSave, styles }: SectionProps) {
  const [headingFont, setHeadingFont] = useState(content.site.headingFont || "serif");

  const fontOptions = [
    { key: "serif", name: "Playfair Display", category: "Luxury Serif", sample: "THE FOURTH FRAME" },
    { key: "pacifico", name: "Pacifico", category: "Cursive Script", sample: "The Fourth Frame" },
    { key: "great-vibes", name: "Great Vibes", category: "Calligraphic Script", sample: "The Fourth Frame" },
    { key: "cormorant", name: "Cormorant Garamond", category: "Classic Editorial", sample: "THE FOURTH FRAME" },
    { key: "cinzel", name: "Cinzel", category: "Roman Capitals", sample: "THE FOURTH FRAME" },
  ];

  const handleSaveFont = () => {
    onSave({
      site: {
        ...content.site,
        headingFont,
      },
    });
  };

  return (
    <div style={styles.sectionWrap}>
      <div style={styles.subGroup}>
        <h3 style={styles.subTitle}>Select Website Heading & Accent Font</h3>
        <p style={styles.hint}>
          Choose the active font family for headings, titles, and accent labels across the entire website.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginTop: "0.5rem" }}>
          {fontOptions.map((opt) => {
            const isSelected = headingFont === opt.key;
            return (
              <div
                key={opt.key}
                onClick={() => setHeadingFont(opt.key)}
                style={{
                  ...styles.card,
                  cursor: "pointer",
                  border: isSelected ? "2px solid #C9A84C" : styles.card.border,
                  background: isSelected ? (styles.card.background === "#121215" ? "#1a1a22" : "#fdfbf7") : styles.card.background,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: isSelected ? "#C9A84C" : styles.textMuted.color }}>
                    {opt.name}
                  </span>
                  {isSelected && <span style={{ fontSize: "0.72rem", color: "#C9A84C", fontWeight: 800 }}>✓ ACTIVE</span>}
                </div>
                <span style={{ fontSize: "0.68rem", color: styles.hint.color }}>{opt.category}</span>
                <div
                  style={{
                    fontSize: opt.key === "great-vibes" ? "1.6rem" : opt.key === "pacifico" ? "1.2rem" : "1.1rem",
                    color: styles.text.color,
                    marginTop: "0.6rem",
                    padding: "0.5rem 0 0 0",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {opt.sample}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button style={styles.saveBtn} onClick={handleSaveFont}>Save Website Font Choice</button>
    </div>
  );
}

// ── SOCIAL LINKS ───────────────────────────────────────
function SocialSection({ content, onSave, styles }: SectionProps) {
  const [links, setLinks] = useState(content.socialLinks);

  return (
    <div style={styles.sectionWrap}>
      {links.map((link, i) => (
        <div key={i} style={styles.card}>
          <div style={styles.cardHeader}>
            <h4 style={styles.cardTitle}>{link.label || `Link #${i + 1}`}</h4>
            <button style={styles.removeBtn} onClick={() => setLinks(links.filter((_, j) => j !== i))}>Remove</button>
          </div>
          <Field label="Label" value={link.label} onChange={(v) => {
            const l = [...links];
            l[i] = { ...l[i], label: v };
            setLinks(l);
          }} styles={styles} />
          <Field label="URL (href)" value={link.href} onChange={(v) => {
            const l = [...links];
            l[i] = { ...l[i], href: v };
            setLinks(l);
          }} styles={styles} />
          <Field label="Handle" value={link.handle} onChange={(v) => {
            const l = [...links];
            l[i] = { ...l[i], handle: v };
            setLinks(l);
          }} styles={styles} />
        </div>
      ))}
      <button style={styles.addBtn} onClick={() => setLinks([...links, { label: "", href: "", handle: "" }])}>+ Add Social Link</button>
      <button style={styles.saveBtn} onClick={() => onSave({ socialLinks: links })}>Save Social Links</button>
    </div>
  );
}

// ── HERO MEDIA ─────────────────────────────────────────
function HeroSection({ content, onSave, onUpload, onDelete, styles }: SectionProps) {
  const [media, setMedia] = useState(content.heroMedia);
  const [uploading, setUploading] = useState(false);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    setUploading(true);
    const path = await onUpload(file, "video");

    if (path) {
      if (isManagedUploadPath(media.desktopVideo) && onDelete) {
        await onDelete(media.desktopVideo);
      }
      const updatedMedia = { ...media, desktopVideo: path };
      setMedia(updatedMedia);
      await onSave({ heroMedia: updatedMedia });
    }

    setUploading(false);
    e.target.value = "";
  };

  const removeVideo = async () => {
    if (isManagedUploadPath(media.desktopVideo) && onDelete) {
      await onDelete(media.desktopVideo);
    }
    setMedia({ ...media, desktopVideo: "" });
  };

  return (
    <div style={styles.sectionWrap}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Desktop & Mobile Hero Video</h3>
        <p style={styles.hint}>
          Upload MP4, WEBM, MOV, AVI, or OGG video (max {formatMaxVideoSize(MAX_ADMIN_VIDEO_BYTES)}). Save Hero Media after upload.
        </p>

        {media.desktopVideo ? (
          <div style={styles.mediaPreview}>
            <video src={formatMediaUrl(media.desktopVideo)} style={styles.previewVideo} controls muted />
            <div style={styles.mediaActions}>
              <span style={styles.mediaPath}>{media.desktopVideo}</span>
              <button style={styles.removeBtn} onClick={removeVideo}>Remove Video</button>
            </div>
          </div>
        ) : (
          <p style={styles.noMedia}>No video set</p>
        )}

        <label style={styles.uploadLabel}>
          {uploading ? "Uploading..." : "Upload Video"}
          <input
            type="file"
            accept={VIDEO_FILE_ACCEPT}
            onChange={handleVideoUpload}
            style={styles.fileInput}
            disabled={uploading}
          />
        </label>
      </div>

      <button style={styles.saveBtn} onClick={() => onSave({ heroMedia: media })}>Save Hero Media</button>
    </div>
  );
}

// ── FOUNDERS ───────────────────────────────────────────
function FoundersSection({ content, onSave, onUpload, onDelete, styles }: SectionProps) {
  const [section, setSection] = useState(content.foundersSection);
  const [founders, setFounders] = useState(content.founders);
  const [uploading, setUploading] = useState<number | null>(null);

  const updateFounder = (i: number, key: string, val: string) => {
    const f = [...founders];
    f[i] = { ...f[i], [key]: val };
    setFounders(f);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    setUploading(i);
    const path = await onUpload(file, "image");

    if (path) {
      if (isManagedUploadPath(founders[i].image) && onDelete) {
        await onDelete(founders[i].image);
      }
      const updatedFounders = [...founders];
      updatedFounders[i] = { ...updatedFounders[i], image: path };
      setFounders(updatedFounders);
      await onSave({ foundersSection: section, founders: updatedFounders });
    }

    setUploading(null);
    e.target.value = "";
  };

  return (
    <div style={styles.sectionWrap}>
      <div style={styles.subGroup}>
        <h3 style={styles.subTitle}>Section Header</h3>
        <Field label="Label" value={section.label} onChange={(v) => setSection({ ...section, label: v })} styles={styles} />
        <Field label="Title" value={section.title} onChange={(v) => setSection({ ...section, title: v })} styles={styles} />
        <Field label="Title Accent" value={section.titleAccent} onChange={(v) => setSection({ ...section, titleAccent: v })} styles={styles} />
        <Field label="Slider Speed (seconds)" value={String(section.sliderSpeed ?? 20)} onChange={(v) => setSection({ ...section, sliderSpeed: Number(v) || 20 })} styles={styles} />
      </div>

      <h3 style={styles.subTitle}>Founders</h3>
      {founders.map((f, i) => (
        <div key={i} style={styles.card}>
          <div style={styles.cardHeader}>
            <h4 style={styles.cardTitle}>{f.name || `Founder #${i + 1}`}</h4>
            <button style={styles.removeBtn} onClick={() => setFounders(founders.filter((_, j) => j !== i))}>Remove</button>
          </div>
          <Field label="Name" value={f.name} onChange={(v) => updateFounder(i, "name", v)} styles={styles} />
          <Field label="Role" value={f.role} onChange={(v) => updateFounder(i, "role", v)} styles={styles} />

          {f.image && (
            <div style={styles.mediaPreview}>
              <img src={f.image} alt={f.name} style={styles.previewImg} referrerPolicy="no-referrer" />
              <span style={styles.mediaPath}>{f.image}</span>
            </div>
          )}
          <label style={styles.uploadLabel}>
            {uploading === i ? "Uploading..." : "Upload Image"}
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, i)} style={styles.fileInput} disabled={uploading !== null} />
          </label>
        </div>
      ))}
      <button style={styles.addBtn} onClick={() => setFounders([...founders, { name: "", role: "", image: "" }])}>+ Add Founder</button>
      <button style={styles.saveBtn} onClick={() => onSave({ foundersSection: section, founders })}>Save Founders</button>
    </div>
  );
}

// ── SERVICES ──────────────────────────────────────────
function ServicesSection({ content, onSave, onUpload, onDelete, styles }: SectionProps) {
  const [section, setSection] = useState(content.servicesSection);
  const [services, setServices] = useState(content.services);
  const [uploading, setUploading] = useState<number | null>(null);

  const updateService = (i: number, key: string, val: unknown) => {
    const s = [...services];
    s[i] = { ...s[i], [key]: val };
    setServices(s);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    setUploading(i);
    const path = await onUpload(file, "video");
    if (path) {
      const oldMedia = services[i]?.video || services[i]?.image;
      if (oldMedia && isManagedUploadPath(oldMedia) && onDelete) {
        await onDelete(oldMedia);
      }
      const updatedServices = [...services];
      updatedServices[i] = { ...updatedServices[i], video: path };
      setServices(updatedServices);
      await onSave({ servicesSection: section, services: updatedServices });
    }
    setUploading(null);
    e.target.value = "";
  };

  const removeServiceVideo = async (i: number) => {
    const mediaPath = services[i]?.video || services[i]?.image;
    if (mediaPath && isManagedUploadPath(mediaPath) && onDelete) {
      await onDelete(mediaPath);
    }
    updateService(i, "video", "");
  };

  const addService = () => {
    setServices([
      ...services,
      {
        title: "",
        video: "",
        description: "",
        details: "",
        includes: [],
      },
    ]);
  };

  const saveServices = () => {
    const normalizedServices = services.map((service) => ({
      title: service.title,
      video: service.video || service.image || "",
      description: service.description || "",
      details: service.details || "",
      includes: Array.isArray(service.includes) ? service.includes : [],
    }));

    onSave({ servicesSection: section, services: normalizedServices });
  };

  return (
    <div style={styles.sectionWrap}>
      <div style={styles.subGroup}>
        <h3 style={styles.subTitle}>Section Header</h3>
        <Field label="Label" value={section.label} onChange={(v) => setSection({ ...section, label: v })} styles={styles} />
        <Field label="Title" value={section.title} onChange={(v) => setSection({ ...section, title: v })} styles={styles} />
        <Field label="Title Accent" value={section.titleAccent} onChange={(v) => setSection({ ...section, titleAccent: v })} styles={styles} />
      </div>

      <h3 style={styles.subTitle}>Services</h3>
      <p style={styles.hint}>Manage Video (MP4), Service Name, Description, Details, and Includes bullet points for each service card.</p>
      {services.map((service, i) => {
        const videoSrc = service.video || service.image;
        const includesList = Array.isArray(service.includes) ? service.includes : [];
        return (
          <div key={i} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitleField}>
                <label style={styles.fieldLabel}>Service Name</label>
                <input
                  style={styles.fieldInput}
                  value={service.title}
                  placeholder="Type service name"
                  onChange={(e) => updateService(i, "title", e.target.value)}
                />
              </div>
              <button style={styles.removeBtn} onClick={() => setServices(services.filter((_, j) => j !== i))}>Remove</button>
            </div>

            <FieldTextarea label="Description" value={service.description || ""} onChange={(v) => updateService(i, "description", v)} styles={styles} />
            <Field label="Details (e.g. TEAM | COORDINATION)" value={service.details || ""} onChange={(v) => updateService(i, "details", v)} styles={styles} />

            {videoSrc ? (
              <div style={styles.mediaPreview}>
                {isVideoUrl(videoSrc) ? (
                  <video src={formatMediaUrl(videoSrc)} style={styles.previewVideo} controls muted autoPlay playsInline />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={formatImageUrl(videoSrc)} alt={service.title || "Service media"} style={{ ...styles.previewVideo, objectFit: "cover" }} />
                )}
                <div style={styles.mediaActions}>
                  <span style={styles.mediaPath}>{videoSrc}</span>
                  <button style={styles.removeBtn} onClick={() => removeServiceVideo(i)}>Remove Media</button>
                </div>
              </div>
            ) : (
              <p style={styles.noMedia}>No media (video or image) set for this service.</p>
            )}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <label style={styles.uploadLabel}>
                {uploading === i ? "Uploading..." : "Upload Video"}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/ogg"
                  onChange={(e) => handleVideoUpload(e, i)}
                  style={styles.fileInput}
                  disabled={uploading !== null}
                />
              </label>
            </div>

            <div style={{ marginTop: "1.2rem" }}>
              <h5 style={{ ...styles.subTitle, fontSize: "0.75rem", marginBottom: "0.5rem" }}>Includes (Bullet Points)</h5>
              {includesList.map((item, j) => (
                <div key={j} style={{ ...styles.row, marginBottom: "0.5rem" }}>
                  <input
                    style={styles.inputFlex}
                    value={item}
                    placeholder="Bullet point text"
                    onChange={(e) => {
                      const updatedIncludes = [...includesList];
                      updatedIncludes[j] = e.target.value;
                      updateService(i, "includes", updatedIncludes);
                    }}
                  />
                  <button
                    style={styles.removeBtn}
                    onClick={() => {
                      const updatedIncludes = includesList.filter((_, k) => k !== j);
                      updateService(i, "includes", updatedIncludes);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button style={styles.addBtnSmall} onClick={() => updateService(i, "includes", [...includesList, ""])}>
                + Add Bullet Point
              </button>
            </div>
          </div>
        );
      })}

      <button style={styles.addBtn} onClick={addService}>+ Add Service</button>
      <button style={styles.saveBtn} onClick={saveServices}>Save Services</button>
    </div>
  );
}

// ── MODELS ────────────────────────────────────────────
function ModelsSection({ content, onSave, onUpload, onDelete, styles }: SectionProps) {
  const [section, setSection] = useState(content.modelsSection);
  const [models, setModels] = useState(content.models);
  const [uploading, setUploading] = useState<number | null>(null);

  const updateModel = (i: number, key: string, val: unknown) => {
    const m = [...models];
    m[i] = { ...m[i], [key]: val };
    setModels(m);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    setUploading(i);
    const path = await onUpload(file, "image");
    if (path) {
      if (isManagedUploadPath(models[i].image) && onDelete) {
        await onDelete(models[i].image);
      }
      const updatedModels = [...models];
      updatedModels[i] = { ...updatedModels[i], image: path };
      setModels(updatedModels);
      await onSave({ modelsSection: section, models: updatedModels });
    }
    setUploading(null);
    e.target.value = "";
  };

  return (
    <div style={styles.sectionWrap}>
      <div style={styles.subGroup}>
        <h3 style={styles.subTitle}>Section Header</h3>
        <Field label="Label" value={section.label} onChange={(v) => setSection({ ...section, label: v })} styles={styles} />
        <Field label="Title" value={section.title} onChange={(v) => setSection({ ...section, title: v })} styles={styles} />
        <Field label="Title Accent" value={section.titleAccent} onChange={(v) => setSection({ ...section, titleAccent: v })} styles={styles} />
        <Field label="Slider Speed (seconds)" value={String(section.sliderSpeed ?? 25)} onChange={(v) => setSection({ ...section, sliderSpeed: Number(v) || 25 })} styles={styles} />
      </div>

      <h3 style={styles.subTitle}>Models</h3>
      <p style={styles.hint}>JPEG images only. 1 image per model.</p>

      {models.map((model, i) => (
        <div key={i} style={styles.card}>
          <div style={styles.cardHeader}>
            <h4 style={styles.cardTitle}>{model.name || `Model #${i + 1}`}</h4>
            <button style={styles.removeBtn} onClick={() => setModels(models.filter((_, j) => j !== i))}>Remove</button>
          </div>
          <Field label="Name (Required)" value={model.name} onChange={(v) => updateModel(i, "name", v)} styles={styles} />
          <Field label="Height (Optional)" value={model.height || ""} onChange={(v) => updateModel(i, "height", v)} styles={styles} />
          <Field label="Hair (Optional)" value={model.hair || ""} onChange={(v) => updateModel(i, "hair", v)} styles={styles} />
          <Field label="Eyes (Optional)" value={model.eyes || ""} onChange={(v) => updateModel(i, "eyes", v)} styles={styles} />

          {model.image && (
            <div style={styles.mediaPreview}>
              <img src={model.image} alt={model.name} style={styles.previewImg} referrerPolicy="no-referrer" />
              <span style={styles.mediaPath}>{model.image}</span>
            </div>
          )}
          <label style={styles.uploadLabel}>
            {uploading === i ? "Uploading..." : "Upload JPEG"}
            <input type="file" accept="image/jpeg" onChange={(e) => handleImageUpload(e, i)} style={styles.fileInput} disabled={uploading !== null} />
          </label>
        </div>
      ))}

      <button style={styles.addBtn} onClick={() => setModels([...models, { id: Date.now(), name: "", height: "", hair: "", eyes: "", image: "" }])}>+ Add Model</button>
      <button style={styles.saveBtn} onClick={() => onSave({ modelsSection: section, models })}>Save Models</button>
    </div>
  );
}

// ── CONTACT QUERIES SECTION (LIST VIEW + SEARCH + 10 PAGINATION) ───
function ContactQueriesSection({ showToast, styles }: { showToast: (msg: string, type?: "ok" | "err") => void; styles: AdminStyles }) {
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadQueries = useCallback(async (pageToLoad: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contact-queries?page=${pageToLoad}&limit=10`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load contact queries");
      setQueries(data.queries || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalQueries || 0);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load contact queries", "err");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadQueries(1);
  }, [loadQueries]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact query?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/contact-queries?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setQueries((prev) => prev.filter((q) => q._id !== id));
      showToast("Contact query deleted");
      loadQueries(page);
    } catch {
      showToast("Failed to delete contact query", "err");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredQueries = queries.filter((q) => {
    const term = searchQuery.toLowerCase();
    return (
      q.name.toLowerCase().includes(term) ||
      q.email.toLowerCase().includes(term) ||
      q.interest.toLowerCase().includes(term) ||
      q.timeline.toLowerCase().includes(term) ||
      q.message.toLowerCase().includes(term)
    );
  });

  return (
    <div style={styles.sectionWrap}>
      {/* Top Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: styles.text.color }}>
            Contact Queries ({totalCount})
          </h3>
          <p style={styles.hint}>Showing 10 items per page</p>
        </div>

        {/* Local Search Input */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flex: 1, maxWidth: "360px" }}>
          <input
            style={{ ...styles.fieldInput, padding: "0.5rem 0.8rem", fontSize: "0.82rem" }}
            placeholder="🔍 Search name, email, interest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button style={styles.addBtnSmall} onClick={() => loadQueries(page)}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: styles.textMuted.color }}>Loading contact queries...</p>
      ) : filteredQueries.length === 0 ? (
        <div style={styles.card}>
          <p style={styles.noMedia}>{searchQuery ? "No matching queries found." : "No contact queries received yet."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {/* List Table Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1.8fr 1.1fr 1fr 1.1fr 170px",
              gap: "0.75rem",
              padding: "0.7rem 1rem",
              background: styles.subGroup.background,
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: styles.textMuted.color,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              alignItems: "center",
            }}
          >
            <span>Client Name</span>
            <span>Email</span>
            <span>Interest</span>
            <span>Timeline</span>
            <span>Date</span>
            <span style={{ textAlign: "right" }}>Action</span>
          </div>

          {/* List Rows */}
          {filteredQueries.map((q) => {
            const isExpanded = expandedId === q._id;
            return (
              <div
                key={q._id}
                style={{
                  background: styles.card.background,
                  border: `1px solid ${isExpanded ? "#C9A84C" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "10px",
                  overflow: "hidden",
                  transition: "border-color 0.2s ease",
                }}
              >
                {/* Main Row Bar */}
                <div
                  onClick={() => q._id && setExpandedId(isExpanded ? null : q._id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1.8fr 1.1fr 1fr 1.1fr 170px",
                    gap: "0.75rem",
                    padding: "0.85rem 1rem",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ fontWeight: 700, color: styles.text.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.name}</span>
                  <span style={{ color: styles.textMuted.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.email}</span>
                  <span style={{ color: "#C9A84C", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.interest}</span>
                  <span style={{ color: styles.text.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.timeline}</span>
                  <span style={{ fontSize: "0.75rem", color: styles.hint.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {new Date(q.createdAt).toLocaleDateString()}
                  </span>

                  <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", alignItems: "center" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (q._id) setExpandedId(isExpanded ? null : q._id);
                      }}
                      style={styles.addBtnSmall}
                    >
                      {isExpanded ? "Close ▲" : "View Brief ▼"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (q._id) handleDelete(q._id);
                      }}
                      style={styles.removeBtn}
                      disabled={deletingId === q._id}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Expanded Brief Drawer */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "1rem 1.25rem",
                      background: styles.subGroup.background,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#C9A84C", letterSpacing: "0.1em", display: "block", marginBottom: "0.4rem" }}>
                      PROJECT BRIEF / FULL MESSAGE
                    </span>
                    <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: "1.6", color: styles.text.color, whiteSpace: "pre-wrap" }}>
                      {q.message}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            disabled={page <= 1 || loading}
            onClick={() => loadQueries(page - 1)}
            style={{
              ...styles.addBtnSmall,
              opacity: page <= 1 ? 0.4 : 1,
              cursor: page <= 1 ? "not-allowed" : "pointer",
            }}
          >
            ← Previous Page
          </button>
          <span style={{ fontSize: "0.82rem", color: styles.textMuted.color, fontWeight: 600 }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => loadQueries(page + 1)}
            style={{
              ...styles.addBtnSmall,
              opacity: page >= totalPages ? 0.4 : 1,
              cursor: page >= totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next Page →
          </button>
        </div>
      )}
    </div>
  );
}

// ── MODEL SUBMISSIONS SECTION (LIST VIEW + SEARCH + 10 PAGINATION) ───
function ModelSubmissionsSection({ showToast, styles }: { showToast: (msg: string, type?: "ok" | "err") => void; styles: AdminStyles }) {
  const [submissions, setSubmissions] = useState<ModelSubmission[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const ITEMS_PER_PAGE = 10;

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/model-submissions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load submissions");
      setSubmissions(data.submissions || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load model applications", "err");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleDeleteModel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/model-submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setSubmissions((prev) => prev.filter((item) => item._id !== id));
      showToast("Submission deleted");
    } catch {
      showToast("Failed to delete submission", "err");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const term = searchQuery.toLowerCase();
    return (
      sub.fullname.toLowerCase().includes(term) ||
      sub.email.toLowerCase().includes(term) ||
      sub.contact.toLowerCase().includes(term) ||
      sub.city.toLowerCase().includes(term) ||
      sub.height.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE) || 1;
  const paginatedSubmissions = filteredSubmissions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div style={styles.sectionWrap}>
      {/* Top Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: styles.text.color }}>
            Model Applications ({filteredSubmissions.length})
          </h3>
          <p style={styles.hint}>Showing 10 items per page</p>
        </div>

        {/* Local Search Input */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flex: 1, maxWidth: "360px" }}>
          <input
            style={{ ...styles.fieldInput, padding: "0.5rem 0.8rem", fontSize: "0.82rem" }}
            placeholder="🔍 Search model name, city, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
          <button style={styles.addBtnSmall} onClick={loadSubmissions}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: styles.textMuted.color }}>Loading model applications...</p>
      ) : paginatedSubmissions.length === 0 ? (
        <div style={styles.card}>
          <p style={styles.noMedia}>{searchQuery ? "No matching model applications." : "No model applications received yet."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {/* List Table Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1.8fr 1.1fr 1fr 1.1fr 170px",
              gap: "0.75rem",
              padding: "0.7rem 1rem",
              background: styles.subGroup.background,
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: styles.textMuted.color,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              alignItems: "center",
            }}
          >
            <span>Model Name</span>
            <span>Email</span>
            <span>Contact</span>
            <span>City</span>
            <span>Height / Age</span>
            <span style={{ textAlign: "right" }}>Action</span>
          </div>

          {/* List Rows */}
          {paginatedSubmissions.map((sub) => {
            const isExpanded = expandedId === sub._id;
            return (
              <div
                key={sub._id}
                style={{
                  background: styles.card.background,
                  border: `1px solid ${isExpanded ? "#C9A84C" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "10px",
                  overflow: "hidden",
                  transition: "border-color 0.2s ease",
                }}
              >
                {/* Main Row Bar */}
                <div
                  onClick={() => sub._id && setExpandedId(isExpanded ? null : sub._id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1.8fr 1.1fr 1fr 1.1fr 170px",
                    gap: "0.75rem",
                    padding: "0.85rem 1rem",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ fontWeight: 700, color: styles.text.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.fullname}</span>
                  <span style={{ color: styles.textMuted.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.email}</span>
                  <span style={{ color: styles.text.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.contact}</span>
                  <span style={{ color: "#C9A84C", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.city}</span>
                  <span style={{ color: styles.text.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.height} / {sub.age} yrs</span>

                  <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", alignItems: "center" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (sub._id) setExpandedId(isExpanded ? null : sub._id);
                      }}
                      style={styles.addBtnSmall}
                    >
                      {isExpanded ? "Hide ▲" : `Media (${sub.images?.length || 0}) ▼`}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (sub._id) handleDeleteModel(sub._id);
                      }}
                      style={styles.removeBtn}
                      disabled={deletingId === sub._id}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Expanded Media Gallery Drawer */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "1.2rem",
                      background: styles.subGroup.background,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#C9A84C", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
                        SUBMITTED PHOTOS ({sub.images?.length || 0})
                      </span>
                      <div style={styles.submissionImageGrid}>
                        {sub.images?.map((img, i) => {
                          const formattedImg = formatImageUrl(img);
                          return (
                            <a key={i} href={formattedImg} target="_blank" rel="noreferrer" style={styles.submissionMediaLink}>
                              <img src={formattedImg} alt={`Submission photo ${i + 1}`} style={styles.submissionImg} referrerPolicy="no-referrer" />
                            </a>
                          );
                        })}
                      </div>
                    </div>

                    {sub.video && (
                      <div>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#C9A84C", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
                          SUBMITTED VIDEO
                        </span>
                        <video src={formatMediaUrl(sub.video)} controls style={{ width: "100%", maxWidth: "380px", borderRadius: "8px" }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{
              ...styles.addBtnSmall,
              opacity: page <= 1 ? 0.4 : 1,
              cursor: page <= 1 ? "not-allowed" : "pointer",
            }}
          >
            ← Previous Page
          </button>
          <span style={{ fontSize: "0.82rem", color: styles.textMuted.color, fontWeight: 600 }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            style={{
              ...styles.addBtnSmall,
              opacity: page >= totalPages ? 0.4 : 1,
              cursor: page >= totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next Page →
          </button>
        </div>
      )}
    </div>
  );
}

// ── FOOTER ────────────────────────────────────────────
function FooterSection({ content, onSave, onUpload, onDelete, styles }: SectionProps) {
  const [footer, setFooter] = useState(content.footer);
  const [uploading, setUploading] = useState(false);

  const handleCtaVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    setUploading(true);
    const path = await onUpload(file, "video");

    if (path) {
      if (isManagedUploadPath(footer.ctaVideoSrc) && onDelete) {
        await onDelete(footer.ctaVideoSrc);
      }
      const updatedFooter = { ...footer, ctaVideoSrc: path };
      setFooter(updatedFooter);
      await onSave({ footer: updatedFooter });
    }

    setUploading(false);
    e.target.value = "";
  };

  const removeCtaVideo = async () => {
    if (isManagedUploadPath(footer.ctaVideoSrc) && onDelete) {
      await onDelete(footer.ctaVideoSrc);
    }

    setFooter({ ...footer, ctaVideoSrc: "" });
  };

  return (
    <div style={styles.sectionWrap}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>CTA Video</h3>
        <p style={styles.hint}>
          Upload MP4, WEBM, MOV, AVI, or OGG video (max {formatMaxVideoSize(MAX_ADMIN_VIDEO_BYTES)}). Save Footer after upload.
        </p>
        {footer.ctaVideoSrc ? (
          <div style={styles.mediaPreview}>
            <video src={formatMediaUrl(footer.ctaVideoSrc)} style={styles.previewVideo} controls muted />
            <div style={styles.mediaActions}>
              <span style={styles.mediaPath}>{footer.ctaVideoSrc}</span>
              <button style={styles.removeBtn} onClick={removeCtaVideo}>Remove</button>
            </div>
          </div>
        ) : (
          <p style={styles.noMedia}>No CTA video set</p>
        )}
        <label style={styles.uploadLabel}>
          {uploading ? "Uploading..." : "Upload Video"}
          <input type="file" accept={VIDEO_FILE_ACCEPT} onChange={handleCtaVideoUpload} style={styles.fileInput} disabled={uploading} />
        </label>
      </div>

      <FieldTextarea label="Description" value={footer.description} onChange={(v) => setFooter({ ...footer, description: v })} styles={styles} />

      <div style={styles.subGroup}>
        <h3 style={styles.subTitle}>Heading Lines</h3>
        {footer.heading.map((line, i) => (
          <Field key={i} label={`Line ${i + 1}`} value={line} onChange={(v) => {
            const h = [...footer.heading];
            h[i] = v;
            setFooter({ ...footer, heading: h });
          }} styles={styles} />
        ))}
      </div>

      <div style={styles.subGroup}>
        <h3 style={styles.subTitle}>Team</h3>
        <Field label="Team Title" value={footer.team.title} onChange={(v) => setFooter({ ...footer, team: { ...footer.team, title: v } })} styles={styles} />
        <Field label="Marketing" value={footer.team.marketing} onChange={(v) => setFooter({ ...footer, team: { ...footer.team, marketing: v } })} styles={styles} />

        <h4 style={{ ...styles.subTitle, fontSize: "0.7rem", marginTop: "1rem" }}>Members</h4>
        {footer.team.members.map((m, i) => (
          <div key={i} style={styles.row}>
            <input
              style={styles.inputFlex}
              value={m.name}
              placeholder="Name"
              onChange={(e) => {
                const members = [...footer.team.members];
                members[i] = { ...members[i], name: e.target.value };
                setFooter({ ...footer, team: { ...footer.team, members } });
              }}
            />
            <input
              style={styles.inputFlex}
              value={m.role}
              placeholder="Role"
              onChange={(e) => {
                const members = [...footer.team.members];
                members[i] = { ...members[i], role: e.target.value };
                setFooter({ ...footer, team: { ...footer.team, members } });
              }}
            />
            <button style={styles.removeBtn} onClick={() => {
              const members = footer.team.members.filter((_, j) => j !== i);
              setFooter({ ...footer, team: { ...footer.team, members } });
            }}>✕</button>
          </div>
        ))}
        <button style={styles.addBtnSmall} onClick={() => {
          setFooter({ ...footer, team: { ...footer.team, members: [...footer.team.members, { name: "", role: "" }] } });
        }}>+ Add Member</button>
      </div>

      <div style={styles.subGroup}>
        <h3 style={styles.subTitle}>Studio Locations</h3>
        {footer.studioLocations.map((loc, i) => (
          <div key={i} style={styles.row}>
            <input
              style={styles.inputFlex}
              value={loc.city}
              placeholder="City"
              onChange={(e) => {
                const locs = [...footer.studioLocations];
                locs[i] = { ...locs[i], city: e.target.value };
                setFooter({ ...footer, studioLocations: locs });
              }}
            />
            <input
              style={styles.inputFlex}
              value={loc.note}
              placeholder="Note"
              onChange={(e) => {
                const locs = [...footer.studioLocations];
                locs[i] = { ...locs[i], note: e.target.value };
                setFooter({ ...footer, studioLocations: locs });
              }}
            />
            <button style={styles.removeBtn} onClick={() => {
              setFooter({ ...footer, studioLocations: footer.studioLocations.filter((_, j) => j !== i) });
            }}>✕</button>
          </div>
        ))}
        <button style={styles.addBtnSmall} onClick={() => {
          setFooter({ ...footer, studioLocations: [...footer.studioLocations, { city: "", note: "" }] });
        }}>+ Add Location</button>
      </div>

      <div style={styles.subGroup}>
        <h3 style={styles.subTitle}>CTA Headline Overlay Text</h3>
        <p style={styles.hint}>
          Text displayed over the footer CTA video (e.g. &quot;Build visuals that look premium before production even starts.&quot;). Leave empty to hide.
        </p>
        <FieldTextarea label="CTA Headline" value={footer.ctaHeadline || ""} onChange={(v) => setFooter({ ...footer, ctaHeadline: v })} styles={styles} />
      </div>

      <button style={styles.saveBtn} onClick={() => onSave({ footer })}>Save Footer</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Reusable Form Controls
// ─────────────────────────────────────────────────────────

function Field({ label, value, onChange, styles }: { label: string; value: string; onChange: (v: string) => void; styles: AdminStyles }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.fieldLabel}>{label}</label>
      <input style={styles.fieldInput} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, styles }: { label: string; value: string; onChange: (v: string) => void; styles: AdminStyles }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.fieldLabel}>{label}</label>
      <textarea style={{ ...styles.fieldInput, minHeight: "80px", resize: "vertical" as const }} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Dynamic Theme Styles Definition
// ─────────────────────────────────────────────────────────

type AdminStyles = Record<string, React.CSSProperties>;

function getThemeStyles(theme: "dark" | "light"): AdminStyles {
  const isDark = theme === "dark";

  const bg = isDark ? "#09090b" : "#f8fafc";
  const text = isDark ? "#fafafa" : "#0f172a";
  const textMuted = isDark ? "#a1a1aa" : "#475569";
  const textDim = isDark ? "#71717a" : "#94a3b8";
  const border = isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0";
  const cardBg = isDark ? "#121215" : "#ffffff";
  const subGroupBg = isDark ? "#17171c" : "#f1f5f9";
  const inputBg = isDark ? "#1a1a20" : "#ffffff";
  const inputBorder = isDark ? "rgba(255, 255, 255, 0.14)" : "#cbd5e1";

  return {
    layout: {
      display: "flex",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
    },
    bg: { background: bg },
    text: { color: text },
    textMuted: { color: textMuted },
    sidebar: {
      width: "250px",
      background: cardBg,
      borderRight: `1px solid ${border}`,
      padding: "1.5rem",
      display: "flex",
      flexDirection: "column",
      position: "sticky",
      top: 0,
      height: "100vh",
      flexShrink: 0,
    },
    sidebarLogo: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      marginBottom: "1.8rem",
      paddingBottom: "1.2rem",
      borderBottom: `1px solid ${border}`,
    },
    logoMark: {
      width: "36px",
      height: "36px",
      borderRadius: "8px",
      background: "linear-gradient(135deg, #C9A84C, #8B6914)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#0A0A0A",
      fontWeight: 800,
      fontSize: "0.75rem",
    },
    logoText: {
      color: text,
      fontWeight: 700,
      fontSize: "0.85rem",
      letterSpacing: "0.15em",
    },
    nav: {
      display: "flex",
      flexDirection: "column",
      gap: "0.35rem",
      flex: 1,
    },
    navBtn: {
      background: "transparent",
      border: "none",
      color: textMuted,
      padding: "0.7rem 0.85rem",
      borderRadius: "8px",
      textAlign: "left" as const,
      cursor: "pointer",
      fontSize: "0.84rem",
      fontWeight: 500,
      transition: "all 0.15s",
    },
    navBtnActive: {
      background: isDark ? "#1c1c22" : "#ffffff",
      border: `1px solid ${isDark ? "rgba(201,168,76,0.35)" : "#cbd5e1"}`,
      color: isDark ? "#F3E5AB" : "#8B6914",
      fontWeight: 700,
      boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.25)" : "0 2px 4px rgba(0,0,0,0.04)",
    },
    logoutBtn: {
      background: "transparent",
      border: `1px solid ${border}`,
      color: textDim,
      padding: "0.65rem",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "0.7rem",
      fontWeight: 600,
      letterSpacing: "0.15em",
      marginTop: "1rem",
    },
    main: {
      flex: 1,
      padding: "2rem 3rem",
      overflowY: "auto" as const,
      maxHeight: "100vh",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "2rem",
      paddingBottom: "1.2rem",
      borderBottom: `1px solid ${border}`,
    },
    headerTitle: {
      color: text,
      fontSize: "1.6rem",
      fontWeight: 700,
      margin: 0,
    },
    themeBtn: {
      background: isDark ? "#1e1e24" : "#ffffff",
      border: `1px solid ${border}`,
      color: text,
      borderRadius: "20px",
      padding: "0.45rem 1rem",
      fontSize: "0.78rem",
      fontWeight: 600,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem",
      boxShadow: isDark ? "none" : "0 2px 5px rgba(0,0,0,0.05)",
    },
    savingBadge: {
      background: "rgba(201,168,76,0.2)",
      color: "#C9A84C",
      padding: "0.35rem 0.85rem",
      borderRadius: "6px",
      fontSize: "0.72rem",
      fontWeight: 600,
      letterSpacing: "0.1em",
    },
    content: {
      width: "100%",
      maxWidth: "100%",
    },
    center: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
    },
    spinner: {
      width: "36px",
      height: "36px",
      border: `3px solid ${border}`,
      borderTopColor: "#C9A84C",
      borderRadius: "50%",
      animation: "spin 0.6s linear infinite",
    },
    sectionWrap: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "1.2rem",
    },
    subGroup: {
      background: subGroupBg,
      border: `1px solid ${border}`,
      borderRadius: "14px",
      padding: "1.4rem",
      display: "flex",
      flexDirection: "column" as const,
      gap: "0.85rem",
      boxShadow: isDark ? "0 4px 15px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
    },
    subTitle: {
      color: textMuted,
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase" as const,
      margin: 0,
    },
    card: {
      background: cardBg,
      border: `1px solid ${border}`,
      borderRadius: "14px",
      padding: "1.4rem",
      display: "flex",
      flexDirection: "column" as const,
      gap: "0.85rem",
      boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 2px 10px rgba(0,0,0,0.04)",
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardTitle: {
      color: text,
      fontSize: "0.95rem",
      fontWeight: 600,
      margin: 0,
    },
    cardTitleField: {
      flex: 1,
      display: "flex",
      flexDirection: "column" as const,
      gap: "0.35rem",
    },
    row: {
      display: "flex",
      gap: "0.5rem",
      alignItems: "center",
    },
    inputFlex: {
      flex: 1,
      background: inputBg,
      border: `1px solid ${inputBorder}`,
      borderRadius: "8px",
      padding: "0.65rem 0.85rem",
      color: text,
      fontSize: "0.85rem",
      outline: "none",
    },
    fieldWrap: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "0.4rem",
    },
    fieldLabel: {
      color: textMuted,
      fontSize: "0.7rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
    },
    fieldInput: {
      background: inputBg,
      border: `1px solid ${inputBorder}`,
      borderRadius: "8px",
      padding: "0.7rem 0.9rem",
      color: text,
      fontSize: "0.85rem",
      outline: "none",
      width: "100%",
      boxSizing: "border-box" as const,
    },
    saveBtn: {
      background: "linear-gradient(135deg, #C9A84C, #8B6914)",
      color: "#0A0A0A",
      border: "none",
      borderRadius: "10px",
      padding: "0.85rem 1.6rem",
      fontSize: "0.82rem",
      fontWeight: 700,
      letterSpacing: "0.1em",
      cursor: "pointer",
      marginTop: "1rem",
      alignSelf: "flex-start",
      boxShadow: "0 4px 15px rgba(201,168,76,0.25)",
    },
    addBtn: {
      background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
      border: `1px dashed ${inputBorder}`,
      borderRadius: "10px",
      padding: "0.75rem",
      color: textMuted,
      fontSize: "0.82rem",
      cursor: "pointer",
      textAlign: "center" as const,
    },
    addBtnSmall: {
      background: "transparent",
      border: "none",
      color: isDark ? "#C9A84C" : "#8B6914",
      fontSize: "0.78rem",
      cursor: "pointer",
      padding: "0.3rem 0",
      fontWeight: 700,
      alignSelf: "flex-start",
    },
    removeBtn: {
      background: isDark ? "rgba(220,38,38,0.15)" : "#fee2e2",
      border: `1px solid ${isDark ? "rgba(220,38,38,0.25)" : "#fca5a5"}`,
      color: isDark ? "#fca5a5" : "#991b1b",
      borderRadius: "6px",
      padding: "0.35rem 0.65rem",
      fontSize: "0.72rem",
      cursor: "pointer",
      fontWeight: 600,
      flexShrink: 0,
    },
    hint: {
      color: textDim,
      fontSize: "0.78rem",
      fontStyle: "italic" as const,
      margin: 0,
    },
    mediaPreview: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "0.5rem",
    },
    previewImg: {
      width: "120px",
      height: "120px",
      objectFit: "cover" as const,
      borderRadius: "8px",
      border: `1px solid ${border}`,
    },
    previewVideo: {
      width: "100%",
      maxWidth: "320px",
      borderRadius: "8px",
      border: `1px solid ${border}`,
    },
    submissionMetaGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: "0.75rem",
    },
    submissionMetaItem: {
      background: subGroupBg,
      border: `1px solid ${border}`,
      borderRadius: "8px",
      padding: "0.75rem",
      display: "flex",
      flexDirection: "column" as const,
      gap: "0.35rem",
    },
    submissionMetaValue: {
      color: text,
      fontSize: "0.86rem",
      fontWeight: 600,
      wordBreak: "break-word" as const,
    },
    submissionImageGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
      gap: "0.75rem",
    },
    submissionMediaLink: {
      display: "block",
      borderRadius: "8px",
      overflow: "hidden",
      border: `1px solid ${border}`,
      background: subGroupBg,
    },
    submissionImg: {
      width: "100%",
      aspectRatio: "1 / 1",
      objectFit: "cover" as const,
      display: "block",
    },
    mediaPath: {
      color: textDim,
      fontSize: "0.72rem",
      wordBreak: "break-all" as const,
    },
    mediaActions: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    noMedia: {
      color: textDim,
      fontSize: "0.82rem",
      fontStyle: "italic" as const,
    },
    uploadLabel: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      background: inputBg,
      border: `1px solid ${inputBorder}`,
      borderRadius: "8px",
      padding: "0.55rem 1.1rem",
      color: textMuted,
      fontSize: "0.78rem",
      fontWeight: 600,
      cursor: "pointer",
      alignSelf: "flex-start",
    },
    fileInput: {
      display: "none",
    },
    toast: {
      position: "fixed" as const,
      bottom: "2rem",
      right: "2rem",
      padding: "0.85rem 1.6rem",
      borderRadius: "10px",
      color: "#fff",
      fontSize: "0.85rem",
      fontWeight: 600,
      zIndex: 99999,
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    },
  };
}
