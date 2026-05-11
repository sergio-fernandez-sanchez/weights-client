# Weights Client

Mobile-first web interface for the [Weights API](https://github.com/sergio-fernandez-sanchez/weights-api). Built with React and Tailwind CSS, optimized for iPhone Safari.

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
- **Home** — log or update today's weight, calorie target button, gym shortcut
- **Weight History** — weight chart and table with filters (current phase, all, week, month, year) + body composition charts from nutritionist reports
- **Current Phase** — active phase metrics, temporal progress bar, gym strength progress (volume-based), weekly rhythm and consistency stats, weight evolution chart, edit goals button
- **Reports** — nutritionist body composition reports with delta comparison, weight and phase context per report date
- **AI Report** — generate and download two report types: optimized for AI analysis or full raw data
- **New Phase** — start a new training phase with optional manual start date
- **New Report** — log a new nutritionist measurement with optional manual date
- **Calories** — update current daily calorie target
- **Gym** — track gym performance: list active exercises with progress (phase and total %), add/edit/remove exercises, create custom exercises
- **Edit Phase Goals** — update weight and date goal of the active phase

---

## Project Structure

```
weights-client/
├── src/
│   ├── api/
│   │   └── client.js              # API calls and auth token management
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
│   │   ├── Calories.jsx
│   │   ├── CurrentPhase.jsx
│   │   ├── DataMenu.jsx
│   │   ├── EditPhaseGoals.jsx
│   │   ├── Gym.jsx
│   │   ├── Home.jsx
│   │   ├── Phase.jsx
│   │   ├── Report.jsx
│   │   ├── Reports.jsx
│   │   └── WeightHistory.jsx
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