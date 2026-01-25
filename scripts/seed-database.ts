/**
 * Database Seeding Script
 *
 * This script:
 * 1. Reads the existing location and food stop data
 * 2. Generates embeddings using OpenAI
 * 3. Inserts everything into Supabase with pgvector
 *
 * Usage:
 *   npx tsx scripts/seed-database.ts
 *
 * Prerequisites:
 *   - Run the migration first in Supabase dashboard
 *   - Set OPENAI_API_KEY environment variable
 *   - Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables
 */

import { createClient } from "@supabase/supabase-js";

// ============================================
// Configuration
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin access
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  console.log("Set these environment variables:");
  console.log("  export SUPABASE_URL=https://your-project.supabase.co");
  console.log("  export SUPABASE_SERVICE_KEY=your-service-role-key");
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY");
  console.log("Set the environment variable:");
  console.log("  export OPENAI_API_KEY=sk-your-key");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// Existing Data (from locations.ts)
// ============================================

const allLocations = [
  {
    id: "golden-gate-vista",
    name: "Golden Gate Bridge Vista Point",
    neighborhood: "Marin Headlands",
    address: "Conzelman Rd, Sausalito, CA 94965",
    coordinates: { lat: 37.8324, lng: -122.4795 },
    category: "iconic",
    heroImage:
      "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=800",
    historicYear: "1937",
    shortSummary:
      "The Golden Gate Bridge, completed in 1937, was once the longest suspension bridge in the world. Its iconic 'International Orange' color was chosen to complement the natural surroundings and enhance visibility in fog.",
    fullDescription:
      "Standing at Battery Spencer, you're witnessing one of the most photographed bridges on Earth. Chief Engineer Joseph Strauss initially proposed a clunky hybrid cantilever-suspension design, but consulting architect Irving Morrow refined it into the Art Deco masterpiece you see today.",
    hints: [
      "Look for the vista point parking area",
      "Best photos are from the elevated battery position",
    ],
    vibe: "iconic landmark, breathtaking views, photography paradise, bucket list destination",
  },
  {
    id: "coit-tower",
    name: "Coit Tower",
    neighborhood: "Telegraph Hill",
    address: "1 Telegraph Hill Blvd, San Francisco, CA 94133",
    coordinates: { lat: 37.8024, lng: -122.4058 },
    category: "iconic",
    heroImage:
      "https://images.unsplash.com/photo-1534050359320-02900022671e?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    historicYear: "1933",
    shortSummary:
      "Built with funds bequeathed by eccentric millionaire Lillie Hitchcock Coit, this 210-foot tower honors San Francisco firefighters.",
    fullDescription:
      "Lillie Hitchcock Coit was a legend in her own time—she smoked cigars, wore pants, and once rescued a fire engine company in 1851. The tower's fluted design resembles a fire hose nozzle.",
    hints: [
      "The tower is at the top of Telegraph Hill",
      "Look for the white Art Deco column",
    ],
    vibe: "historic art deco, panoramic city views, quirky history, elevator to observation deck",
  },
  {
    id: "transamerica-pyramid",
    name: "Transamerica Pyramid",
    neighborhood: "Financial District",
    address: "600 Montgomery St, San Francisco, CA 94111",
    coordinates: { lat: 37.7952, lng: -122.4028 },
    category: "iconic",
    heroImage:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "1972",
    shortSummary:
      "At 853 feet, the Transamerica Pyramid was the tallest building in San Francisco until 2018. Its distinctive shape was designed to allow more light and air to reach the streets below.",
    fullDescription:
      "When architect William Pereira proposed this radical design in 1969, San Franciscans were outraged. They called it 'Pereira's Prick' and organized protests. Today, it's beloved as a symbol of the city.",
    hints: [
      "Find the small redwood park at the base",
      "Best viewed from Washington Street",
    ],
    vibe: "modern architecture, skyline icon, urban exploration, business district landmark",
  },
  {
    id: "painted-ladies",
    name: "Painted Ladies",
    neighborhood: "Alamo Square",
    address: "710-720 Steiner St, San Francisco, CA 94117",
    coordinates: { lat: 37.7762, lng: -122.4328 },
    category: "architecture",
    heroImage:
      "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    historicYear: "1895",
    shortSummary:
      "The 'Painted Ladies' earned their nickname in the 1960s when the colorful Victorian revival began. These seven houses survived the 1906 earthquake.",
    fullDescription:
      "These Queen Anne-style Victorians are the most photographed homes in America. The term 'Painted Lady' was coined by writers Elizabeth Pomada and Michael Larsen in their 1978 book.",
    hints: [
      "View from Alamo Square Park across Hayes Street",
      "The downtown skyline frames them perfectly",
    ],
    vibe: "victorian architecture, postcard perfect, Full House nostalgia, colorful historic homes",
  },
  {
    id: "palace-fine-arts",
    name: "Palace of Fine Arts",
    neighborhood: "Marina District",
    address: "3601 Lyon St, San Francisco, CA 94123",
    coordinates: { lat: 37.802, lng: -122.4484 },
    category: "architecture",
    heroImage:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "1915",
    shortSummary:
      "Built for the 1915 Panama-Pacific International Exposition, this Roman-inspired rotunda was the only structure meant to be permanent.",
    fullDescription:
      "Architect Bernard Maybeck designed this melancholy ruin to evoke 'the mortality of grandeur and the vanity of human wishes.'",
    hints: [
      "Enter from Lyon Street",
      "The reflecting lagoon offers the best photo spots",
    ],
    vibe: "romantic spot, classical architecture, wedding photography, swans on lagoon, peaceful escape",
  },
  {
    id: "city-hall",
    name: "San Francisco City Hall",
    neighborhood: "Civic Center",
    address: "1 Dr Carlton B Goodlett Pl, San Francisco, CA 94102",
    coordinates: { lat: 37.7793, lng: -122.4193 },
    category: "architecture",
    heroImage:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    historicYear: "1915",
    shortSummary:
      "This Beaux-Arts masterpiece features a dome taller than the U.S. Capitol. It was built to replace the original City Hall destroyed in the 1906 earthquake.",
    fullDescription:
      "Architects Arthur Brown Jr. and John Bakewell Jr. designed this grand civic temple to rival any capital in the world.",
    hints: [
      "The main entrance faces Civic Center Plaza",
      "Look up at the stunning gilded dome",
    ],
    vibe: "grand beaux-arts, gilded dome, civic pride, historic government building, marriage ceremonies",
  },
  {
    id: "dragon-gate",
    name: "Dragon Gate",
    neighborhood: "Chinatown",
    address: "Grant Ave & Bush St, San Francisco, CA 94108",
    coordinates: { lat: 37.7908, lng: -122.4058 },
    category: "neighborhoods",
    heroImage:
      "https://images.unsplash.com/photo-1534050359320-02900022671e?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "1970",
    shortSummary:
      "This ornate gateway marks the entrance to the oldest Chinatown in North America. The gate was a gift from Taiwan in 1970.",
    fullDescription:
      "San Francisco's Chinatown was established in 1848, making it the oldest and one of the most densely populated Chinatowns in the Western Hemisphere.",
    hints: [
      "Located at the corner of Grant Avenue and Bush Street",
      "Look for the green tile roof and guardian lions",
    ],
    vibe: "cultural gateway, bustling neighborhood, dim sum and tea shops, authentic asian experience",
  },
  {
    id: "mission-dolores",
    name: "Mission Dolores",
    neighborhood: "Mission District",
    address: "3321 16th St, San Francisco, CA 94114",
    coordinates: { lat: 37.7649, lng: -122.4269 },
    category: "neighborhoods",
    heroImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "1776",
    shortSummary:
      "Founded in 1776, Mission Dolores is the oldest surviving structure in San Francisco. Its 4-foot-thick adobe walls survived the 1906 earthquake.",
    fullDescription:
      "Mission San Francisco de Asís, known as Mission Dolores, was the sixth of 21 California missions. The cemetery contains the remains of the city's original settlers.",
    hints: [
      "The small white adobe building is the original mission",
      "The cemetery is behind the building",
    ],
    vibe: "oldest building in SF, Spanish colonial history, peaceful cemetery garden, spiritual heritage",
  },
  {
    id: "city-lights",
    name: "City Lights Bookstore",
    neighborhood: "North Beach",
    address: "261 Columbus Ave, San Francisco, CA 94133",
    coordinates: { lat: 37.7976, lng: -122.4066 },
    category: "neighborhoods",
    heroImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "1953",
    shortSummary:
      "Founded by poet Lawrence Ferlinghetti, City Lights was the first all-paperback bookstore in the U.S. and the birthplace of the Beat Generation literary movement.",
    fullDescription:
      "In 1956, City Lights published Allen Ginsberg's 'Howl,' leading to an obscenity trial that became a landmark First Amendment case.",
    hints: [
      "Located at the corner of Columbus and Broadway",
      "Look for the iconic yellow and black signage",
    ],
    vibe: "beat generation history, literary pilgrimage, independent bookstore, counterculture landmark",
  },
  {
    id: "clarion-alley",
    name: "Clarion Alley",
    neighborhood: "Mission District",
    address: "Clarion Alley, San Francisco, CA 94110",
    coordinates: { lat: 37.7631, lng: -122.4222 },
    category: "street-art",
    heroImage:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "1992",
    shortSummary:
      "This one-block alley between Mission and Valencia streets is covered floor to ceiling with murals addressing social justice, politics, and community issues.",
    fullDescription:
      "The Clarion Alley Mural Project (CAMP) was founded in 1992 by a collective of artists who wanted to bring art to the community.",
    hints: [
      "Access from Valencia Street between 17th and 18th",
      "The entire alley is the gallery",
    ],
    vibe: "outdoor art gallery, social justice murals, gritty urban art, instagram worthy, ever-changing",
  },
  {
    id: "balmy-alley",
    name: "Balmy Alley",
    neighborhood: "Mission District",
    address: "Balmy Alley, San Francisco, CA 94110",
    coordinates: { lat: 37.7536, lng: -122.4122 },
    category: "street-art",
    heroImage:
      "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "1984",
    shortSummary:
      "San Francisco's original mural alley, Balmy features over 30 murals primarily addressing Central American politics, human rights, and Latino culture.",
    fullDescription:
      "In 1984, during civil wars in Central America, local artists transformed this alley into a canvas for protest and healing.",
    hints: ["Between 24th and 25th Streets", "Runs parallel to Treat Avenue"],
    vibe: "latino heritage, political art, resistance murals, community expression, cultural history",
  },
  {
    id: "seward-slides",
    name: "Seward Street Slides",
    neighborhood: "Castro District",
    address: "Seward St, San Francisco, CA 94114",
    coordinates: { lat: 37.7572, lng: -122.4375 },
    category: "hidden-gems",
    heroImage:
      "https://images.unsplash.com/photo-1516550135131-fe3dcb0bedc7?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "1973",
    shortSummary:
      "These concrete slides hidden in a tiny neighborhood park let you zip down the hillside on cardboard. A beloved local secret since 1973.",
    fullDescription:
      "Built in 1973 as part of a community improvement project, these twin slides run down a steep hillside. Locals know to bring cardboard for maximum speed.",
    hints: [
      "Bring cardboard for sliding!",
      "Hidden stairway entrance on Seward Street",
    ],
    vibe: "local secret, childhood fun, quirky SF, bring your own cardboard, hidden playground",
  },
  {
    id: "wave-organ",
    name: "Wave Organ",
    neighborhood: "Marina District",
    address: "83 Marina Green Dr, San Francisco, CA 94123",
    coordinates: { lat: 37.8087, lng: -122.4445 },
    category: "hidden-gems",
    heroImage:
      "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "1986",
    shortSummary:
      "This acoustic sculpture on a jetty uses the motion of waves to create music through 25 organ pipes. The sounds vary with the tide.",
    fullDescription:
      "Created by sculptors Peter Richards and George Gonzales, the Wave Organ was built from materials salvaged from a demolished cemetery.",
    hints: [
      "Walk to the end of the jetty past the yacht harbor",
      "High tide provides the best sounds",
    ],
    vibe: "acoustic sculpture, tide-powered music, peaceful meditation spot, bay views, hidden art",
  },
  {
    id: "tiled-steps",
    name: "16th Avenue Tiled Steps",
    neighborhood: "Inner Sunset",
    address: "16th Ave & Moraga St, San Francisco, CA 94122",
    coordinates: { lat: 37.7561, lng: -122.4733 },
    category: "hidden-gems",
    heroImage:
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "2005",
    shortSummary:
      "163 steps covered in a sea-to-stars mosaic created by 300 neighborhood volunteers. Each of the 2,000 handmade tiles was crafted by community members.",
    fullDescription:
      "Irish ceramicist Aileen Barr and mosaic artist Colette Crutcher led this remarkable community project.",
    hints: [
      "Best viewed from the bottom looking up",
      "Climb all 163 steps for city views",
    ],
    vibe: "community art project, colorful mosaic, residential neighborhood gem, stair climb workout",
  },
  {
    id: "pier39-sea-lions",
    name: "Pier 39 Sea Lions",
    neighborhood: "Fisherman's Wharf",
    address: "Pier 39, San Francisco, CA 94133",
    coordinates: { lat: 37.8087, lng: -122.4098 },
    category: "waterfront",
    heroImage:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "1990",
    shortSummary:
      "After the 1989 earthquake, sea lions mysteriously began gathering on K-Dock. Today, up to 1,700 California sea lions lounge here.",
    fullDescription:
      "Nobody invited them. In January 1990, sea lions began hauling out on K-Dock, displacing the boats. Marine biologists theorize the earthquake disrupted their usual spots.",
    hints: [
      "Head to K-Dock at the west end of Pier 39",
      "Listen for the barking!",
    ],
    vibe: "wildlife watching, family friendly, touristy but fun, loud and smelly, quintessential SF",
  },
  {
    id: "hyde-street-pier",
    name: "Hyde Street Pier",
    neighborhood: "Fisherman's Wharf",
    address: "2905 Hyde St, San Francisco, CA 94109",
    coordinates: { lat: 37.8069, lng: -122.4218 },
    category: "waterfront",
    heroImage:
      "https://images.unsplash.com/photo-1534050359320-02900022671e?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "1922",
    shortSummary:
      "Home to the largest collection of historic ships in the country. Board the 1886 Balclutha sailing ship, the ferry Eureka, and the tugboat Hercules.",
    fullDescription:
      "This pier served as the terminal for ferries crossing to Marin County before the Golden Gate Bridge was built.",
    hints: [
      "Entrance is at the foot of Hyde Street",
      "Start with the Balclutha ship",
    ],
    vibe: "maritime history, historic ships museum, nautical adventure, educational experience",
  },
  {
    id: "ferry-building",
    name: "Ferry Building Marketplace",
    neighborhood: "Embarcadero",
    address: "1 Ferry Building, San Francisco, CA 94111",
    coordinates: { lat: 37.7955, lng: -122.3937 },
    category: "waterfront",
    heroImage:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "1898",
    shortSummary:
      "Once the second-busiest transit terminal in the world, this Beaux-Arts beauty now houses a gourmet marketplace featuring Bay Area artisans.",
    fullDescription:
      "Before the bridges, 50,000 commuters passed through here daily. The 2003 renovation transformed it into a food lover's paradise.",
    hints: [
      "The clock tower is a city landmark",
      "Saturday farmers market is legendary",
    ],
    vibe: "foodie paradise, artisan marketplace, saturday farmers market, waterfront dining, local producers",
  },
  {
    id: "twin-peaks",
    name: "Twin Peaks",
    neighborhood: "Twin Peaks",
    address: "501 Twin Peaks Blvd, San Francisco, CA 94114",
    coordinates: { lat: 37.7544, lng: -122.4477 },
    category: "parks",
    heroImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "Ancient",
    shortSummary:
      "At 922 feet, these twin summits offer 360-degree panoramic views of the entire Bay Area.",
    fullDescription:
      "Twin Peaks is one of the few places in San Francisco where you can see natural grassland and coastal scrub—the original ecosystem.",
    hints: ["Drive or take the 37 bus", "Best views at sunset on clear days"],
    vibe: "360 degree views, sunset spot, windy summit, city lights at night, romantic overlook",
  },
  {
    id: "lands-end",
    name: "Lands End Trail",
    neighborhood: "Outer Richmond",
    address: "680 Point Lobos Ave, San Francisco, CA 94121",
    coordinates: { lat: 37.787, lng: -122.5108 },
    category: "parks",
    heroImage:
      "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800",
    historicImage:
      "https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800",
    historicYear: "1880s",
    shortSummary:
      "A wild, rugged coastal trail with stunning Golden Gate Bridge views, shipwreck remains, and the haunting ruins of the Sutro Baths.",
    fullDescription:
      "This 1.5-mile trail winds along the rocky cliffs of the city's northwestern edge. At low tide, you can spot the remains of several shipwrecks.",
    hints: [
      "Start at the Lands End Lookout visitor center",
      "Look for the hidden labyrinth at Eagles Nest",
    ],
    vibe: "rugged coastal hike, sutro baths ruins, nature escape in city, hidden labyrinth, shipwreck spotting",
  },
];

