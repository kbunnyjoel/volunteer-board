# 🌐 Full-Stack Volunteer Project Planning (React + Node + Supabase)

## ✅ Project Workflow (SDLC)

### 1. Requirements
- **Primary use case (Day 1):** Volunteer browses opportunities and submits interest.
- **Support tasks:** Organizer can create, update, and archive opportunities.
- **Out of scope (backlog):** Authentication, notifications, analytics, multi-org support.

### 2. Design
- UI Wireframes (desktop-first) for: opportunity list, opportunity details, signup confirmation.
- API contract documented via TypeScript interfaces.
- Single-table Supabase schema (`opportunities`) plus optional `signups` table.

### 3. Development
- Feature slices only—complete browse + signup flow before enhancements.
- Build order adjusted for speed: frontend mock → backend stubs → Supabase integration.

### 4. Testing
- Unit test after every feature
- API tested with Postman
- UI tested manually per sprint

### 5. Deployment
- Auto or manual deployment after each tested feature
- Delete unused projects to avoid costs

---

## 🎯 Day-One Scope & Contracts

- **Opportunity fields:** `id`, `title`, `organization`, `location`, `description`, `date`, `tags`, `spotsRemaining`.
- **Signup payload:** `opportunityId`, `volunteerName`, `volunteerEmail`, `notes`.
- **API routes:**
  - `GET /opportunities` → list all opportunities.
  - `POST /opportunities` → create opportunity (organizer use).
  - `PATCH /opportunities/:id` → update opportunity.
  - `DELETE /opportunities/:id` → archive opportunity.
  - `POST /opportunities/:id/signups` → record volunteer interest.
- **Frontend flow:** volunteer sees list, opens detail drawer/modal, submits signup form, receives success toast.

---

## 🚀 Sprint Strategy

- Sprint Duration: 2–3 days per feature
- Only one feature per sprint
- After every sprint:
  - ✅ Feature complete
  - ✅ Tests passed
  - ✅ Deployed
  - ✅ Demo-ready

---

## 💸 Cost Forecasting

| Tool      | Free Tier                     | Risk of Charges |
|-----------|-------------------------------|-----------------|
| Vercel    | 100 GB/mo bandwidth            | Low             |
| Netlify   | 100 GB/mo + 300 build mins     | Low             |
| Railway   | $5 usage credit per month      | Medium if left running |
| Supabase  | 500MB DB, 50K users            | Low             |

✅ Plan to deploy and delete after testing  
✅ Keep backend/server idle when not testing

---

## 🧪 Testing Checklist

- ✅ Backend routes tested with Postman
- ✅ Frontend forms tested manually
- ✅ Unit tests (if any) run before deploy
- ✅ Manual QA for each user flow

---

## 📦 Deployment Plan

| Layer     | Tool     | Deploy To        |
|-----------|----------|------------------|
| Frontend  | Vercel   | vercel.com       |
| Backend   | Railway  | railway.app      |
| Database  | Supabase | supabase.com     |

- Setup environment variables (`.env`)
- CORS enabled for frontend-backend
- Delete deployments when done

---

## 🔁 Project Folder Structure

```
volunteer-board/
├── client/               # React/Next frontend
├── server/               # Node.js backend
├── db/                   # Schema or mock data
├── .env.example
├── README.md
└── planning/
    └── project-planning.md
```

---

## 🔢 Best Build Order

1. **Database Schema**
   - Define tables/collections
   - Set up Supabase or mock DB

2. **Backend (Node.js + Express)**
   - RESTful routes
   - Connect to DB
   - Test with Postman

3. **Frontend (React or Next.js)**
   - Create UI
   - Connect to backend
   - Fetch and display data

---

## ✅ Final Reminders

- ✅ Stick to scope
- ✅ Delete unused deployments
- ✅ Track builds per feature
- ✅ Use Git branches per sprint
- ✅ Use `.env` for secrets
- ✅ Write docs in README

---

*Built to help you deliver clean, scoped, testable full-stack apps.*
