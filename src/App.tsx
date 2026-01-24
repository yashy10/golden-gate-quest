import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import OnboardingScreen from "./pages/OnboardingScreen";
import CategoriesScreen from "./pages/CategoriesScreen";
import ItineraryScreen from "./pages/ItineraryScreen";
import LocationScreen from "./pages/LocationScreen";
import DiscoveryScreen from "./pages/DiscoveryScreen";
import AchievementScreen from "./pages/AchievementScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/categories" element={<CategoriesScreen />} />
          <Route path="/itinerary" element={<ItineraryScreen />} />
          <Route path="/location/:index" element={<LocationScreen />} />
          <Route path="/discovery/:index" element={<DiscoveryScreen />} />
          <Route path="/achievement" element={<AchievementScreen />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
