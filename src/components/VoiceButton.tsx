import { useRef, useState, useCallback, useEffect } from "react";
import { PipecatClient } from "@pipecat-ai/client-js";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConnectionState = "idle" | "connecting" | "connected" | "error";

export default function VoiceButton() {
  const [state, setState] = useState<ConnectionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const clientRef = useRef<PipecatClient | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []);

  const connect = useCallback(async () => {
    if (state === "connecting" || state === "connected") return;

    setState("connecting");
    setError(null);

    try {
      const transport = new SmallWebRTCTransport({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
      });

      const client = new PipecatClient({
        transport,
        enableMic: true,
        enableCam: false,
        callbacks: {
          onConnected: () => {
            setState("connected");
          },
          onDisconnected: () => {
            setState("idle");
            clientRef.current = null;
          },
          onTransportStateChanged: (state) => {
            console.log("[VoiceButton] Transport state:", state);
          },
          onTrackStarted: (track, participant) => {
            // Play remote audio from bot
            if (!participant?.local && track.kind === "audio" && audioRef.current) {
              audioRef.current.srcObject = new MediaStream([track]);
              audioRef.current.play().catch((e) => {
                console.warn("[VoiceButton] Audio autoplay blocked:", e);
              });
            }
          },
          onError: (error) => {
            console.error("[VoiceButton] Error:", error);
            setError(String(error));
            setState("error");
          },
        },
      });

      clientRef.current = client;

      // Connect to Pipecat bot via proxy
      await client.connect({ webrtcUrl: "/api/voice/offer" });
    } catch (e) {
      console.error("[VoiceButton] Connection error:", e);
      setError(e instanceof Error ? e.message : "Connection failed");
      setState("error");
      clientRef.current = null;
    }
  }, [state]);

  const disconnect = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.disconnect();
      clientRef.current = null;
    }
    setState("idle");
  }, []);

  const handleClick = useCallback(() => {
    if (state === "connected") {
      disconnect();
    } else if (state === "idle" || state === "error") {
      connect();
    }
  }, [state, connect, disconnect]);

  return (
    <>
      {/* Hidden audio element for bot audio playback */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* Floating voice button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Error message */}
        {error && (
          <div className="bg-destructive/90 text-destructive-foreground text-xs px-3 py-1.5 rounded-lg max-w-[200px]">
            {error}
          </div>
        )}

        <Button
          onClick={handleClick}
          disabled={state === "connecting"}
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all",
            state === "connected" && "bg-green-600 hover:bg-green-700 animate-pulse",
            state === "error" && "bg-destructive hover:bg-destructive/90"
          )}
          title={
            state === "idle"
              ? "Start voice chat"
              : state === "connecting"
                ? "Connecting..."
                : state === "connected"
                  ? "End voice chat"
                  : "Retry connection"
          }
        >
          {state === "connecting" ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : state === "connected" ? (
            <Mic className="h-6 w-6" />
          ) : (
            <MicOff className="h-6 w-6" />
          )}
        </Button>
      </div>
    </>
  );
}
