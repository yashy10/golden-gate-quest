import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Mic, ArrowRight, Download } from 'lucide-react';
import { useQuestStore } from '@/store/questStore';
import PhotoComparison from '@/components/PhotoComparison';
import Confetti from '@/components/Confetti';
import { useToast } from '@/hooks/use-toast';

const DiscoveryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { index } = useParams<{ index: string }>();
  const locationIndex = parseInt(index || '0', 10);

  const { _hasHydrated, currentQuest, getProgress } = useQuestStore();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Detect if running on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleSavePhoto = async (photoUrl: string, filename: string) => {
    setIsSaving(true);

    try {
      // Check if it's a blob URL (user's photo) or external URL
      const isBlobUrl = photoUrl.startsWith('blob:');

      if (isBlobUrl) {
        // For blob URLs, we can fetch directly
        const response = await fetch(photoUrl);
        const blob = await response.blob();

        // Try Web Share API on iOS
        if (navigator.share && isIOS && navigator.canShare?.({ files: [new File([blob], 'test.jpg', { type: 'image/jpeg' })] })) {
          const file = new File([blob], `${filename}.jpg`, { type: 'image/jpeg' });
          try {
            await navigator.share({ files: [file] });
            toast({
              title: "Photo saved",
              description: "Photo has been shared/saved.",
            });
            setIsSaving(false);
            return;
          } catch (shareError) {
            if ((shareError as Error).name === 'AbortError') {
              setIsSaving(false);
              return;
            }
          }
        }

        // Desktop download for blob URLs
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Photo saved",
          description: "Photo downloaded successfully.",
        });
      } else {
        // For external URLs (Unsplash, etc.), use canvas to bypass CORS
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = photoUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to create blob'));
          }, 'image/jpeg', 0.95);
        });

        // Try Web Share API on iOS
        if (navigator.share && isIOS && navigator.canShare?.({ files: [new File([blob], 'test.jpg', { type: 'image/jpeg' })] })) {
          const file = new File([blob], `${filename}.jpg`, { type: 'image/jpeg' });
          try {
            await navigator.share({ files: [file] });
            toast({
              title: "Photo saved",
              description: "Photo has been shared/saved.",
            });
            setIsSaving(false);
            return;
          } catch (shareError) {
            if ((shareError as Error).name === 'AbortError') {
              setIsSaving(false);
              return;
            }
          }
        }

        // Desktop download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Photo saved",
          description: "Photo downloaded successfully.",
        });
      }
    } catch (error) {
      console.error('Error saving photo:', error);

      // Last resort: open in new tab for manual save
      if (isIOS) {
        window.open(photoUrl, '_blank');
        toast({
          title: "Photo opened",
          description: "Long-press the image and tap 'Add to Photos'.",
        });
      } else {
        window.open(photoUrl, '_blank');
        toast({
          title: "Photo opened",
          description: "Right-click the image and choose 'Save Image As'.",
        });
      }
    }

    setIsSaving(false);
  };

  useEffect(() => {
    // Show confetti on first visit
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!_hasHydrated) {
    return (
      <div className="mobile-container min-h-screen flex flex-col gradient-secondary items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentQuest) return <Navigate to="/" replace />;

  const location = currentQuest.locations[locationIndex];
  const userPhoto = currentQuest.progress.photos[locationIndex] || location.heroImage;
  const { completed, total } = getProgress();
  const isQuestComplete = completed === total;

  if (!location) return <Navigate to="/itinerary" replace />;

  const handleContinue = () => {
    if (isQuestComplete) {
      navigate('/achievement');
    } else {
      navigate('/itinerary');
    }
  };

  return (
    <div className="mobile-container min-h-screen bg-background">
      <Confetti isActive={showConfetti} />
      
      {/* Voice Chat Modal */}
      {isVoiceChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-5">
          <div className="card-quest p-6 w-full max-w-sm text-center">
            <div className="w-20 h-20 mx-auto rounded-full gradient-primary flex items-center justify-center mb-4 animate-pulse">
              <Mic className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Voice Chat Coming Soon
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Soon you'll be able to have a voice conversation about this
              location's history, stories, and secrets!
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {['What happened here in 1906?', 'Any ghost stories?', 'Best photo angles?'].map(
                (prompt, i) => (
                  <span
                    key={i}
                    className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full"
                  >
                    "{prompt}"
                  </span>
                )
              )}
            </div>
            <button
              onClick={() => setIsVoiceChatOpen(false)}
              className="w-full py-3 rounded-xl bg-muted text-foreground font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-padding pb-0">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/itinerary')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              ✓ Discovered
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-1 fade-in-up">
          {location.name}
        </h1>
        <p className="text-muted-foreground text-sm mb-4 fade-in-up" style={{ animationDelay: '0.1s' }}>
          {location.neighborhood}
        </p>
      </div>

      {/* Content */}
      <div className="px-5 pb-32 space-y-4">
        {/* Then & Now comparison */}
        <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span>📸</span> Then & Now
          </h2>
          <PhotoComparison
            currentPhoto={userPhoto}
            historicPhoto={location.historicImage}
            historicYear={location.historicYear}
          />

          {/* Save Photo Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleSavePhoto(userPhoto, `${location.name.replace(/\s+/g, '-')}-today`)}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Your Photo'}
            </button>
            <button
              onClick={() => handleSavePhoto(location.historicImage, `${location.name.replace(/\s+/g, '-')}-${location.historicYear}`)}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-medium disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Historic'}
            </button>
          </div>
        </div>

        {/* The Story */}
        <div className="card-quest p-5 fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span>📖</span> The Story
          </h2>
          <p className="text-foreground text-sm leading-relaxed">
            {location.shortSummary}
          </p>
          
          {!showFullDescription ? (
            <button
              onClick={() => setShowFullDescription(true)}
              className="mt-3 text-primary text-sm font-medium flex items-center gap-1"
            >
              Learn More
              <ChevronDown className="w-4 h-4" />
            </button>
          ) : (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {location.fullDescription}
              </p>
            </div>
          )}
        </div>

        {/* Voice Chat */}
        <button
          onClick={() => setIsVoiceChatOpen(true)}
          className="w-full card-quest p-5 flex items-center gap-4 fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="w-12 h-12 rounded-full gradient-secondary flex items-center justify-center flex-shrink-0">
            <Mic className="w-6 h-6 text-secondary-foreground" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-foreground">
              Ask Me Anything About This Place
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tap to start a voice conversation
            </p>
          </div>
        </button>
      </div>

      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent safe-bottom">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 shadow-button"
          >
            {isQuestComplete ? (
              <>
                🎉 View Achievement
              </>
            ) : (
              <>
                Continue Quest
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <p className="text-center text-muted-foreground text-sm mt-3">
            {completed}/{total} locations discovered
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryScreen;
