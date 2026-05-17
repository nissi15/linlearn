"use client";

import { useState, useRef, useEffect } from "react";

interface MusicTrack {
  id: string;
  name: string;
  youtubeId: string;
}

interface MusicPlayerProps {
  isPlaying: boolean;
  onToggle: (playing: boolean) => void;
  soundEffectsEnabled: boolean;
  onSoundEffectsToggle: (enabled: boolean) => void;
  musicVolume: number;
  onMusicVolumeChange: (volume: number) => void;
}

const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "claude-fm",
    name: "Claude FM",
    youtubeId: "YmQ7jRgf4f0",
  },
  {
    id: "lock-in",
    name: "Lock In | Build the Future",
    youtubeId: "3jUyQ8j2vus",
  },
];

export default function MusicPlayer({
  isPlaying,
  onToggle,
  soundEffectsEnabled,
  onSoundEffectsToggle,
  musicVolume,
  onMusicVolumeChange,
}: MusicPlayerProps) {
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack>(MUSIC_TRACKS[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPlaying || !iframeRef.current) return;

    if (iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { action: "play" },
        "*"
      );
    }
  }, [isPlaying]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="hidden">
        <iframe
          ref={iframeRef}
          key={selectedTrack.id}
          width="100%"
          height="166"
          src={`https://www.youtube.com/embed/${selectedTrack.youtubeId}?autoplay=${isPlaying ? 1 : 0}&controls=0&modestbranding=1&volume=${Math.round(musicVolume)}`}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <div className="flex items-center gap-1">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={() => onToggle(!isPlaying)}
          title={isPlaying ? "Stop music" : "Play music"}
          className="obsidian-action flex h-9 w-9 items-center justify-center border border-transparent text-[var(--foreground)]/62 hover:border-[var(--border)] hover:bg-white/6 hover:text-[var(--accent)] cursor-pointer"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        {/* Music Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            title="Select music"
            className="obsidian-action flex h-9 w-auto items-center gap-2 px-2.5 border border-transparent text-[var(--foreground)]/62 hover:border-[var(--border)] hover:bg-white/6 hover:text-[var(--accent)] cursor-pointer text-xs"
          >
            <span className="truncate max-w-[100px]">{selectedTrack.name}</span>
            <span className="text-[var(--foreground)]/45 text-xs">▼</span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full z-[1001] mt-2 w-48 bg-[var(--panel-strong)] border border-[var(--border)] rounded p-1.5">
              {MUSIC_TRACKS.map(track => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => {
                    setSelectedTrack(track);
                    setShowDropdown(false);
                    onToggle(true);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors ${
                    selectedTrack.id === track.id
                      ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                      : "text-[var(--foreground)] hover:bg-white/10"
                  }`}
                >
                  {track.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            title="Sound settings"
            className="obsidian-action flex h-9 w-9 items-center justify-center border border-transparent text-[var(--foreground)]/62 hover:border-[var(--border)] hover:bg-white/6 hover:text-[var(--accent)] cursor-pointer text-sm"
          >
            ⚙
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full z-[1001] mt-2 w-56 bg-[var(--panel-strong)] border border-[var(--border)] rounded p-4 space-y-4">
              {/* Sound Effects Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--foreground)] block">
                  Sound Effects
                </label>
                <button
                  type="button"
                  onClick={() => onSoundEffectsToggle(!soundEffectsEnabled)}
                  className={`w-full px-3 py-2 rounded text-sm transition-colors cursor-pointer ${
                    soundEffectsEnabled
                      ? "bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/40"
                      : "bg-white/6 text-[var(--foreground)]/70 border border-[var(--border)]"
                  }`}
                >
                  {soundEffectsEnabled ? "✓ Enabled" : "✗ Disabled"}
                </button>
              </div>

              {/* Music Volume Slider */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--foreground)] flex justify-between">
                  <span>Music Volume</span>
                  <span className="text-[var(--accent)]">{Math.round(musicVolume)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={(e) => onMusicVolumeChange(Number(e.target.value))}
                  className="w-full h-2 bg-[var(--border)] rounded appearance-none cursor-pointer accent-[var(--accent)]"
                />
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => onMusicVolumeChange(25)}
                    className="flex-1 px-2 py-1 rounded bg-white/6 hover:bg-white/10 text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    onClick={() => onMusicVolumeChange(50)}
                    className="flex-1 px-2 py-1 rounded bg-white/6 hover:bg-white/10 text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
                  >
                    Med
                  </button>
                  <button
                    type="button"
                    onClick={() => onMusicVolumeChange(75)}
                    className="flex-1 px-2 py-1 rounded bg-white/6 hover:bg-white/10 text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
                  >
                    High
                  </button>
                  <button
                    type="button"
                    onClick={() => onMusicVolumeChange(100)}
                    className="flex-1 px-2 py-1 rounded bg-white/6 hover:bg-white/10 text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
