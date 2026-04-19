# LUNE
## The Trust Layer for Hiring

---

**User Story, Product Strategy & Engagement Design**
*Building a Killer Product That Users Cannot Leave*
MVP & Growth Strategy | 2026

---

## 01 MAKING THE USER STORY TIGHT & HIGH QUALITY

A great user story is not just a list of features — it is a precise, testable articulation of user intent, the action taken, and the value delivered. Below is the framework for ensuring Lune's user stories are of the highest quality.

### The INVEST Framework for Lune's Stories

Every user story in Lune should satisfy the INVEST criteria:

- **Independent** — stories should be deliverable without being blocked by another story.
- **Negotiable** — stories represent a goal, not a specification; details are discussed.
- **Valuable** — every story must deliver clear, measurable value to the user or business.
- **Estimable** — stories must be specific enough for developers to size them.
- **Small** — stories should fit within a single sprint (1–2 week delivery window).
- **Testable** — the acceptance criteria must be verifiable by QA or the user themselves.

### Story Format Standard

| Element | Format |
|---------|--------|
| User Story | As a [role], I want to [action] so that [benefit]. |
| Acceptance Criteria | Given [context], When [action], Then [outcome]. Include at least 3 criteria per story. |
| Priority | High / Medium / Low based on user impact x business value matrix. |
| Retention Hook | Every story should explicitly map to a retention mechanism: progress, reward, social, or necessity. |

---

## 02 FULL USER STORY MAP (CANDIDATES & EMPLOYERS)

### CANDIDATE USER STORIES

#### Onboarding & Profile

**US-C01:** As a candidate, I want to sign up with email and verify my identity so that my Skill Passport (when generated) is bound to a real person and cannot be claimed by anyone else.

Acceptance Criteria:
- Given I provide my email, When I sign up, Then I receive a verification email within 60 seconds.
- Given I verify my email, When I complete KYC, Then my Skill Passport is created and locked to my identity.
- Given my KYC is complete, Then I cannot transfer or duplicate my Skill Passport to another account.

**US-C02:** As a candidate, I want to build a rich profile page that includes my skills, background, and Skill Passport so that employers instantly understand my capabilities.

**US-C03:** As a candidate, I want to control which information is visible to which employers so that I maintain privacy while still attracting opportunities.

#### Skill Assessment & Passport

**US-C04:** As a candidate, I want to take AI-evaluated, real-world job simulations so that I earn verified skill scores that reflect my actual ability, not just theoretical knowledge.

Acceptance Criteria:
- Given I select a simulation, When I complete it, Then I receive an AI-generated score within 5 minutes.
- Given my score is generated, ensure it is highly tamper-proof (explore military and financial-grade encryption) making future alteration mathematically impossible.
- Given I pass a simulation, Then a verified badge and score are added to my Skill Passport immediately. These scores are only appendable to the existing Skill Passport.

**US-C05:** As a candidate, I want to view my Skill Passport as a shareable, verifiable profile link so that I can share it with any employer or institution and they can verify it independently.

**US-C06:** As a candidate, I want to retake simulations to improve my score so that I am always presenting my best performance to employers.

**US-C07:** As a candidate, I want to take proctored exams with AI oversight so that my scores are trusted by employers who know I could not have cheated.

#### Career Growth & AI Coach *(Premium-Tier candidates)*

**US-C08:** As a candidate, I want an AI Career Coach that analyses my Skill Passport and suggests the next skills to build so that I have a clear, personalised roadmap to my career goals.

> **Retention Hook:** The AI Coach creates a continuous improvement loop that brings candidates back weekly.

**US-C09:** As a candidate, I want to see a real-time skill gap analysis comparing my profile to the top 10% of candidates in my field so that I know exactly what to work on to become more competitive.

**US-C10:** As a candidate, I want to access curated courses and interview prep sessions linked to my identified skill gaps so that I can act on the AI Coach's recommendations immediately within the platform. *(Future development)*

**US-C11:** As a candidate, I want one-on-one interview preparation sessions so that I am confident and well-prepared before employer conversations. *(Future development)*

#### Community & Leaderboard

**US-C12:** As a candidate, I want to see my rank on a live leaderboard for each skill (top 100 per skill category) so that I am motivated to improve and employers can identify top performers at a glance.

