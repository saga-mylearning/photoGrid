import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Info,
  Calendar,
  Aperture,
  HardDrive,
  Type,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { Photo } from '@/types';

interface SlideshowProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  formatFileSize: (bytes: number) => string;
}

export function Slideshow({
  photos,
  currentIndex,
  onClose,
  onIndexChange,
  formatFileSize,
}: SlideshowProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState(1);
  const [kenBurnsKey, setKenBurnsKey] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhoto = photos[currentIndex];

  // Format a date string/timestamp to "MM/DD/YYYY, HH:MM AM/PM" or similar
function formatDateTaken(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  
  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) return generateMockDate();

  return date.toLocaleString('en-US', {
    month: 'short',      // "Jun"
    day: 'numeric',      // "13"
    year: 'numeric',     // "2026"
    hour: 'numeric',     // "9"
    minute: '2-digit',   // "07"
    hour12: true         // AM/PM format
  });
  // Output: "Jun 13, 2026, 9:07 AM"
}


const fs = require('fs');

function generateMockDate() {
    // Define the specific date range: December 1, 2025 to February 28, 2026
    const startDate = new Date('2025-12-01T00:00:00Z').getTime();
    const endDate = new Date('2026-03-20T23:59:59Z').getTime();
    
    const data = [];
    const recordCount = 100;

    for (let i = 0; i < recordCount; i++) {
        // Generate random timestamp within the range
        const randomTime = Math.random() * (endDate - startDate) + startDate;
        const randomDate = new Date(randomTime);

        
        data.push({
            id: i + 1,            
            timestamp: randomDate.toISOString() // Formatted date string
        });
    }

    // Save data to a JSON file
   return data.timestamp;
}




  // Auto-advance slideshow
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        goToNext();
      }, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'i':
          setShowInfo((prev) => !prev);
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const goToNext = useCallback(() => {
    setDirection(1);
    setKenBurnsKey((prev) => prev + 1);
    onIndexChange((currentIndex + 1) % photos.length);
  }, [currentIndex, photos.length, onIndexChange]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setKenBurnsKey((prev) => prev + 1);
    onIndexChange((currentIndex - 1 + photos.length) % photos.length);
  }, [currentIndex, photos.length, onIndexChange]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported
    }
  }, []);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    touchStartX.current = null;
  };

  if (!currentPhoto) return null;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  // Random Ken Burns direction for variety
  const kenBurnsDirections = [
    { scale: [1, 1.15], x: [0, '-3%'], y: [0, '2%'] },
    { scale: [1, 1.12], x: [0, '3%'], y: [0, '-2%'] },
    { scale: [1, 1.18], x: [0, '-2%'], y: [0, '-3%'] },
    { scale: [1, 1.1], x: [0, '2%'], y: [0, '3%'] },
  ];
  const kenBurns = kenBurnsDirections[kenBurnsKey % kenBurnsDirections.length];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main image area */}
      <div className="relative w-full h-full overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentPhoto.id + kenBurnsKey}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'tween', duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
              opacity: { duration: 0.3 },
            }}
            className="absolute inset-0"
          >
            <motion.img
              src={currentPhoto.url}
              alt={currentPhoto.name}
              className="w-full h-full object-contain"
              initial={{ scale: kenBurns.scale[0], x: kenBurns.x[0], y: kenBurns.y[0] }}
              animate={{ scale: kenBurns.scale[1], x: kenBurns.x[1], y: kenBurns.y[1] }}
              transition={{ duration: 5, ease: 'linear' }}
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Top bar - controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent"
        >
          <div className="flex items-center gap-3">
            <span className="text-white/80 text-sm font-medium">
              {currentIndex + 1} / {photos.length}
            </span>
            <span className="text-white/40">|</span>
            <span className="text-white/60 text-sm truncate max-w-[200px] md:max-w-md">
              {currentPhoto.name}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowInfo((prev) => !prev)}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
              title="Toggle info (I)"
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
              title="Toggle fullscreen (F)"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Side navigation arrows */}
        <button
          onClick={goToPrev}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/50 transition-all"
          title="Previous (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/50 transition-all"
          title="Next (Right Arrow)"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Bottom controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent"
        >
          {/* Progress bar */}
          <div className="w-full h-1 bg-white/10">
            <motion.div
              className="h-full bg-white/60"
              initial={{ width: '0%' }}
              animate={{ width: isPlaying ? '100%' : '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              key={currentPhoto.id + (isPlaying ? '-playing' : '-paused')}
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            {/* Thumbnail strip */}
            <div className="flex-1 mx-4 overflow-hidden">
              <div className="flex gap-1.5 justify-center">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      onIndexChange(index);
                    }}
                    className={`relative w-10 h-8 md:w-14 md:h-10 rounded overflow-hidden transition-all flex-shrink-0 ${
                      index === currentIndex
                        ? 'ring-2 ring-white scale-110'
                        : 'opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="w-9" /> {/* Spacer for alignment */}
          </div>
        </motion.div>

        {/* Info panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute right-0 top-16 bottom-24 w-72 z-30 overflow-y-auto"
            >
              <div className="mx-3 p-5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                <h3 className="text-white font-semibold text-lg mb-4 truncate">
                  {currentPhoto.name}
                </h3>

                <div className="space-y-3" >
                  {/* File type */}
                  <div className="flex items-center gap-3" style={{ display: 'none' }}>
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Type className="w-4 h-4 text-white/70" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-wider">Format</p>
                      <p className="text-white/90 text-sm">{currentPhoto.type}</p>
                    </div>
                  </div>

                  {/* Dimensions */}
                  {currentPhoto.dimensions && (
                    <div className="flex items-center gap-3" style={{ display: 'none' }}>
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Maximize2 className="w-4 h-4 text-white/70" />
                      </div>
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider">Dimensions</p>
                        <p className="text-white/90 text-sm">
                          {currentPhoto.dimensions.width} x {currentPhoto.dimensions.height} px
                        </p>
                      </div>
                    </div>
                  )}

                  {/* File size */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <HardDrive className="w-4 h-4 text-white/70" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-wider">File Size</p>
                      <p className="text-white/90 text-sm">{formatFileSize(currentPhoto.size)}</p>
                    </div>
                  </div>

                  {/* Date */}
                  {currentPhoto.dateTaken && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-white/70" />
                      </div>
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider">Date</p>
                        <p className="text-white/90 text-sm"> {formatDateTaken(currentPhoto.dateTaken)}</p>
                      </div>
                    </div>
                  )}

                  {/* Camera */}
                  {currentPhoto.camera && (
                    <div className="flex items-center gap-3" style={{ display: 'none' }}>
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Aperture className="w-4 h-4 text-white/70" />
                      </div>
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider">Camera</p>
                        <p className="text-white/90 text-sm">{currentPhoto.camera}</p>
                      </div>
                    </div>
                  )}

                  {/* EXIF data */}
                  {(currentPhoto.aperture || currentPhoto.iso || currentPhoto.focalLength || currentPhoto.exposure) && (
                    <>
                      <div className="border-t border-white/10 pt-3 mt-3" style={{ display: 'none' }}>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-2">EXIF</p>
                        <div className="grid grid-cols-2 gap-2">
                          {currentPhoto.aperture && (
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-white/40 text-[10px]">Aperture</p>
                              <p className="text-white/80 text-xs">{currentPhoto.aperture}</p>
                            </div>
                          )}
                          {currentPhoto.iso && (
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-white/40 text-[10px]">ISO</p>
                              <p className="text-white/80 text-xs">{currentPhoto.iso}</p>
                            </div>
                          )}
                          {currentPhoto.focalLength && (
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-white/40 text-[10px]">Focal Length</p>
                              <p className="text-white/80 text-xs">{currentPhoto.focalLength}</p>
                            </div>
                          )}
                          {currentPhoto.exposure && (
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-white/40 text-[10px]">Exposure</p>
                              <p className="text-white/80 text-xs">{currentPhoto.exposure}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* File path */}
                  <div className="border-t border-white/10 pt-3 mt-3" style={{ display: 'none' }}>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Path</p>
                    <p className="text-white/60 text-xs break-all">{currentPhoto.path}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
