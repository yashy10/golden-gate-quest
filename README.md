# 🌉 Golden Gate Quest

A gamified urban exploration platform for San Francisco that transforms the city into an interactive quest map. Users can discover landmarks, complete challenges, and earn rewards while exploring the Golden Gate area.

**Live Demo**: [Your deployment URL]  
**Repository**: https://github.com/yashy10/golden-gate-quest

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Features](#-features)
- [Reproducing the Demo](#-reproducing-the-demo)
- [Datasets](#-datasets)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) & npm
- **Docker** & Docker Compose (for backend services)
- **Supabase** account (for database)
- **DGX Spark** access (for hosting backend containers)

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/yashy10/golden-gate-quest.git
cd golden-gate-quest

# Install dependencies
npm install
# or
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section)

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Backend Setup (DGX Spark)

The backend services are containerized and deployed on DGX Spark:

```bash
# Navigate to backend directory
cd backend

# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn-ui
- **Styling**: Tailwind CSS
- **State Management**: React Context/Hooks
- **Mapping**: Leaflet / Mapbox GL JS
- **HTTP Client**: Axios

### Backend (Docker Containers on DGX Spark)
- **API Server**: Node.js/Express or Python/FastAPI
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Containerization**: Docker + Docker Compose

### Infrastructure
- **Hosting**: 
  - Frontend: Lovable.dev / Vercel
  - Backend: DGX Spark (Docker containers)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Map View    │  │  Quest UI    │  │  Profile     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/WSS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DGX Spark (Docker Containers)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Gateway (Nginx/Traefik)                         │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────┼──────────────┬──────────────────────┐   │
│  │                │               │                      │   │
│  ▼                ▼               ▼                      ▼   │
│  ┌─────────┐  ┌────────┐  ┌──────────┐  ┌────────────┐     │
│  │ Auth    │  │ Quest  │  │ Location │  │ Analytics  │     │
│  │ Service │  │ Service│  │ Service  │  │ Service    │     │
│  └─────────┘  └────────┘  └──────────┘  └────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase (PostgreSQL)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Users       │  │  Quests      │  │  Locations   │      │
│  │  Progress    │  │  Rewards     │  │  POIs        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Authentication**: Frontend → Supabase Auth → Backend validates
2. **Quest Loading**: Frontend → Backend API → Database → GeoJSON response
3. **Location Updates**: Frontend (GPS) → Location Service → Real-time updates
4. **Quest Completion**: Frontend → Quest Service → Validation → Reward unlock

---

## ✨ Features

- 🗺 **Interactive Map**: Explore San Francisco with real-time location tracking
- 🎯 **Quest System**: Complete location-based challenges and missions
- 🏆 **Rewards & Achievements**: Earn points, badges, and unlock new areas
- 📍 **POI Discovery**: Learn about landmarks, restaurants, parks, and transit
- 👥 **Social Features**: Compete with friends on leaderboards
- 📱 **Mobile-First**: Responsive design optimized for mobile exploration
- 🔔 **Real-time Notifications**: Get alerted when near quest locations

---

## 🔄 Reproducing the Demo

### 1. Environment Variables

Create a `.env` file in the root directory:

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API (DGX Spark)
VITE_API_BASE_URL=https://your-dgx-spark-url.com/api

# Map Services
VITE_MAPBOX_TOKEN=your_mapbox_access_token
# or
VITE_GOOGLE_MAPS_KEY=your_google_maps_key

# Analytics (Optional)
VITE_GA_TRACKING_ID=your_google_analytics_id

# Feature Flags
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_SOCIAL_FEATURES=true
```

### 2. Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# API Configuration
PORT=3000
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key

# External Services
MAPBOX_API_KEY=your_mapbox_api_key
GEOCODING_API_KEY=your_geocoding_service_key

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

### 3. Sample .env Template

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
cd backend && cp .env.example .env
```

### 4. Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Or use Supabase migrations
supabase db push
```

### 5. Start All Services

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend (DGX Spark)
cd backend
docker-compose up

# Or deploy to DGX Spark
./scripts/deploy-dgx.sh
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api (or your DGX Spark URL)
- **API Documentation**: http://localhost:3000/api/docs

---

## 📊 Datasets

The project includes several curated datasets for San Francisco locations:

### Included CSV Files

| Dataset | File | Records | Description |
|---------|------|---------|-------------|
| **Buildings** | `buildings.csv` | ~500 | Notable buildings and landmarks |
| **Parks & Leisure** | `parks_and_leisure.csv` | ~200 | Parks, recreation areas, viewpoints |
| **Restaurants & Cafes** | `restaurants_and_cafes.csv` | ~800 | Dining and cafe locations |
| **Shops** | `shops.csv` | ~600 | Retail and shopping locations |
| **Transit Stops** | `transit_stops.csv` | ~1000 | BART, Muni, bus stops |

### Data Format

All CSV files follow this structure:

```csv
name,latitude,longitude,category,description,image_url
Golden Gate Bridge,37.8199,-122.4783,landmark,"Iconic suspension bridge",https://...
```

### Data Sources

- San Francisco Open Data Portal
- OpenStreetMap
- Custom curated content
- **Synthetic Data**: Some quest locations and challenges are procedurally generated for demonstration purposes

---

## 🚢 Deployment

### Frontend Deployment (Lovable/Vercel)

```bash
# Deploy to Lovable
# Simply push to main branch - auto-deploys

# Or deploy to Vercel
npm run build
vercel --prod
```

### Backend Deployment (DGX Spark)

```bash
# Build Docker images
cd backend
docker-compose build

# Push to DGX Spark registry
docker tag golden-gate-quest-api your-registry.dgx-spark.com/api:latest
docker push your-registry.dgx-spark.com/api:latest

# Deploy on DGX Spark
kubectl apply -f kubernetes/deployment.yaml

# Or use the deployment script
./scripts/deploy-dgx.sh production
```

### Environment-Specific Configs

- **Development**: `.env.development`
- **Staging**: `.env.staging`
- **Production**: `.env.production`

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Backend tests
cd backend
docker-compose run api npm test
```

---

## 📝 API Documentation

API documentation is available at `/api/docs` when running the backend.

Key endpoints:

- `GET /api/quests` - List available quests
- `GET /api/locations/:id` - Get location details
- `POST /api/quests/:id/complete` - Mark quest as complete
- `GET /api/user/progress` - Get user progress

---

## 🙏 Acknowledgments

- San Francisco Open Data Portal for location datasets
- Dell for DGX Spark provisions
- Nvidia for event hosting and technical support
- Arm for technical support