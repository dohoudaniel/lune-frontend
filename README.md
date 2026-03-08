<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Lune - Blockchain Skill Verification Platform

A decentralized talent verification platform using AI proctoring, Gemini AI, and PWRCHAIN for immutable certification.

## 🚀 Features

- **AI-Powered Assessments**: Generate custom technical assessments using Gemini AI
- **Blockchain Certificates**: Mint immutable certificates on PWRCHAIN
- **Smart Proctoring**: AI-based cheating detection and monitoring
- **Job Matching**: AI-powered candidate-job matching for employers
- **Mock Interviews**: Practice interviews with AI feedback
- **Secure Authentication**: Supabase Auth with Row-Level Security

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite
- Lucide Icons
- Axios for API calls

**Backend:**
- Node.js + Express + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- PWRCHAIN (@pwrjs/core)
- Google Gemini AI
- Winston logging

**Blockchain:**
- PWRCHAIN for certificate minting
- Immutable on-chain verification

## 📁 Project Structure

```
lune/
├── api/                     # Vercel-style serverless routes
│   ├── assessments/
│   ├── auth/
│   ├── certificates/
│   ├── interviews/
│   ├── jobs/
│   └── users/
├── backend/                 # Node.js/Express API
│   ├── src/
│   └── supabase/schema.sql
├── components/              # React UI components
├── contexts/                # React contexts (Auth)
├── lib/                     # Shared utilities (supabase, gemini, pwr)
├── services/                # Frontend service layer
├── src/contexts/            # Additional contexts (Realtime, Wallet)
├── App.tsx                  # Main app + routing
├── index.tsx                # Entry point
└── types.ts                 # Shared TypeScript types
```

## 🚦 Quick Start



### Prerequisites

- Node.js 18+
- Supabase account
- PWRCHAIN wallet
- Gemini API key

### Installation

1. **Clone and install dependencies:**
```bash
npm install
cd backend && npm install && cd ..
```

2. **Configure environment variables:**
```bash
# Backend
cp backend/env.example backend/.env
# Frontend
cp env.example .env.local
```

3. **Set up Supabase database:**
- Run `backend/supabase/schema.sql` in Supabase SQL Editor

4. **Start development servers:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

## 📚 API Documentation

See [backend/README.md](./backend/README.md) for complete API documentation.

### Key Endpoints

- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Login
- `POST /api/assessments/generate` - Generate AI assessment
- `POST /api/assessments/submit` - Submit assessment
- `POST /api/certificates/mint` - Mint blockchain certificate
- `GET /api/certificates/verify/:hash` - Verify certificate
- `GET /api/jobs` - Get jobs with AI matching
- `POST /api/interviews/start` - Start mock interview

## 🔐 Security

- Supabase Auth for authentication
- Row-Level Security (RLS) policies
- JWT token-based API access
- Role-based access control (candidate/employer)
- AI-powered proctoring and cheating detection

## 🎯 User Flows

### Candidate Flow
1. Sign up as candidate
2. Complete profile
3. Take skill assessment
4. Get AI evaluation
5. Mint blockchain certificate
6. Share certificate
7. Get AI job recommendations

### Employer Flow
1. Sign up as employer
2. Create job posting
3. View AI-matched candidates
4. Verify candidate certificates
5. Review candidate profiles

## 🌐 Deployment

### Backend
- Railway, Render, or Heroku
- Set environment variables
- Deploy from GitHub

### Frontend
- Vercel or Netlify
- Set `VITE_API_URL` to production backend
- Deploy from GitHub

## 📊 Database Schema

Key tables:
- `users` - User accounts
- `candidate_profiles` - Candidate information
- `employer_profiles` - Employer information
- `skills` - Available skills
- `assessments` - Generated assessments
- `assessment_submissions` - User submissions
- `certifications` - Blockchain certificates
- `jobs` - Job postings
- `mock_interviews` - Interview sessions
- `proctoring_events` - Security monitoring

## 🔗 PWRCHAIN Integration

Certificates are minted on PWRCHAIN blockchain:
- Immutable verification
- Public transparency
- Cryptographic proof
- Explorer: https://explorer.pwrlabs.io

## 🤖 AI Features

**Gemini AI Powers:**
- Assessment generation
- Code evaluation
- Cheating detection
- Career recommendations
- Job matching
- Interview feedback

## 📝 License

MIT

## 🙏 Acknowledgments

- Google Gemini AI
- PWRCHAIN
- Supabase
- React Team
