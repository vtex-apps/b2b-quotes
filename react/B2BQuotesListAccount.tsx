import type { FC } from 'react'
import React, { Fragment } from 'react'
import { Route } from 'vtex.my-account-commons/Router'
import { useRuntime } from 'vtex.render-runtime'
import { Spinner } from 'vtex.styleguide'

const B2BQuotesRedirect: FC = () => {
  const { navigate } = useRuntime()

  navigate({
    page: 'store.b2b-quotes',
  })

  return <Spinner />
}

const B2BQuotesListAccount = () => (
  <Fragment>
    <Route exact path="/b2b-quotes" component={B2BQuotesRedirect} />
  </Fragment>
)

export default B2BQuotesListAccount
