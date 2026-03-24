// Хук для избранного

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'tramplin_favorites';

export type FavoriteType = 'OPPORTUNITY' | 'COMPANY';

export interface FavoriteItem {
  id: string;
  type: FavoriteType;
  addedAt: string;
}

function loadFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavorites(items: FavoriteItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Не удалось сохранить избранное:', err);
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(loadFavorites);

  // Синхронизация между вкладками
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setFavorites(loadFavorites());
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (id: string, type: FavoriteType = 'OPPORTUNITY') => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === id);
        const next = exists
          ? prev.filter((f) => f.id !== id)
          : [...prev, { id, type, addedAt: new Date().toISOString() }];
        saveFavorites(next);
        return next;
      });
    },
    []
  );

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      saveFavorites(next);
      return next;
    });
  }, []);

  const getFavoriteIds = useCallback(
    (type?: FavoriteType) => {
      const filtered = type ? favorites.filter((f) => f.type === type) : favorites;
      return filtered.map((f) => f.id);
    },
    [favorites]
  );

  return { favorites, isFavorite, toggleFavorite, removeFavorite, getFavoriteIds };
}
