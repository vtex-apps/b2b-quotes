import { FormattedMessage, useIntl } from 'react-intl'
import { Card, Tag } from 'vtex.styleguide'
import React from 'react'

import { LabelByStatusMap } from '../../utils/status'

const QuoteUpdateHistory = ({ updateHistory }: any) => {
  const { formatDate } = useIntl()

  return (
    <div className="mt3">
      {updateHistory.length > 0 && (
        <h3 className="t-heading-4">
          <FormattedMessage id="store/b2b-quotes.quote-details.update-history.title" />
        </h3>
      )}
      {updateHistory.map((update: any, index: number) => {
        return (
          <div key={index} className="ph4 pv2">
            <Card>
              <div>
                <FormattedMessage
                  id="store/b2b-quotes.quote-details.update-history.update-details"
                  values={{
                    date: formatDate(update.date, {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric',
                    }),
                    email: update.email,
                    role: update.role,
                    status: (
                      <Tag type={LabelByStatusMap[update.status]}>
                        {update.status}
                      </Tag>
                    ),
                    index,
                  }}
                />
              </div>
              {update.note && (
                <div>
                  <b>
                    <FormattedMessage id="store/b2b-quotes.quote-details.update-history.notes" />
                  </b>
                  <br />
                  {update.note}
                </div>
              )}
            </Card>
          </div>
        )
      })}
    </div>
  )
}

export default QuoteUpdateHistory
