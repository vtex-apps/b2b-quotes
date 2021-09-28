/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Fragment, useState, useContext, useEffect } from 'react'
import {
  Input,
  Textarea,
  Button,
  Table,
  Totalizer,
  ToastContext,
  PageHeader,
} from 'vtex.styleguide'
import { useCssHandles } from 'vtex.css-handles'
import { useQuery, useMutation } from 'react-apollo'
import { FormattedCurrency } from 'vtex.format-currency'
import { useRuntime } from 'vtex.render-runtime'
import { useIntl, defineMessages, FormattedMessage } from 'react-intl'

import { getSession } from '../modules/session'
import saveCartMutation from '../graphql/createQuote.graphql'
import clearCartMutation from '../graphql/clearCartMutation.graphql'
import GET_PERMISSIONS from '../graphql/getPermissions.graphql'
import getOrderForm from '../graphql/orderForm.gql'
import storageFactory from '../utils/storage'

const localStore = storageFactory(() => localStorage)

const useSessionResponse = () => {
  const [session, setSession] = useState<any>()
  const sessionPromise = getSession()

  useEffect(() => {
    if (!sessionPromise) {
      return
    }

    sessionPromise.then((sessionResponse) => {
      const { response } = sessionResponse

      setSession(response)
    })
  }, [sessionPromise])

  return session
}

let isAuthenticated =
  JSON.parse(String(localStore.getItem('orderquote_isAuthenticated'))) ?? false

const storePrefix = 'store/b2b-quotes.'

const messages = defineMessages({
  image: {
    id: `${storePrefix}quote-details.items.image.title`,
  },
  refCode: {
    id: `${storePrefix}quote-details.items.refId.title`,
  },
  name: {
    id: `${storePrefix}quote-details.items.name.title`,
  },
  price: {
    id: `${storePrefix}quote-details.items.price.title`,
  },
  quantity: {
    id: `${storePrefix}quote-details.items.quantity.title`,
  },
  total: {
    id: `${storePrefix}quote-details.items.total.title`,
  },
  subtotal: {
    id: `${storePrefix}quote-details.subtotal.title`,
  },
  notAuthenticated: {
    id: `${storePrefix}error.notAuthenticated`,
  },
  createSuccess: {
    id: `${storePrefix}create.success`,
  },
  createError: {
    id: `${storePrefix}create.error`,
  },
  required: {
    id: `${storePrefix}create.required`,
  },
  title: {
    id: `${storePrefix}create.title`,
  },
  back: {
    id: `${storePrefix}back`,
  },
  placeholderName: {
    id: `${storePrefix}create.placeholder.quotationName`,
  },
  labelName: {
    id: `${storePrefix}create.nameLabel`,
  },
  labelDescription: {
    id: `${storePrefix}create.descriptionLabel`,
  },
  emptyState: {
    id: `${storePrefix}create.empty-state-label`,
  },
})

const CSS_HANDLES = [
  'containerCreate',
  'inputCreate',
  'buttonsContainer',
  'noteContainer',
  'buttonSaveQuote',
  'buttonRequestQuote',
  'listContainer',
  'descriptionContainer',
  'notAuthenticatedMessage',
  'itemNameContainer',
  'itemName',
  'itemSkuName',
  'totalizerContainer',
] as const

