# 消费餐饮助手

A full-stack web app for managing monthly food budgets and getting daily meal recommendations.

## Project Structure

```
.
├── backend/
│   ├── config/constants.ts         # Server config
│   ├── db/
│   │   ├── index.ts                # Drizzle DB connection (postgres.js)
│   │   ├── schema.ts               # Tables: Users, Budgets, Dishes, Expenses, Recommendations
│   │   └── migrations/
│   │       └── 1776498174168_initial_schema.sql
│   ├── middleware/errorHandler.ts
│   ├── repositories/
│   │   ├── users.ts
│   │   ├── budgets.ts
│   │   ├── dishes.ts
│   │   ├── expenses.ts
│   │   └── recommendations.ts
│   ├── routes/
│   │   ├── auth.ts                 # POST /signup, /login, GET /me, PUT /profile, /password
│   │   ├── budgets.ts              # GET /:month, POST /
│   │   ├── dishes.ts               # CRUD /api/dishes
│   │   ├── expenses.ts             # CRUD /api/expenses + summary
│   │   └── recommendations.ts      # GET /:date, POST /refresh, /confirm
│   └── server.ts
├── frontend/src/
│   ├── components/
│   │   ├── custom/
│   │   │   ├── AppShell.tsx        # Nav + footer layout wrapper
│   │   │   └── OmniflowBadge.tsx
│   │   └── ui/                     # shadcn/ui components
│   ├── lib/api.ts                  # All API service functions
│   ├── pages/
│   │   ├── Index.tsx               # Auth guard → Dashboard
│   │   ├── AuthPage.tsx            # Login + Signup
│   │   ├── Dashboard.tsx           # Budget ring + meal recommendations + recent expenses
│   │   ├── DishesPage.tsx          # Dish library CRUD
│   │   ├── HistoryPage.tsx         # Expense history + bar chart
│   │   └── SettingsPage.tsx        # Profile + password change
│   ├── App.tsx                     # HashRouter routes
│   └── index.css                   # Tailwind v4 theme
└── shared/types/api.ts             # Shared TS types (frontend ↔ backend)
```

## Tech Stack
- **Backend**: Express.js + TypeScript + Drizzle ORM + postgres.js + JWT auth + bcryptjs
- **Frontend**: React 18 + Vite + Tailwind CSS v4 + shadcn/ui + React Router (HashRouter)
- **Database**: PostgreSQL

## Key Features
1. **User Auth** – Signup/login with JWT, profile & password management
2. **Monthly Budget** – Set/reset budget per month, live remaining balance ring chart
3. **Daily Meal Recommendations** – Auto-generated breakfast/lunch/dinner from dish library, refresh individual meals, confirm to auto-record expense
4. **Expense Tracking** – Manual add/edit/delete, grouped by date, monthly bar chart
5. **Dish Library** – Custom dishes (CRUD) + system default dishes, category filter

## API Routes
- `POST /api/auth/signup|login` – Auth
- `GET /api/auth/me` – Current user
- `PUT /api/auth/profile|password` – Update profile/password
- `GET|POST /api/budgets/:month` – Budget management
- `GET|POST|PUT|DELETE /api/dishes` – Dish library
- `GET|POST|PUT|DELETE /api/expenses` – Expense records
- `GET /api/expenses/summary?month=` – Daily summary for chart
- `GET /api/recommendations/:date` – Get/generate daily recommendation
- `POST /api/recommendations/refresh|confirm` – Refresh or confirm a meal

## Code Generation Guidelines
- All shared types in `shared/types/api.ts`, import with `@shared/types/api` in frontend
- Repository pattern: routes → repositories → drizzle db
- JWT extracted manually in each route (no passport middleware)
- Frontend API calls via `frontend/src/lib/api.ts` functions
- HashRouter: use `navigate('/path')` not `window.location.href`
