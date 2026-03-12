import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: string;
    structuredData?: Record<string, any>;
}

export const SEO: React.FC<SEOProps> = ({
    title = "Lune | Talent Beyond Borders",
    description = "Blockchain-powered skill verification and AI-driven talent assessment platform. Get verified, get hired.",
    keywords = "remote work, skill verification, blockchain, AI assessment, talent platform, crypto hiring",
    image = "/images/og-image.png",
    url = "https://lune.platform",
    type = "website",
    structuredData
}) => {
    const siteTitle = title === "Lune | Talent Beyond Borders" ? title : `${title} | Lune`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />
            <meta property="og:site_name" content="Lune" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
};
