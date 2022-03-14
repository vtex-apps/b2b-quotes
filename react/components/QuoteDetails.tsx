/* eslint-disable react/display-name */
import type { FunctionComponent, ChangeEventHandler } from 'react'
import React, { useState, useEffect, useContext, Fragment } from 'react'
import { useIntl, defineMessages, FormattedMessage } from 'react-intl'
import { useQuery, useMutation } from 'react-apollo'
import { useRuntime } from 'vtex.render-runtime'
import {
  Alert,
  Layout,
  PageHeader,
  PageBlock,
  Spinner,
  Button,
  Table,
  Card,
  Slider,
  Tag,
  Textarea,
  Input,
  InputCurrency,
  ToastContext,
  DatePicker,
} from 'vtex.styleguide'
import { formatCurrency, FormattedCurrency } from 'vtex.format-currency'
import { useCheckoutURL } from 'vtex.checkout-resources/Utils'

import { arrayShallowEqual } from '../utils/shallowEquals'
import useCheckout from '../modules/checkoutHook'
import { labelTypeByStatusMap } from './QuotesTable'
import GET_PERMISSIONS from '../graphql/getPermissions.graphql'
import GET_QUOTE from '../graphql/getQuote.graphql'
import GET_ORDERFORM from '../graphql/orderForm.gql'
import UPDATE_QUOTE from '../graphql/updateQuote.graphql'
import USE_QUOTE from '../graphql/useQuote.graphql'
import GET_AUTH_RULES from '../graphql/getDimension.graphql'
import { getSession } from '../modules/session'
import storageFactory from '../utils/storage'

const localStore = storageFactory(() => localStorage)

const useSessionResponse = () => {
  const [session, setSession] = useState<unknown>()
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
  updateSuccess: {
    id: `${storePrefix}quote-details.update-success`,
  },
  updateError: {
    id: `${storePrefix}quote-details.update-error`,
  },
  useError: {
    id: `${storePrefix}quote-details.use-error`,
  },
  pageTitle: {
    id: `${storePrefix}quote-details.title`,
  },
  back: {
    id: `${storePrefix}back`,
  },
  subtotal: {
    id: `${storePrefix}quote-details.subtotal.title`,
  },
  expiration: {
    id: `${storePrefix}quote-details.expiration.title`,
  },
  status: {
    id: `${storePrefix}quote-details.status.title`,
  },
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
  addNote: {
    id: `${storePrefix}quote-details.add-note.label`,
  },
  percentageDiscount: {
    id: `${storePrefix}quote-details.percentage-discount.title`,
  },
  quotedSubtotal: {
    id: `${storePrefix}quote-details.quoted-subtotal.title`,
  },
  originalSubtotal: {
    id: `${storePrefix}quote-details.original-subtotal.title`,
  },
  quotePrice: {
    id: `${storePrefix}quote-details.quote-price.title`,
  },
  originalPrice: {
    id: `${storePrefix}quote-details.original-price.title`,
  },
  expirationDateChange: {
    id: `${storePrefix}quote-details.expiration-date-change.title`,
  },
})