> **Retention Hook:** Leaderboards create competitive drive that brings candidates back consistently to improve ranking.

**US-C13:** As a candidate, I want to share my Skill Passport and leaderboard position on LinkedIn, Twitter/X, and WhatsApp so that my verified achievements build social proof.

**US-C14:** As a candidate, I want to see which companies have viewed my Skill Passport so that I know who is interested and can proactively follow up. This will come as notifications on candidate dashboard. We can build email notifications if a candidate spends an extended period of time not logged in (~7 days).

#### Job Discovery & Applications

**US-C15:** As a candidate, I want to see a personalised feed of job postings matched to my verified skill set so that every opportunity I see is one I am actually qualified for.

**US-C16:** As a candidate, I want to receive an email and in-app notification when an employer in my skill category posts a new role so that I never miss a relevant opportunity. We can hold-off on this for now — send weekly instead and list all relevant jobs employers have posted.

**US-C17:** As a candidate, I want to receive a payment reminder when my subscription is due so that my Skill Passport never lapses due to an accidental missed payment. SP is still accessible if payment is expired; the only restriction is no new assessments.

---

### EMPLOYER USER STORIES

#### Onboarding & Company Profile

**US-E01:** As an employer, I want to sign up, verify my company identity through KYC, and create a Company Profile so that candidates know they are applying to a legitimate, verified organisation.

Acceptance Criteria:
- Given I register as an employer, When my KYC is complete, Then my company profile is marked as 'Verified Employer' and visible to candidates.
- Given my profile is complete, Then I can post jobs, view talent, and access the verification portal.

**US-E02:** As an employer, I want a Company Profile page that showcases our brand, culture, open roles, and hiring stats so that top candidates are attracted to apply.

#### Talent Discovery

**US-E03:** As an employer, I want to browse a database of verified candidates filtered by skill, score threshold, experience level, and availability so that I am only looking at candidates who have provably demonstrated the skills I need.

Acceptance Criteria:
- Given I set a skill filter and minimum score, When I search, Then I only see candidates who have a verified, encrypted Skill Passport badge for that skill above my threshold.
- Given I find a candidate, When I click their profile, Then I can view their full Skill Passport with independently verifiable credential hashes (unique numbers for each generated SP).

**US-E04:** As an employer, I want to see a leaderboard of the top 100 candidates per skill category so that I can quickly identify the highest performers without running my own assessment process.

**US-E05:** As an employer, I want to see which candidates have applied to my jobs and review their Skill Passport scores side by side so that I can make fast, evidence-based shortlisting decisions.

#### AI-Powered Talent Matching *(Growth & Enterprise Plans only)*

**US-E06:** As an employer, I want AI-powered talent recommendations delivered to my dashboard weekly so that I discover strong candidates I might have missed through manual search.

> **Retention Hook:** Weekly AI recommendations ensure employers have a reason to check the platform regularly.

**US-E07:** As an employer, I want the ability to reach out directly to candidates through a monitored in-platform messaging system so that all hiring communication is tracked, professional, and compliant.

#### Assessment & Custom Hiring

**US-E08:** As an employer, I want to post custom job simulations that candidates take specifically for my open roles so that I can assess role-fit precisely, not just general skill level. *(Enterprise subscription only)*

**US-E09:** As an employer, I want to review the strength and quality of simulation questions before deploying them so that the assessment standards match my company's expectations. *(Enterprise subscription only)*

**US-E10:** As an employer, I want to post jobs directly on Lune's job board so that my roles are visible to Lune's growing verified talent community.

#### Admin & Business Intelligence

**US-E11:** As an employer admin, I want a real-time analytics dashboard showing application volumes, score distributions, funnel drop-off, and time-to-hire so that I can continuously improve my hiring process.

**US-E12:** As an employer, I want weekly campaign and hiring analytics emails so that I have performance data delivered to me even when I am not actively logged in. *(Future development)*

**US-E13:** As an employer, I want a payment reminder and clear subscription management so that my account never lapses mid-hiring campaign.

---

### ADMIN USER STORIES