const QuoteCreate: StorefrontFunctionComponent = () => {
  const [_state, setState] = useState({
    name: '',
    note: '',
    errorMessage: '',
    savingQuote: false,
  })

  const { formatMessage } = useIntl()
  const { navigate } = useRuntime()

  const { showToast } = useContext(ToastContext)
  const sessionResponse: any = useSessionResponse()
  const handles = useCssHandles(CSS_HANDLES)

  const { data: permissionsData } = useQuery(GET_PERMISSIONS, {
    ssr: false,
    skip: !isAuthenticated,
  })

  const { data } = useQuery(getOrderForm, {
    ssr: false,
  })

  const [SaveCartMutation] = useMutation(saveCartMutation)
  const [ClearCartMutation] = useMutation(clearCartMutation)

  if (!permissionsData || !data?.orderForm) return null
  const { orderForm } = data

  if (sessionResponse) {
    isAuthenticated =
      sessionResponse?.namespaces?.profile?.isAuthenticated?.value === 'true'

    localStore.setItem(
      'orderquote_isAuthenticated',
      JSON.stringify(isAuthenticated)
    )
  }

  const { name, note, savingQuote, errorMessage } = _state

  const toastMessage = (message: MessageDescriptor) => {
    const translatedMessage = formatMessage(message)

    const action = undefined

    showToast({ translatedMessage, action })
  }

  const defaultSchema = {
    properties: {
      imageUrl: {
        title: formatMessage(messages.image),
        // eslint-disable-next-line react/display-name
        cellRenderer: ({ rowData: { imageUrl, skuName } }: any) =>
          imageUrl && (
            <div className="dib v-mid relative">
              <img
                className="br2 v-mid"
                height="38"
                width="38"
                src={imageUrl}
                alt={skuName}
                crossOrigin="anonymous"
              />
            </div>
          ),
        width: 70,
      },
      refId: {
        title: formatMessage(messages.refCode),
        width: 200,
      },
      name: {
        title: formatMessage(messages.name),
        // eslint-disable-next-line react/display-name
        cellRenderer: ({ rowData }: any) => {
          return (
            <div className={handles.itemNameContainer}>
              <span className={handles.itemName}>{rowData.name}</span>
              {rowData.skuName !== rowData.name && (
                <Fragment>
                  <br />
                  <span className={`t-mini ${handles.itemSkuName}`}>
                    {rowData.skuName}
                  </span>
                </Fragment>
              )}
            </div>
          )
        },
        minWidth: 300,
      },
      sellingPrice: {
        title: formatMessage(messages.price),
        headerRight: true,
        // eslint-disable-next-line react/display-name
        cellRenderer: ({ cellData }: any) => {
          return (
            <span className="tr w-100">
              <FormattedCurrency value={cellData} />
            </span>
          )
        },
        width: 200,
      },
      quantity: {
        title: formatMessage(messages.quantity),
        width: 100,
      },
      total: {
        title: formatMessage(messages.total),
        headerRight: true,
        // eslint-disable-next-line react/display-name
        cellRenderer: ({ rowData }: any) => {
          return (
            <span className="tr w-100">
              <FormattedCurrency
                value={rowData.sellingPrice * rowData.quantity}
              />
            </span>
          )
        },
        width: 150,
      },
    },
  }

  let itemsCopy: any = orderForm?.items ? orderForm.items : []
  const { totalizers } = orderForm ?? {}

  const subtotal = (
    totalizers?.find((x: { id: string }) => x.id === 'Items') || {
      value: 0,
    }
  ).value

  // TODO: Capture order-level discounts
  //
  //   const discounts = (
  //     totalizers?.find((x: { id: string }) => x.id === 'Discounts') || {
  //       value: 0,
  //     }
  //   ).value

  const summary = [
    {
      label: formatMessage(messages.subtotal),
      value: (
        <FormattedCurrency value={subtotal === 0 ? subtotal : subtotal / 100} />
      ),
      isLoading: false,
    },
  ]

  const activeLoading = (status: boolean) => {
    setState({ ..._state, savingQuote: status })
  }

  const handleClearCart = (orderFormId: string) => {
    ClearCartMutation({
      variables: {
        orderFormId,
      },
    }).then(() => {
      itemsCopy = null
      navigate({
        page: 'store.b2b-quotes',
        fallbackToWindowLocation: true,
        fetchPage: true,
      })
    })
  }

  const handleSaveCart = (sendToSalesRep: boolean) => {
    if (!isAuthenticated) {
      toastMessage(messages.notAuthenticated)
    } else {
      activeLoading(true)
      if (
        name &&
        name.length > 0 &&
        orderForm?.items &&
        orderForm.items.length
      ) {
        // referenceName: String
        // items: [QuoteItem]
        // subtotal: Float
        // note: String
        // sendToSalesRep: Boolean

        const cart = {
          referenceName: name,
          items: orderForm.items.map((item: any) => {
            return {
              name: item.name,
              skuName: item.skuName,
              refId: item.refId,
              id: item.id,
              productId: item.productId,
              imageUrl: item.imageUrl,
              listPrice: parseInt(String(item.listPrice * 100), 10),
              price: parseInt(String(item.price * 100), 10),
              quantity: item.quantity,
              sellingPrice: parseInt(String(item.sellingPrice * 100), 10),
            }
          }),
          subtotal: parseInt(String(subtotal), 10),
          note,
          sendToSalesRep,
        }

        SaveCartMutation({
          variables: cart,
        })
          .then((result: any) => {
            if (result.data.createQuote) {
              activeLoading(false)
              toastMessage(messages.createSuccess)
              activeLoading(false)
              handleClearCart(orderForm.orderFormId)
            } else {
              toastMessage(messages.createError)
              activeLoading(false)
            }
          })
          .catch(() => {
            toastMessage(messages.createError)
            activeLoading(false)
          })
      }

      activeLoading(false)
    }
  }

  const saveQuote = (sendToSalesRep: boolean) => {
    if (!name) {
      setState({
        ..._state,
        errorMessage: formatMessage(messages.required),
      })
    } else {
      handleSaveCart(sendToSalesRep)
    }
  }

  const { permissions = [] } = permissionsData.checkUserPermission

  return (
    <div className={`${handles.containerCreate} pv6 ph4 mw9 center`}>
      <PageHeader
        title={formatMessage(messages.title)}
        linkLabel={formatMessage(messages.back)}
        onLinkClick={() => {
          navigate({
            page: 'store.b2b-quotes',
          })
        }}
      />

      {(!permissions.includes('create-quotes') || !isAuthenticated) && (
        <div className="flex flex-row ph5 ph7-ns">
          <div className="flex flex-column w-100">
            <div className={`mb5 ${handles.notAuthenticatedMessage}`}>
              {!isAuthenticated ? (
                <FormattedMessage id="store/b2b-quotes.error.notAuthenticated" />
              ) : (
                <FormattedMessage id="store/b2b-quotes.error.notPermitted" />
              )}
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && permissions.includes('create-quotes') && (
        <div>
          <div className="flex flex-column ph5 ph7-ns">
            <div className={`${handles.inputCreate} mb5 flex flex-column`}>
              <Input
                size="large"
                placeholder={formatMessage(messages.placeholderName)}
                dataAttributes={{ 'hj-white-list': true, test: 'string' }}
                label={formatMessage(messages.labelName)}
                value={name}
                errorMessage={errorMessage}
                onChange={(e: any) => {
                  setState({ ..._state, name: e.target.value })
                }}
              />
            </div>
          </div>
          <div className="flex flex-row ph5 ph7-ns">
            <div
              className={`flex flex-column w-100 mb5 ${handles.noteContainer}`}
            >
              <Textarea
                label={formatMessage(messages.labelDescription)}
                onChange={(e: any) =>
                  setState({ ..._state, note: e.target.value })
                }
                value={note}
                characterCountdownText={
                  <FormattedMessage
                    id="store/b2b-quotes.create.characterLeft"
                    values={{ count: _state.note.length }}
                  />
                }
                maxLength="500"
                rows="4"
              />
            </div>
          </div>
          <div className="flex flex-row ph5 ph7-ns">
            <div
              className={`flex flex-column w-100 mb5 ${handles.listContainer}`}
            >
              <Table
                fullWidth
                schema={defaultSchema}
                items={itemsCopy}
                density="medium"
                emptyStateLabel={formatMessage(messages.emptyState)}
              />
            </div>
          </div>
          <div className="flex flex-row ph5 ph7-ns">
            <div
              className={`flex flex-column w-100 mb5  ${handles.totalizerContainer}`}
            >
              <Totalizer items={summary} />
            </div>
          </div>
          <div
            className={`${handles.buttonsContainer} mb5 flex flex-column items-end pt6`}
          >
            <div className="flex justify-content flex-row">
              <div className={`no-wrap mr4 ${handles.buttonSaveQuote}`}>
                <Button
                  variation="secondary"
                  isLoading={savingQuote}
                  onClick={() => {
                    saveQuote(false)
                  }}
                  disabled={!itemsCopy?.length || !name}
                >
                  <FormattedMessage id="store/b2b-quotes.create.button.save-for-later" />
                </Button>
              </div>
              <div className={`no-wrap ${handles.buttonRequestQuote}`}>
                <Button
                  variation="primary"
                  isLoading={savingQuote}
                  onClick={() => {
                    saveQuote(true)
                  }}
                  disabled={!itemsCopy?.length || !name}
                >
                  <FormattedMessage id="store/b2b-quotes.create.button.request-quote" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface MessageDescriptor {
  id: string
  description?: string | Record<string, unknown>
  defaultMessage?: string
  values?: Record<string, unknown>
}

export default QuoteCreate
