import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react'

import type { Game } from '../types/game'

import './HeroBanner.css'

interface HeroBannerProps {
  games: Game[]
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function HeroBanner({ games }: HeroBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const navigate = useNavigate()
  const featuredGames = games.filter((game) => game.isFeatured)
  const slides = featuredGames.length > 0 ? featuredGames : games
  const activeGame = slides[activeIndex % slides.length]
  const bannerImageUrl = activeGame?.coverUrl.replace('w=900', 'w=1800')

  function handleSelectSlide(index: number) {
    setActiveIndex(index)
  }

  useEffect(() => {
    if (slides.length < 2) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length)
    }, 6000)

    return () => window.clearInterval(intervalId)
  }, [slides.length])

  if (!activeGame) {
    return null
  }

  return (
    <section
      className="hero-banner"
      aria-label="Jogo em destaque"
      aria-live="polite"
      style={{ backgroundImage: `url("${bannerImageUrl}")` }}
    >
      <div className="hero-banner__overlay" />
      <div className="hero-banner__content">
        <span className="hero-banner__eyebrow">
          <Sparkles size={16} aria-hidden="true" />
          Destaque da semana
        </span>
        <h1 className="hero-banner__title">{activeGame.title}</h1>
        <p className="hero-banner__description">
          {activeGame.description ?? 'Uma nova aventura espera por você.'}
        </p>
        <div className="hero-banner__offer">
          {activeGame.discountPercentage !== undefined && (
            <span className="hero-banner__discount">
              -{activeGame.discountPercentage}%
            </span>
          )}
          {activeGame.originalPrice !== undefined && (
            <span className="hero-banner__original-price">
              {currencyFormatter.format(activeGame.originalPrice)}
            </span>
          )}
          <span className="hero-banner__price">
            {currencyFormatter.format(activeGame.price)}
          </span>
        </div>
        <div className="hero-banner__actions">
          <button
            className="hero-banner__button hero-banner__button--primary"
            type="button"
            onClick={() => navigate(`/jogo/${activeGame.id}`)}
          >
            Ver Detalhes
            <ArrowRight size={18} aria-hidden="true" />
          </button>
          <button
            className="hero-banner__button hero-banner__button--secondary"
            type="button"
            aria-label={`Adicionar ${activeGame.title} ao carrinho (demonstração)`}
          >
            <ShoppingBag size={18} aria-hidden="true" />
            Adicionar ao Carrinho
          </button>
        </div>
        {slides.length > 1 && (
          <div className="hero-banner__indicators" aria-label="Destaques">
            {slides.map((game, index) => (
              <button
                className={`hero-banner__indicator${index === activeIndex % slides.length ? ' hero-banner__indicator--active' : ''}`}
                key={game.id}
                type="button"
                aria-label={`Exibir ${game.title}`}
                aria-pressed={index === activeIndex % slides.length}
                onClick={() => handleSelectSlide(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default HeroBanner
