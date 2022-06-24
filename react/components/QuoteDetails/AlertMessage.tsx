import { Alert } from 'vtex.styleguide'
import { FormattedMessage } from 'react-intl'
import React from 'react'

const AlertMessage = ({ quoteState, noteState }: any) =>
  quoteState.items.some((item: any) => item.error) ? (
    <div className="mb4">
      <Alert type="error">
        <FormattedMessage
          id="store/b2b-quotes.quote-details.discount-error"
          values={{ count: noteState.length }}
        />
      </Alert>
    </div>
  ) : null

export default AlertMessage
