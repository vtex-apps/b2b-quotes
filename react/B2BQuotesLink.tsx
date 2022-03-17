import type { FunctionComponent, ReactElement } from 'react'
import { defineMessages, useIntl } from 'react-intl'

const messages = defineMessages({
  myQuotes: {
    id: 'store/b2b-quotes.myAccountLink',
  },
})

const B2BQuotesLink: FunctionComponent<Props> = ({ render }) => {
  const { formatMessage } = useIntl()

  return render([
    {
      name: formatMessage(messages.myQuotes),
      path: `/b2b-quotes`,
    },
  ])
}

type Props = {
  render: (links: Array<{ name: string; path: string }>) => ReactElement
  intl: any
}

export default B2BQuotesLink
