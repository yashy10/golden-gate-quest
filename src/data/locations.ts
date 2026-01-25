export type Category =
  | 'iconic'
  | 'architecture'
  | 'neighborhoods'
  | 'hidden-gems'
  | 'waterfront'
  | 'parks'
  | 'arts-culture'
  | 'local-business'
  | 'film-history';

export interface Location {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  coordinates: { lat: number; lng: number };
  category: Category;
  heroImage: string;
  historicImage: string;
  historicYear: string;
  shortSummary: string;
  fullDescription: string;
  hints: string[];
}

export interface FoodStop {
  id: string;
  name: string;
  cuisine: string;
  priceRange: '$' | '$$' | '$$$';
  neighborhood: string;
  coordinates: { lat: number; lng: number };
  recommendations: string[];
  image: string;
}

export interface UserPreferences {
  ageRange: string;
  budget: string;
  startingPoint: { type: 'current' | 'address'; value?: string };
  timeAvailable: string;
  mobility: string;
  groupSize: string;
}

export interface Quest {
  id: string;
  createdAt: Date;
  preferences: UserPreferences;
  categories: Category[];
  locations: Location[];
  foodStop: FoodStop;
  aiProvider?: 'openai' | 'dgx' | 'fallback';
  progress: {
    currentIndex: number;
    completed: boolean[];
    photos: string[];
    startTime?: Date;
  };
}

export const categoryInfo: Record<Category, { icon: string; title: string; subtitle: string; culturalFocus?: string }> = {
  'arts-culture': { 
    icon: '🎭', 
    title: 'Arts & Culture', 
    subtitle: 'Museums, theaters & galleries',
    culturalFocus: 'Celebrating SF\'s vibrant arts scene'
  },
  neighborhoods: { 
    icon: '🌍', 
    title: 'Cultural Districts', 
    subtitle: 'Chinatown, Mission & unique communities',
    culturalFocus: 'Preserving neighborhood identity & heritage'
  },
  'local-business': { 
    icon: '🏪', 
    title: 'Local Treasures', 
    subtitle: 'Historic shops & community hubs',
    culturalFocus: 'Supporting small business legacy'
  },
  'film-history': { 
    icon: '🎬', 
    title: 'Film & Media', 
    subtitle: 'Famous filming locations',
    culturalFocus: 'SF\'s cinematic heritage'
  },
  iconic: { 
    icon: '🏛️', 
    title: 'Iconic Landmarks', 
    subtitle: 'The famous must-sees',
    culturalFocus: 'Symbols of SF identity'
  },
  architecture: { 
    icon: '🏠', 
    title: 'Historic Architecture', 
    subtitle: 'Victorian gems & grand buildings',
    culturalFocus: 'Architectural preservation'
  },
  'hidden-gems': { 
    icon: '💎', 
    title: 'Hidden Gems', 
    subtitle: 'Secret spots locals love',
    culturalFocus: 'Community discoveries'
  },
  waterfront: { 
    icon: '🌊', 
    title: 'Waterfront & Maritime', 
    subtitle: 'Bay views & nautical history',
    culturalFocus: 'Maritime heritage'
  },
  parks: { 
    icon: '🌲', 
    title: 'Parks & Recreation', 
    subtitle: 'Green spaces & outdoor culture',
    culturalFocus: 'Public spaces for all'
  },
};

