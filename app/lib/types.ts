// ─────────────────────────────────────────────────────────
// Shared TypeScript interfaces for site content (MongoDB)
// ─────────────────────────────────────────────────────────

export interface SiteData {
  name: string;
  operatedBy: string;
  established: number;
  logo: string;
  email: string;
  footerEmail: string;
  footerEmailHref: string;
  location: {
    studio: string;
    city: string;
    country: string;
  };
  badges: string[];
}

export interface SocialLink {
  label: string;
  href: string;
  handle: string;
}

export interface HeroMedia {
  desktopVideo: string;
  mobileVideo: string;
}

export interface SectionHeader {
  label: string;
  title: string;
  titleAccent: string;
  sliderSpeed?: number;
}

export interface Founder {
  name: string;
  role: string;
  image: string;
}

export interface Service {
  index?: string;
  title: string;
  video: string;
  image?: string;
  description?: string;
  details?: string;
  includes?: string[];
}

export interface Model {
  id: number;
  name: string;
  height: string;
  hair: string;
  eyes: string;
  image: string;
}

export interface ContactSectionData {
  label: string;
  title: string;
  titleAccent: string;
  submitButtonText: string;
  successTitle: string;
  successMessage: string;
}

export interface ModelSubmission {
  _id?: string;
  fullname: string;
  email: string;
  contact: string;
  age: string;
  height: string;
  city: string;
  images: string[];
  video: string | null;
  createdAt: string;
}

export interface FooterTeamMember {
  name: string;
  role: string;
}

export interface FooterData {
  ctaVideoSrc: string;
  ctaHeadline: string;
  heading: string[];
  description: string;
  team: {
    title: string;
    marketing: string;
    members: FooterTeamMember[];
  };
  studioLocations: { city: string; note: string }[];
}

export interface SiteContent {
  _id?: string;
  site: SiteData;
  socialLinks: SocialLink[];
  heroMedia: HeroMedia;
  foundersSection: SectionHeader;
  founders: Founder[];
  servicesSection: SectionHeader;
  services: Service[];
  modelsSection: SectionHeader;
  models: Model[];
  contactSection: ContactSectionData;
  contactFormInterests: string[];
  footer: FooterData;
}