const foodStops = [
  {
    id: "tartine",
    name: "Tartine Bakery",
    cuisine: "Bakery & Café",
    priceRange: "$$",
    neighborhood: "Mission District",
    coordinates: { lat: 37.7614, lng: -122.4241 },
    recommendations: ["Morning Bun", "Croque Monsieur", "Country Bread"],
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
    vibe: "artisan bakery, long lines worth it, perfect pastries, brunch spot",
  },
  {
    id: "swan-oyster",
    name: "Swan Oyster Depot",
    cuisine: "Seafood",
    priceRange: "$$$",
    neighborhood: "Nob Hill",
    coordinates: { lat: 37.7895, lng: -122.419 },
    recommendations: ["Oysters on Half Shell", "Crab Louie", "Clam Chowder"],
    image: "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=400",
    vibe: "old school counter service, fresh seafood institution, cash only, no reservations",
  },
  {
    id: "golden-boy",
    name: "Golden Boy Pizza",
    cuisine: "Italian",
    priceRange: "$",
    neighborhood: "North Beach",
    coordinates: { lat: 37.7986, lng: -122.4092 },
    recommendations: ["Clam & Garlic", "Pepperoni", "Combo"],
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
    vibe: "late night slice joint, focaccia style pizza, cheap eats, dive bar adjacent",
  },
  {
    id: "la-taqueria",
    name: "La Taqueria",
    cuisine: "Mexican",
    priceRange: "$",
    neighborhood: "Mission District",
    coordinates: { lat: 37.751, lng: -122.418 },
    recommendations: ["Carne Asada Burrito", "Carnitas Tacos", "Horchata"],
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400",
    vibe: "best burrito debate contender, no rice in burritos, mission staple, james beard winner",
  },
  {
    id: "house-of-nanking",
    name: "House of Nanking",
    cuisine: "Chinese",
    priceRange: "$$",
    neighborhood: "Chinatown",
    coordinates: { lat: 37.7969, lng: -122.4047 },
    recommendations: ["Sesame Chicken", "Pot Stickers", "House Special Prawns"],
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400",
    vibe: "let the chef decide, chaotic but delicious, tiny chinatown spot, cult following",
  },
];

