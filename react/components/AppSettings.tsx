import type { FC } from 'react'
import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'react-apollo'
import { useIntl } from 'react-intl'
import {
  Page,
  PageHeader,
  PageHeaderTop,
  PageHeaderTitle,
  PageContent,
  Box,
  Button,
  NumberInput,
  Skeleton,
  useToast,
} from '@vtex/admin-ui'

import { adminMessages } from '../utils/messages'
import APP_SETTINGS from '../graphql/getAppSettings.graphql'
import SAVE_APP_SETTINGS from '../graphql/saveAppSettings.graphql'

const AppSettings: FC = () => {
  const { formatMessage } = useIntl()
  const showToast = useToast()

  const [settingsState, setSettingsState] = useState({
    cartLifeSpan: 30,
  })

  const [settingsLoading, setSettingsLoading] = useState(false)

  const { data, loading } = useQuery(APP_SETTINGS, {
    ssr: false,
  })

  const [saveSettings] = useMutation(SAVE_APP_SETTINGS)

  useEffect(() => {
    if (!data?.getAppSettings?.adminSetup) return

    setSettingsState(data.getAppSettings.adminSetup)
  }, [data])

  const handleSaveSettings = () => {
    setSettingsLoading(true)

    saveSettings({
      variables: {
        input: settingsState,
      },
    })
      .catch((err) => {
        console.error(err)
        showToast({
          message: formatMessage(adminMessages.saveSettingsFailure),
          duration: 5000,
        })
        setSettingsLoading(false)
      })
      .then(() => {
        showToast({
          message: formatMessage(adminMessages.saveSettingsSuccess),
          duration: 5000,
        })
        setSettingsLoading(false)
      })
  }

  return (
    <Page>
      <PageHeader>
        <PageHeaderTop>
          <PageHeaderTitle>
            {formatMessage(adminMessages.settingsPageTitle)}
          </PageHeaderTitle>
        </PageHeaderTop>
      </PageHeader>
      {loading && <Skeleton shape="rect" />}
      {data?.getAppSettings?.adminSetup && (
        <PageContent
          csx={{ padding: 5, display: 'table-cell', verticalAlign: 'middle' }}
        >
          <Box as="section" csx={{ paddingBottom: 5 }}>
            <NumberInput
              value={settingsState.cartLifeSpan}
              label={formatMessage(adminMessages.cartLifeSpanLabel)}
              min={1}
              onChange={(event: any) =>
                setSettingsState({
                  ...settingsState,
                  cartLifeSpan: event.value,
                })
              }
            />
          </Box>
          <Box as="section">
            <Button
              variant="primary"
              onClick={() => handleSaveSettings()}
              loading={settingsLoading}
            >
              {formatMessage(adminMessages.saveSettingsButtonText)}
            </Button>
          </Box>
        </PageContent>
      )}
    </Page>
  )
}

export default AppSettings
