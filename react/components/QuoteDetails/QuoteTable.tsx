import React, { Fragment, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { formatCurrency, FormattedCurrency } from 'vtex.format-currency'
import { useRuntime } from 'vtex.render-runtime'
import {
  Card,
  Collapsible,
  Input,
  InputCurrency,
  Table,
  Tag,
  Totalizer,
} from 'vtex.styleguide'

import { itemDiscountEligible } from '../../utils/helpers'
import { quoteMessages, statusMessages } from '../../utils/messages'
import { LabelByStatusMap } from '../../utils/status'

const QuoteTable = ({
  isNewQuote,
  quoteState,
  updatingSubtotal,
  originalSubtotal,
  isSalesRep,
  formState,
  maxDiscountState,
  discountState,
  onUpdateSellingPrice,
  onUpdateQuantity,
  checkedSellers,
}: any) => {
  const intl = useIntl()
  const {
    culture,
    culture: { currency: currencyCode, locale },
  } = useRuntime()

  const { formatMessage, formatDate } = intl
  const formatPrice = (value: number) =>
    formatCurrency({
      intl,
      culture,
      value: value / 100,
    })

  quoteState.expirationDate = quoteState.expirationDate || ''

  const checkedExternalSellers = checkedSellers
    ?.filter((seller: any) => seller.id !== '1')
    ?.map((seller: any) => seller.id)

  const renderTable = (items: any, totalizers?: any) => (
    <Table
      totalizers={totalizers}
      fullWidth
      schema={{
        properties: {
          imageUrl: {
            title: formatMessage(quoteMessages.image),
            cellRenderer: ({ rowData: { imageUrl, skuName } }: any) =>
              imageUrl && (
                <div className="dib v-mid relative">
                  <img
                    className="br2 v-mid"
                    height="38"
                    width="38"
                    src={imageUrl}
                    alt={skuName}
                    crossOrigin="anonymous"
                  />
                </div>
              ),
            width: 70,
          },
          refId: {
            title: formatMessage(quoteMessages.refCode),
            width: 200,
          },
          name: {
            title: formatMessage(quoteMessages.name),
            cellRenderer: ({ rowData }: any) => {
              return (
                <div>
                  <span>{rowData.name}</span>
                  {rowData.skuName !== rowData.name && (
                    <Fragment>
                      <br />
                      <span className="t-mini">{rowData.skuName}</span>
                    </Fragment>
                  )}
                </div>
              )
            },
            minWidth: 300,
          },
          listPrice: {
            title: formatMessage(quoteMessages.originalPrice),
            headerRight: true,
            width: 120,
            cellRenderer: ({ rowData }: any) => {
              return (
                isSalesRep && (
                  <div
                    className={`w-100 tr${
                      rowData.listPrice !== rowData.sellingPrice
                        ? ' strike '
                        : ''
                    }`}
                  >
                    <FormattedCurrency value={rowData.listPrice / 100} />
                  </div>
                )
              )
            },
          },
          sellingPrice: {
            title: formatMessage(quoteMessages.quotePrice),
            headerRight: true,
            width: 120,
            cellRenderer: ({
              cellData: sellingPrice,
              rowData: { id: itemId, listPrice, error },
            }: any) => {
              if (
                formState.isEditable &&
                isSalesRep &&
                discountState === 0 &&
                itemDiscountEligible({
                  listPrice,
                  sellingPrice,
                  error,
                  maxDiscountState,
                })
              ) {
                return (
                  <InputCurrency
                    name="price"
                    value={sellingPrice / 100}
                    onChange={onUpdateSellingPrice(itemId)}
                    currencyCode={currencyCode}
                    locale={locale}
                    error={error}
                  />
                )
              }

              return (
                <div className="w-100 tr">
                  <FormattedCurrency value={sellingPrice / 100} />
                </div>
              )
            },
          },
          quantity: {
            title: formatMessage(quoteMessages.quantity),
            width: 100,
            cellRenderer: ({
              cellData: quantity,
              rowData: { id: itemId },
            }: any) => {
              if (formState.isEditable && isSalesRep) {
                return (
                  <Input
                    id={itemId}
                    name="quantity"
                    value={quantity}
                    onChange={onUpdateQuantity(itemId)}
                  />
                )
              }

              return quantity
            },
          },
          total: {
            title: formatMessage(quoteMessages.total),
            headerRight: true,
            cellRenderer: ({ rowData }: any) => {
              return (
                <span className="tr w-100">
                  <FormattedCurrency
                    value={
                      rowData.sellingPrice
                        ? (rowData.sellingPrice * rowData.quantity) / 100
                        : 0
                    }
                  />
                </span>
              )
            },
            width: 100,
          },
        },
      }}
      items={items}
      emptyStateLabel={formatMessage(quoteMessages.emptyState)}
    />
  )

  const totalizers = [
    {
      label: formatMessage(quoteMessages.originalSubtotal),
      value: formatPrice(originalSubtotal),
    },
    {
      label: formatMessage(quoteMessages.percentageDiscount),
      value:
        updatingSubtotal && originalSubtotal
          ? `${Math.round(100 - (updatingSubtotal / originalSubtotal) * 100)}%`
          : `0%`,
    },
    {
      label: formatMessage(quoteMessages.quotedSubtotal),
      value: formatPrice(updatingSubtotal),
    },
    ...(quoteState.expirationDate && [
      {
        label: formatMessage(quoteMessages.expiration),
        value: formatDate(quoteState.expirationDate, {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
        }),
      },
    ]),
    ...(quoteState.status && [
      {
        label: formatMessage(quoteMessages.status),
        value: (
          <Tag type={LabelByStatusMap[quoteState.status]}>
            <FormattedMessage
              id={
                statusMessages[quoteState.status as keyof typeof statusMessages]
                  .id
              }
            />
          </Tag>
        ),
      },
    ]),
  ]

  if (!isNewQuote || !checkedExternalSellers?.length) {
    return renderTable(quoteState.items, totalizers)
  }

  const itemsBySeller: Record<string, any> = {}

  quoteState.items.forEach((item: any) => {
    let sellerId: string = item.seller

    if (!checkedExternalSellers.includes(item.seller)) {
      sellerId = '1'
    }

    if (!itemsBySeller[sellerId]) {
      itemsBySeller[sellerId] = { items: [] }
    }

    itemsBySeller[sellerId].items.push(item)
    itemsBySeller[sellerId].sellerName = checkedSellers.find(
      (seller: any) => seller.id === sellerId
    )?.name
  })

  return (
    <div className="flex flex-column">
      {!quoteState.parentQuote && (
        <div className="mb6">
          <Totalizer items={totalizers} />
        </div>
      )}
      {Object.entries(itemsBySeller).map(([seller, sellerQuote]: any) => (
        <ChildrenQuoteCard key={seller} title={sellerQuote.sellerName}>
          {renderTable(sellerQuote.items)}
        </ChildrenQuoteCard>
      ))}
    </div>
  )
}

function ChildrenQuoteCard({ children, title }: React.PropsWithChildren<any>) {
  const [open, setOpen] = useState(true)

  return (
    <div className="mb6">
      <Card>
        <Collapsible
          isOpen={open}
          onClick={() => setOpen((prev) => !prev)}
          header={title}
        >
          <div className="pv4">{children}</div>
        </Collapsible>
      </Card>
    </div>
  )
}

export default QuoteTable
