import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Gamepad2,
  QrCode,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { useCart } from '../context/CartContext'

import type { User } from '../types/user'

import './Checkout.css'

type PaymentMethod = 'pix' | 'credit_card' | 'boleto'
type ActivationKeys = Record<string, string[]>

const USER_STORAGE_KEY = 'gamezone-user'
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})
const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'pix', label: 'Pix Instantâneo' },
  { id: 'credit_card', label: 'Cartão Fictício' },
  { id: 'boleto', label: 'Boleto Demonstrativo' },
]
const PAYMENT_ICONS = {
  pix: QrCode,
  credit_card: CreditCard,
  boleto: Banknote,
}

/** Valida o formato mínimo do perfil lido do armazenamento local. */
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'email' in value &&
    typeof value.email === 'string'
  )
}

/** Lê o perfil local e retorna null quando não existe ou está malformado. */
function readStoredUser(): User | null {
  try {
    const storedUser: unknown = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) ?? 'null')

    if (storedUser === null) {
      return null
    }

    if (!isUser(storedUser)) {
      console.error('O perfil demonstrativo salvo está em um formato inválido.')
      return null
    }

    return storedUser
  } catch (error) {
    console.error('Não foi possível ler o perfil demonstrativo salvo.', error)
    return null
  }
}

