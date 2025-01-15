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

import { quoteMessages, statusMessages } from '../../utils/messages'
import { LabelByStatusMap, Status } from '../../utils/status'
import QuoteTable from './QuoteTable'
import QuoteUpdateHistory from './QuoteUpdateHistory'

interface Props {
  quote: Quote
  isSalesRep: boolean
}

const QuoteChildren: React.FC<Props> = ({ quote, isSalesRep }) => {
  const { culture, navigate } = useRuntime()
  const intl = useIntl()
  const { formatMessage, formatDate } = intl
  const [open, setOpen] = useState(true)
  const [currentTab, setCurrentTab] = useState<number | null>(1)

  const formatPrice = (value: number) =>
    formatCurrency({
      intl,
      culture,
      value: value / 100,
    })

  const originalSubtotal = useMemo(
    () =>
      (quote.items ?? []).reduce((acc, item) => {
        return acc + item.price * item.quantity
      }, 0),
    [quote.items]
  )

  const discount = useMemo(
    () => Math.round(100 - (quote.subtotal / originalSubtotal) * 100),
    [originalSubtotal, quote.subtotal]
  )

  return (
    <div className="mb5">
      <Card>
        <Collapsible
          key={quote?.id}
          onClick={() => setOpen((prev) => !prev)}
          header={
            <div className="flex justify-between items-center">
              <div>
                <span className="mr3">
                  {quote?.sellerName ?? quote?.seller}
                </span>
                <Tag type={LabelByStatusMap[quote.status]}>
                  <FormattedMessage
                    id={
                      statusMessages[
                        quote.status as keyof typeof statusMessages
                      ]?.id
                    }
                  />
                </Tag>
              </div>
              <div className="flex flex-column-s flex-row-l justify-start items-center">
                <span className="t-mini c-muted-2 mr3">
                  {formatMessage(quoteMessages.expiration)}
                </span>
                <span>
                  {quote.expirationDate
                    ? formatDate(quote.expirationDate, {
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
                    value: formatPrice(quote.subtotal),
                  },
                ]}
              />
            </div>
            <Tabs>
              <Tab
                label={formatMessage(quoteMessages.productsTitle, {
                  total: quote.items.length,
                })}
                active={currentTab === 1}
                onClick={() => setCurrentTab(1)}
              >
                <div className="mt5">
                  <QuoteTable
                    quoteState={quote}
                    updatingSubtotal={quote.subtotal}
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
                  <QuoteUpdateHistory updateHistory={quote.updateHistory} />
                </div>
              </Tab>
            </Tabs>
            {(quote.status === Status.PENDING ||
              quote.status === Status.READY ||
              quote.status === Status.REVISED) && (
              <div className="flex mt6 justify-end">
                <Button
                  variation="secondary"
                  size="small"
                  onClick={() =>
                    navigate({
                      page: 'store.b2b-quote-details',
                      params: { id: quote.id },
                      query: 'parent',
                    })
                  }
                >
                  {formatMessage(quoteMessages.makeChanges)}
                </Button>
              </div>
            )}
          </div>
        </Collapsible>
      </Card>
    </div>
  )
}

export default memo(QuoteChildren)
