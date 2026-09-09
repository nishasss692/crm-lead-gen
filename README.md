# Department of Posts - Karnataka Circle Commercial Lead Operations & CRM Portal

[![Next.js](https://img.shields.io/badge/Next.js-14.x-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supported-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

An enterprise-grade Commercial Lead Generation, Verification, and Outreach CRM tailored specifically for the **Department of Posts, Ministry of Communications, Government of India (Karnataka Postal Circle)**. 

The platform empowers **Circle Leadership (CO)**, **Regional Directors (RO)**, **Divisional Officers (DO)**, and **Marketing Executives (ME)** to track, verify, and onboard high-value commercial bulk mailers, e-commerce sellers, artisans, exporters, and industrial manufacturers into India Post's Speed Post, Parcel Network, and Business Solutions.

---

## 🏛️ Administrative Hierarchy & Role-Based Access Control (RBAC)

The portal strictly enforces the operational hierarchy of the Karnataka Postal Circle:

```
                          ┌──────────────────────────────┐
                          │   Circle Office (CO - Apex)  │
                          │   Statewide Lead Governance  │
                          └──────────────┬───────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
│  Bengaluru HQ Region │      │  South Kar Region    │      │  North Kar Region    │
│  (RO Bengaluru)      │      │  (RO South Kar)      │      │  (RO North Kar)      │
└──────────┬───────────┘      └──────────┬───────────┘      └──────────┬───────────┘
           │                             │                             │
           ▼                             ▼                             ▼
┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
│ Divisions (e.g.      │      │ Divisions (e.g.      │      │ Divisions (e.g.      │
│ BG East, BG South)   │      │ Mysuru, Kolar,       │      │ Dharwad, Belagavi,   │
│ & Field MEs          │      │ Mangaluru) & MEs     │      │ Kalaburagi) & MEs    │
└──────────────────────┘      └──────────────────────┘      └──────────────────────┘
```

| Role Level | Jurisdiction Scope | Permissions |
| :--- | :--- | :--- |
| **CO (Circle Office)** | Entire Karnataka Circle (Statewide) | Full oversight, division management, analytics, system exports, deduplication, circle-wide assignments. |
| **RO (Regional Office)** | Assigned Region (Bengaluru HQ, South Kar, or North Kar) | Oversees all constituent divisions and MEs; performance tracking; lead reallocation. |
| **DO (Division Office)** | Assigned Postal Division (e.g., Mysuru, BG Central) | Division lead lifecycle management, ME pipeline tracking, assignment, lead verification. |
| **ME (Marketing Executive)**| Assigned Territory / Division | Field operations, merchant calls, meeting notes, status updates (`Contacted`, `Willing`, `Onboarded`). |

---

## ✨ Core Features

- **Territory-Aware Lead Directory**:
  - Filterable by Region, Division, Pincode, Status, and Lead Source.
  - Granular search by company name, contact person, phone, email, and IEC code.
- **Workflow & Lead Status Lifecycle**:
  - `Contact Pending`: Uncontacted leads awaiting outreach.
  - `Contacted`: Outreach initiated; call notes and follow-up schedules recorded.
  - `Willing to Onboard`: Qualified merchants interested in corporate contracts.
  - `Onboarded`: Converted merchants actively utilizing India Post commercial parcel accounts.
  - `Follow-up` / `Not Interested`: Scheduled reminders and closed-out pipelines.
- **Intuitive Lead Action Modals**:
  - Clicking leads in **Contact Pending** launches the direct **Update Lead Modal** for immediate qualification.
  - Clicking leads in **all other statuses** opens the **Modify Lead Modal** to edit source tags, notes, and territory assignments.
  - Dedicated **Edit** and **Delete** action buttons with instant backend persistence.
- **Commercial Lead Source Classification**:
  - Pre-tagged sources: *Exporter, E-Commerce Seller, Artisan / Handloom, Bulk Mailer, Industrial Manufacturer, Agricultural Producer*.
  - Ability to customize and reassign lead source categories.
- **Bulk Operations & Ingestion**:
  - CSV and Excel file ingestion with automatic column mapping.
  - Duplicate detection and batch deduplication.
  - CSV export conforming to official postal reporting formats.
- **Executive Analytics & Conversion Funnels**:
  - Visual metrics for leads by division, region-wise volume, conversion rates, and revenue projections.
- **Executive Login Portal**:
  - Light gradient theme with Department of Posts Navy (`#1B2A4A`) and Crimson Red (`#D1242F`) branding.
  - Cartographic **India Postal Logistics Network map** highlighting the Bengaluru GPO hub.
  - 1-Click Role Access shortcuts for instant demo and evaluation.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts & Visualizations**: Recharts / SVG

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Server**: [Uvicorn](https://www.uvicorn.org/) (ASGI)
- **ORM & DB Abstraction**: [SQLAlchemy](https://www.sqlalchemy.org/)
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/)

### Data Layer
- **Production**: [PostgreSQL](https://www.postgresql.org/)
- **Local/Development**: SQLite with automatic schema generation and zero-config fallback.

---

## 📂 Project Structure

```
crm-lead-gen/
├── backend/
│   ├── main.py               # FastAPI application, route handlers & endpoints
│   ├── database.py           # Database connection & session management
│   ├── models.py             # SQLAlchemy ORM models (Leads, Users, Logs)
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── migrate_to_pg.py      # Migration script for SQLite to PostgreSQL
│   ├── requirements.txt      # Python dependencies
│   └── test_*.py             # Backend unit & integration test suites
│
├── frontend/
│   ├── public/               # Public assets (logos, maps, emblems)
│   │   ├── india-post-logo.png
│   │   ├── india-post-map-light.jpg
│   │   └── india-post-map.jpg
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── page.tsx      # Home / Dashboard overview
│   │   │   ├── login/        # Official Login Portal
│   │   │   ├── leads/        # Leads Directory & Filter Table
│   │   │   ├── analytics/    # Conversion & Performance Charts
│   │   │   └── components/   # Modular UI components
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       ├── LeadsTable.tsx
│   │   │       ├── UpdateLeadModal.tsx
│   │   │       ├── ModifyLeadSourceModal.tsx
│   │   │       └── IndiaPostLogo.tsx
│   │   └── lib/              # Utilities, territory mappings, API client
│   │       ├── api.ts
│   │       └── karnatakaTerritory.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── docker-compose.yml        # Multi-container orchestration (FastAPI + PostgreSQL + Next.js)
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v18.17.0` or higher
- **Python**: `3.10` or higher
- **npm** or **yarn**
- **Git**

---

### 1. Clone the Repository

```bash
git clone https://github.com/nishasss692/crm-lead-gen.git
cd crm-lead-gen
```

---

### 2. Backend Setup (FastAPI)

1. Create and activate a Python virtual environment:

   **Windows (PowerShell):**
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

   **macOS / Linux:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Start the FastAPI development server:
   ```bash
   python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
   ```

   - API Base URL: `http://127.0.0.1:8000`
   - Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup (Next.js)

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

   - Access the CRM application at `http://localhost:3000`
   - Access the Login Portal directly at `http://localhost:3000/login`

---

## 🔑 Demo Role Logins & Credentials

The portal features quick one-click authentication and supports standard credentials for all administrative levels.

**Default Password for all demo accounts**: `Post@123`

| Role Level | User / Employee ID | Jurisdiction Scope | Password |
| :--- | :--- | :--- | :--- |
| **Circle Office (CO)** | `CO_ADMIN` | Statewide (Karnataka Circle) | `Post@123` |
| **RO Bengaluru** | `r001` | Bengaluru HQ Region | `Post@123` |
| **RO South Karnataka** | `r002` | South Karnataka Region | `Post@123` |
| **RO North Karnataka** | `r003` | North Karnataka Region | `Post@123` |
| **DO Mysuru** | `Mysuru` (or `DIV_MYS`) | Mysuru Postal Division | `Post@123` |
| **ME Suresh** | `ME_MYS_01` | Mysuru Division (Field Exec) | `Post@123` |

> *Tip: Any valid Karnataka Postal Division name (e.g. `Kolar`, `Mangaluru`, `BG East`, `Belagavi`, `Dharwad`) can be entered directly as the Employee ID to authenticate as that Division's Officer.*

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/login` | Authenticate user and return session token & jurisdiction info |
| `GET` | `/api/leads` | Retrieve paginated leads with region, division & status filters |
| `POST` | `/api/leads` | Create a new commercial lead |
| `GET` | `/api/leads/{id}` | Retrieve comprehensive lead profile and history |
| `PUT` | `/api/leads/{id}` | Update lead fields (contact info, stage, notes, follow-up) |
| `DELETE` | `/api/leads/{id}` | Permanently remove a lead record |
| `POST` | `/api/leads/upload` | Ingest and parse bulk leads via CSV / Excel |
| `GET` | `/api/leads/export` | Export leads into structured CSV format |
| `POST` | `/api/leads/clean-duplicates` | Analyze database and purge duplicate records |
| `GET` | `/api/analytics/summary` | Aggregate conversion metrics, division volumes, and funnels |

---

## 🐳 Docker Deployment

To run the entire system (FastAPI backend + PostgreSQL + Next.js frontend) with Docker Compose:

```bash
docker-compose up --build -d
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

To shut down containers:
```bash
docker-compose down
```

---

## 🛡️ Security & Compliance

- **Data Privacy**: Role-based access ensures officers only view leads belonging to their jurisdiction.
- **Transport Security**: Ready for TLS 1.3 / HTTPS encryption in government cloud deployments.
- **Audit Trails**: Timestamped tracking for all lead modifications and stage transitions.

---

## 📄 License & Attribution

Developed for the **Department of Posts, Ministry of Communications, Government of India**.  
All official emblems, logos, and designations are property of the Department of Posts, Government of India.