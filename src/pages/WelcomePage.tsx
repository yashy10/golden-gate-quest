import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, MapPin, Camera, Clock, Sparkles, Mic, Award, ChevronRight, Download, Share, Plus } from 'lucide-react';
import GoldenGateLogo from '@/components/GoldenGateLogo';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();

  const handleGetStarted = () => {
    navigate('/onboarding');
  };

  const handleInstall = async () => {
    if (isIOS) {
      // Can't programmatically install on iOS, show instructions instead
      return;
    }
    await promptInstall();
  };

  return (
    <div className="mobile-container min-h-screen bg-background overflow-y-auto">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col gradient-secondary overflow-hidden">
        {/* Fog animation */}
        <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none">
          <div className="fog-animation absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="fog-animation-delayed absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* Hero Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="animate-scale-in mb-4">
            <GoldenGateLogo size={80} />
          </div>
          
          <h1 className="text-4xl font-extrabold text-primary-foreground mb-3 animate-fade-in">
            Explore San Francisco
            <br />
            <span className="text-white/90">Like Never Before</span>
          </h1>
          
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-xs animate-fade-in" style={{ animationDelay: '0.1s' }}>
            A personalized photo quest that reveals the city's hidden stories
          </p>

          <button
            onClick={handleGetStarted}
            className="px-8 py-4 rounded-2xl bg-white text-primary font-bold text-lg shadow-button animate-slide-up flex items-center gap-2 hover:scale-105 transition-transform"
            style={{ animationDelay: '0.2s' }}
          >
            Start Your Adventure
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 pb-8 flex flex-col items-center animate-bounce">
          <span className="text-primary-foreground/60 text-sm mb-2">Learn more</span>
          <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/40 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-primary-foreground/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Install App Section - Only show if installable and not installed */}
      {isInstallable && !isInstalled && (
        <section className="py-8 px-6 bg-primary/5 border-y border-primary/10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg">
              <Download className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground mb-1">Install SF Quest</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Add to your home screen for the best experience — works offline!
              </p>
              
              {isIOS ? (
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-sm text-foreground font-medium mb-2">To install on iPhone/iPad:</p>
                  <ol className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">1</span>
                      Tap the <Share className="w-4 h-4 inline mx-1" /> Share button below
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">2</span>
                      Scroll down and tap <span className="font-medium">"Add to Home Screen"</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">3</span>
                      Tap <span className="font-medium">"Add"</span> in the top right
                    </li>
                  </ol>
                </div>
              ) : (
                <button
                  onClick={handleInstall}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add to Home Screen
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Already installed indicator */}
      {isInstalled && (
        <section className="py-4 px-6 bg-green-500/10 border-y border-green-500/20">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-sm">App installed! Open from your home screen.</span>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="py-12 px-6 bg-background">
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">
          How It Works
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Three simple steps to your adventure
        </p>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/50">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Tell Us Your Vibe</h3>
              <p className="text-sm text-muted-foreground">
                Answer a few quick questions about your interests, time, and mobility
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/50">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Get Your Custom Quest</h3>
              <p className="text-sm text-muted-foreground">
                We'll create a personalized route with 5 must-see locations + a food stop
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/50">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Discover & Capture</h3>
              <p className="text-sm text-muted-foreground">
                Visit each spot, take photos, and unlock the history behind every location
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-12 px-6 bg-muted/30">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">
          What Makes It Special
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Feature 1 */}
          <div className="p-4 rounded-2xl bg-background shadow-card">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Then & Now Photos</h3>
            <p className="text-xs text-muted-foreground">
              Compare your shots with historic images
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-4 rounded-2xl bg-background shadow-card">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Hidden Stories</h3>
            <p className="text-xs text-muted-foreground">
              Learn fascinating facts about each location
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-4 rounded-2xl bg-background shadow-card">
            <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center mb-3">
              <Mic className="w-5 h-5 text-secondary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Voice Guide</h3>
            <p className="text-xs text-muted-foreground">
              Ask questions about what you're seeing
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-4 rounded-2xl bg-background shadow-card">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-3">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">Earn Achievements</h3>
            <p className="text-xs text-muted-foreground">
              Complete quests and share your badge
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 px-6 bg-background">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-3xl font-bold text-primary">15+</p>
            <p className="text-sm text-muted-foreground">Locations</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-3xl font-bold text-primary">7</p>
            <p className="text-sm text-muted-foreground">Categories</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-3xl font-bold text-primary">100%</p>
            <p className="text-sm text-muted-foreground">Free</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 px-6 gradient-secondary">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary-foreground mb-3">
            Ready to discover the real San Francisco?
          </h2>
          <p className="text-primary-foreground/80 mb-6">
            Takes only 2 minutes to set up
          </p>
          <button
            onClick={handleGetStarted}
            className="w-full max-w-xs mx-auto py-4 rounded-2xl bg-white text-primary font-bold text-lg shadow-button flex items-center justify-center gap-2 hover:scale-105 transition-transform"
          >
            Get Started — It's Free
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 bg-background text-center">
        <p className="text-sm text-muted-foreground">
          Made with ❤️ for San Francisco explorers
        </p>
      </footer>
    </div>
  );
};

export default WelcomePage;
