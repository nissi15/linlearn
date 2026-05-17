"use client";

import { useEffect, useRef } from "react";

interface BackgroundMusicProps {
  enabled: boolean;
}

export default function BackgroundMusic({ enabled }: BackgroundMusicProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);
  const isInitializedRef = useRef(false);

  const initAudio = () => {
    if (isInitializedRef.current && audioContextRef.current) {
      return audioContextRef.current;
    }

    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Resume audio context (required for browser autoplay policy)
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      audioContextRef.current = audioContext;

      const masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);
      masterGainRef.current = masterGain;

      // Create layered sine waves for ambient music
      const frequencies = [55, 82, 110, 165]; // Low harmonic notes
      const now = audioContext.currentTime;

      frequencies.forEach(freq => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.1); // Start louder

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);

        oscillatorsRef.current.push(osc);
      });

      masterGain.gain.setValueAtTime(0, now);
      isInitializedRef.current = true;

      console.log("Audio context initialized, state:", audioContext.state);
      return audioContext;
    } catch (e) {
      console.error("Audio initialization failed:", e);
      return null;
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const audioContext = initAudio();
    if (!audioContext || !masterGainRef.current) return;

    const now = audioContext.currentTime;
    masterGainRef.current.gain.setValueAtTime(0, now);
    masterGainRef.current.gain.linearRampToValueAtTime(0.3, now + 1.5);

    console.log("Music enabled, fading in");
  }, [enabled]);

  useEffect(() => {
    return () => {
      if (!enabled && audioContextRef.current && masterGainRef.current) {
        const now = audioContextRef.current.currentTime;
        masterGainRef.current.gain.setValueAtTime(
          masterGainRef.current.gain.value,
          now
        );
        masterGainRef.current.gain.linearRampToValueAtTime(0, now + 1);
      }
    };
  }, [enabled]);

  useEffect(() => {
    return () => {
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
        } catch {
          // Already stopped
        }
      });
    };
  }, []);

  return null;
}
