import React, { memo, useMemo, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { formatCurrency } from 'vtex.format-currency'
import { useRuntime } from 'vtex.render-runtime'
import {
  Button,
  Card,
  Collapsible,
  Tab,
  Tabs,
  Tag,
  Totalizer,
} from 'vtex.styleguide'

import { isQuoteUsable } from '../../utils/helpers'
import { quoteMessages, statusMessages } from '../../utils/messages'
import { LabelByStatusMap } from '../../utils/status'
import QuoteTable from './QuoteTable'
import QuoteUpdateHistory from './QuoteUpdateHistory'

interface Props {
  quote: Quote
  isSalesRep: boolean
  handleUseQuote: (quote: Quote) => void
  permissions: string[]
  usingParentQuote: boolean
  usingQuoteChild?: string
}

const QuoteChildren: React.FC<Props> = ({
  quote,
  isSalesRep,
  handleUseQuote,
  permissions,
  usingParentQuote,
  usingQuoteChild,
}) => {
  const { culture, navigate } = useRuntime()
  const intl = useIntl()
  const { formatMessage, formatDate } = intl
  const [open, setOpen] = useState(true)
  const [loadingViewQuote, setLoadingViewQuote] = useState(false)
  const [currentTab, setCurrentTab] = useState<number | null>(1)
  const {
    id,
    items,
    subtotal,
    status,
    seller,
    sellerName,
    expirationDate,
    updateHistory,
  } = quote

  const formatPrice = (value: number) =>
    formatCurrency({
      intl,
      culture,
      value: value / 100,
    })

  const originalSubtotal = useMemo(
    () =>
      (items ?? []).reduce((acc, item) => {
        return acc + item.price * item.quantity
      }, 0),
    [items]
  )

  const discount = useMemo(
    () => Math.round(100 - (subtotal / originalSubtotal) * 100),
    [originalSubtotal, subtotal]
  )

  const quoteUsable = isQuoteUsable(permissions, status)

  return (
    <div className="mb5">
      <Card>
        <Collapsible
          onClick={() => setOpen((prev) => !prev)}
          header={
            <div className="flex justify-between items-center">
              <div>
                <span className="mr3">{sellerName ?? seller}</span>
                <Tag type={LabelByStatusMap[status]}>
                  <FormattedMessage
                    id={
                      statusMessages[status as keyof typeof statusMessages]?.id
                    }
                  />
                </Tag>
              </div>
              <div className="flex flex-column-s flex-row-l justify-start items-center">
                <span className="t-mini c-muted-2 mr3">
                  {formatMessage(quoteMessages.expiration)}
                </span>
                <span>
                  {expirationDate
                    ? formatDate(expirationDate, {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                      })
                    : '---'}
                </span>
              </div>
            </div>
          }
          isOpen={open}
        >
          <div className="pt6">
            <div className="mb5">
              <Totalizer
                items={[
                  {
                    label: formatMessage(quoteMessages.percentageDiscount),
                    value: `${discount}%`,
                  },
                  {
                    label: formatMessage(quoteMessages.originalSubtotal),
                    value: formatPrice(originalSubtotal),
                  },
                  {
                    label: formatMessage(quoteMessages.quotedSubtotal),
                    value: formatPrice(subtotal),
                  },
                ]}
              />
            </div>
            <Tabs>
              <Tab
                label={formatMessage(quoteMessages.productsTitle, {
                  total: items.length,
                })}
                active={currentTab === 1}
                onClick={() => setCurrentTab(1)}
              >
                <div className="mt5">
                  <QuoteTable
                    quoteState={quote}
                    updatingSubtotal={subtotal}
                    originalSubtotal={originalSubtotal}
                    isSalesRep={isSalesRep}
                    formState={{ isEditable: false }}
                  />
                </div>
              </Tab>
              <Tab
                label={formatMessage(quoteMessages.historyTitle)}
                active={currentTab === 2}
                onClick={() => setCurrentTab(2)}
              >
                <div className="flex flex-column-s flex-column-l">
                  <QuoteUpdateHistory updateHistory={updateHistory} />
                </div>
              </Tab>
            </Tabs>
            <div className="flex mt6 justify-end">
              <Button
                variation="secondary"
                size="small"
                isLoading={loadingViewQuote}
                onClick={() => {
                  setLoadingViewQuote(true)

                  navigate({
                    page: 'store.b2b-quote-details',
                    params: { id },
                    query: 'parent',
                  })
                }}
              >
                {formatMessage(quoteMessages.updatePageTitle)}
              </Button>
              <div className="ml3">
                <Button
                  size="small"
                  disabled={!quoteUsable}
                  isLoading={usingParentQuote || usingQuoteChild === id}
                  onClick={() => handleUseQuote(quote)}
                >
                  {formatMessage(quoteMessages.useQuote)}
                </Button>
              </div>
            </div>
          </div>
        </Collapsible>
      </Card>
    </div>
  )
}

export default memo(QuoteChildren)
