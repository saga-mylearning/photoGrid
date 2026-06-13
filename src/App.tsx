import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Images,
  Search,
  Loader2,
  AlertCircle,
  Github,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useGitHubImages } from '@/hooks/useGitHubImages';
import { PhotoGrid } from '@/components/PhotoGrid';
import { Slideshow } from '@/components/Slideshow';

// Demo repository with images
const DEMO_REPO = 'microsoft/fluentui-system-icons';
const DEMO_PATH = 'assets';

function App() {
  const [input, setInput] = useState('');
  const [slideshowIndex, setSlideshowIndex] = useState<number | null>(null);
  const { photos, loading, error, fetchImages, repoInfo, formatFileSize } =
    useGitHubImages();

  const hasPhotos = photos.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = input.trim() || `${DEMO_REPO}/${DEMO_PATH}`;
    fetchImages(url);
  };

  const handleDemoClick = () => {
    setInput(`${DEMO_REPO}/${DEMO_PATH}`);
    fetchImages(`${DEMO_REPO}/${DEMO_PATH}`);
  };

  const openSlideshow = (index: number) => {
    setSlideshowIndex(index);
  };

  const closeSlideshow = () => {
    setSlideshowIndex(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-zinc-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Images className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Photo Album</h1>
              <p className="text-xs text-white/40 -mt-0.5">GitHub Repository Slideshow</p>
            </div>
          </div>

          {repoInfo && hasPhotos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
            >
              <Github className="w-3.5 h-3.5 text-white/50" />
              <span className="text-sm text-white/70">
                {repoInfo.owner}/{repoInfo.repo}
              </span>
              {repoInfo.path && (
                <>
                  <span className="text-white/30">/</span>
                  <span className="text-sm text-white/50">{repoInfo.path}</span>
                </>
              )}
            </motion.div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto">
        {/* Input section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`px-4 transition-all duration-500 ${
            hasPhotos ? 'py-6' : 'py-24 md:py-32'
          }`}
        >
          {!hasPhotos && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 10 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-10"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 mb-5">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                Photo Album Slideshow
              </h2>
              <p className="text-white/50 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
                Enter a public GitHub repository to instantly create a beautiful photo slideshow with metadata overlays.
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div
              className={`relative flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all focus-within:border-indigo-500/50 focus-within:bg-white/[0.07] focus-within:shadow-lg focus-within:shadow-indigo-500/10 ${
                hasPhotos ? '' : 'shadow-2xl shadow-black/50'
              }`}
            >
              <div className="pl-4 pr-2">
                <Github className="w-5 h-5 text-white/30" />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`e.g., ${DEMO_REPO}/${DEMO_PATH}`}
                className="flex-1 bg-transparent py-3.5 px-2 text-white placeholder-white/30 outline-none text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="mr-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Load
                  </>
                )}
              </button>
            </div>
          </form>

          {!hasPhotos && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-5"
            >
              <button
                onClick={handleDemoClick}
                className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Try with a demo repository
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 text-sm font-medium">Error</p>
                  <p className="text-red-300/70 text-sm">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Photo count */}
          {hasPhotos && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-7xl mx-auto mt-6 mb-2 px-4"
            >
              <p className="text-white/40 text-sm">
                {photos.length} photo{photos.length !== 1 ? 's' : ''} found
                {repoInfo && (
                  <span className="text-white/25">
                    {' '}
                    in {repoInfo.owner}/{repoInfo.repo}
                    {repoInfo.path ? `/${repoInfo.path}` : ''}
                  </span>
                )}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Photo grid */}
        <PhotoGrid photos={photos} onPhotoClick={openSlideshow} />
      </main>

      {/* Footer */}
      {!hasPhotos && (
        <footer className="text-center py-8 text-white/20 text-xs">
          <p>Supports any public GitHub repository with image files</p>
          <p className="mt-1">
            Formats: JPG, PNG, GIF, WebP, SVG, BMP
          </p>
        </footer>
      )}

      {/* Slideshow overlay */}
      <AnimatePresence>
        {slideshowIndex !== null && (
          <Slideshow
            photos={photos}
            currentIndex={slideshowIndex}
            onClose={closeSlideshow}
            onIndexChange={setSlideshowIndex}
            formatFileSize={formatFileSize}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
