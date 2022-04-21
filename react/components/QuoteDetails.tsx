/* eslint-disable react/display-name */
import type { FunctionComponent, ChangeEventHandler } from 'react'
import React, { useState, useEffect, useContext, Fragment } from 'react'
import { useIntl, FormattedMessage } from 'react-intl'
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
import { OrderForm } from 'vtex.order-manager'

import { quoteMessages } from '../utils/messages'
import { arrayShallowEqual } from '../utils/shallowEquals'
import {
  useSessionResponse,
  initQuoteFromOrderForm,
  itemDiscountEligible,
} from '../utils/helpers'
import useCheckout from '../modules/checkoutHook'
import { labelTypeByStatusMap } from './QuotesTable'
import GET_PERMISSIONS from '../graphql/getPermissions.graphql'
import GET_QUOTE from '../graphql/getQuote.graphql'
import GET_ORDERFORM from '../graphql/orderForm.gql'
import CREATE_QUOTE from '../graphql/createQuote.graphql'
import UPDATE_QUOTE from '../graphql/updateQuote.graphql'
import USE_QUOTE from '../graphql/useQuote.graphql'
import GET_AUTH_RULES from '../graphql/getDimension.graphql'
import CLEAR_CART from '../graphql/clearCartMutation.graphql'
import storageFactory from '../utils/storage'

const localStore = storageFactory(() => localStorage)

let isAuthenticated =
  JSON.parse(String(localStore.getItem('b2bquotes_isAuthenticated'))) ?? false

const initialState = {
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
}