**US-A01:** As a platform admin, I want real-time dashboards showing platform usage, revenue, user growth, and credential issuance so that I can make data-driven decisions on marketing, features, and operations.

**US-A02:** As an admin, I want to complete full company KYC verification workflows for employers before granting access to the candidate database so that only legitimate organisations can contact our talent pool.

**US-A03:** As an admin, I want to send targeted email campaigns to candidates and employers so that I can drive re-engagement, announce new features, and reduce churn.

**US-A04:** As an admin, I want to monitor payment streams in real-time and receive alerts on failed payments so that no revenue falls through the cracks.

**US-A05:** As an admin, I want to set and enforce the standards for simulation questions across all skill categories so that assessment quality remains consistently high and unbiased.

**US-A06:** As an admin, I want a full support ticket system so that I can resolve user issues quickly and track resolution SLAs.

**US-A07:** As an admin, I want terms, conditions, and privacy policy management tools so that legal compliance documentation is always current and user-acknowledged.

---

## 03 KILLER FEATURES FOR RETENTION & GROWTH

The following features are designed around the core psychology of what makes users return to LUNE habitually: **progress, social proof, necessity, reward, and community.** Each is designed to make both candidates and employers think: *'I cannot do this anywhere else.'*

### CANDIDATE RETENTION FEATURES

#### 1. Skill Passport — The Portable Career Identity

The Skill Passport is Lune's single most powerful retention mechanism. It is the candidate's identity on the platform; the more skills they verify, the more valuable their passport becomes. Because it is encrypted and bound to their KYC identity, it cannot be recreated anywhere else. The passport creates deep lock-in: leaving Lune means leaving your credential.

Even if a candidate shares their Skill Passport externally (e.g. LinkedIn), others will only see an image of what is being shared (we control what is shared generally and candidates choose what to share) — but those external people will have to click the link to join LUNE before they can see the full Skill Passport.

#### 2. AI Skill Gap Coach (Weekly Nudge Engine)

