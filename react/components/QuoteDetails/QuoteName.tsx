import React from 'react'
import { useIntl } from 'react-intl'
import { Input } from 'vtex.styleguide'

import { quoteMessages } from '../../utils/messages'

const QuoteName = ({
  isNewQuote,
  quoteState,
  formState,
  onChange,
  childrenQuantity,
  sellerName,
}: any) => {
  const { formatMessage } = useIntl()

  return isNewQuote ? (
    <div className="w-50-l mb5">
      <Input
        size="large"
        placeholder={formatMessage(quoteMessages.placeholderName)}
        dataAttributes={{
          'hj-white-list': true,
          test: 'string',
        }}
        label={formatMessage(quoteMessages.labelName)}
        value={quoteState.referenceName}
        errorMessage={formState.errorMessage}
        onChange={onChange}
      />
    </div>
  ) : (
    <h3 className="t-heading-3 mb8">
      {quoteState.referenceName}
      {childrenQuantity > 0 && (
        <span className="v-mid c-muted-2 pl3 t-heading-4">
          ({childrenQuantity})
        </span>
      )}
      {sellerName && (
        <div className="c-muted-2 pt2 t-heading-4">({sellerName})</div>
      )}
    </h3>
  )
}

export default QuoteName
