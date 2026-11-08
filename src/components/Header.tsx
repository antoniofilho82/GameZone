import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Gamepad2,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'

import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'

import './Header.css'

const badgeStyle = {
  position: 'absolute',
  top: 0,
  right: 0,
  display: 'flex',
  minWidth: 17,
  height: 17,
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4px',
  transform: 'translate(30%, -25%)',
  border: '2px solid var(--color-background-secondary)',
  borderRadius: 999,
  color: 'var(--color-text)',
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1,
} as const

function CountBadge({ count, kind }: { count: number; kind: 'cart' | 'favorites' }) {
  if (count === 0) {
    return null
  }

  return (
    <span
      aria-hidden="true"
      style={{
        ...badgeStyle,
        backgroundColor: kind === 'cart' ? 'var(--color-primary)' : 'var(--color-promotion)',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { totalItems } = useCart()
  const { totalFavorites } = useFavorites()

  return (
    <header className="site-header">
      <div className="site-header__main">
        <Link className="site-header__brand" to="/" aria-label="GameZone - início">
          <span className="site-header__brand-icon" aria-hidden="true">
            <Gamepad2 size={24} strokeWidth={2.2} />
          </span>
          <span className="site-header__brand-name">
            Game<span>Zone</span>
          </span>
        </Link>

        <div
          className={`site-header__navigation${isMenuOpen ? ' site-header__navigation--open' : ''}`}
          id="site-header-navigation"
        >
          <nav className="site-header__desktop-nav" aria-label="Navegação principal">
            <NavLink
              className={({ isActive }) =>
                `site-header__nav-link${isActive ? ' site-header__nav-link--active' : ''}`
              }
              to="/"
              end
              onClick={() => setIsMenuOpen(false)}
            >
              Início
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `site-header__nav-link${isActive ? ' site-header__nav-link--active' : ''}`
              }
              to="/catalogo"
              onClick={() => setIsMenuOpen(false)}
            >
              Catálogo
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `site-header__nav-link${isActive ? ' site-header__nav-link--active' : ''}`
              }
              to="/ofertas"
              onClick={() => setIsMenuOpen(false)}
            >
              Ofertas
            </NavLink>
          </nav>

          <div className="site-header__mobile-actions">
            <Link
              className="site-header__icon-button"
              to="/favoritos"
              aria-label={`Favoritos${totalFavorites > 0 ? `, ${totalFavorites} jogos` : ''}`}
              onClick={() => setIsMenuOpen(false)}
              style={{ position: 'relative' }}
            >
              <Heart size={20} aria-hidden="true" />
              <CountBadge count={totalFavorites} kind="favorites" />
            </Link>
            <Link
              className="site-header__icon-button"
              to="/login"
              aria-label="Minha conta"
              onClick={() => setIsMenuOpen(false)}
            >
              <User size={20} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <label className="site-header__search">
          <Search size={19} aria-hidden="true" />
          <input type="search" aria-label="Buscar jogos" placeholder="Buscar jogos..." />
        </label>

        <div className="site-header__desktop-actions">
          <Link
            className="site-header__icon-button"
            to="/favoritos"
            aria-label={`Favoritos${totalFavorites > 0 ? `, ${totalFavorites} jogos` : ''}`}
            style={{ position: 'relative' }}
          >
            <Heart size={20} aria-hidden="true" />
            <CountBadge count={totalFavorites} kind="favorites" />
          </Link>
          <Link className="site-header__icon-button" to="/login" aria-label="Minha conta">
            <User size={20} aria-hidden="true" />
          </Link>
          <Link
            className="site-header__icon-button site-header__icon-button--cart"
            to="/carrinho"
            aria-label={`Carrinho${totalItems > 0 ? `, ${totalItems} itens` : ''}`}
            style={{ position: 'relative' }}
          >
            <ShoppingBag size={20} aria-hidden="true" />
            <CountBadge count={totalItems} kind="cart" />
          </Link>
        </div>

        <div className="site-header__mobile-controls">
          <Link
            className="site-header__icon-button site-header__icon-button--cart"
            to="/carrinho"
            aria-label={`Carrinho${totalItems > 0 ? `, ${totalItems} itens` : ''}`}
            style={{ position: 'relative' }}
          >
            <ShoppingBag size={20} aria-hidden="true" />
            <CountBadge count={totalItems} kind="cart" />
          </Link>
          <button
            className="site-header__icon-button"
            type="button"
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
            aria-controls="site-header-navigation"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          >
            {isMenuOpen ? (
              <X size={21} aria-hidden="true" />
            ) : (
              <Menu size={21} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
