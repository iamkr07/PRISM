# PRISM - AI Recruitment Intelligence Platform

A luxury enterprise AI dashboard for analyzing candidate profiles through a seven-stage intelligence pipeline.

## Project Overview

PRISM is an end-to-end AI-powered recruitment intelligence platform that transforms raw candidate profiles into actionable hiring insights. The system combines modern data engineering, machine learning, and beautiful data visualization to provide recruiters with a comprehensive view of candidates.

## System Architecture

PRISM consists of two main components:
1. **Backend**: Python/FastAPI pipeline for data processing and AI analysis
2. **Frontend**: React/Vite static dashboard for data visualization

## Backend Design

The backend is built on FastAPI and includes:
- **API Layer** (`/backend/api/routes/`): RESTful endpoints for candidates, comparisons, analytics, and pipeline
- **Service Layer** (`/backend/api/services/`): Core business logic for candidate processing and analytics
- **Schema Layer** (`/backend/api/schemas/`): Pydantic models for data validation
- **Utils** (`/backend/api/utils.py`): Helper functions

## AI Pipeline

The seven-stage intelligence pipeline:
1. Data ingestion and validation
2. Feature extraction
3. Candidate scoring
4. Risk assessment
5. DNA profiling
6. Recommendation generation
7. Analytics reporting

## Frontend

The frontend is a static React/Vite application built with:
- React 19 with TypeScript
- TanStack Query for data fetching
- Framer Motion for animations
- Recharts for data visualization
- Tailwind CSS for styling
- Lucide React for icons

It uses static JSON files located in `/frontend/public/data/` to ensure it can be deployed without any backend dependencies.

## Deployment

### Demo Deployment

The deployed application is a static demonstration hosted on Vercel. The backend implementation is fully included in this repository for evaluation. Large processed datasets are intentionally excluded from Git because of GitHub repository size limits. The complete datasets are available through the links provided below.

### Frontend Deployment
Deploy the `/frontend` directory to Vercel as a static application. No backend configuration needed.

### Backend Deployment (Optional)
To run the full backend locally, install dependencies from `/backend/requirements.txt` and start the FastAPI server.

## Technology Stack

| Component | Technologies |
|-----------|--------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion |
| Backend | Python 3.11+, FastAPI, Pydantic, NumPy |
| Hosting | Vercel (frontend) |

## Dataset

Candidates Dataset:
&lt;ADD LINK&gt;

Analytics Dataset:
&lt;ADD LINK&gt;

Outputs:
&lt;ADD LINK&gt;

## Repository Layout

| Directory | Purpose |
|-----------|---------|
| `/frontend` | **Deployed demo**: Fully static React/Vite application that runs on Vercel with no backend dependency |
| `/backend` | **Complete implementation**: Full Python/FastAPI AI pipeline and backend API |
| Datasets | Downloaded separately from the links provided below |

## Folder Structure

```
prism-main/
├── backend/
│   ├── api/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── app.py
│   ├── phases/
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── public/data/       # Static demo data
│   ├── src/
│   │   ├── api/hooks/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vercel.json
├── .gitignore
└── README.md
```

## License

Proprietary - PRISM Platform
