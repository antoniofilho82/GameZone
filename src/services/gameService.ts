import { AxiosError } from 'axios'

import { api } from './api'

import type { Game } from '../types/game'
import { MOCK_GAMES } from '../data/mockGames'

interface CheapSharkDeal {
  gameID: string
  dealID: string
  title: string
  salePrice: string
  normalPrice: string
  thumb: string
}

interface CheapSharkGameDeal {
  dealID: string
  price: string
  retailPrice: string
}

interface CheapSharkGame {
  info: {
    title: string
    thumb: string
  }
  deals: CheapSharkGameDeal[]
}

function parsePrice(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined
  }

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : undefined
}

function mapDealToGame(deal: CheapSharkDeal, index = 0): Game | undefined {
  const price = parsePrice(deal.salePrice)
  const originalPrice = parsePrice(deal.normalPrice)

  if (
    !deal.gameID ||
    !deal.title.trim() ||
    !deal.thumb ||
    price === undefined ||
    originalPrice === undefined
  ) {
    return undefined
  }

  const discountPercentage =
    originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined

  return {
    id: deal.gameID,
    title: deal.title,
    coverUrl: deal.thumb,
    price,
    originalPrice: originalPrice > price ? originalPrice : undefined,
    discountPercentage,
    genre: ['Ofertas'],
    platforms: ['PC'],
    isOffer: true,
    isFeatured: index < 3,
  }
}

function fallbackGame(id: string): Game | undefined {
  return MOCK_GAMES.find((game) => game.id === id)
}

export async function getGames(): Promise<Game[]> {
  try {
    const response = await api.get<CheapSharkDeal[]>('/deals', {
      params: { storeID: 1, pageSize: 12 },
    })

    const gamesById = new Map<string, Game>()
    response.data.forEach((deal, index) => {
      const game = mapDealToGame(deal, index)
      if (game && !gamesById.has(game.id)) {
        gamesById.set(game.id, game)
      }
    })

    if (gamesById.size === 0) {
      console.warn('A CheapShark não retornou ofertas válidas; usando dados locais.')
      return MOCK_GAMES
    }

    return Array.from(gamesById.values())
  } catch (error) {
    // O fallback mantém a navegação disponível mesmo sem rede ou com limite da API.
    if (error instanceof AxiosError) {
      console.error('Não foi possível carregar ofertas da CheapShark; usando dados locais.', error)
    } else {
      console.error('Erro inesperado ao carregar ofertas; usando dados locais.', error)
    }

    return MOCK_GAMES
  }
}

export async function getGameById(id: string): Promise<Game | undefined> {
  const localGame = fallbackGame(id)
  if (localGame) {
    return localGame
  }

  try {
    const response = await api.get<CheapSharkGame>('/games', {
      params: { id },
    })
    const apiGame = response.data
    const bestDeal = apiGame.deals.reduce<CheapSharkGameDeal | undefined>(
      (currentBest, deal) =>
        !currentBest || Number(deal.price) < Number(currentBest.price) ? deal : currentBest,
      undefined,
    )
    const price = parsePrice(bestDeal?.price)
    const originalPrice = parsePrice(bestDeal?.retailPrice)

    if (
      apiGame.info.title &&
      apiGame.info.thumb &&
      price !== undefined &&
      originalPrice !== undefined
    ) {
      const discountPercentage =
        originalPrice > price
          ? Math.round(((originalPrice - price) / originalPrice) * 100)
          : undefined

      return {
        id,
        title: apiGame.info.title,
        coverUrl: apiGame.info.thumb,
        price,
        originalPrice: originalPrice > price ? originalPrice : undefined,
        discountPercentage,
        genre: ['Ofertas'],
        platforms: ['PC'],
        isOffer: originalPrice > price,
      }
    }

    return fallbackGame(id)
  } catch (error) {
    // Se a consulta remota falhar, um jogo local conhecido continua acessível.
    if (error instanceof AxiosError) {
      console.error(`Não foi possível carregar o jogo ${id}; consultando dados locais.`, error)
    } else {
      console.error(`Erro inesperado ao carregar o jogo ${id}; consultando dados locais.`, error)
    }

    return fallbackGame(id)
  }
}
