
import { ethers } from 'ethers';
import { CertificateDetails } from '../types';

// PWR Chain Configuration
const PWR_CHAIN_ID = 10023;
const PWR_RPC_URL = "https://rpc.pwr.io";

declare global {
  interface Window {
    ethereum: any;
  }
}

export const mintCertificate = async (
  candidateName: string,
  skill: string,
  score: number
): Promise<string> => {


  // 1. Check for Web3 Wallet
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();


      // In a production app, we would call the contract here:
      // const contract = new ethers.Contract(ADDRESS, ABI, signer);
      // const tx = await contract.mint(candidateName, skill, score);

      // For this demo, we sign a message to prove identity and intent on-chain
      const message = `Lune Verification: Mint Certificate for ${candidateName} [Skill: ${skill}, Score: ${score}]`;
      const signature = await signer.signMessage(message);

      // Generate a deterministic hash based on the signature to simulate a TxHash
      const txHash = ethers.keccak256(ethers.toUtf8Bytes(signature + Date.now()));


      return txHash;

    } catch (error) {
      console.error("Blockchain Error:", error);
      // If user rejects or error, we fall back to mock to ensure flow continues
      return mockMint();
    }
  } else {

    return mockMint();
  }
};

const mockMint = async (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const randomHash = '0x' + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      resolve(randomHash);
    }, 1500);
  });
}

export const getCertificateDetails = async (hash: string): Promise<CertificateDetails | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!hash.startsWith("0x") || hash.length !== 66) {
        resolve(null);
        return;
      }

      // Map known certificate hashes to candidate IDs (for demo)
      const candidateIdMap: Record<string, string> = {
        '0x7f2c3a1b9d8e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9': '1', // Alex Chen
        '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1': '2', // Sarah Jones
        '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1': '4', // Aisha Khan
        '0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2': '5', // Maria Santos
        '0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3': '6', // James Wilson
      };

      resolve({
        hash,
        candidateId: candidateIdMap[hash] || 'unknown',
        candidateName: "Candidate",
        skill: "Engineering Verification",
        score: 85,
        timestamp: new Date().toISOString(),
        isValid: true,
        issuer: "Lune Verification Authority (PWR Chain)"
      });
    }, 1000);
  });
};

// Mint a Skill Passport containing all verified skills
export const mintSkillPassport = async (
  candidateName: string,
  skills: Record<string, number>,
  certifications: Array<{ skill: string; txHash?: string }>
): Promise<{ txHash: string; passportId: string }> => {


  // Generate passport data
  const passportData = {
    candidate: candidateName,
    skills: skills,
    certifications: certifications,
    mintedAt: new Date().toISOString(),
    version: "1.0"
  };

  try {
    // Check for Web3 Wallet
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Ensure ethers is loaded
        if (!ethers) throw new Error("Ethers.js library not loaded");

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();


        // Sign the passport data
        const message = `Lune Skill Passport: Mint for ${candidateName}\n\nSkills: ${Object.keys(skills).join(', ')}\nCertifications: ${certifications.length}\nTimestamp: ${passportData.mintedAt}`;
        const signature = await signer.signMessage(message);

        // Generate passport ID and transaction hash
        const txHash = ethers.keccak256(ethers.toUtf8Bytes(signature + Date.now()));
        const passportId = `LUNE-PASS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;


        return { txHash, passportId };

      } catch (error) {
        console.error("Blockchain Error during passport minting (falling back to mock):", error);
        return mockMintPassport(candidateName);
      }
    } else {

      return mockMintPassport(candidateName);
    }
  } catch (err) {
    console.error("Unexpected error in mintSkillPassport:", err);
    return mockMintPassport(candidateName);
  }
};

const mockMintPassport = async (candidateName: string): Promise<{ txHash: string; passportId: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const randomHash = '0x' + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      const passportId = `LUNE-PASS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      resolve({ txHash: randomHash, passportId });
    }, 2000);
  });
};

// Generate shareable passport link
export const getPassportShareLink = (passportId: string): string => {
  // Use the current window origin to ensure links point to this app
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  return `${baseUrl}/passport/${passportId}`;
};
