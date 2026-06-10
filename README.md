# ✅ TODO App

### A clean, full-stack task management app built for real productivity

![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=flat-square&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Deployed on Render](https://img.shields.io/badge/Deployed-Render-46E3B7?style=flat-square&logo=render&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## 🌐 Live Demo

**[todo-app-3xs4.onrender.com](https://todo-app-3xs4.onrender.com)**

---

## 📖 Overview

TODO App is a full-stack task management application that lets users create, organize, and track their daily tasks. Built with React Router v7, Prisma ORM, and PostgreSQL, it features a clean dark/light UI, Google OAuth authentication, priority levels, due dates, recurring tasks, subtasks, and smart task grouping by date.

---

## ✨ Features

### 🔐 Authentication
- **Email & Password** signup and login with bcrypt hashing
- **Continue with Google** via OAuth 2.0
- **Forgot Password** — 6-digit email reset code (15-minute expiry)
- Secure session management with cookie-based sessions

### 📝 Task Management
- **Full CRUD** — Create, Read, Update, Delete tasks
- **Priority levels** — Low, Medium, High with color-coded badges
- **Due dates** with smart labels (Due today, Due tomorrow, Starts tomorrow, Overdue)
- **Recurring tasks** — Daily, Weekly, Monthly
- **Subtasks** — expandable sub-items per task
- **Notes** — optional notes field per task
- **Duplicate prevention** — blocks adding the same task name twice (case-insensitive, active tasks only)
- **Auto-capitalize** — first letter of task titles capitalized automatically

### 🗂️ Organization
- **Smart grouping** — tasks grouped by Today, Yesterday, This Week, Older
- **Smart sort** — within each group: due today → future → overdue → no date
- **Live search** — filters tasks as you type (300ms debounce)
- **Filter tabs** — All, Active, Completed
- **See more** — shows 5 tasks by default with a universal expand button
- **Progress bar** — shows % of tasks completed

### 🎨 UI/UX
- **Dark/Light mode** — auto-detects system preference
- **Responsive design** — works on mobile and desktop
- **Delete confirmation modal** — prevents accidental deletions
- **Inline editing** — edit task titles without leaving the page
- **Password visibility toggle** on login/signup

### ⚙️ Settings
- Update display name
- View account type (Email or Google)
- Sign out
- Delete account (with confirmation)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Router v7 (Remix-based) |
| Language | TypeScript |
| Database | PostgreSQL (hosted on Neon) |
| ORM | Prisma v6 |
| Auth | bcryptjs + Google OAuth 2.0 |
| Email | Resend |
| Deployment | Render |
| Fonts | DM Sans + DM Serif Display (Google Fonts) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or [Neon](https://neon.tech))
- Google Cloud project with OAuth 2.0 credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/Susankemigisa/TODO_App.git
cd TODO_App

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

SESSION_SECRET="your-long-random-secret"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5173/auth/google/callback"

RESEND_API_KEY="re_your_resend_api_key"
```

### Database Setup

```bash
# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## 📁 Project Structure

```
todo-app/
├── app/
│   ├── routes/
│   │   ├── home.tsx              # Main task list (CRUD)
│   │   ├── login.tsx             # Login page
│   │   ├── signup.tsx            # Signup page
│   │   ├── logout.tsx            # Logout handler
│   │   ├── settings.tsx          # User settings
│   │   ├── todos.edit.tsx        # Edit task page
│   │   ├── auth.google.ts        # Google OAuth trigger
│   │   ├── auth.google.callback.ts # Google OAuth callback
│   │   ├── forgot-password.tsx   # Forgot password page
│   │   └── reset-password.tsx    # Reset password page
│   ├── services/
│   │   ├── google.server.ts      # Google OAuth logic
│   │   └── email.server.ts       # Resend email service
│   ├── db.server.ts              # Prisma client singleton
│   └── session.server.ts         # Session management
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
└── .env                          # Environment variables (never commit!)
```

---

## 🗄️ Database Schema

```prisma
model User {
  id             String          @id @default(uuid())
  email          String          @unique
  password       String?
  name           String
  avatar         String?
  googleId       String?         @unique
  createdAt      DateTime        @default(now())
  todos          Todo[]
  passwordResets PasswordReset[]
}

model Todo {
  id         String     @id @default(uuid())
  title      String
  done       Boolean    @default(false)
  priority   Priority   @default(MEDIUM)
  dueDate    DateTime?
  notes      String?
  recurrence Recurrence @default(NONE)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  userId     String
  user       User       @relation(fields: [userId], references: [id])
  subtasks   Subtask[]
  tags       TodoTag[]
}

model Subtask {
  id        String   @id @default(uuid())
  title     String
  done      Boolean  @default(false)
  order     Int      @default(0)
  todoId    String
  todo      Todo     @relation(fields: [todoId], references: [id], onDelete: Cascade)
}

model PasswordReset {
  id        String   @id @default(uuid())
  userId    String
  code      String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 🔐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Navigate to **APIs & Services → Credentials**
4. Create an **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:5173/auth/google/callback` (development)
   - `https://your-app.onrender.com/auth/google/callback` (production)
6. Copy the Client ID and Secret to your `.env`

---

## 🚢 Deployment

This app is deployed on **Render** with a **Neon PostgreSQL** database.

### Deploy to Render

1. Push your code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repository
4. Set **Build Command**: `npm install --include=dev && npx prisma generate && npm run build`
5. Set **Start Command**: `npm run start`
6. Add all environment variables from `.env`
7. Deploy!

### Run migrations on production

```bash
# Set DATABASE_URL to your production Neon URL first
npx prisma migrate deploy
```

---

## 👩‍💻 Author

**Suzan Kemigisa**
- GitHub: [@Susankemigisa](https://github.com/Susankemigisa)
- Email: susankemigisa32@gmail.com

---

## 📄 License

This project is licensed under the MIT License.