Every week, the AI Coach analyses the candidate's current skill profile against the latest employer demand signals on the platform and delivers a personalised *'This Week's Skill Opportunity'* notification. This creates a Duolingo-style habit loop: candidates return weekly to see what the AI recommends and take the next step. Include a progress streak counter (*'You've been improving for 4 weeks!'*) to trigger loss aversion and sustain engagement.

#### 3. Live Skill Leaderboards (per Category)

A public, real-time leaderboard of the top 100 verified candidates in each skill category. Candidates see exactly where they rank and how many points separate them from the next tier. This feature taps into three powerful motivators: competition, status, and measurable progress. It also creates employer attention — top 10 candidates on a leaderboard will receive significantly more employer outreach, making the leaderboard a direct path to career opportunity.

#### 4. Profile View Notifications

Notify candidates every time an employer views their Skill Passport, including the employer's name, industry, and the role they are hiring for. This is one of the highest-engagement features on professional platforms because it creates a reason to check the app daily, and it converts passive candidates into active ones who update their profiles, add skills, and upgrade to premium to stand out.

#### 5. Skill Streak & Achievement Badges

Gamify the assessment journey with streaks (consecutive weeks with skill activity), milestone badges (*'First 5 Skills Verified'*, *'Top 50 in Software Development'*, *'AI-Recommended Candidate'*), and level-up notifications. Badges are displayed prominently on the Skill Passport and signal candidate quality to employers — making gamification both a retention tool and a trust signal. Candidates accrue points as they verify more skills and those points can be converted into credits that can be used to verify more skills. *(Future development)*

#### 6. Interview Prep Room

A dedicated feature for candidates to practice common and role-specific interview questions, receiving AI feedback on their answers. Paired with one-on-one mentorship booking with verified industry professionals, this creates significant value that candidates pay for and return to repeatedly — especially in the weeks before a scheduled employer interview. *(Future development)*

#### 7. Community & Peer Study Groups

A community layer where candidates in the same skill category can form study groups, share resources, and prepare for simulations together. Community features are one of the strongest retention drivers because they create social bonds with the platform; users return not just for the product, but for the people. Moderated by top-ranked community members who earn recognition and profile boosts.

A future development will be a place for the candidate community to have the capacity to build projects and form communities within Lune, and Lune will in turn amplify these projects — candidates receive a badge for it.

---

### EMPLOYER RETENTION FEATURES

#### 8. Weekly Talent Intelligence Brief

Every Monday, employers receive an automated email/dashboard update containing:
- (a) new top-scoring candidates in their skill categories
- (b) leaderboard movements in relevant skills
- (c) application conversion analytics
- (d) AI hiring trend insights

All delivered in one email; employers log in to see the full report. This creates a habitual Monday touchpoint — employers begin their hiring week on Lune.

#### 9. AI Talent Recommendations Engine *(Employer Growth & Enterprise Plan)*

Rather than requiring employers to search manually every time, Lune's AI continuously monitors the candidate pool and proactively surfaces recommended candidates based on the employer's historical hiring patterns, open roles, and stated preferences. This creates a push engagement model — the platform works for the employer even when they are not logged in, making Lune indispensable to the hiring workflow.

#### 10. Candidate Pipeline View

A Kanban-style pipeline view where employers can track candidates across stages:

**Discovered → Contacted → Interview Scheduled → Offer Extended → Hired**

All candidate communication, notes, and Skill Passport data are centralised in one view. Once employers start managing their hiring pipeline on Lune, switching costs become enormous — their entire hiring history is on the platform.

#### 11. Company Culture & Employer Brand Page *(Growth/Enterprise Plan)*

A full employer branding experience where companies can showcase their culture, employee testimonials, office environment, and benefits — visible to candidates browsing the platform. Employers who invest in their brand page see higher quality applicants and higher offer acceptance rates, creating a virtuous cycle that increases their perceived ROI from Lune and deepens platform commitment.

#### 12. Verified Hire Outcome Tracking

After an employer hires a candidate through Lune, the platform tracks the outcome: 90-day performance, rehire intent, and satisfaction rating. This creates a feedback loop that improves AI matching over time, and gives employers verifiable data on Lune's ROI compared to traditional hiring. Employers who can see that their Lune hires outperform their traditional hires will never leave.

---

## 04 FEATURE PRIORITY MATRIX

Priority is scored by **Impact** (user value + retention) × **Feasibility** (build complexity).
- **High** = MVP must-have
- **Medium** = Early growth feature
- **Low** = Scale feature

| ID | Persona | User Story Goal | Retention Mechanism | Priority | Phase |
|----|---------|-----------------|---------------------|----------|-------|
| C-04 | Candidate | Take AI-evaluated real-world simulations | Core product value — drives sign-ups | High | MVP |
| C-05 | Candidate | Shareable verified Skill Passport link | Lock-in & social distribution | High | MVP |
| C-12 | Candidate | Live skill leaderboard (top 100) | Competition & status motivation | High | MVP |
| C-14 | Candidate | Profile view notifications | Daily active usage driver | High | MVP |
| C-08 | Candidate | AI Career Coach with weekly nudges | Habit loop & upsell trigger | High | MVP |
| C-03 | Candidate | Privacy controls for employer visibility | Trust & comfort for sign-up | High | MVP |
| E-03 | Employer | Search verified candidates by skill/score | Core employer value — drives subscriptions | High | MVP |
| E-01 | Employer | Company KYC and verified profile | Trust infrastructure for candidates | High | MVP |
| E-05 | Employer | Side-by-side Skill Passport comparison | Decision efficiency — drives upgrades | High | MVP |
| C-10 | Candidate | Courses linked to AI skill gap recs | Revenue + retention combo | Medium | Growth |
| C-11 | Candidate | One-on-one interview prep sessions | Premium upsell & retention | Medium | Growth |
| E-06 | Employer | Weekly AI talent recommendations | Habitual employer engagement | Medium | Growth |
| E-08 | Employer | Custom role-specific simulations | Enterprise upsell | Medium | Growth |
| C-13 | Candidate | Social sharing of Skill Passport | Viral growth loop | Medium | Growth |
| C-07 | Candidate | Community & peer study groups | Deep social retention | Low | Scale |
| E-12 | Employer | Verified hire outcome tracking | ROI proof for enterprise renewal | Low | Scale |
| E-11 | Employer | Candidate pipeline (Kanban view) | Enterprise lock-in feature | Medium | Growth |
