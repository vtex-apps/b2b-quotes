import { Layout, PageBlock, PageHeader, Spinner } from 'vtex.styleguide'
import { FormattedMessage, useIntl } from 'react-intl'
import React from 'react'

import { quoteMessages } from '../../utils/messages'

const QuoteDetailsNotAuthenticated = ({
  isNewQuote,
  permissionsLoading,
  isAuthenticated,
  onLinkClick,
}: any) => {
  const { formatMessage } = useIntl()

  const Message = () =>
    !isAuthenticated ? (
      <FormattedMessage id="store/b2b-quotes.error.notAuthenticated" />
    ) : (
      <FormattedMessage id="store/b2b-quotes.error.notPermitted" />
    )

  return (
    <Layout fullWidth>
      <div className="mw9 center">
        <Layout
          fullWidth
          pageHeader={
            <PageHeader
              title={formatMessage(
                isNewQuote
                  ? quoteMessages.createPageTitle
                  : quoteMessages.updatePageTitle
              )}
              linkLabel={formatMessage(quoteMessages.back)}
              onLinkClick={() => onLinkClick}
            />
          }
        >
          <PageBlock>
            {permissionsLoading ? <Spinner /> : <Message />}
          </PageBlock>
        </Layout>
      </div>
    </Layout>
  )
}

export default QuoteDetailsNotAuthenticated
