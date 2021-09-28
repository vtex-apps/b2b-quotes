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
}

interface FilterStatement {
  subject: string
  verb: string
  object: Record<string, unknown> | string
}
