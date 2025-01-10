import type { FunctionComponent, ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { defineMessages, useIntl } from 'react-intl'
import { useQuery } from 'react-apollo'

import { useSessionResponse } from './utils/helpers'
import CHECK_PERMISSIONS from './graphql/checkPermissions.graphql'

const messages = defineMessages({
  myQuotes: {
    id: 'store/b2b-quotes.myAccountLink',
  },
})

const B2BQuotesLink: FunctionComponent<Props> = ({ render }) => {
  const { formatMessage } = useIntl()
  const sessionResponse: any = useSessionResponse()
  const userEmail = sessionResponse?.namespaces?.profile?.email?.value

  const [show, setShow] = useState(false)

  const { data } = useQuery(CHECK_PERMISSIONS, {
    variables: { email: userEmail },
  })

  useEffect(() => {
    if (!data) {
      return
    }

    if (data.getQuoteEnabledForUser) {
      setShow(true)
    }
  }, [data, userEmail, sessionResponse])

  const parameter = {
    name: formatMessage(messages.myQuotes),
    path: `/b2b-quotes`,
  }

  return show ? render([parameter]) : null
}

type Props = {
  render: (links: Array<{ name: string; path: string }>) => ReactElement
  intl: any
}

export default B2BQuotesLink
