import { useLocale } from '../context/LocaleContext'
import './MockPurchaseSheet.css'

type Props = {
  priceNok: number
  patternTitle: string
  onConfirm: () => void
  onClose: () => void
}

/** Visually obvious mock purchase — no card fields, provider-agnostic. */
export function MockPurchaseSheet({
  priceNok,
  patternTitle,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useLocale()

  return (
    <div className="purchase-sheet" role="dialog" aria-modal="true">
      <div className="purchase-sheet__card">
        <p className="purchase-sheet__demo">{t('purchase.demo')}</p>
        <h2>{t('purchase.title')}</h2>
        <p className="purchase-sheet__lead">{t('purchase.lead')}</p>
        <p className="purchase-sheet__item">
          <strong>{patternTitle}</strong>
          <span>{t('explore.price', { price: priceNok })}</span>
        </p>
        <div className="purchase-sheet__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={onConfirm}
          >
            {t('purchase.confirm')}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t('purchase.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
