import { useState, useEffect } from 'react'

import { getSession } from '../modules/session'

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
