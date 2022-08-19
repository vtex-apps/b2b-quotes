import type { FunctionComponent } from 'react'
import React from 'react'
import { createSystem, ToastProvider } from '@vtex/admin-ui'

const B2BQuotesAdminLayout: FunctionComponent = ({ children }) => {
  const [SystemProvider] = createSystem()

  return (
    <SystemProvider>
      <ToastProvider>{children}</ToastProvider>
    </SystemProvider>
  )
}

export default B2BQuotesAdminLayout
