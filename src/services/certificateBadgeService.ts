/**
 * Certificate Badge Generator
 * Creates visual NFT-style badges for blockchain certificates
 */

export interface CertificateData {
    recipientName: string;
    skill: string;
    score: number;
    difficulty: 'Beginner' | 'Mid-Level' | 'Advanced';
    issuedAt: Date;
    blockchainHash: string;
    certificateId: string;
}

export interface BadgeStyle {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    borderGradient: string;
    glowColor: string;
}

// Badge styles based on difficulty
const BADGE_STYLES: Record<string, BadgeStyle> = {
    'Beginner': {
        primaryColor: '#10B981',    // Emerald
        secondaryColor: '#059669',
        accentColor: '#34D399',
        borderGradient: 'linear-gradient(135deg, #10B981, #059669)',
        glowColor: 'rgba(16, 185, 129, 0.4)',
    },
    'Mid-Level': {
        primaryColor: '#3B82F6',    // Blue
        secondaryColor: '#2563EB',
        accentColor: '#60A5FA',
        borderGradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
        glowColor: 'rgba(59, 130, 246, 0.4)',
    },
    'Advanced': {
        primaryColor: '#F59E0B',    // Amber/Gold
        secondaryColor: '#D97706',
        accentColor: '#FBBF24',
        borderGradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
        glowColor: 'rgba(245, 158, 11, 0.5)',
    },
};

/**
 * Generate SVG badge for certificate
 */