const QuoteDetails: FunctionComponent = () => {
  const {
    culture,
    culture: { currency: currencyCode, locale },
    route: { params },
    navigate,
  } = useRuntime()

  const sessionResponse: any = useSessionResponse()

  if (sessionResponse) {
    isAuthenticated =
      sessionResponse?.namespaces?.profile?.isAuthenticated?.value === 'true'

    localStore.setItem(
      'orderquote_isAuthenticated',
      JSON.stringify(isAuthenticated)
    )
  }

  const intl = useIntl()
  const { formatMessage, formatDate } = intl
  const { url: checkoutUrl } = useCheckoutURL()
  const goToCheckout = useCheckout()
  const { showToast } = useContext(ToastContext)

  const toastMessage = (message: MessageDescriptor) => {
    const translatedMessage = formatMessage(message)

    const action = undefined

    showToast({ message: translatedMessage, duration: 5000, action })
  }

  // const { orderForm } = useOrderForm()

  const formatPrice = (value: number) =>
    formatCurrency({
      intl,
      culture,
      value: value / 100,
    })

  const [quoteState, setQuoteState] = useState<Quote>({
    id: '',
    costCenter: '',
    costCenterName: '',
    creationDate: '',
    creatorEmail: '',
    creatorRole: '',
    expirationDate: '',
    items: [],
    lastUpdate: '',
    organization: '',
    organizationName: '',
    referenceName: '',
    status: '',
    subtotal: 0,
    updateHistory: [],
    viewedByCustomer: false,
    viewedBySales: false,
  })

  const [formState, setFormState] = useState({
    isEditable: false,
  })

  const [orderFormState, setOrderFormState] = useState('')
  const [noteState, setNoteState] = useState('')
  const [maxDiscountState, setMaxDiscountState] = useState(100)
  const [discountState, setDiscountState] = useState(0)
  const [updatingQuoteState, setUpdatingQuoteState] = useState(false)
  const [usingQuoteState, setUsingQuoteState] = useState(false)
  const [originalSubtotal, setOriginalSubtotal] = useState(0)
  const [updatingSubtotal, setUpdatingSubtotal] = useState(0)

  const { data, loading, refetch } = useQuery(GET_QUOTE, {
    variables: { id: params?.id },
    ssr: false,
    skip: !params?.id,
  })

  const { data: orderFormData } = useQuery(GET_ORDERFORM, { ssr: false })

  const { data: orderAuthData } = useQuery(GET_AUTH_RULES, { ssr: false })
  const {
    data: permissionsData,
    loading: permissionsLoading,
  } = useQuery(GET_PERMISSIONS, { ssr: false })

  useEffect(() => {
    if (!quoteState.items.find((item) => item.error)) {
      setUpdatingSubtotal(
        quoteState.items.reduce(
          (sum, item) => sum + item.sellingPrice * item.quantity,
          0
        )
      )
    }

    const price = quoteState.items.reduce(
      (sum: number, item: QuoteItem) => sum + item.listPrice * item.quantity,
      0
    )

    setOriginalSubtotal(price)
  }, [quoteState])

  useEffect(() => {
    if (!orderFormData?.orderForm) return

    setOrderFormState(orderFormData.orderForm.orderFormId)
  }, [orderFormData])

  useEffect(() => {
    if (!orderAuthData?.getDimension?.ruleCollection?.length) return

    const { ruleCollection } = orderAuthData.getDimension

    // 'greatherThan' typo is correct
    const maxDiscountPercentage =
      ruleCollection.find(
        (collection: any) =>
          collection?.trigger?.effect?.description === 'DenyEffect'
      )?.trigger?.condition?.greatherThan ?? 100

    setMaxDiscountState(maxDiscountPercentage)
  }, [orderAuthData])

  useEffect(() => {
    if (!data?.getQuote) return

    const {
      getQuote: {
        id,
        costCenter,
        costCenterName,
        creationDate,
        creatorEmail,
        creatorRole,
        expirationDate,
        items,
        lastUpdate,
        organization,
        organizationName,
        referenceName,
        status,
        subtotal,
        updateHistory,
        viewedByCustomer,
        viewedBySales,
      },
    } = data

    setUpdatingSubtotal(subtotal)
    setQuoteState({
      id,
      costCenter,
      costCenterName,
      creationDate,
      creatorEmail,
      creatorRole,
      expirationDate,
      items,
      lastUpdate,
      organization,
      organizationName,
      referenceName,
      status,
      subtotal,
      updateHistory,
      viewedByCustomer,
      viewedBySales,
    })

    if (status === 'pending' || status === 'ready' || status === 'revised') {
      setFormState((f) => {
        return {
          ...f,
          isEditable: true,
        }
      })
    }
  }, [data])

  const [updateQuote] = useMutation(UPDATE_QUOTE)
  const [mutationUseQuote] = useMutation(USE_QUOTE)

  const handleSaveQuote = () => {
    setUpdatingQuoteState(true)
    const { id, items, expirationDate } = quoteState

    const itemsChanged = !arrayShallowEqual(data.getQuote.items, items)

    updateQuote({
      variables: {
        id,
        ...(itemsChanged && { items }),
        ...(itemsChanged && { subtotal: updatingSubtotal }),
        ...(noteState && { note: noteState }),
        decline: false,
        expirationDate,
      },
    })
      .catch((error) => {
        console.error(error)
        toastMessage(messages.updateError)
        setUpdatingQuoteState(false)
      })
      .then(() => {
        setNoteState('')
        setDiscountState(0)
        setUpdatingQuoteState(false)
        toastMessage(messages.updateSuccess)
        refetch({ id: params?.id })
      })
  }

  const handleUseQuote = () => {
    setUsingQuoteState(true)
    const { id } = quoteState
    const variables = {
      id,
      orderFormId: orderFormState,
    }

    mutationUseQuote({
      variables,
    })
      .catch((error) => {
        console.error(error)
        toastMessage(messages.useError)
        setUsingQuoteState(false)
      })
      .then(() => {
        goToCheckout(checkoutUrl)
        setUsingQuoteState(false)
      })
  }

  const { id = '', items = [], status = '', expirationDate } =
    data?.getQuote ?? {}

  const handleDeclineQuote = () => {
    setUpdatingQuoteState(true)
    updateQuote({
      variables: {
        id,
        ...(noteState && { note: noteState }),
        decline: true,
      },
    })
      .catch((error) => {
        console.error(error)
        toastMessage(messages.updateError)
        setUpdatingQuoteState(false)
      })
      .then(() => {
        setNoteState('')
        setDiscountState(0)
        setUpdatingQuoteState(false)
        toastMessage(messages.updateSuccess)
        refetch({ id: params?.id })
      })
  }

  const handleUpdateSellingPrice: (
    id: string
  ) => ChangeEventHandler<HTMLInputElement> = (itemId) => (event) => {
    const newItems = quoteState.items.map((item: QuoteItem) => {
      if (item.id === itemId) {
        const newPrice = ((event.target.value as unknown) as number) * 100

        return {
          ...item,
          sellingPrice: newPrice,
          error:
            !newPrice || newPrice / item.listPrice < maxDiscountState / 100,
        }
      }

      return item
    })

    setQuoteState({
      ...quoteState,
      items: newItems,
    })
  }

  const handleUpdateQuantity: (
    id: string
  ) => ChangeEventHandler<HTMLInputElement> = (itemId) => (event) => {
    let newSubtotal = 0
    const newItems = quoteState.items.map((item: QuoteItem) => {
      if (item.id === itemId) {
        newSubtotal += item.sellingPrice * +event.target.value

        return {
          ...item,
          quantity: +event.target.value,
        }
      }

      newSubtotal += item.sellingPrice * item.quantity

      return item
    })

    setUpdatingSubtotal(newSubtotal)
    setQuoteState({
      ...quoteState,
      items: newItems,
      subtotal: newSubtotal,
    })
  }

  const handlePercentageDiscount = (percent: number) => {
    setDiscountState(percent)
    const newItems = [] as QuoteItem[]
    let newSubtotal = 0

    items.forEach((item: QuoteItem) => {
      const newSellingPrice = Math.round(
        item.listPrice * ((100 - percent) / 100)
      )

      newSubtotal += newSellingPrice * item.quantity

      newItems.push({ ...item, sellingPrice: newSellingPrice })
    })

    setUpdatingSubtotal(newSubtotal)
    setQuoteState({
      ...quoteState,
      items: newItems,
      subtotal: newSubtotal,
    })
  }

  const { permissions = [] } = permissionsData?.checkUserPermission ?? {}

  const isSalesRep = permissions.some(
    (permission: string) => permission.indexOf('edit-quotes') >= 0
  )

  const quoteUsable =
    permissions.includes('use-quotes') &&
    status !== 'expired' &&
    status !== 'declined'

  const quoteDeclinable =
    permissions.includes('decline-quotes') &&
    status !== 'expired' &&
    status !== 'declined'

  if (
    !isAuthenticated ||
    !permissions?.length ||
    !permissions.some(
      (permission: string) => permission.indexOf('access-quotes') >= 0
    )
  ) {
    return (
      <Layout fullWidth>
        <div className="mw9 center">
          <Layout
            fullWidth
            pageHeader={
              <PageHeader
                title={formatMessage(messages.pageTitle)}
                linkLabel={formatMessage(messages.back)}
                onLinkClick={() => {
                  navigate({
                    page: 'store.b2b-quotes',
                  })
                }}
              />
            }
          >
            <PageBlock>
              {permissionsLoading ? (
                <Spinner />
              ) : !isAuthenticated ? (
                <FormattedMessage id="store/b2b-quotes.error.notAuthenticated" />
              ) : (
                <FormattedMessage id="store/b2b-quotes.error.notPermitted" />
              )}
            </PageBlock>
          </Layout>
        </div>
      </Layout>
    )
  }

  return (
    <Layout fullWidth>
      <div className="mw9 center">
        <Layout
          fullWidth
          pageHeader={
            <PageHeader
              title={formatMessage(messages.pageTitle)}
              linkLabel={formatMessage(messages.back)}
              onLinkClick={() => {
                navigate({
                  page: 'store.b2b-quotes',
                })
              }}
            />
          }
        >
          <PageBlock>
            {loading ? (
              <Spinner />
            ) : (
              <Fragment>
                <div className="pa5">
                  <Table
                    totalizers={[
                      {
                        label: formatMessage(messages.originalSubtotal),
                        value: formatPrice(originalSubtotal),
                      },
                      {
                        label: formatMessage(messages.percentageDiscount),
                        value: `${Math.round(
                          100 - (quoteState.subtotal / originalSubtotal) * 100
                        )}%`,
                      },
                      {
                        label: formatMessage(messages.quotedSubtotal),
                        value: formatPrice(updatingSubtotal),
                      },
                      {
                        label: formatMessage(messages.expiration),
                        value: formatDate(quoteState.expirationDate, {
                          day: 'numeric',
                          month: 'numeric',
                          year: 'numeric',
                        }),
                      },
                      {
                        label: formatMessage(messages.status),
                        value: (
                          <Tag type={labelTypeByStatusMap[quoteState.status]}>
                            {quoteState.status}
                          </Tag>
                        ),
                      },
                    ]}
                    fullWidth
                    schema={{
                      properties: {
                        imageUrl: {
                          title: formatMessage(messages.image),
                          cellRenderer: ({
                            rowData: { imageUrl, skuName },
                          }: any) =>
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
                              <div>
                                <span>{rowData.name}</span>
                                {rowData.skuName !== rowData.name && (
                                  <Fragment>
                                    <br />
                                    <span className="t-mini">
                                      {rowData.skuName}
                                    </span>
                                  </Fragment>
                                )}
                              </div>
                            )
                          },
                          minWidth: 300,
                        },
                        listPrice: {
                          title: formatMessage(messages.originalPrice),
                          headerRight: true,
                          width: 120,
                          cellRenderer: ({ rowData }: any) => {
                            return (
                              isSalesRep && (
                                <div
                                  className={`w-100 tr${
                                    rowData.listPrice !== rowData.sellingPrice
                                      ? ' strike '
                                      : ''
                                  }`}
                                >
                                  <FormattedCurrency
                                    value={rowData.listPrice / 100}
                                  />
                                </div>
                              )
                            )
                          },
                        },
                        sellingPrice: {
                          title: formatMessage(messages.quotePrice),
                          headerRight: true,
                          width: 120,
                          cellRenderer: ({
                            cellData: sellingPrice,
                            rowData: { id: itemId, error },
                          }: any) => {
                            if (
                              formState.isEditable &&
                              isSalesRep &&
                              discountState === 0
                            ) {
                              return (
                                <InputCurrency
                                  name="price"
                                  value={sellingPrice / 100}
                                  onChange={handleUpdateSellingPrice(itemId)}
                                  currencyCode={currencyCode}
                                  locale={locale}
                                  error={error}
                                />
                              )
                            }

                            return (
                              <div className="w-100 tr">
                                <FormattedCurrency value={sellingPrice / 100} />
                              </div>
                            )
                          },
                        },
                        quantity: {
                          title: formatMessage(messages.quantity),
                          width: 100,
                          cellRenderer: ({
                            cellData: quantity,
                            rowData: { id: itemId },
                          }: any) => {
                            if (formState.isEditable && isSalesRep) {
                              return (
                                <Input
                                  id={itemId}
                                  name="quantity"
                                  value={quantity}
                                  onChange={handleUpdateQuantity(itemId)}
                                />
                              )
                            }

                            return quantity
                          },
                        },
                        total: {
                          title: formatMessage(messages.total),
                          headerRight: true,
                          // eslint-disable-next-line react/display-name
                          cellRenderer: ({ rowData }: any) => {
                            return (
                              <span className="tr w-100">
                                <FormattedCurrency
                                  value={
                                    (rowData.sellingPrice * rowData.quantity) /
                                    100
                                  }
                                />
                              </span>
                            )
                          },
                          width: 100,
                        },
                      },
                    }}
                    items={quoteState.items}
                  />
                  {formState.isEditable && isSalesRep && (
                    <div className="mt3">
                      <h3 className="t-heading-4 mb8">
                        <FormattedMessage id="store/b2b-quotes.quote-details.apply-discount.title" />
                      </h3>
                      <div className="pa5">
                        <Slider
                          onChange={([value]: [number]) => {
                            handlePercentageDiscount(value)
                          }}
                          min={0}
                          max={maxDiscountState}
                          step={1}
                          disabled={false}
                          defaultValues={[0]}
                          alwaysShowCurrentValue
                          formatValue={(a: number) => `${a}%`}
                          value={discountState}
                        />

                        <div className="mt1">
                          <FormattedMessage id="store/b2b-quotes.quote-details.apply-discount.help-text" />
                        </div>
                        {maxDiscountState < 100 && (
                          <div className="mt1">
                            <FormattedMessage
                              id="store/b2b-quotes.quote-details.apply-discount.maxDiscount-text"
                              values={{ maxDiscount: maxDiscountState }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {formState.isEditable && isSalesRep && (
                    <div className="mt3">
                      <h3 className="t-heading-4">
                        <FormattedMessage id="store/b2b-quotes.quote-details.expiration-date-change.title" />
                      </h3>
                      <div className="pa5">
                        <DatePicker
                          label={formatMessage(messages.expiration)}
                          minDate={new Date()}
                          locale="en-US"
                          value={new Date(quoteState.expirationDate)}
                          onChange={(date: Date) =>
                            setQuoteState({
                              ...quoteState,
                              expirationDate: date.toISOString(),
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt3">
                    <h3 className="t-heading-4">
                      <FormattedMessage id="store/b2b-quotes.quote-details.update-history.title" />
                    </h3>
                    {quoteState.updateHistory.map((update, index) => {
                      return (
                        <div key={index} className="ph4 pv2">
                          <Card>
                            <div>
                              <FormattedMessage
                                id="store/b2b-quotes.quote-details.update-history.update-details"
                                values={{
                                  date: formatDate(update.date, {
                                    day: 'numeric',
                                    month: 'numeric',
                                    year: 'numeric',
                                  }),
                                  email: update.email,
                                  role: update.role,
                                  status: (
                                    <Tag
                                      type={labelTypeByStatusMap[update.status]}
                                    >
                                      {update.status}
                                    </Tag>
                                  ),
                                  index,
                                }}
                              />
                            </div>
                            {update.note && (
                              <div>
                                <b>
                                  <FormattedMessage id="store/b2b-quotes.quote-details.update-history.notes" />
                                </b>
                                <br />
                                {update.note}
                              </div>
                            )}
                          </Card>
                        </div>
                      )
                    })}
                  </div>
                  {formState.isEditable && (
                    <div className="mt3 pa5">
                      <Textarea
                        label={formatMessage(messages.addNote)}
                        value={noteState}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setNoteState(e.target.value)
                        }}
                        characterCountdownText={
                          <FormattedMessage
                            id="store/b2b-quotes.create.characterLeft"
                            values={{ count: noteState.length }}
                          />
                        }
                        maxLength="500"
                        rows="4"
                      />
                    </div>
                  )}
                </div>

                {quoteState.items.some((item) => item.error) ? (
                  <div className="mb4">
                    <Alert type="error">
                      <FormattedMessage
                        id="store/b2b-quotes.quote-details.discount-error"
                        values={{ count: noteState.length }}
                      />
                    </Alert>
                  </div>
                ) : null}

                <div className="nowrap">
                  {quoteDeclinable && (
                    <span className="mr4">
                      <Button
                        variation="danger"
                        onClick={() => handleDeclineQuote()}
                        disabled={!formState.isEditable || updatingQuoteState}
                      >
                        <FormattedMessage id="store/b2b-quotes.quote-details.decline" />
                      </Button>
                    </span>
                  )}
                  <span className="mr4">
                    <Button
                      variation="primary"
                      onClick={() => handleSaveQuote()}
                      isLoading={updatingQuoteState}
                      disabled={
                        quoteState.items.some((item) => item.error) ||
                        (quoteState.items.length &&
                          noteState === '' &&
                          expirationDate === quoteState.expirationDate &&
                          arrayShallowEqual(items, quoteState.items))
                      }
                    >
                      {isSalesRep ? (
                        <FormattedMessage id="store/b2b-quotes.quote-details.save" />
                      ) : (
                        <FormattedMessage id="store/b2b-quotes.quote-details.submit-to-sales-rep" />
                      )}
                    </Button>
                  </span>
                  {quoteUsable && (
                    <span className="mr4">
                      <Button
                        variation="primary"
                        onClick={() => handleUseQuote()}
                        isLoading={usingQuoteState}
                      >
                        <FormattedMessage id="store/b2b-quotes.quote-details.use-quote" />
                      </Button>
                    </span>
                  )}
                </div>
              </Fragment>
            )}
          </PageBlock>
        </Layout>
      </div>
    </Layout>
  )
}

export default QuoteDetails
