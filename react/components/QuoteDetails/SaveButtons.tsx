import React, { Fragment } from 'react'
import { Button } from 'vtex.styleguide'
import { FormattedMessage } from 'react-intl'

import { arrayShallowEqual } from '../../utils/shallowEquals'

const SaveButtons = ({
  isNewQuote,
  updatingQuoteState,
  sentToSalesRep,
  quoteState,
  onSaveForLater,
  onSaveQuote,
  quoteItems,
  expirationDate,
  noteState,
  isSalesRep,
}: any) => {
  if (quoteState.hasChildren) return null

  if (isNewQuote) {
    return (
      <Fragment>
        <span className="mr4">
          <Button
            variation="secondary"
            isLoading={updatingQuoteState && !sentToSalesRep}
            onClick={onSaveForLater}
            disabled={
              !quoteState.items?.length ||
              !quoteState.referenceName ||
              updatingQuoteState
            }
          >
            <FormattedMessage id="store/b2b-quotes.create.button.save-for-later" />
          </Button>
        </span>
        <span className="mr4">
          <Button
            variation="primary"
            isLoading={updatingQuoteState && sentToSalesRep}
            onClick={onSaveQuote}
            disabled={
              !quoteState.items?.length ||
              !quoteState.referenceName ||
              updatingQuoteState
            }
          >
            <FormattedMessage id="store/b2b-quotes.create.button.request-quote" />
          </Button>
        </span>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <span className="mr4">
        <Button
          variation="primary"
          onClick={onSaveQuote}
          isLoading={updatingQuoteState}
          disabled={
            quoteState.items.some((item: any) => item.error) ||
            (quoteState.items.length &&
              noteState === '' &&
              expirationDate === quoteState.expirationDate &&
              arrayShallowEqual(quoteItems, quoteState.items))
          }
        >
          {isSalesRep ? (
            <FormattedMessage id="store/b2b-quotes.quote-details.save" />
          ) : (
            <FormattedMessage id="store/b2b-quotes.quote-details.submit-to-sales-rep" />
          )}
        </Button>
      </span>
    </Fragment>
  )
}

export default SaveButtons
