import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: Record<string, any>;
  pageType?:
    | "candidate-dashboard"
    | "employer-dashboard"
    | "profile"
    | "analytics"
    | "landing"
    | "default";
}

/**
 * Predefined SEO configurations for common page types
 */
const pageConfigs = {
  "candidate-dashboard": {
    title: "Candidate Dashboard | Lune",
    description:
      "Manage your skills, assessments, and career growth. Access your portfolio, credentials, and job recommendations on the Lune platform.",
    keywords:
      "candidate dashboard, skill verification, career growth, assessments, credentials, job opportunities",
    type: "website",
  },
  "employer-dashboard": {
    title: "Employer Dashboard | Lune",
    description:
      "Find and verify top talent. Browse verified candidates, manage job postings, and build your dream team with AI-powered skill matching.",
    keywords:
      "employer dashboard, hiring, talent verification, candidate search, recruitment",
    type: "website",
  },
  profile: {
    title: "User Profile | Lune",
    description:
      "Manage your Lune profile, account settings, credentials, and security preferences.",
    keywords: "profile, account settings, credentials, security",
    type: "profile",
  },
  analytics: {
    title: "Analytics Dashboard | Lune",
    description:
      "View detailed analytics and insights about your skill assessments, progress, and market positioning.",
    keywords:
      "analytics, insights, skill progress, market data, performance metrics",
    type: "website",
  },
  landing: {
    title: "Lune | Talent Beyond Borders",
    description:
      "AI-powered skill verification and talent assessment platform. Get verified, get hired. Find top talent globally.",
    keywords:
      "remote work, skill verification, AI assessment, talent platform, tech hiring, global recruitment",
    type: "website",
  },
  default: {
    title: "Lune | Talent Beyond Borders",
    description:
      "AI-powered skill verification and talent assessment platform. Get verified, get hired.",
    keywords:
      "remote work, skill verification, AI assessment, talent platform, tech hiring",
    type: "website",
  },
};

/**
 * Get the appropriate OG image based on page type
 */
const getOGImage = (pageType?: string): string => {
  // Use existing assets when appropriate, otherwise use the hero illustration
  // In production, you may want to generate social cards dynamically
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://lune.platform";

  switch (pageType) {
    case "candidate-dashboard":
    case "employer-dashboard":
      return `${baseUrl}/assets/hero_3d_illustration_1768418058502.png`;
    case "analytics":
      return `${baseUrl}/assets/ui_mockup_ide_1768418073547.png`;
    default:
      // Use hero illustration as default OG image
      return `${baseUrl}/assets/hero_3d_illustration_1768418058502.png`;
  }
};

/**
 * Generate structured data for rich snippets
 */
const generateStructuredData = (
  pageType?: string,
  customData?: Record<string, any>,
): Record<string, any> => {
  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lune",
    url: "https://lune.platform",
    logo: "https://lune.platform/assets/hero_3d_illustration_1768418058502.png",
    description: "AI-powered skill verification and talent assessment platform",
    sameAs: [
      "https://twitter.com/luneplatform",
      "https://linkedin.com/company/lune",
    ],
  };

  if (pageType === "candidate-dashboard") {
    return {
      ...baseStructuredData,
      "@type": "WebApplication",
      name: "Lune Candidate Dashboard",
      applicationCategory: "CareerTools",
      offers: {
        "@type": "Offer",
        description: "Skill verification and career growth tools",
      },
    };
  }

  if (pageType === "employer-dashboard") {
    return {
      ...baseStructuredData,
      "@type": "WebApplication",
      name: "Lune Employer Dashboard",
      applicationCategory: "RecruitmentTool",
      offers: {
        "@type": "Offer",
        description: "Find and verify top talent globally",
      },
    };
  }

  return { ...baseStructuredData, ...customData };
};

/**
 * SEO Component - Manages all meta tags and SEO-related head content
 * Supports predefined page types for consistency across the platform
 *
 * @example
 * // Using predefined page type
 * <SEO pageType="candidate-dashboard" />
 *
 * // Using custom props
 * <SEO
 *   title="Custom Title"
 *   description="Custom description"
 *   pageType="landing"
 * />
 */
export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type,
  structuredData,
  pageType = "default",
}) => {
  // Get config for page type
  const config = pageConfigs[pageType] || pageConfigs.default;

  // Use provided values or fall back to config defaults
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalKeywords = keywords || config.keywords;
  const finalImage = image || getOGImage(pageType);
  const finalUrl =
    url ||
    (typeof window !== "undefined"
      ? window.location.href
      : "https://lune.platform");
  const finalType = type || config.type;

  // Ensure title has proper format
  const siteTitle =
    finalTitle === config.title ? finalTitle : `${finalTitle} | Lune`;

  // Generate structured data
  const finalStructuredData =
    structuredData || generateStructuredData(pageType);

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=5"
      />
      <meta name="theme-color" content="#1F4D48" />
      <link rel="canonical" href={finalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={finalType} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:site_name" content="Lune" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:site" content="@luneplatform" />

      {/* Additional Meta Tags */}
      <meta name="author" content="Lune" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />

      {/* Structured Data */}
      {finalStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(finalStructuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
