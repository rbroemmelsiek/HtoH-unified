# HtoH Unified Platform

A comprehensive real estate advisory platform combining:

- **ReactDashboard** - Main UI shell with widgets and calculator tools
- **React Plan App** - Interactive planning and task management
- **AI Academy** - Learning platform with video, chat, and document viewing
- **AI Ethics Advisor** - Vertex AI Agent Engine for ethical guidance
- **Forms Engine** - Dynamic form builder (coming soon)

## Project Structure

```
HtoH-Unified/
â”œâ”€â”€ frontend/                  # React/TypeScript frontend
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard/     # Main shell components
â”‚   â”‚   â”‚   â”œâ”€â”€ plan-app/      # Plan management
â”‚   â”‚   â”‚   â”œâ”€â”€ ai-academy/    # Learning platform
â”‚   â”‚   â”‚   â”œâ”€â”€ forms-engine/  # Form builder
â”‚   â”‚   â”‚   â””â”€â”€ shared/        # Shared UI components
â”‚   â”‚   â”œâ”€â”€ services/          # API clients, Firebase
â”‚   â”‚   â”œâ”€â”€ store/             # Redux store
â”‚   â”‚   â”œâ”€â”€ types/             # TypeScript types
â”‚   â”‚   â”œâ”€â”€ hooks/             # Custom hooks
â”‚   â”‚   â””â”€â”€ utils/             # Utility functions
â”‚   â””â”€â”€ public/                # Static assets
â”œâ”€â”€ backend/                   # Python/FastAPI backend
â”‚   â””â”€â”€ app/
â”‚       â”œâ”€â”€ api/               # API routes
â”‚       â”œâ”€â”€ agents/            # Vertex AI Agent configs
â”‚       â””â”€â”€ services/          # Business logic
â””â”€â”€ firebase/                  # Firebase configuration
```

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Google Cloud project with Vertex AI enabled
- Firebase project

### Frontend Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Development

```bash
# Create virtual environment
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt

# Start server
npm run backend:dev
```

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Redux Toolkit, Tailwind CSS
- **Backend**: Python, FastAPI, Vertex AI Agent Engine
- **Database**: Cloud Firestore
- **Auth**: Firebase Authentication
- **Deployment**: Google Cloud Run