// ============================================
// Embedding Generation
// ============================================

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

function createLocationEmbeddingText(location: (typeof allLocations)[0]): string {
  return [
    location.name,
    location.neighborhood,
    location.category,
    location.shortSummary,
    location.vibe || "",
    location.hints?.join(" ") || "",
  ].join(" | ");
}

function createFoodStopEmbeddingText(foodStop: (typeof foodStops)[0]): string {
  return [
    foodStop.name,
    foodStop.cuisine,
    foodStop.neighborhood,
    foodStop.priceRange,
    foodStop.vibe || "",
    foodStop.recommendations?.join(", ") || "",
  ].join(" | ");
}

// ============================================
// Database Seeding
// ============================================

async function seedLocations() {
  console.log("\n📍 Seeding locations...\n");

  for (const location of allLocations) {
    console.log(`  Processing: ${location.name}`);

    // Generate embedding
    const embeddingText = createLocationEmbeddingText(location);
    const embedding = await generateEmbedding(embeddingText);

    // Insert into database
    const { error } = await supabase.from("locations").upsert({
      id: location.id,
      name: location.name,
      neighborhood: location.neighborhood,
      address: location.address,
      category: location.category,
      lat: location.coordinates.lat,
      lng: location.coordinates.lng,
      hero_image: location.heroImage,
      historic_image: location.historicImage,
      historic_year: location.historicYear,
      short_summary: location.shortSummary,
      full_description: location.fullDescription,
      hints: location.hints,
      vibe: location.vibe,
      embedding: embedding,
    });

    if (error) {
      console.error(`  ❌ Error inserting ${location.name}:`, error.message);
    } else {
      console.log(`  ✅ ${location.name}`);
    }

    // Rate limit: OpenAI allows 3000 RPM for embeddings, but let's be safe
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function seedFoodStops() {
  console.log("\n🍽️  Seeding food stops...\n");

  for (const foodStop of foodStops) {
    console.log(`  Processing: ${foodStop.name}`);

    // Generate embedding
    const embeddingText = createFoodStopEmbeddingText(foodStop);
    const embedding = await generateEmbedding(embeddingText);

    // Insert into database
    const { error } = await supabase.from("food_stops").upsert({
      id: foodStop.id,
      name: foodStop.name,
      cuisine: foodStop.cuisine,
      price_range: foodStop.priceRange,
      neighborhood: foodStop.neighborhood,
      lat: foodStop.coordinates.lat,
      lng: foodStop.coordinates.lng,
      recommendations: foodStop.recommendations,
      image: foodStop.image,
      vibe: foodStop.vibe,
      embedding: embedding,
    });

    if (error) {
      console.error(`  ❌ Error inserting ${foodStop.name}:`, error.message);
    } else {
      console.log(`  ✅ ${foodStop.name}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// ============================================
// Main
// ============================================

async function main() {
  console.log("🌉 Golden Gate Quest - Database Seeder\n");
  console.log("=".repeat(50));

  try {
    await seedLocations();
    await seedFoodStops();

    console.log("\n" + "=".repeat(50));
    console.log("✅ Database seeding complete!\n");
    console.log("Next steps:");
    console.log("  1. Verify data in Supabase dashboard");
    console.log("  2. Run: npx supabase gen types typescript --project-id qhztihvjfdovxkdsyebp > src/integrations/supabase/types.ts");
    console.log("  3. Update your app to query from the database");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