export const generateCertificateBadge = (data: CertificateData): string => {
    const style = BADGE_STYLES[data.difficulty] || BADGE_STYLES['Beginner'];
    const formattedDate = data.issuedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const shortHash = data.blockchainHash.slice(0, 10) + '...' + data.blockchainHash.slice(-8);

    // Score ring calculation
    const scorePercentage = data.score / 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference * (1 - scorePercentage);

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <!-- Gradients -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="50%" style="stop-color:#16213e"/>
      <stop offset="100%" style="stop-color:#0f0f23"/>
    </linearGradient>
    
    <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${style.primaryColor}"/>
      <stop offset="100%" style="stop-color:${style.secondaryColor}"/>
    </linearGradient>
    
    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${style.primaryColor}"/>
      <stop offset="100%" style="stop-color:${style.accentColor}"/>
    </linearGradient>
    
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
    
    <!-- Pattern for background -->
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.5"/>
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="500" rx="20" fill="url(#bgGradient)"/>
  <rect width="400" height="500" rx="20" fill="url(#grid)"/>
  
  <!-- Border glow -->
  <rect x="4" y="4" width="392" height="492" rx="18" fill="none" 
        stroke="url(#borderGradient)" stroke-width="2" filter="url(#glow)"/>
  
  <!-- Lune Logo -->
  <g transform="translate(160, 30)">
    <circle cx="40" cy="20" r="15" fill="${style.primaryColor}" opacity="0.3"/>
    <text x="40" y="26" font-family="Arial, sans-serif" font-size="16" font-weight="bold" 
          fill="white" text-anchor="middle">LUNE</text>
  </g>
  
  <!-- Certificate Title -->
  <text x="200" y="85" font-family="Arial, sans-serif" font-size="14" 
        fill="rgba(255,255,255,0.6)" text-anchor="middle" letter-spacing="3">
    VERIFIED SKILL CERTIFICATE
  </text>
  
  <!-- Score Ring -->
  <g transform="translate(200, 180)">
    <!-- Background ring -->
    <circle cx="0" cy="0" r="45" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
    
    <!-- Score ring -->
    <circle cx="0" cy="0" r="45" fill="none" stroke="url(#scoreGradient)" stroke-width="8"
            stroke-linecap="round" stroke-dasharray="${circumference}" 
            stroke-dashoffset="${strokeDashoffset}" transform="rotate(-90)"
            filter="url(#glow)"/>
    
    <!-- Score text -->
    <text x="0" y="8" font-family="Arial, sans-serif" font-size="28" font-weight="bold" 
          fill="white" text-anchor="middle">${data.score}</text>
    <text x="0" y="25" font-family="Arial, sans-serif" font-size="10" 
          fill="rgba(255,255,255,0.6)" text-anchor="middle">SCORE</text>
  </g>
  
  <!-- Skill Name -->
  <text x="200" y="270" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
        fill="white" text-anchor="middle">${data.skill}</text>
  
  <!-- Difficulty Badge -->
  <g transform="translate(200, 300)">
    <rect x="-50" y="-12" width="100" height="24" rx="12" fill="${style.primaryColor}" opacity="0.2"/>
    <rect x="-50" y="-12" width="100" height="24" rx="12" fill="none" 
          stroke="${style.primaryColor}" stroke-width="1"/>
    <text x="0" y="5" font-family="Arial, sans-serif" font-size="11" font-weight="bold" 
          fill="${style.accentColor}" text-anchor="middle">${data.difficulty.toUpperCase()}</text>
  </g>
  
  <!-- Recipient Name -->
  <text x="200" y="350" font-family="Arial, sans-serif" font-size="12" 
        fill="rgba(255,255,255,0.5)" text-anchor="middle">AWARDED TO</text>
  <text x="200" y="375" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
        fill="white" text-anchor="middle">${data.recipientName}</text>
  
  <!-- Divider -->
  <line x1="50" y1="400" x2="350" y2="400" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
  
  <!-- Blockchain Info -->
  <g transform="translate(200, 430)">
    <text x="0" y="0" font-family="monospace" font-size="9" 
          fill="rgba(255,255,255,0.4)" text-anchor="middle">PWRCHAIN VERIFIED</text>
    <text x="0" y="15" font-family="monospace" font-size="8" 
          fill="${style.primaryColor}" text-anchor="middle">${shortHash}</text>
  </g>
  
  <!-- Date -->
  <text x="200" y="470" font-family="Arial, sans-serif" font-size="10" 
        fill="rgba(255,255,255,0.4)" text-anchor="middle">${formattedDate}</text>
  
  <!-- Verification checkmark -->
  <g transform="translate(350, 450)">
    <circle cx="0" cy="0" r="15" fill="${style.primaryColor}" opacity="0.2"/>
    <path d="M-6 0 L-2 4 L6 -4" fill="none" stroke="${style.accentColor}" 
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
    `.trim();
};

/**
 * Generate badge as PNG using Canvas
 */
export const generateCertificatePNG = async (
    data: CertificateData
): Promise<Blob> => {
    const svg = generateCertificateBadge(data);

    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 800;
        canvas.height = 1000;

        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            if (ctx) {
                ctx.drawImage(img, 0, 0, 800, 1000);
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to generate PNG'));
                    }
                }, 'image/png');
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG'));
        };

        img.src = url;
    });
};

/**
 * Download certificate as image
 */
export const downloadCertificate = async (
    data: CertificateData,
    format: 'svg' | 'png' = 'png'
): Promise<void> => {
    const fileName = `lune-certificate-${data.skill.toLowerCase()}-${data.certificateId.slice(0, 8)}`;

    if (format === 'svg') {
        const svg = generateCertificateBadge(data);
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        downloadBlob(blob, `${fileName}.svg`);
    } else {
        const pngBlob = await generateCertificatePNG(data);
        downloadBlob(pngBlob, `${fileName}.png`);
    }
};

/**
 * Helper to download blob
 */
const downloadBlob = (blob: Blob, fileName: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Generate OpenSea-compatible NFT metadata
 */
export const generateNFTMetadata = (data: CertificateData): object => {
    return {
        name: `Lune ${data.skill} Certificate`,
        description: `Verified ${data.difficulty} level ${data.skill} certification with a score of ${data.score}/100. Issued by Lune Skill Verification Platform.`,
        image: `ipfs://placeholder/${data.certificateId}.png`, // Would be replaced with actual IPFS hash
        external_url: `${window.location.origin}/verify/${data.blockchainHash}`,
        attributes: [
            {
                trait_type: 'Skill',
                value: data.skill
            },
            {
                trait_type: 'Difficulty',
                value: data.difficulty
            },
            {
                trait_type: 'Score',
                value: data.score,
                display_type: 'number'
            },
            {
                trait_type: 'Issue Date',
                value: Math.floor(data.issuedAt.getTime() / 1000),
                display_type: 'date'
            },
            {
                trait_type: 'Blockchain',
                value: 'PWRCHAIN'
            },
            {
                trait_type: 'Verified',
                value: 'Yes'
            }
        ],
        properties: {
            category: 'certificate',
            creators: [
                {
                    address: 'lune-platform',
                    share: 100
                }
            ]
        }
    };
};

/**
 * Generate shareable certificate link
 */
export const generateShareableLink = (blockchainHash: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/verify/${blockchainHash}`;
};

/**
 * Generate social share text
 */
export const generateShareText = (data: CertificateData): {
    twitter: string;
    linkedin: string;
    generic: string;
} => {
    const link = generateShareableLink(data.blockchainHash);

    return {
        twitter: `🎉 I just earned my ${data.skill} certification on @LunePlatform with a score of ${data.score}/100! Verified on blockchain. ${link} #VerifiedSkills #Web3 #TechCareers`,
        linkedin: `I'm excited to share that I've earned a verified ${data.skill} certification through Lune's blockchain-based skill verification platform!\n\n📊 Score: ${data.score}/100\n🏆 Level: ${data.difficulty}\n🔗 Verified on PWRCHAIN\n\nView my certificate: ${link}`,
        generic: `I earned my ${data.skill} certification with a score of ${data.score}/100! Verified on blockchain: ${link}`,
    };
};
