import { useEffect, useState } from 'react'

import { getSession } from '../modules/session'
import { Status } from './status'

export const initQuoteFromOrderForm = (orderForm: any) => {
  const quoteItems = [] as QuoteItem[]

  orderForm?.items?.forEach((item: QuoteItem) => {
    const existingItem = quoteItems.find(
      (existing: QuoteItem) =>
        existing.id === item.id && existing.sellingPrice === item.sellingPrice
    )

    if (existingItem) {
      existingItem.quantity += item.quantity
    } else if (item.sellingPrice !== 0) {
      quoteItems.push({
        ...item,
        listPrice: item.listPrice * 100,
        price: item.price * 100,
        sellingPrice: item.sellingPrice * 100,
      })
    }
  })

  return quoteItems
}

export const itemDiscountEligible = ({
  listPrice,
  sellingPrice,
  error,
  maxDiscountState,
}: {
  listPrice: number
  sellingPrice: number
  error: boolean | undefined
  maxDiscountState: number
}) => {
  return !(
    !error &&
    Math.round(100 - (sellingPrice / listPrice) * 100) > maxDiscountState
  )
}

export const useSessionResponse = () => {
  const [session, setSession] = useState<unknown>()
  const sessionPromise = getSession()

  useEffect(() => {
    if (!sessionPromise) {
      return
    }

    sessionPromise.then((sessionResponse) => {
      const { response } = sessionResponse

      setSession(response)
    })
  }, [sessionPromise])

  return session
}

export const getEmptySimpleQuote = (parentQuote: string): QuoteSimple => ({
  id: '',
  referenceName: '',
  subtotal: 0,
  costCenter: '',
  costCenterName: '',
  creatorEmail: '',
  creatorRole: '',
  creationDate: '',
  expirationDate: '',
  lastUpdate: '',
  organization: '',
  organizationName: '',
  status: '',
  viewedByCustomer: true,
  viewedBySales: true,
  parentQuote,
  rowLoading: true,
})

export const isQuoteUsable = (permissions: string[], status: string) =>
  permissions.includes('use-quotes') &&
  status &&
  status !== Status.EXPIRED &&
  status !== Status.PLACED &&
  status !== Status.DECLINED
