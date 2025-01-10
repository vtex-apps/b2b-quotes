import React, { memo, useCallback, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { formatCurrency } from 'vtex.format-currency'
import { useRuntime } from 'vtex.render-runtime'
import { Collapsible, Tab, Tabs, Tag, Totalizer } from 'vtex.styleguide'

import { quoteMessages, statusMessages } from '../../utils/messages'
import { LabelByStatusMap } from '../../utils/status'
import QuoteTable from './QuoteTable'
import QuoteUpdateHistory from './QuoteUpdateHistory'

interface Props {
  quoteState: Quote
  isSalesRep: boolean
  childrens: {
    getChildrenQuotes: {
      data: Quote[]
    }
  }
}

const QuoteChildren: React.FC<Props> = ({
  quoteState,
  childrens,
  isSalesRep,
}) => {
  const { culture } = useRuntime()
  const intl = useIntl()
  const { formatMessage, formatDate } = intl
  const [openId, setOpenId] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState<number | null>(1)

  const formatPrice = (value: number) =>
    formatCurrency({
      intl,
      culture,
      value: value / 100,
    })

  // Memoized toggle function to prevent re-creation
  const handleToggle = useCallback(
    (id: string) => {
      setOpenId((prevOpenId) => (prevOpenId === id ? null : id))
    },
    [] // No dependencies, so the function won't be recreated
  )

  return (
    <div>
      {childrens.getChildrenQuotes.data.map((quote: Quote) => {
        const isOpen = openId === quote?.id

        const originalSubtotal = (quote.items ?? []).reduce((acc, item) => {
          return acc + item.price * item.quantity
        }, 0)

        const discount = Math.round(
          100 - (quote.subtotal / originalSubtotal) * 100
        )

        return (
          <Collapsible
            key={quote.id}
            onClick={() => handleToggle(quote?.id)}
            header={
              <div className="flex flex-column-s flex-row-l justify-between items-center">
                <div>
                  <span className="mr3">{quote?.seller}</span>
                  <Tag type={LabelByStatusMap[quote.status]}>
                    <FormattedMessage
                      id={
                        statusMessages[
                          quoteState.status as keyof typeof statusMessages
                        ].id
                      }
                    />
                  </Tag>
                </div>
                <div className="flex flex-column-s flex-row-l justify-start items-center">
                  <span className="t-mini c-muted-2 mr3">
                    {formatMessage(quoteMessages.expiration)}
                  </span>
                  <span>
                    {formatDate(quote.expirationDate, {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            }
            isOpen={isOpen}
          >
            <div className=" pa6">
              <Totalizer
                items={[
                  {
                    label: formatMessage(quoteMessages.percentageDiscount),
                    value: `0%`,
                  },
                  {
                    label: formatMessage(quoteMessages.quotedSubtotal),
                    value: formatPrice(discount),
                  },
                  {
                    label: formatMessage(quoteMessages.quotedSubtotal),
                    value: `0%`,
                  },
                ]}
              />
              <div className="flex t-small c-muted-2 items-center ">
                {formatDate(quote.expirationDate, {
                  day: 'numeric',
                  month: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                })}
                <span>·</span>
                <FormattedMessage
                  id={
                    statusMessages[
                      quoteState.status as keyof typeof statusMessages
                    ].id
                  }
                />
              </div>
              <Tabs>
                <Tab
                  label={`Products (${quote.items.length})`}
                  active={currentTab === 1}
                  onClick={() => setCurrentTab(1)}
                >
                  <QuoteTable
                    quoteState={quote}
                    updatingSubtotal={discount}
                    originalSubtotal={originalSubtotal}
                    isSalesRep={isSalesRep}
                    formState={{
                      isEditable: false,
                      errorMessage: '',
                    }}
                  />
                </Tab>
                <Tab
                  label="Histórico"
                  active={currentTab === 2}
                  onClick={() => setCurrentTab(2)}
                >
                  <div className="flex flex-column-s flex-column-l">
                    <QuoteUpdateHistory updateHistory={quote.updateHistory} />
                  </div>
                </Tab>
              </Tabs>
            </div>
          </Collapsible>
        )
      })}
    </div>
  )
}

export default memo(QuoteChildren)
