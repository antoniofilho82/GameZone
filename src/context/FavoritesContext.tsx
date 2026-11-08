import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { Game } from '../types/game'

const FAVORITES_STORAGE_KEY = 'gamezone-favorites'

interface FavoritesContextValue {
  favorites: Game[]
  toggleFavorite: (game: Game) => void
  isFavorite: (gameId: string) => boolean
  totalFavorites: number
}

interface FavoritesProviderProps {
  children: ReactNode
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined)

function isGame(value: unknown): value is Game {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const game = value as Record<string, unknown>
  return (
    typeof game.id === 'string' &&
    typeof game.title === 'string' &&
    typeof game.coverUrl === 'string' &&
    typeof game.price === 'number' &&
    Array.isArray(game.genre) &&
    game.genre.every((genre: unknown) => typeof genre === 'string') &&
    Array.isArray(game.platforms) &&
    game.platforms.every((platform: unknown) => typeof platform === 'string')
  )
}

function loadFavorites(): Game[] {
  try {
    const storedFavorites: unknown = JSON.parse(
      localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]',
    )

    if (!Array.isArray(storedFavorites)) {
      throw new TypeError('Os dados salvos dos favoritos não estão em uma lista.')
    }

    const validFavorites = storedFavorites.filter(isGame)

    if (validFavorites.length !== storedFavorites.length) {
      console.error('Alguns favoritos inválidos salvos foram descartados.')
    }

    return validFavorites
  } catch (error) {
    console.error('Não foi possível restaurar os favoritos salvos.', error)
    return []
  }
}

function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<Game[]>(loadFavorites)

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
    } catch (error) {
      console.error('Não foi possível salvar os favoritos.', error)
    }
  }, [favorites])

  const toggleFavorite = useCallback((game: Game) => {
    setFavorites((currentFavorites) =>
      currentFavorites.some((favorite) => favorite.id === game.id)
        ? currentFavorites.filter((favorite) => favorite.id !== game.id)
        : [...currentFavorites, game],
    )
  }, [])

  const isFavorite = useCallback(
    (gameId: string) => favorites.some((game) => game.id === gameId),
    [favorites],
  )

  const value = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite,
      totalFavorites: favorites.length,
    }),
    [favorites, toggleFavorite, isFavorite],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext)

  if (!context) {
    throw new Error('useFavorites deve ser utilizado dentro de um FavoritesProvider.')
  }

  return context
}

// The provider and its consumer hook intentionally share this context module.
// eslint-disable-next-line react-refresh/only-export-components
export { FavoritesProvider, useFavorites }