export const allLocations: Location[] = [
  // Iconic Landmarks
  {
    id: 'golden-gate-vista',
    name: 'Golden Gate Bridge Vista Point',
    neighborhood: 'Marin Headlands',
    address: 'Conzelman Rd, Sausalito, CA 94965',
    coordinates: { lat: 37.8324, lng: -122.4795 },
    category: 'iconic',
    heroImage: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800',
    historicImage: 'https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=800',
    historicYear: '1937',
    shortSummary: "The Golden Gate Bridge, completed in 1937, was once the longest suspension bridge in the world. Its iconic 'International Orange' color was chosen to complement the natural surroundings and enhance visibility in fog.",
    fullDescription: "Standing at Battery Spencer, you're witnessing one of the most photographed bridges on Earth. Chief Engineer Joseph Strauss initially proposed a clunky hybrid cantilever-suspension design, but consulting architect Irving Morrow refined it into the Art Deco masterpiece you see today. The bridge's famous color, officially called 'International Orange,' was originally just a primer coat that looked so stunning against the blue sky and green hills that it became permanent.",
    hints: ['Look for the vista point parking area', 'Best photos are from the elevated battery position'],
  },
  {
    id: 'coit-tower',
    name: 'Coit Tower',
    neighborhood: 'Telegraph Hill',
    address: '1 Telegraph Hill Blvd, San Francisco, CA 94133',
    coordinates: { lat: 37.8024, lng: -122.4058 },
    category: 'iconic',
    heroImage: 'https://images.unsplash.com/photo-1534050359320-02900022671e?w=800',
    historicImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    historicYear: '1933',
    shortSummary: "Built with funds bequeathed by eccentric millionaire Lillie Hitchcock Coit, this 210-foot tower honors San Francisco firefighters. Lillie was an honorary member of Knickerbocker Engine Co. No. 5 from age 15.",
    fullDescription: "Lillie Hitchcock Coit was a legend in her own time—she smoked cigars, wore pants, and once rescued a fire engine company in 1851. The tower's fluted design resembles a fire hose nozzle, though architect Arthur Brown Jr. denied the connection. Inside, stunning Depression-era murals by 26 artists depict California life and labor, created as part of the Public Works of Art Project.",
    hints: ['The tower is at the top of Telegraph Hill', 'Look for the white Art Deco column'],
  },
  {
    id: 'transamerica-pyramid',
    name: 'Transamerica Pyramid',
    neighborhood: 'Financial District',
    address: '600 Montgomery St, San Francisco, CA 94111',
    coordinates: { lat: 37.7952, lng: -122.4028 },
    category: 'iconic',
    heroImage: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
    historicImage: 'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    historicYear: '1972',
    shortSummary: "At 853 feet, the Transamerica Pyramid was the tallest building in San Francisco until 2018. Its distinctive shape was designed to allow more light and air to reach the streets below.",
    fullDescription: "When architect William Pereira proposed this radical design in 1969, San Franciscans were outraged. They called it 'Pereira's Prick' and organized protests. Today, it's beloved as a symbol of the city. The building's two 'wings' house an elevator shaft and a smoke tower. At its base, a half-acre redwood grove provides a tranquil urban oasis.",
    hints: ['Find the small redwood park at the base', 'Best viewed from Washington Street'],
  },

  // Historic Architecture
  {
    id: 'painted-ladies',
    name: 'Painted Ladies',
    neighborhood: 'Alamo Square',
    address: '710-720 Steiner St, San Francisco, CA 94117',
    coordinates: { lat: 37.7762, lng: -122.4328 },
    category: 'architecture',
    heroImage: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800',
    historicImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    historicYear: '1895',
    shortSummary: "The 'Painted Ladies' earned their nickname in the 1960s when the colorful Victorian revival began. These seven houses, built between 1892-1896, survived the 1906 earthquake and have appeared in over 70 films and TV shows.",
    fullDescription: "These Queen Anne-style Victorians are the most photographed homes in America. The term 'Painted Lady' was coined by writers Elizabeth Pomada and Michael Larsen in their 1978 book. During World War II, many Victorians were painted battleship gray due to Navy surplus paint. The colorful revival began when artist Butch Kardum started painting his house in bright colors, inspiring a citywide movement.",
    hints: ['View from Alamo Square Park across Hayes Street', 'The downtown skyline frames them perfectly'],
  },
  {
    id: 'palace-fine-arts',
    name: 'Palace of Fine Arts',
    neighborhood: 'Marina District',
    address: '3601 Lyon St, San Francisco, CA 94123',
    coordinates: { lat: 37.8020, lng: -122.4484 },
    category: 'architecture',
    heroImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    historicImage: 'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    historicYear: '1915',
    shortSummary: "Built for the 1915 Panama-Pacific International Exposition, this Roman-inspired rotunda was the only structure meant to be permanent. It was rebuilt in the 1960s after the original began to crumble.",
    fullDescription: "Architect Bernard Maybeck designed this melancholy ruin to evoke 'the mortality of grandeur and the vanity of human wishes.' The weeping women atop the colonnade represent the sadness of life without art. Originally built of temporary materials, it deteriorated for decades before being rebuilt in concrete. The lagoon reflects swans and the graceful columns, creating San Francisco's most romantic spot.",
    hints: ['Enter from Lyon Street', 'The reflecting lagoon offers the best photo spots'],
  },
  {
    id: 'city-hall',
    name: 'San Francisco City Hall',
    neighborhood: 'Civic Center',
    address: '1 Dr Carlton B Goodlett Pl, San Francisco, CA 94102',
    coordinates: { lat: 37.7793, lng: -122.4193 },
    category: 'architecture',
    heroImage: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
    historicImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    historicYear: '1915',
    shortSummary: "This Beaux-Arts masterpiece features a dome taller than the U.S. Capitol. It was built to replace the original City Hall destroyed in the 1906 earthquake and has witnessed historic moments from the assassination of Mayor George Moscone to same-sex marriage ceremonies.",
    fullDescription: "Architects Arthur Brown Jr. and John Bakewell Jr. designed this grand civic temple to rival any capital in the world. The dome, inspired by St. Peter's Basilica, rises 307 feet—42 feet higher than the U.S. Capitol. Inside, a grand staircase of carved California oak leads to the rotunda. The building has seen tragedy (the 1978 assassinations) and triumph (the 2004 same-sex marriages).",
    hints: ['The main entrance faces Civic Center Plaza', 'Look up at the stunning gilded dome'],
  },

  // Cultural Neighborhoods
  {
    id: 'dragon-gate',
    name: 'Dragon Gate',
    neighborhood: 'Chinatown',
    address: 'Grant Ave & Bush St, San Francisco, CA 94108',
    coordinates: { lat: 37.7908, lng: -122.4058 },
    category: 'neighborhoods',
    heroImage: 'https://images.unsplash.com/photo-1534050359320-02900022671e?w=800',
    historicImage: 'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    historicYear: '1970',
    shortSummary: "This ornate gateway marks the entrance to the oldest Chinatown in North America. The gate was a gift from Taiwan in 1970, featuring traditional Chinese architecture with green tile roofs and dragon motifs.",
    fullDescription: "San Francisco's Chinatown was established in 1848, making it the oldest and one of the most densely populated Chinatowns in the Western Hemisphere. After the 1906 earthquake, city planners tried to relocate Chinatown, but Chinese merchants rebuilt even faster and grander. The Dragon Gate, officially the Chinatown Gate, was designed by Clayton Lee and features the Chinese inscription 'All under heaven is for the good of the people.'",
    hints: ['Located at the corner of Grant Avenue and Bush Street', 'Look for the green tile roof and guardian lions'],
  },
  {
    id: 'mission-dolores',
    name: 'Mission Dolores',
    neighborhood: 'Mission District',
    address: '3321 16th St, San Francisco, CA 94114',
    coordinates: { lat: 37.7649, lng: -122.4269 },
    category: 'neighborhoods',
    heroImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    historicImage: 'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    historicYear: '1776',
    shortSummary: "Founded in 1776, Mission Dolores is the oldest surviving structure in San Francisco. Its 4-foot-thick adobe walls survived the 1906 earthquake while newer buildings around it crumbled.",
    fullDescription: "Mission San Francisco de Asís, known as Mission Dolores, was the sixth of 21 California missions. The cemetery contains the remains of the city's original settlers, including the fictional Carlotta Valdes from Hitchcock's 'Vertigo.' The original redwood roof beams, held together with rawhide strips, remain intact after nearly 250 years. The larger basilica next door was built in 1918.",
    hints: ['The small white adobe building is the original mission', 'The cemetery is behind the building'],
  },
  {
    id: 'city-lights',
    name: 'City Lights Bookstore',
    neighborhood: 'North Beach',
    address: '261 Columbus Ave, San Francisco, CA 94133',
    coordinates: { lat: 37.7976, lng: -122.4066 },
    category: 'neighborhoods',
    heroImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    historicImage: 'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    historicYear: '1953',
    shortSummary: "Founded by poet Lawrence Ferlinghetti, City Lights was the first all-paperback bookstore in the U.S. and the birthplace of the Beat Generation literary movement.",
    fullDescription: "In 1956, City Lights published Allen Ginsberg's 'Howl,' leading to an obscenity trial that became a landmark First Amendment case. The store's three floors are packed with poetry, progressive politics, and counterculture works. The alley next door is officially named Jack Kerouac Alley. Look for the 'I Am the Door' sign—a meditation on knowledge and freedom.",
    hints: ['Located at the corner of Columbus and Broadway', 'Look for the iconic yellow and black signage'],
  },

  // Hidden Gems
  {
    id: 'seward-slides',
    name: 'Seward Street Slides',
    neighborhood: 'Castro District',
    address: 'Seward St, San Francisco, CA 94114',
    coordinates: { lat: 37.7572, lng: -122.4375 },
    category: 'hidden-gems',
    heroImage: 'https://images.unsplash.com/photo-1516550135131-fe3dcb0bedc7?w=800',
    historicImage: 'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    historicYear: '1973',
    shortSummary: "These concrete slides hidden in a tiny neighborhood park let you zip down the hillside on cardboard. A beloved local secret since 1973, they're pure San Francisco whimsy.",
    fullDescription: "Built in 1973 as part of a community improvement project, these twin slides run down a steep hillside. Locals know to bring cardboard for maximum speed (some is usually lying around). The slides have been featured in countless 'hidden gems' lists but remain wonderfully undervisited. It's a reminder that San Francisco isn't just about tech—it's still a city that celebrates play.",
    hints: ['Bring cardboard for sliding!', 'Hidden stairway entrance on Seward Street'],
  },
  {
    id: 'wave-organ',
    name: 'Wave Organ',
    neighborhood: 'Marina District',
    address: '83 Marina Green Dr, San Francisco, CA 94123',
    coordinates: { lat: 37.8087, lng: -122.4445 },
    category: 'hidden-gems',
    heroImage: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800',
    historicImage: 'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    historicYear: '1986',
    shortSummary: "This acoustic sculpture on a jetty uses the motion of waves to create music through 25 organ pipes. The sounds vary with the tide—best experienced during high tide or storms.",
    fullDescription: "Created by sculptors Peter Richards and George Gonzales, the Wave Organ was built from materials salvaged from a demolished cemetery. The stone steps, benches, and walls incorporate granite and marble from gravestones. At high tide, waves push through the pipes creating gurgles, slurps, and harmonics. On calm days, the music is subtle; during storms, it's symphonic.",
    hints: ['Walk to the end of the jetty past the yacht harbor', 'High tide provides the best sounds'],
  },
  {
    id: 'tiled-steps',
    name: '16th Avenue Tiled Steps',
    neighborhood: 'Inner Sunset',
    address: '16th Ave & Moraga St, San Francisco, CA 94122',
    coordinates: { lat: 37.7561, lng: -122.4733 },
    category: 'hidden-gems',
    heroImage: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800',
    historicImage: 'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    historicYear: '2005',
    shortSummary: "163 steps covered in a sea-to-stars mosaic created by 300 neighborhood volunteers. Each of the 2,000 handmade tiles was crafted by community members.",
    fullDescription: "Irish ceramicist Aileen Barr and mosaic artist Colette Crutcher led this remarkable community project. The bottom steps depict the sea, rising through land, flowers, and trees to the sun, moon, and stars at the top. The project took two years and involved over 300 volunteers who made or funded tiles. It spawned similar projects around the world.",
    hints: ['Best viewed from the bottom looking up', 'Climb all 163 steps for city views'],
  },

  // Waterfront
  {
    id: 'pier39-sea-lions',
    name: 'Pier 39 Sea Lions',
    neighborhood: 'Fisherman\'s Wharf',
    address: 'Pier 39, San Francisco, CA 94133',
    coordinates: { lat: 37.8087, lng: -122.4098 },
    category: 'waterfront',
    heroImage: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800',
    historicImage: 'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    historicYear: '1990',
    shortSummary: "After the 1989 earthquake, sea lions mysteriously began gathering on K-Dock. Today, up to 1,700 California sea lions lounge here, and the dock has become their permanent home.",
    fullDescription: "Nobody invited them. In January 1990, sea lions began hauling out on K-Dock, displacing the boats. Marine biologists theorize the earthquake disrupted their usual spots, or perhaps the herring migration made this location irresistible. The Marina attempted to evict them, but the Marine Mammal Center intervened. Now they're Pier 39's biggest attraction, with their own webcam and interpretive center.",
    hints: ['Head to K-Dock at the west end of Pier 39', 'Listen for the barking!'],
  },
  {
    id: 'hyde-street-pier',
    name: 'Hyde Street Pier',
    neighborhood: 'Fisherman\'s Wharf',
    address: '2905 Hyde St, San Francisco, CA 94109',
    coordinates: { lat: 37.8069, lng: -122.4218 },
    category: 'waterfront',
    heroImage: 'https://images.unsplash.com/photo-1534050359320-02900022671e?w=800',
    historicImage: 'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    historicYear: '1922',
    shortSummary: "Home to the largest collection of historic ships in the country. Board the 1886 Balclutha sailing ship, the ferry Eureka, and the tugboat Hercules for a journey into maritime history.",
    fullDescription: "This pier served as the terminal for ferries crossing to Marin County before the Golden Gate Bridge was built. Today, it's a floating museum. The crown jewel is the Balclutha, a steel-hulled sailing ship that rounded Cape Horn 17 times. The Eureka was once the world's largest passenger ferry. Each vessel tells a story of San Francisco's maritime past.",
    hints: ['Entrance is at the foot of Hyde Street', 'Start with the Balclutha ship'],
  },
  {
    id: 'ferry-building',
    name: 'Ferry Building Marketplace',
    neighborhood: 'Embarcadero',
    address: '1 Ferry Building, San Francisco, CA 94111',
    coordinates: { lat: 37.7955, lng: -122.3937 },
    category: 'waterfront',
    heroImage: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
    historicImage: 'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    historicYear: '1898',
    shortSummary: "Once the second-busiest transit terminal in the world (after Charing Cross in London), this Beaux-Arts beauty now houses a gourmet marketplace featuring Bay Area artisans and farmers.",
    fullDescription: "Before the bridges, 50,000 commuters passed through here daily. After the bridges opened in the 1930s, ferry ridership plummeted, and the Embarcadero Freeway obscured the building. When the freeway collapsed in the 1989 earthquake, the city demolished it, revealing the Ferry Building again. The 2003 renovation transformed it into a food lover's paradise with Cowgirl Creamery, Acme Bread, and Blue Bottle Coffee.",
    hints: ['The clock tower is a city landmark', 'Saturday farmers market is legendary'],
  },

  // Parks
  {
    id: 'twin-peaks',
    name: 'Twin Peaks',
    neighborhood: 'Twin Peaks',
    address: '501 Twin Peaks Blvd, San Francisco, CA 94114',
    coordinates: { lat: 37.7544, lng: -122.4477 },
    category: 'parks',
    heroImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    historicImage: 'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    historicYear: 'Ancient',
    shortSummary: "At 922 feet, these twin summits offer 360-degree panoramic views of the entire Bay Area. The Spanish called them 'Los Pechos de la Chola' (The Breasts of the Indian Maiden).",
    fullDescription: "Twin Peaks is one of the few places in San Francisco where you can see natural grassland and coastal scrub—the original ecosystem. The exposed summit is almost always windy and often foggy, but on clear days, you can see from the Farallon Islands to Mount Diablo. The figure-8 road was built in 1914, and Christmas Eve brings hundreds of locals for a midnight celebration.",
    hints: ['Drive or take the 37 bus', 'Best views at sunset on clear days'],
  },
  {
    id: 'lands-end',
    name: 'Lands End Trail',
    neighborhood: 'Outer Richmond',
    address: '680 Point Lobos Ave, San Francisco, CA 94121',
    coordinates: { lat: 37.7870, lng: -122.5108 },
    category: 'parks',
    heroImage: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800',
    historicImage: 'https://images.unsplash.com/photo-1476973422084-e0fa66ff9456?w=800',
    historicYear: '1880s',
    shortSummary: "A wild, rugged coastal trail with stunning Golden Gate Bridge views, shipwreck remains, and the haunting ruins of the Sutro Baths. It feels like the edge of the world.",
    fullDescription: "This 1.5-mile trail winds along the rocky cliffs of the city's northwestern edge. At low tide, you can spot the remains of several shipwrecks. The ruins of Sutro Baths, a Victorian swimming complex that once held 10,000 bathers, lie at the trail's end. Eagles Nest viewpoint offers a labyrinth and one of the best Golden Gate views. It's wild San Francisco at its finest.",
    hints: ['Start at the Lands End Lookout visitor center', 'Look for the hidden labyrinth at Eagles Nest'],
  },
];

