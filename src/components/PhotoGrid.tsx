import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, ImageOff } from 'lucide-react';
import type { Photo } from '@/types';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
}

interface ColumnPhoto {
  photo: Photo;
  aspectRatio: number;
}

function getAspectRatio(photo: Photo): number {
  if (photo.dimensions) {
    return photo.dimensions.width / photo.dimensions.height;
  }
  return 1.5; // default aspect ratio
}

export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  const [columns, setColumns] = useState<ColumnPhoto[][]>([[], [], []]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Distribute photos into columns based on column heights
  useEffect(() => {
    const numColumns = 3;
    const newColumns: ColumnPhoto[][] = Array.from({ length: numColumns }, () => []);
    const columnHeights = Array(numColumns).fill(0);

    photos.forEach((photo) => {
      const ar = getAspectRatio(photo);
      // Find shortest column
      const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));
      newColumns[shortestCol].push({ photo, aspectRatio: ar });
      columnHeights[shortestCol] += 1 / ar; // accumulate inverse aspect ratio as proxy for height
    });

    setColumns(newColumns);
  }, [photos]);

  const handleImageLoad = useCallback((photoId: string) => {
    setLoadedImages((prev) => new Set(prev).add(photoId));
  }, []);

  if (photos.length === 0) return null;

  return (
    <div ref={containerRef} className="w-full px-4 pb-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex gap-3 md:gap-4"
      >
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex-1 flex flex-col gap-3 md:gap-4">
            {column.map(({ photo, aspectRatio }, index) => {
              const isHovered = hoveredId === photo.id;
              const isLoaded = loadedImages.has(photo.id);

              return (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: colIndex * 0.1 + index * 0.08,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="relative overflow-hidden rounded-lg cursor-pointer group"
                  style={{ aspectRatio: `${aspectRatio} / 1` }}
                  onMouseEnter={() => setHoveredId(photo.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => {
                    const photoIndex = photos.findIndex((p) => p.id === photo.id);
                    onPhotoClick(photoIndex);
                  }}
                >
                  {/* Skeleton loader */}
                  {!isLoaded && (
                    <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
                      <ImageOff className="w-8 h-8 text-zinc-600" />
                    </div>
                  )}

                  {/* Image */}
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className={`w-full h-full object-cover transition-all duration-700 ease-out ${
                      isHovered ? 'scale-110 brightness-75' : 'scale-100'
                    } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => handleImageLoad(photo.id)}
                    loading="lazy"
                  />

                  {/* Hover overlay with metadata */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 flex flex-col justify-end p-3 md:p-4"
                      >
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Content */}
                        <div className="relative z-10">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-2">
                              <p className="text-white font-medium text-sm truncate">
                                {photo.name}
                              </p>
                              {photo.dimensions && (
                                <p className="text-white/60 text-xs mt-0.5">
                                  {photo.dimensions.width} x {photo.dimensions.height}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-white/50 text-xs uppercase tracking-wide">
                                {photo.type}
                              </span>
                              <Maximize2 className="w-4 h-4 text-white/70" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