/** Gera uma chave fictícia para a demonstração do fluxo de checkout. */
function createActivationKey(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segment = () =>
    Array.from(
      { length: 4 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join('')

  return `GZ-${segment()}-${segment()}-${segment()}`
}

/** Checkout simulado com pagamentos fictícios e emissão local de pedidos. */
function Checkout() {
  const { cart, subtotal, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [isCompleted, setIsCompleted] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [activationKeys, setActivationKeys] = useState<ActivationKeys>({})
  const [user] = useState(readStoredUser)
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (isCompleted) {
      return
    }

    if (cart.length === 0) {
      navigate('/catalogo', { replace: true })
      return
    }

    if (!user) {
      navigate('/login', { replace: true, state: { from: '/checkout' } })
    }
  }, [cart.length, isCompleted, navigate, user])

  const offerSavings = cart.reduce(
    (total, item) =>
      total +
      Math.max(0, (item.game.originalPrice ?? item.game.price) - item.game.price) *
        item.quantity,
    0,
  )
  const originalSubtotal = subtotal + offerSavings

  function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const generatedKeys = Object.fromEntries(
      cart.map(({ game, quantity }) => [
        game.id,
        Array.from({ length: quantity }, createActivationKey),
      ]),
    )

    setOrderId(`#GZ-${Math.floor(10000 + Math.random() * 90000)}`)
    setActivationKeys(generatedKeys)
    setIsCompleted(true)
  }

  function handleReturnHome() {
    clearCart()
    navigate('/', { replace: true })
  }

  function handleSelectPaymentMethod(method: PaymentMethod) {
    setPaymentMethod(method)
  }

  if (!user || cart.length === 0) {
    return null
  }

  if (isCompleted) {
    return (
      <div className="checkout-page">
        <section className="checkout-success" aria-labelledby="checkout-success-title">
          <span className="checkout-success__icon">
            <CheckCircle2 size={42} aria-hidden="true" />
          </span>
          <span className="checkout-page__eyebrow">Pedido demonstrativo</span>
          <h1 id="checkout-success-title">Pedido Concluído com Sucesso!</h1>
          <p className="checkout-success__order">Identificação do pedido: {orderId}</p>
          <p className="checkout-success__notice">
            Estas chaves são fictícias e não ativam jogos em nenhuma plataforma.
          </p>

          <div className="checkout-success__items">
            {cart.map(({ game }) => (
              <article className="checkout-success__item" key={game.id}>
                <img src={game.coverUrl} alt={`Capa de ${game.title}`} />
                <div>
                  <h2>{game.title}</h2>
                  <ul aria-label={`Chaves demonstrativas de ${game.title}`}>
                    {(activationKeys[game.id] ?? []).map((key, index) => (
                      <li key={`${key}-${index}`}>{key}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <button className="checkout-button" type="button" onClick={handleReturnHome}>
            <Gamepad2 size={19} aria-hidden="true" />
            Voltar para a Página Inicial
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <header className="checkout-page__heading">
        <span className="checkout-page__eyebrow">Quase lá</span>
        <h1>Finalizar Pedido</h1>
        <Link className="checkout-page__back" to="/carrinho">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar ao carrinho
        </Link>
      </header>

      <div className="checkout-layout">
        <div className="checkout-main">
          <section className="checkout-panel" aria-labelledby="checkout-account-title">
            <h2 id="checkout-account-title">
              <UserRound size={20} aria-hidden="true" />
              Dados da Conta
            </h2>
            <div className="checkout-account">
              <span>{user.name}</span>
              <span>{user.email}</span>
            </div>
          </section>

          <form id="checkout-form" onSubmit={handlePaymentSubmit}>
            <section className="checkout-panel" aria-labelledby="checkout-payment-title">
              <h2 id="checkout-payment-title">
                <CreditCard size={20} aria-hidden="true" />
                Forma de Pagamento Demonstrativa
              </h2>
              <div className="checkout-payment-options" role="radiogroup" aria-label="Forma de pagamento">
                {PAYMENT_METHODS.map(({ id, label }) => {
                  const PaymentIcon = PAYMENT_ICONS[id]

                  return (
                    <button
                      className={`checkout-payment-option${paymentMethod === id ? ' checkout-payment-option--active' : ''}`}
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === id}
                      key={id}
                      onClick={() => handleSelectPaymentMethod(id)}
                    >
                      <PaymentIcon size={18} aria-hidden="true" />
                      {label}
                    </button>
                  )
                })}
              </div>

              {paymentMethod === 'pix' && (
                <div className="checkout-payment-detail checkout-pix">
                  <div className="checkout-pix__code" aria-label="Ilustração de QR Code fictício">
                    <svg viewBox="0 0 100 100" role="img" aria-hidden="true">
                      <rect width="100" height="100" fill="#f5f3ff" />
                      <path
                        fill="#14141d"
                        d="M5 5h30v30H5zm5 5v20h20V10zm5 5h10v10H15zM65 5h30v30H65zm5 5v20h20V10zm5 5h10v10H75zM5 65h30v30H5zm5 5v20h20V70zm5 5h10v10H15zM42 5h8v8h-8zm10 12h8v8h-8zm-10 8h8v8h-8zm8 10h8v8h-8zm10 5h8v8h-8zm-18 5h8v8h-8zm10 8h8v8h-8zm12 8h8v8h-8zm12-10h8v8h-8zm12 10h8v8h-8zm-40 8h8v8h-8zm10 12h8v8h-8zm12-8h8v8h-8zm12 10h8v8h-8zm-20 8h8v8h-8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3>Pix Instantâneo</h3>
                    <p>QR Code ilustrativo — não pode ser utilizado para pagamento.</p>
                    <code>GZ-PIX-DEMONSTRATIVO-SEM-VALOR</code>
                  </div>
                </div>
              )}

              {paymentMethod === 'credit_card' && (
                <div className="checkout-payment-detail checkout-card-fields">
                  <label>
                    Número do cartão fictício
                    <input type="text" value="0000 0000 0000 0000" readOnly disabled />
                  </label>
                  <div>
                    <label>
                      Validade fictícia
                      <input type="text" value="MM/AA" readOnly disabled />
                    </label>
                    <label>
                      CVV fictício
                      <input type="text" value="000" readOnly disabled />
                    </label>
                  </div>
                  <p>Campos ilustrativos. Não informe dados reais de pagamento.</p>
                </div>
              )}

              {paymentMethod === 'boleto' && (
                <div className="checkout-payment-detail checkout-boleto">
                  <Banknote size={32} aria-hidden="true" />
                  <div>
                    <h3>Boleto Demonstrativo</h3>
                    <svg viewBox="0 0 280 52" role="img" aria-label="Código de barras fictício">
                      <rect width="280" height="52" fill="#f5f3ff" />
                      <path
                        stroke="#14141d"
                        strokeWidth="3"
                        d="M8 5v42m7-42v42m5-42v42m10-42v42m8-42v42m6-42v42m12-42v42m4-42v42m9-42v42m7-42v42m11-42v42m5-42v42m14-42v42m5-42v42m8-42v42m6-42v42m12-42v42m8-42v42m5-42v42m13-42v42m7-42v42m10-42v42m4-42v42m11-42v42m7-42v42m12-42v42m5-42v42m10-42v42m8-42v42m5-42v42m14-42v42m6-42v42m10-42v42m7-42v42m9-42v42m6-42v42m12-42v42"
                      />
                    </svg>
                    <p>Código de barras fictício — sem validade para pagamento.</p>
                  </div>
                </div>
              )}
            </section>
          </form>

          <p className="checkout-notice">
            <ShieldCheck size={19} aria-hidden="true" />
            Projeto Acadêmico Demonstrativo — Nenhuma transação financeira real será processada.
          </p>
        </div>

        <aside className="checkout-summary" aria-labelledby="checkout-summary-title">
          <h2 id="checkout-summary-title">Resumo do Pedido</h2>
          <div className="checkout-summary__items">
            {cart.map(({ game, quantity }) => (
              <article className="checkout-summary__item" key={game.id}>
                <img src={game.coverUrl} alt="" />
                <div>
                  <h3>{game.title}</h3>
                  <span>Quantidade: {quantity}</span>
                </div>
                <strong>{currencyFormatter.format(game.price * quantity)}</strong>
              </article>
            ))}
          </div>

          <div className="checkout-summary__breakdown">
            <div>
              <span>Subtotal dos Produtos</span>
              <strong>{currencyFormatter.format(originalSubtotal)}</strong>
            </div>
            {offerSavings > 0 && (
              <div className="checkout-summary__saving">
                <span>Economia de Promoções</span>
                <strong>-{currencyFormatter.format(offerSavings)}</strong>
              </div>
            )}
          </div>

          <div className="checkout-summary__total">
            <span>Total Final</span>
            <strong>{currencyFormatter.format(subtotal)}</strong>
          </div>

          <button className="checkout-button" type="submit" form="checkout-form">
            <CheckCircle2 size={19} aria-hidden="true" />
            Confirmar e Finalizar Pedido
          </button>
          <p className="checkout-summary__disclaimer">
            A confirmação gera somente dados fictícios para demonstração.
          </p>
        </aside>
      </div>
    </div>
  )
}

export default Checkout