export const foodStops: FoodStop[] = [
  {
    id: 'tartine',
    name: 'Tartine Bakery',
    cuisine: 'Bakery & Café',
    priceRange: '$$',
    neighborhood: 'Mission District',
    coordinates: { lat: 37.7614, lng: -122.4241 },
    recommendations: ['Morning Bun', 'Croque Monsieur', 'Country Bread'],
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
  },
  {
    id: 'swan-oyster',
    name: 'Swan Oyster Depot',
    cuisine: 'Seafood',
    priceRange: '$$$',
    neighborhood: 'Nob Hill',
    coordinates: { lat: 37.7895, lng: -122.4190 },
    recommendations: ['Oysters on Half Shell', 'Crab Louie', 'Clam Chowder'],
    image: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=400',
  },
  {
    id: 'golden-boy',
    name: 'Golden Boy Pizza',
    cuisine: 'Italian',
    priceRange: '$',
    neighborhood: 'North Beach',
    coordinates: { lat: 37.7986, lng: -122.4092 },
    recommendations: ['Clam & Garlic', 'Pepperoni', 'Combo'],
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
  },
  {
    id: 'la-taqueria',
    name: 'La Taqueria',
    cuisine: 'Mexican',
    priceRange: '$',
    neighborhood: 'Mission District',
    coordinates: { lat: 37.7510, lng: -122.4180 },
    recommendations: ['Carne Asada Burrito', 'Carnitas Tacos', 'Horchata'],
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
  },
  {
    id: 'house-of-nanking',
    name: 'House of Nanking',
    cuisine: 'Chinese',
    priceRange: '$$',
    neighborhood: 'Chinatown',
    coordinates: { lat: 37.7969, lng: -122.4047 },
    recommendations: ['Sesame Chicken', 'Pot Stickers', 'House Special Prawns'],
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
  },
];

export function generateQuest(
  categories: Category[],
  preferences: UserPreferences
): Quest {
  // Filter locations by selected categories
  const availableLocations = allLocations.filter(loc =>
    categories.includes(loc.category)
  );

  // Shuffle and pick 5 locations
  const shuffled = [...availableLocations].sort(() => Math.random() - 0.5);
  const selectedLocations = shuffled.slice(0, 5);

  // Pick a random food stop
  const foodStop = foodStops[Math.floor(Math.random() * foodStops.length)];

  return {
    id: `quest-${Date.now()}`,
    createdAt: new Date(),
    preferences,
    categories,
    locations: selectedLocations,
    foodStop,
    aiProvider: 'fallback',
    progress: {
      currentIndex: 0,
      completed: new Array(selectedLocations.length).fill(false),
      photos: new Array(selectedLocations.length).fill(''),
    },
  };
}
