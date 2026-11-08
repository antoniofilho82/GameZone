import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { CartItem } from '../types/cart'
import type { Game } from '../types/game'

const CART_STORAGE_KEY = 'gamezone-cart'

interface CartContextValue {
  cart: CartItem[]
  addToCart: (game: Game) => void
  removeFromCart: (gameId: string) => void
  updateQuantity: (gameId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (gameId: string) => boolean
  totalItems: number
  subtotal: number
}

interface CartProviderProps {
  children: ReactNode
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

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

function loadCart(): CartItem[] {
  try {
    const storedCart: unknown = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]')

    if (!Array.isArray(storedCart)) {
      throw new TypeError('Os dados salvos do carrinho não estão em uma lista.')
    }

    const validCart = storedCart.filter((item: unknown): item is CartItem => {
      if (typeof item !== 'object' || item === null) {
        return false
      }

      const cartItem = item as Record<string, unknown>
      return (
        isGame(cartItem.game) &&
        typeof cartItem.quantity === 'number' &&
        Number.isInteger(cartItem.quantity) &&
        cartItem.quantity > 0
      )
    })

    if (validCart.length !== storedCart.length) {
      console.error('Alguns itens inválidos do carrinho salvo foram descartados.')
    }

    return validCart
  } catch (error) {
    console.error('Não foi possível restaurar o carrinho salvo.', error)
    return []
  }
}

function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch (error) {
      console.error('Não foi possível salvar o carrinho.', error)
    }
  }, [cart])

  const addToCart = useCallback((game: Game) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.game.id === game.id)

      if (existingItem) {
        return currentCart.map((item) =>
          item.game.id === game.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }

      return [...currentCart, { game, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((gameId: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.game.id !== gameId))
  }, [])

  const updateQuantity = useCallback((gameId: string, quantity: number) => {
    if (!Number.isInteger(quantity)) {
      return
    }

    if (quantity < 1) {
      setCart((currentCart) => currentCart.filter((item) => item.game.id !== gameId))
      return
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.game.id === gameId ? { ...item, quantity } : item,
      ),
    )
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const isInCart = useCallback(
    (gameId: string) => cart.some((item) => item.game.id === gameId),
    [cart],
  )

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + item.game.price * item.quantity, 0)

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isInCart,
      totalItems,
      subtotal,
    }),
    [cart, addToCart, removeFromCart, updateQuantity, clearCart, isInCart, totalItems, subtotal],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

function useCart(): CartContextValue {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart deve ser utilizado dentro de um CartProvider.')
  }

  return context
}

// The provider and its consumer hook intentionally share this context module.
// eslint-disable-next-line react-refresh/only-export-components
export { CartProvider, useCart }
