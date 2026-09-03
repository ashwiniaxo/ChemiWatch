# ChemiWatch

ChemiWatch is a TypeScript service that monitors course availability on ETS ChemiNot and sends email notifications when availability changes.

The goal is simple: instead of manually refreshing ChemiNot over and over, the goal of ChemiWatch is to check selected courses automatically and lets you know when a spot opens up and you can work on other things in the same time.

---

## ✨ What it does

ChemiWatch can:

- monitor multiple courses at the same time
- check course availability every 5 minutes
- detect when a course becomes available
- detect when a course becomes unavailable again
- detect newly available groups
- detect when a previously full group gets an open seat
- send email notifications

---

## 🛠 Tech Stack

- Node.js
- TypeScript
- Express
- Playwright
- node-cron
- Nodemailer

---

## 📁 Project Structure

```text
ChemiWatch/
├── server/
│   ├── src/
│   │   ├── cheminot/
│   │   │   ├── cheminot.client.ts
│   │   │   ├── cheminot.mapper.ts
│   │   │   ├── cheminot.session.ts
│   │   │   └── cheminot.types.ts
│   │   │
│   │   ├── courses/
│   │   │   └── course.service.ts
│   │   │
│   │   ├── monitoring/
│   │   │   └── monitor.service.ts
│   │   │
│   │   ├── notifications/
│   │   │   └── notification.service.ts
│   │   │
│   │   ├── auth.ts
│   │   └── index.ts
│   │
│   ├── .env.example
│   ├── .prettierrc
│   ├── eslint.config.js
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

# Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/ashwiniaxo/ChemiWatch.git
cd ChemiWatch/server
```

---

## 2. Install dependencies

```bash
npm install
```

Install the Chromium browser used by Playwright:

```bash
npx playwright install chromium
```

---

## 3. Configure environment variables

Create a `.env` file inside:

```text
server/.env
```

You can use `.env.example` as a template.

| Variable                   | Description                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `CHEMINOT_LOGIN_URL`       | URL used by Playwright to open the ChemiNot registration page and maintain the authenticated browser session. |
| `CHEMINOT_BASE_URL`        | Base URL of the ChemiNot API used for HTTP requests.                                                          |
| `CHEMINOT_STUDENT_ID`      | Student code.                                                              |
| `CHEMINOT_PROGRAM_ID`      | Program identifier associated with the student.                                                               |
| `CHEMINOT_SESSION`         | Academic session.                                                                                  |
| `CHEMINOT_CONCENTRATION`   | Student concentration/program option required by the course-selection endpoint.                               |
| `CHEMINOT_WATCH_COURSES`   | Comma-separated list of course codes that ChemiWatch should monitor.                                          |
| `CHEMINOT_NOTIFY_ON_START` | If `true`, sends an email when a watched course is already available when ChemiWatch starts.                  |
| `EMAIL_USER`               | Email address used to send notifications.                                                                     |
| `EMAIL_PASSWORD`           | App password used by Nodemailer to authenticate with the email provider.                                      |
| `EMAIL_TO`                 | Email address that receives ChemiWatch notifications.                                                         |
| `PORT`                     | Port used by the Express API.                                                             |

> Never commit your `.env` file.

---

# Running ChemiWatch

Before starting the server for the first time, run:

```bash
npm run auth
```

A Chromium window will open.

Then:

1. Sign in to ChemiNot normally.
2. Complete Microsoft MFA.
3. Wait until ChemiNot is fully loaded.
4. Return to the terminal.
5. Press `Ctrl+C`.

The browser session is stored locally inside:

```text
.chemiwatch-profile/
```

ChemiWatch reuses this session later so you do not need to manually provide authentication tokens.

If the session eventually expires and automatic refresh no longer works, simply run:

```bash
npm run auth
```

Start the development server:

```bash
npm run dev
```

You should see something similar to:

```text
COURSE1: initial status = AVAILABLE
  Group 01: 49/50 (1 seat(s) available)

COURSE2: initial status = NO_AVAILABLE_GROUPS
```

ChemiWatch will then continue checking the configured courses every 5 minutes.

Example:

```text
[2026-09-02 21:00:00] Checking course availability...
```

If availability changes, ChemiWatch will log the change and send an email notification.

---

# 📧 Notifications

ChemiWatch currently sends two main types of alerts.

### Course becomes available

Example:

```text
🚨 COURSE1: a group is now available!
```

An email is sent with:

- group number
- available seats
- current enrollment
- course/lab schedule

### Course becomes unavailable

Example:

```text
🔴 COURSE1: no groups are available anymore.
```

ChemiWatch will continue monitoring it and notify you again if availability returns.

---

# ⚠️ Limitations

ChemiWatch currently runs locally.

For continuous monitoring:

- the computer must stay powered on
- the computer must stay awake
- the Node.js process must remain running
- the internet connection must remain available

If the computer goes to sleep, scheduled checks will be missed.

---

## Disclaimer

ChemiWatch is an independent personal project.

It is not officially supported by École de technologie supérieure or ChemiNot.