const QuoteDetails: FunctionComponent = () => {
  const {
    culture,
    culture: { currency: currencyCode, locale },
    route: { params },
    navigate,
  } = useRuntime()

  const isNewQuote = !params?.id

  const sessionResponse: any = useSessionResponse()

  if (sessionResponse) {
    isAuthenticated =
      sessionResponse?.namespaces?.profile?.isAuthenticated?.value === 'true'

    localStore.setItem(
      'b2bquotes_isAuthenticated',
      JSON.stringify(isAuthenticated)
    )
  }

  const intl = useIntl()
  const { formatMessage, formatDate } = intl
  const { url: checkoutUrl } = useCheckoutURL()
  const goToCheckout = useCheckout()
  const { setOrderForm }: OrderFormContext = OrderForm.useOrderForm()
  const { showToast } = useContext(ToastContext)

  const toastMessage = (message: MessageDescriptor) => {
    const translatedMessage = formatMessage(message)

    const action = undefined

    showToast({ message: translatedMessage, duration: 5000, action })
  }

  const formatPrice = (value: number) =>
    formatCurrency({
      intl,
      culture,
      value: value / 100,
    })

  const [quoteState, setQuoteState] = useState<Quote>(initialState)

  const [formState, setFormState] = useState({
    isEditable: false,
    errorMessage: '',
  })

  const [orderFormState, setOrderFormState] = useState('')
  const [noteState, setNoteState] = useState('')
  const [maxDiscountState, setMaxDiscountState] = useState(100)
  const [discountState, setDiscountState] = useState(0)
  const [updatingQuoteState, setUpdatingQuoteState] = useState(false)
  const [usingQuoteState, setUsingQuoteState] = useState(false)
  const [originalSubtotal, setOriginalSubtotal] = useState(0)
  const [updatingSubtotal, setUpdatingSubtotal] = useState(0)
  const [sentToSalesRep, setSentToSalesRep] = useState(false)

  const setEditable = () => {
    setFormState((f) => {
      return {
        ...f,
        isEditable: true,
      }
    })
  }

  const { data, loading, refetch } = useQuery(GET_QUOTE, {
    variables: { id: params?.id },
    ssr: false,
    skip: isNewQuote,
  })

  const {
    data: orderFormData,
    refetch: refetchOrderForm,
  } = useQuery(GET_ORDERFORM, { ssr: false })

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
      setEditable()
    }
  }, [data])

  useEffect(() => {
    // only run this function if this is a new quote and there is orderForm data
    if (!(isNewQuote && orderFormData?.orderForm?.items?.length)) return

    let subtotal = 0
    const itemsCopy = initQuoteFromOrderForm(orderFormData.orderForm)

    itemsCopy.forEach((item: QuoteItem) => {
      subtotal += item.sellingPrice * item.quantity
    })

    setEditable()
    setQuoteState((prevState) => {
      return { ...prevState, items: itemsCopy }
    })
    setUpdatingSubtotal(subtotal)
  }, [isNewQuote, orderFormData])

  const [createQuoteMutation] = useMutation(CREATE_QUOTE)
  const [updateQuote] = useMutation(UPDATE_QUOTE)
  const [mutationUseQuote] = useMutation(USE_QUOTE)
  const [clearCart] = useMutation(CLEAR_CART)

  const handleClearCart = (orderFormId: string) => {
    return clearCart({
      variables: {
        orderFormId,
      },
    })
  }

  const handleCreateQuote = (sendToSalesRep: boolean) => {
    const { orderForm } = orderFormData

    setUpdatingQuoteState(true)
    const { referenceName, items: quoteItems } = quoteState
    const cart = {
      referenceName,
      items: quoteItems,
      subtotal: updatingSubtotal,
      note: noteState,
      sendToSalesRep,
    }

    createQuoteMutation({
      variables: cart,
    })
      .then((result: any) => {
        if (result.data.createQuote) {
          toastMessage(quoteMessages.createSuccess)
          handleClearCart(orderForm.orderFormId).then(() => {
            setQuoteState(initialState)
            setUpdatingSubtotal(0)
            setOriginalSubtotal(0)
            setTimeout(() => {
              refetchOrderForm().then((resp: any) => {
                if (resp?.data?.orderForm) {
                  setOrderForm(resp?.data?.orderForm)
                }

                setUpdatingQuoteState(false)
                navigate({
                  page: 'store.b2b-quotes',
                  fallbackToWindowLocation: true,
                  fetchPage: true,
                })

                return resp
              })
            }, 500)
          })
        } else {
          toastMessage(quoteMessages.createError)
          setUpdatingQuoteState(false)
        }
      })
      .catch(() => {
        toastMessage(quoteMessages.createError)
        setUpdatingQuoteState(false)
      })
  }

  const createQuote = (sendToSalesRep: boolean) => {
    setSentToSalesRep(sendToSalesRep)
    if (!quoteState.referenceName) {
      setFormState({
        ...formState,
        errorMessage: formatMessage(quoteMessages.required),
      })
    } else {
      handleCreateQuote(sendToSalesRep)
    }
  }

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
        toastMessage(quoteMessages.updateError)
        setUpdatingQuoteState(false)
      })
      .then(() => {
        setNoteState('')
        setDiscountState(0)
        setUpdatingQuoteState(false)
        toastMessage(quoteMessages.updateSuccess)
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
        toastMessage(quoteMessages.useError)
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
        toastMessage(quoteMessages.updateError)
        setUpdatingQuoteState(false)
      })
      .then(() => {
        setNoteState('')
        setDiscountState(0)
        setUpdatingQuoteState(false)
        toastMessage(quoteMessages.updateSuccess)
        refetch({ id: params?.id })
      })
  }

  const handleUpdateSellingPrice: (
    id: string
  ) => ChangeEventHandler<HTMLInputElement> = (itemId) => (event) => {
    const newItems = quoteState.items.map((item: QuoteItem) => {
      if (item.id === itemId) {
        let newPrice = ((event.target.value as unknown) as number) * 100

        if (newPrice > item.listPrice) {
          newPrice = item.listPrice
        }

        return {
          ...item,
          sellingPrice: newPrice,
          error:
            !newPrice || newPrice / item.listPrice < maxDiscountState / 100
              ? true
              : undefined, // setting error to false will cause create/update mutation to error
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
        let quantity =
          !new RegExp(/[^\d]/g).test(event.target.value) && event.target.value
            ? parseInt(event.target.value, 10)
            : 1

        if (quantity <= 0) {
          quantity = 1
        } else if (quantity > 50) {
          quantity = 50
        }

        newSubtotal += item.sellingPrice * quantity

        return {
          ...item,
          quantity,
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
    let newItems = [] as QuoteItem[]
    let newSubtotal = 0

    if (percent === 0) {
      if (isNewQuote) {
        newItems = initQuoteFromOrderForm(orderFormData?.orderForm)
      } else {
        newItems = data.getQuote.items
      }
    } else {
      quoteState.items.forEach((item: QuoteItem) => {
        const newSellingPrice = Math.round(
          item.listPrice * ((100 - percent) / 100)
        )

        newSubtotal += newSellingPrice * item.quantity

        newItems.push({ ...item, sellingPrice: newSellingPrice })
      })
    }

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
    status &&
    status !== 'expired' &&
    status !== 'declined'

  const quoteDeclinable =
    permissions.includes('decline-quotes') &&
    status &&
    status !== 'expired' &&
    status !== 'declined'

  const renderQuoteName = () => {
    if (isNewQuote) {
      return (
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
          onChange={(e: any) => {
            setQuoteState({
              ...quoteState,
              referenceName: e.target.value,
            })
          }}
        />
      )
    }

    return <h3 className="t-heading-3 mb8">{quoteState.referenceName}</h3>
  }

  const renderPercentageDiscount = () => {
    if (
      updatingSubtotal &&
      originalSubtotal &&
      Math.round(100 - (updatingSubtotal / originalSubtotal) * 100) <=
        maxDiscountState
    ) {
      return (
        <Fragment>
          <div className="mt5">
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
          </div>

          <div className="mt1">
            <FormattedMessage id="store/b2b-quotes.quote-details.apply-discount.help-text" />
          </div>
        </Fragment>
      )
    }

    return (
      <div className="mt1">
        <FormattedMessage id="store/b2b-quotes.quote-details.apply-discount.disabled-message" />
      </div>
    )
  }

  const renderQuoteSaveButtons = () => {
    if (isNewQuote) {
      return (
        <Fragment>
          <span className="mr4">
            <Button
              variation="secondary"
              isLoading={updatingQuoteState && !sentToSalesRep}
              onClick={() => {
                createQuote(false)
              }}
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
              onClick={() => {
                createQuote(!isSalesRep)
              }}
              disabled={
                !quoteState.items?.length ||
                !quoteState.referenceName ||
                updatingQuoteState
              }
            >
              {isSalesRep ? (
                <FormattedMessage id="store/b2b-quotes.quote-details.save" />
              ) : (
                <FormattedMessage id="store/b2b-quotes.create.button.request-quote" />
              )}
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
      </Fragment>
    )
  }

  if (
    !isAuthenticated ||
    !permissions?.length ||
    (!isNewQuote &&
      !permissions.some((permission: string) =>
        permission.includes('access-quotes')
      )) ||
    (isNewQuote && !permissions.includes('create-quotes'))
  ) {
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
              title={formatMessage(
                isNewQuote
                  ? quoteMessages.createPageTitle
                  : quoteMessages.updatePageTitle
              )}
              linkLabel={formatMessage(quoteMessages.back)}
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
                <div className="flex flex-column ph5 ph7-ns">
                  <div className="mb5 flex flex-column">
                    {renderQuoteName()}
                  </div>
                </div>
                <div className="pa5">
                  <Table
                    totalizers={[
                      {
                        label: formatMessage(quoteMessages.originalSubtotal),
                        value: formatPrice(originalSubtotal),
                      },
                      {
                        label: formatMessage(quoteMessages.percentageDiscount),
                        value:
                          updatingSubtotal && originalSubtotal
                            ? `${Math.round(
                                100 -
                                  (updatingSubtotal / originalSubtotal) * 100
                              )}%`
                            : `0%`,
                      },
                      {
                        label: formatMessage(quoteMessages.quotedSubtotal),
                        value: formatPrice(updatingSubtotal),
                      },
                      ...(quoteState.expirationDate && [
                        {
                          label: formatMessage(quoteMessages.expiration),
                          value: formatDate(quoteState.expirationDate, {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                          }),
                        },
                      ]),
                      ...(quoteState.expirationDate && [
                        {
                          label: formatMessage(quoteMessages.status),
                          value: (
                            <Tag type={labelTypeByStatusMap[quoteState.status]}>
                              {quoteState.status}
                            </Tag>
                          ),
                        },
                      ]),
                    ]}
                    fullWidth
                    schema={{
                      properties: {
                        imageUrl: {
                          title: formatMessage(quoteMessages.image),
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
                          title: formatMessage(quoteMessages.refCode),
                          width: 200,
                        },
                        name: {
                          title: formatMessage(quoteMessages.name),
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
                          title: formatMessage(quoteMessages.originalPrice),
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
                          title: formatMessage(quoteMessages.quotePrice),
                          headerRight: true,
                          width: 120,
                          cellRenderer: ({
                            cellData: sellingPrice,
                            rowData: { id: itemId, listPrice, error },
                          }: any) => {
                            if (
                              formState.isEditable &&
                              isSalesRep &&
                              discountState === 0 &&
                              itemDiscountEligible({
                                listPrice,
                                sellingPrice,
                                error,
                                maxDiscountState,
                              })
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
                          title: formatMessage(quoteMessages.quantity),
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
                          title: formatMessage(quoteMessages.total),
                          headerRight: true,
                          cellRenderer: ({ rowData }: any) => {
                            return (
                              <span className="tr w-100">
                                <FormattedCurrency
                                  value={
                                    rowData.sellingPrice
                                      ? (rowData.sellingPrice *
                                          rowData.quantity) /
                                        100
                                      : 0
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
                    emptyStateLabel={formatMessage(quoteMessages.emptyState)}
                  />
                  {formState.isEditable && isSalesRep && (
                    <div className="mt3">
                      <h3 className="t-heading-4 mb4">
                        <FormattedMessage id="store/b2b-quotes.quote-details.apply-discount.title" />
                      </h3>
                      <div className="pa5">
                        {renderPercentageDiscount()}
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

                  {quoteState.expirationDate &&
                    formState.isEditable &&
                    isSalesRep && (
                      <div className="mt3">
                        <h3 className="t-heading-4">
                          <FormattedMessage id="store/b2b-quotes.quote-details.expiration-date-change.title" />
                        </h3>
                        <div className="pa5">
                          <DatePicker
                            label={formatMessage(quoteMessages.expiration)}
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
                    {quoteState.updateHistory.length > 0 && (
                      <h3 className="t-heading-4">
                        <FormattedMessage id="store/b2b-quotes.quote-details.update-history.title" />
                      </h3>
                    )}
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
                        label={formatMessage(quoteMessages.addNote)}
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
                  {renderQuoteSaveButtons()}
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
