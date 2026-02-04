# SF Quest (Golden Gate Quest)

A gamified mobile web application that enables users to discover San Francisco through a personalized photo-based treasure hunt, revealing the city's cultural history and hidden stories.

## Cultural Impact Track

**Focus:** Celebrating the soul of San Francisco through arts, recreation, and community identity.

**The Goal:** Use data to make the city's rich cultural and recreational offerings more accessible, and to preserve the history of its unique neighborhoods.

SF Quest brings San Francisco's cultural heritage to life by:
- Making historic landmarks and cultural sites discoverable through gamified exploration
- Preserving neighborhood stories and community identity through AI-powered storytelling
- Connecting users with local small businesses, arts venues, and recreation spots
- Using geographic and cultural datasets to create personalized, meaningful experiences

**Dataset Categories Used:** Culture and Recreation, Economy & Community (Small Business), Film Commission, Geographic Data.

## Features

- **Personalized Itineraries** - Answer preference questions (age, budget, mobility, time) to get a custom quest tailored to you
- **Photo Treasure Hunt** - Visit 5-6 curated locations and capture photos to unlock historical stories
- **AI Voice Guide** - Real-time voice interaction powered by Pipecat for immersive exploration
- **Historic Photo Comparison** - Side-by-side slider comparing your captures with historic images
- **Cultural Categories** - Explore SF through themes like architecture, food, parks, and more
- **Achievement System** - Earn shareable badges upon quest completion

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn-ui
- Zustand (state management)
- TanStack Query
- Pipecat AI (voice)

**Backend:**
- FastAPI (Python)
- NeMo Embeddings
- CuVS Vector Search
- Diffusion Models (img2img)

**Infrastructure:**
- Supabase [PostgreSQL]
- OpenAI API
- PWA Support

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Python 3.10+ (for backend services)
- NVIDIA GPU with CUDA (optional, for local inference)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or with specific LLM provider
npm run dev:openai    # Uses OpenAI API
npm run dev:dgx       # Uses local DGX GPU

# Build for production
npm run build

# Run tests
npm test
```

### Backend Setup

```bash
cd backend/tarun_rag

# Install Python dependencies
pip install -r requirements.txt

# Start services
bash start.sh
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
VITE_OPENAI_API_KEY=your_openai_key
VITE_DGX_URL=your_dgx_url
VITE_LLM_PROVIDER=openai
VITE_VOICE_URL=your_voice_service_url
```

## Project Structure

```
├── src/
│   ├── pages/           # Screen components (Splash, Onboarding, Itinerary, etc.)
│   ├── components/      # Reusable UI components
│   ├── store/           # Zustand state management
│   ├── data/            # Location and category data
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities
├── backend/
│   ├── tarun_rag/       # RAG API with vector search
│   ├── tarun_tts/       # Text-to-speech service
│   └── tarun_diffusion/ # Image transformation
├── supabase/            # Database migrations
└── public/              # Static assets
```

## How It Works

1. **Onboarding** - Users answer quick questions about preferences
2. **Category Selection** - Choose cultural themes to explore
3. **Itinerary Generation** - AI creates a personalized route
4. **Quest Mode** - Navigate to locations, capture photos, unlock stories
5. **Discovery** - Compare your photos with historic images and learn the history
6. **Achievement** - Complete the quest and earn shareable badges
