import { useState, useCallback } from 'react';
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
  // Handle GitHub repo URL formats:
  // https://github.com/owner/repo
  // https://github.com/owner/repo/tree/branch/path
  // https://github.com/owner/repo/blob/branch/path
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

  // Handle shorthand: owner/repo
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

      // Try main branch first, then master
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

      // Filter for image files
      const imageFiles = items.filter(
        (item): item is GitHubContent =>
          item.type === 'file' && isImageFile(item.name) && !!item.download_url
      );

      if (imageFiles.length === 0) {
        throw new Error('No image files found in the specified path.');
      }

      const fetchedPhotos: Photo[] = imageFiles.map((file) => {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        // Try to extract date from filename (common patterns: YYYY-MM-DD or IMG_YYYYMMDD)
        let dateTaken: string | undefined;
        const dateMatch = file.name.match(/(\d{4}[-_]?\d{2}[-_]?\d{2})/);
        if (dateMatch) {
          const d = dateMatch[1].replace(/_/g, '-');
          dateTaken = d;
        }

        return {
          id: file.sha,
          name: nameWithoutExt,
          url: file.download_url!.replace('https://raw.githubusercontent.com/', `https://raw.githubusercontent.com/`),
          downloadUrl: file.download_url!,
          size: file.size,
          path: file.path,
          type: file.name.split('.').pop()?.toUpperCase() || 'IMAGE',
          dateTaken,
        };
      });

      // Try to load image dimensions
      const photosWithDimensions = await Promise.all(
        fetchedPhotos.map(
          (photo) =>
            new Promise<Photo>((resolve) => {
              const img = new Image();
              img.onload = () => {
                resolve({
                  ...photo,
                  dimensions: { width: img.naturalWidth, height: img.naturalHeight },
                });
              };
              img.onerror = () => resolve(photo);
              img.src = photo.url;
            })
        )
      );

      setPhotos(photosWithDimensions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return { photos, loading, error, fetchImages, repoInfo, formatFileSize };
}
