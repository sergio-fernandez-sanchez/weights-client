# Weights Client

Mobile-first web interface for the [Weights API](https://github.com/sergio-fernandez-sanchez/weights-client). Built with React and Tailwind CSS, optimized for iPhone Safari.

Live at: [https://weights.up.railway.app](https://weights.up.railway.app)

---

## Demo account

| Field | Value |
|---|---|
| Email | demo@gmail.com |
| Password | 1234 |

---

## Pages

- **Login / Register** — authentication with tab switcher
- **Home** — log or update today's weight, calorie target button, gym shortcut, weekly report status button
- **Weight History** — weight chart and table with filters (current phase, all, week, month, year)
- **Phases** — browse all phases (past and active) with navigator, metrics, gym strength progress (1RM Epley), weekly rhythm, consistency stats and weight evolution chart
- **Bioimpedance Reports** — bioimpedance reports with delta comparison, weight/phase context, and body composition charts
- **DEXA Reports** — DEXA scan reports with delta comparison and weight/phase context
- **Body Measurements** — body circumference measurements (neck, shoulders, chest, bicep, waist, hip, thigh) with delta comparison
- **AI Report** — generate and download two JSON report types: optimized for AI analysis or full raw data
- **New Phase** — start a new training phase with optional manual start date
- **New Bioimpedance** — log a new bioimpedance report with optional manual date
- **New DEXA** — log a new DEXA scan report with optional manual date
- **New Measurements** — log new body measurements with optional manual date
- **Calories** — update current daily calorie target
- **Calories History** — full calorie target history with overlapping phases
- **Gym** — track gym performance: list active exercises with 1RM progress (phase and total %), add/edit/remove exercises, create custom exercises
- **Gym History** — per-exercise charts with 1RM on Y axis, points colored by phase
- **Edit Phase Goals** — update weight and date goal of the active phase
- **Personal Data** — manage personal profile: name, birth date, sex, height, allergies/intolerances, supplements
- **Weekly Report** — fill in weekly lifestyle data: training days, steps, alcohol, cigarettes, water, notes; week navigator to fill in past weeks

---

## Project Structure

```
weights-client/
├── src/
│   ├── api/
│   │   └── client.js                  # API calls and auth token management
│   ├── components/
│   │   ├── BackButton.jsx
│   │   ├── Button.jsx
│   │   ├── HomeHeader.jsx
│   │   ├── Input.jsx
│   │   ├── PageHeader.jsx
│   │   ├── PageWrapper.jsx
│   │   ├── ParticleBackground.jsx
│   │   └── Separator.jsx
│   ├── pages/
│   │   ├── AiReport.jsx
│   │   ├── Auth.jsx
│   │   ├── BioimpedanceReports.jsx
│   │   ├── BodyMeasurements.jsx
│   │   ├── Calories.jsx
│   │   ├── CaloriesHistory.jsx
│   │   ├── CurrentPhase.jsx
│   │   ├── DataMenu.jsx
│   │   ├── DexaReports.jsx
│   │   ├── EditPhaseGoals.jsx
│   │   ├── Gym.jsx
│   │   ├── GymHistory.jsx
│   │   ├── Home.jsx
│   │   ├── NewBioimpedanceReport.jsx
│   │   ├── NewBodyMeasurement.jsx
│   │   ├── NewDexaReport.jsx
│   │   ├── Phase.jsx
│   │   ├── Profile.jsx
│   │   ├── WeightHistory.jsx
│   │   └── WeeklyReport.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
└── package.json
```

---

## Installation

**1. Clone the repository**
```bash
git clone https://github.com/sergio-fernandez-sanchez/weights-client.git
cd weights-client
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables**
```bash
cp .env.example .env
```
Edit `.env`:
```
VITE_API_URL=https://weights-api-production.up.railway.app
```

**4. Run the development server**
```bash
npm run dev
```

App available at `http://localhost:5173`.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |

---

## License

MIT