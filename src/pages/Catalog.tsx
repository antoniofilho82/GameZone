import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Loader2, Search, SearchX, SlidersHorizontal } from 'lucide-react'

import GameCard from '../components/GameCard'
import { getGames } from '../services/gameService'

import type { Game } from '../types/game'
import { MOCK_GAMES } from '../data/mockGames'

import './Catalog.css'

type GenreFilter = 'Todos' | string
type PlatformFilter = 'Todas' | string
type SortOption =
  | 'popularidade'
  | 'preco-crescente'
  | 'preco-decrescente'
  | 'nome-az'
  | 'avaliacao'

function isSortOption(value: string): value is SortOption {
  return [
    'popularidade',
    'preco-crescente',
    'preco-decrescente',
    'nome-az',
    'avaliacao',
  ].includes(value)
}

const mockGenres = Array.from(new Set(MOCK_GAMES.flatMap((game) => game.genre))).sort(
  (first, second) => first.localeCompare(second, 'pt-BR'),
)
const mockPlatforms = Array.from(new Set(MOCK_GAMES.flatMap((game) => game.platforms))).sort(
  (first, second) => first.localeCompare(second, 'pt-BR'),
)

function getGenreFromSearch(search: string): GenreFilter {
  const requestedGenre = new URLSearchParams(search).get('genero')
  const matchingGenre = mockGenres.find(
    (genre) => genre.toLocaleLowerCase('pt-BR') === requestedGenre?.toLocaleLowerCase('pt-BR'),
  )

  return matchingGenre ?? 'Todos'
}

function Catalog() {
  const location = useLocation()
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<GenreFilter>(() =>
    getGenreFromSearch(location.search),
  )
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>('Todas')
  const [sortBy, setSortBy] = useState<SortOption>('popularidade')

  useEffect(() => {
    let isActive = true

    async function loadGames() {
      try {
        const loadedGames = await getGames()
        if (isActive) {
          setGames(loadedGames)
        }
      } catch (error) {
        console.error('Não foi possível carregar o catálogo.', error)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadGames()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const genres = useMemo(
    () =>
      Array.from(new Set([...mockGenres, ...games.flatMap((game) => game.genre)])).sort(
        (first, second) => first.localeCompare(second, 'pt-BR'),
      ),
    [games],
  )
  const platforms = useMemo(
    () =>
      Array.from(new Set([...mockPlatforms, ...games.flatMap((game) => game.platforms)])).sort(
        (first, second) => first.localeCompare(second, 'pt-BR'),
      ),
    [games],
  )

  const filteredAndSortedGames = useMemo<Game[]>(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR')

    const filteredGames = games.filter((game) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        game.title.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
      const matchesGenre = selectedGenre === 'Todos' || game.genre.includes(selectedGenre)
      const matchesPlatform =
        selectedPlatform === 'Todas' || game.platforms.includes(selectedPlatform)

      return matchesSearch && matchesGenre && matchesPlatform
    })

    return filteredGames.sort((first, second) => {
      switch (sortBy) {
        case 'preco-crescente':
          return first.price - second.price
        case 'preco-decrescente':
          return second.price - first.price
        case 'nome-az':
          return first.title.localeCompare(second.title, 'pt-BR')
        case 'avaliacao':
          return (second.rating ?? 0) - (first.rating ?? 0)
        case 'popularidade':
          return (
            Number(Boolean(second.isFeatured)) - Number(Boolean(first.isFeatured)) ||
            (second.rating ?? 0) - (first.rating ?? 0)
          )
      }
    })
  }, [games, searchTerm, selectedGenre, selectedPlatform, sortBy])

  function handleClearFilters() {
    setSearchTerm('')
    setSelectedGenre('Todos')
    setSelectedPlatform('Todas')
    setSortBy('popularidade')
  }

  if (isLoading) {
    return (
      <section
        className="catalog-page"
        role="status"
        aria-live="polite"
        style={{
          display: 'grid',
          minHeight: 320,
          placeItems: 'center',
          color: 'var(--color-highlight)',
        }}
      >
        <style>
          {'@keyframes gamezone-loader-spin { to { transform: rotate(360deg); } }'}
        </style>
        <span style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
          <Loader2
            size={32}
            aria-hidden="true"
            style={{ animation: 'gamezone-loader-spin 1s linear infinite' }}
          />
          <span>Carregando jogos...</span>
        </span>
      </section>
    )
  }

  return (
    <div className="catalog-page">
      <header className="catalog-page__heading">
        <span className="catalog-page__eyebrow">Explore a coleção</span>
        <h1>Catálogo de Jogos</h1>
        <p>Encontre sua próxima aventura entre jogos para todos os estilos.</p>
      </header>

      <section className="catalog-filters" aria-label="Buscar e filtrar jogos">
        <div className="catalog-filters__title">
          <SlidersHorizontal size={19} aria-hidden="true" />
          <h2>Busca e filtros</h2>
        </div>

        <div className="catalog-filters__controls">
          <label className="catalog-filters__search">
            <span className="catalog-filters__sr-only">Buscar por título</span>
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
            />
          </label>

          <label className="catalog-filters__field">
            <span>Gênero</span>
            <select
              value={selectedGenre}
              onChange={(event) => setSelectedGenre(event.currentTarget.value)}
            >
              <option value="Todos">Todos os gêneros</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>

          <label className="catalog-filters__field">
            <span>Plataforma</span>
            <select
              value={selectedPlatform}
              onChange={(event) => setSelectedPlatform(event.currentTarget.value)}
            >
              <option value="Todas">Todas as plataformas</option>
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </label>

          <label className="catalog-filters__field catalog-filters__field--sort">
            <span>Ordenar por</span>
            <select
              value={sortBy}
              onChange={(event) => {
                const value = event.currentTarget.value
                if (isSortOption(value)) {
                  setSortBy(value)
                }
              }}
            >
              <option value="popularidade">Popularidade</option>
              <option value="preco-crescente">Menor preço</option>
              <option value="preco-decrescente">Maior preço</option>
              <option value="nome-az">Nome (A–Z)</option>
              <option value="avaliacao">Melhor avaliação</option>
            </select>
          </label>
        </div>

        <div className="catalog-filters__footer">
          <p aria-live="polite">
            Exibindo <strong>{filteredAndSortedGames.length}</strong> de {games.length} jogos
          </p>
          <button
            className="catalog-filters__clear"
            type="button"
            onClick={handleClearFilters}
          >
            Limpar filtros
          </button>
        </div>
      </section>

      {filteredAndSortedGames.length > 0 ? (
        <div className="catalog-page__grid" aria-label="Resultados do catálogo">
          {filteredAndSortedGames.map((game: Game) => (
            <GameCard game={game} key={game.id} />
          ))}
        </div>
      ) : (
        <section className="catalog-empty" aria-live="polite">
          <span className="catalog-empty__icon">
            <SearchX size={32} aria-hidden="true" />
          </span>
          <h2>Nenhum jogo encontrado</h2>
          <p>Tente outro termo de busca ou ajuste os filtros selecionados.</p>
          <button type="button" onClick={handleClearFilters}>
            Limpar filtros
          </button>
        </section>
      )}
    </div>
  )
}

export default Catalog
