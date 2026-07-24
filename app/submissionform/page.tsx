import type { Metadata } from "next";
import SubmissionFormSection from "../components/SubmissionFormSection";
import { getSiteContent } from "../lib/data";

export const metadata: Metadata = {
  title: "Join as Model | The Fourth Frame",
  description: "Apply to join The Fourth Frame model roster. Upload your photos and video application.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SubmissionFormPage() {
  const content = await getSiteContent();

  return (
    <>
      <div className="page-hero">
        <div className="section-label">
          <span className="section-label-line" />
          Model Application
          <span className="section-label-line" />
        </div>
        <h1>
          Join <span className="accent-text">The Frame</span> Roster
        </h1>
        <p>
          Fill out the application below with your details, clear polaroids/photos, and a short video introduction. Our casting directors review submissions weekly.
        </p>
      </div>

      <SubmissionFormSection
        site={content.site}
        socialLinks={content.socialLinks}
        contactSection={content.contactSection}
        contactFormInterests={content.contactFormInterests}
      />
    </>
  );
}
