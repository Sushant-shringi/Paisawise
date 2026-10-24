# PaisaWise — Official Technical Documentation

Welcome to the central documentation portal for **PaisaWise**, an intelligent personal finance management platform engineered for Indian financial habits.

---

## 📚 Documentation Index

| Document | Description | Target Audience |
|---|---|---|
| [1. Architecture & System Design](./ARCHITECTURE.md) | High-level system architecture, component hierarchy, database schema, data flow, and security model. | Developers, Architects |
| [2. Google Sheets Cloud Integration](./GOOGLE_SHEETS_INTEGRATION.md) | In-depth guide on the bidirectional Google Sheets integration, TSV format, 8-column schema, and zero-duplicate paste mechanics. | Evaluators, Integrators |
| [3. REST API Reference](./API_REFERENCE.md) | Exhaustive API specification for all backend endpoints (`/api/auth`, `/api/transactions`, `/api/budgets`, etc.). | Backend Developers, API Consumers |
| [4. End-User Manual & Feature Guide](./USER_GUIDE.md) | Complete walkthrough of all UI features: Cockpit, UPI Expense Logging, Budgets & 80% Thresholds, Goals, Subscriptions, and Themes. | End Users, QA Testers |
| [5. Deployment & Local Development Guide](./DEPLOYMENT_AND_DEV_GUIDE.md) | Step-by-step instructions for local setup, environment variables, Supabase PostgreSQL, Gmail SMTP, and Vercel deployment. | DevOps, Contributors |
| [6. Automated Demo Video Pipeline](./DEMO_VIDEO_GUIDE.md) | Technical overview of the Playwright headless video capture, Google TTS Indian English voiceover synthesis, and FFmpeg muxing engine. | Media Engineers, Reviewers |

---

## ⚡ Quick Links & Live Resources

- **Live Production App:** [https://paisawise-two.vercel.app](https://paisawise-two.vercel.app)
- **Production API Health:** [https://paisawise-two.vercel.app/api/health](https://paisawise-two.vercel.app/api/health)
- **Live Google Spreadsheet:** [PaisaWise Google Sheets Ledger](https://docs.google.com/spreadsheets/d/1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA/edit?gid=0#gid=0)
- **GitHub Repository:** [https://github.com/Sushant-shringi/Paisawise.git](https://github.com/Sushant-shringi/Paisawise.git)
- **Demo Video (Audible Indian Accent Walkthrough):**
  - [Local MP4 Video File](../recordings/PaisaWise_Full_Demo_Indian_Voiceover.mp4)
  - [Local WebM Video File](../recordings/PaisaWise_Full_Demo_Indian_Voiceover.webm)

---

## 🎯 Platform Highlights

1. **Strictly Denominated in Indian Rupees (₹):** Full support for Indian numbering formats (Lakhs, Crores) and payment rails (UPI, Net Banking, Credit/Debit Cards, Cash).
2. **Deterministic Financial Math:** Zero floating-point rounding errors via integer-cent math (`roundMoney`).
3. **Multi-Factor Auth with Live Gmail SMTP:** 6-digit expiring verification codes delivered directly to the user's inbox with automated fallback.
4. **Instant Google Sheets Sync:** One-click clipboard copy (`Ctrl+V`) into cell `A1` with 8 standardized columns and zero duplicate records guaranteed.
5. **Dynamic Theme Switcher:** Instant toggling between high-contrast dark modes (Professional Carbon, Crimson Dusk) and crisp light modes (Mint Frost).
