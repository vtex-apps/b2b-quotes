import type { OrderForm as OrderFormType } from 'vtex.checkout-graphql'

declare global {
  interface QuoteSimple {
    id: string
    referenceName: string
    creatorEmail: string
    creatorRole: string
    creationDate: string
    expirationDate: string
    lastUpdate: string
    subtotal: number
    status: string
    organization: string
    organizationName: string
    costCenter: string
    costCenterName: string
    viewedBySales: boolean
    viewedByCustomer: boolean
    hasChildren?: boolean | null
    childrenQuantity?: number | null
    parentQuote?: string | null
    seller?: string
    sellerName?: string
    rowLoading?: boolean
  }

  interface Quote extends QuoteSimple {
    items: QuoteItem[]
    updateHistory: QuoteUpdate[]
  }

  interface QuoteUpdate {
    email: string
    role: string
    date: string
    status: string
    note: string
  }

  interface QuoteItem {
    name: string
    skuName: string
    refId: string
    id: string
    productId: string
    imageUrl: string
    listPrice: number
    price: number
    quantity: number
    sellingPrice: number
    seller: string
    error: boolean | undefined
  }

  interface FilterStatement {
    subject: string
    verb: string
    object: Record<string, unknown> | string
  }

  interface MessageDescriptor {
    id: string
    description?: string | Record<string, unknown>
    defaultMessage?: string
    values?: Record<string, unknown>
  }

  interface OrderFormContext {
    loading: boolean
    orderForm: OrderFormType | undefined
    setOrderForm: (orderForm: Partial<OrderFormType>) => void
  }

  interface Seller {
    id: string
    name: string
  }
}
