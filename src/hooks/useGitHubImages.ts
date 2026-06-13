import { useState, useCallback } from 'react';
import exifr from 'exifr'; // Import the fast EXIF extraction library
import type { Photo, RepoInfo, GitHubContent } from '@/types';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];

function isImageFile(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function parseRepoUrl(url: string): RepoInfo | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)\/?$/,
    /github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)/,
    /github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      if (match.length === 3) {
        return { owner: match[1], repo: match[2], path: '', branch: 'main' };
      } else {
        return {
          owner: match[1],
          repo: match[2],
          branch: match[3],
          path: match[4],
        };
      }
    }
  }

  const shorthand = url.match(/^([^\/\s]+)\/([^\/\s]+)(?:\/(.*))?$/);
  if (shorthand) {
    return {
      owner: shorthand[1],
      repo: shorthand[2],
      path: shorthand[3] || '',
      branch: 'main',
    };
  }

  return null;
}

// Helper function to extract EXIF DateTimeOriginal directly from image URL
async function extractExifDate(url: string): Promise<string | undefined> {
  try {
    // Only pass true for properties we actually need to save parsing performance
    const output = await exifr.parse(url, {
      tiff: true,
      exif: true,
    });

    if (output && output.DateTimeOriginal) {
      const date = new Date(output.DateTimeOriginal);
      // Format as standard YYYY-MM-DD format
      return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : undefined;
    }
  } catch (error) {
    // Gracefully handle images with missing EXIF data or CORS restrictions
    console.warn(`Failed to parse EXIF metadata for ${url}:`, error);
  }
  return undefined;
}

export function useGitHubImages() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);

  const fetchImages = useCallback(async (input: string) => {
    setLoading(true);
    setError(null);
    setPhotos([]);

    try {
      const info = parseRepoUrl(input);
      if (!info) {
        throw new Error(
          'Invalid GitHub URL. Use: https://github.com/owner/repo or owner/repo'
        );
      }

      setRepoInfo(info);

      const branches = [info.branch];
      if (info.branch === 'main') branches.push('master');
      if (info.branch === 'master') branches.push('main');

      let contents: GitHubContent[] | null = null;

      for (const branch of branches) {
        const apiUrl = `https://api.github.com/repos/${info.owner}/${info.repo}/contents/${info.path}?ref=${branch}`;
        const response = await fetch(apiUrl, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (response.ok) {
          contents = await response.json();
          break;
        }
      }

      if (!contents) {
        throw new Error('Repository or path not found. Make sure it is public.');
      }

      const items = Array.isArray(contents) ? contents : [contents];

      const imageFiles = items.filter(
        (item): item is GitHubContent =>
          item.type === 'file' && isImageFile(item.name) && !!item.download_url
      );

      if (imageFiles.length === 0) {
        throw new Error('No image files found in the specified path.');
      }

      // 1. Map raw items into structural photo meta objects
      const basePhotos: Photo[] = imageFiles.map((file) => {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        return {
          id: file.sha,
          name: nameWithoutExt,
          url: file.download_url!,
          downloadUrl: file.download_url!,
          size: file.size,
          path: file.path,
          type: file.name.split('.').pop()?.toUpperCase() || 'IMAGE',
          dateTaken: undefined, // Will fill this using metadata / filename parsing
        };
      });

      // 2. Concurrently load metadata and dimensions for all items
      const enrichedPhotos = await Promise.all(
        basePhotos.map(async (photo) => {
          // Attempt EXIF parse first
          let dateTaken = await extractExifDate(photo.url);

          // Fallback to filename string regex if EXIF date metadata is missing
          if (!dateTaken) {
            const dateMatch = photo.path.split('/').pop()?.match(/(\d{4}[-_]?\d{2}[-_]?\d{2})/);
            if (dateMatch) {
              dateTaken = dateMatch[1].replace(/_/g, '-');
            }
          }

          // Fetch original layout dimensions via HTMLImageElement
          const dimensions = await new Promise<{ width: number; height: number } | undefined>((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve(undefined);
            img.src = photo.url;
          });

          return {
            ...photo,
            dateTaken,
            dimensions,
          };
        })
      );

      setPhotos(enrichedPhotos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return { photos, loading, error, fetchImages, repoInfo, formatFileSize };
}
