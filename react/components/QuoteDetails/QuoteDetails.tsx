/* eslint-disable react/display-name */
import type { ChangeEventHandler, FunctionComponent } from 'react'
import React, {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useMutation, useQuery } from 'react-apollo'
import { FormattedMessage, useIntl } from 'react-intl'
import { useCheckoutURL } from 'vtex.checkout-resources/Utils'
import { OrderForm } from 'vtex.order-manager'
import { useRuntime } from 'vtex.render-runtime'
import {
  Alert,
  Button,
  DatePicker,
  Layout,
  PageBlock,
  PageHeader,
  Spinner,
  Textarea,
  ToastContext,
} from 'vtex.styleguide'

import CHECK_SELLER_QUOTES from '../../graphql/checkSellerQuotes.graphql'
import CLEAR_CART from '../../graphql/clearCartMutation.graphql'
import CREATE_QUOTE from '../../graphql/createQuote.graphql'
import GET_AUTH_RULES from '../../graphql/getDimension.graphql'
import GET_CHILDREN_QUOTES from '../../graphql/getFullChildrenQuotes.graphql'
import GET_PERMISSIONS from '../../graphql/getPermissions.graphql'
import GET_QUOTE from '../../graphql/getQuote.graphql'
import GET_ORDERFORM from '../../graphql/orderForm.gql'
import UPDATE_QUOTE from '../../graphql/updateQuote.graphql'
import USE_QUOTE from '../../graphql/useQuote.graphql'
import useCheckout from '../../modules/checkoutHook'
import {
  initQuoteFromOrderForm,
  isQuoteUsable,
  useSessionResponse,
} from '../../utils/helpers'
import { quoteMessages } from '../../utils/messages'
import { sendCreateQuoteMetric } from '../../utils/metrics/createQuote'
import type { UseQuoteMetricsParams } from '../../utils/metrics/useQuote'
import { sendUseQuoteMetric } from '../../utils/metrics/useQuote'
import { arrayShallowEqual } from '../../utils/shallowEquals'
import { Status } from '../../utils/status'
import storageFactory from '../../utils/storage'
import AlertMessage from './AlertMessage'
import PercentageDiscount from './PercentageDiscount'
import QuoteChildren from './QuoteChildren'
import QuoteDetailsNotAuthenticated from './QuoteDetailsNotAuthenticated'
import QuoteName from './QuoteName'
import QuoteTable from './QuoteTable'
import QuoteUpdateHistory from './QuoteUpdateHistory'
import SaveButtons from './SaveButtons'

const localStore = storageFactory(() => localStorage)
const MAX_DISCOUNT_PERCENTAGE = 99

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
  hasChildren: false,
}

const QuoteDetails: FunctionComponent = () => {
  /**
   * constants
   */
  const {
    route: { params },
    query,
    navigate,
    workspace,
    account,
  } = useRuntime()

  const isNewQuote = !params?.id
  const sessionResponse: any = useSessionResponse()
  const intl = useIntl()
  const { formatMessage } = intl
  const { url: checkoutUrl } = useCheckoutURL()
  const goToCheckout = useCheckout()
  const { setOrderForm }: OrderFormContext = OrderForm.useOrderForm()
  const { showToast } = useContext(ToastContext)

  const toastMessage = (message: MessageDescriptor) => {
    const translatedMessage = formatMessage(message)
    const action = undefined

    showToast({ message: translatedMessage, duration: 5000, action })
  }

  const [quoteState, setQuoteState] = useState<Quote>(initialState)
  const [formState, setFormState] = useState({
    isEditable: false,
    canAddNotes: false,
    errorMessage: '',
  })

  const [orderFormState, setOrderFormState] = useState('')
  const [noteState, setNoteState] = useState('')
  const [maxDiscountState, setMaxDiscountState] = useState(
    MAX_DISCOUNT_PERCENTAGE
  )

  const [discountState, setDiscountState] = useState(0)
  const [updatingQuoteState, setUpdatingQuoteState] = useState(false)
  const [usingQuoteState, setUsingQuoteState] = useState(false)
  const [usingQuoteChild, setUsingQuoteChild] = useState<string>()
  const [originalSubtotal, setOriginalSubtotal] = useState(0)
  const [updatingSubtotal, setUpdatingSubtotal] = useState(0)
  const [sentToSalesRep, setSentToSalesRep] = useState(false)
  const getQuoteVariables = { id: params?.id }

  /**
   * GraphQL Queries
   */
  const { data, loading, refetch } = useQuery(GET_QUOTE, {
    fetchPolicy: 'network-only',
    variables: getQuoteVariables,
    ssr: false,
    skip: isNewQuote,
  })

  const {
    data: childrenQuoteList,
    loading: childrenQuotesLoading,
    refetch: refetchChildrenQuotes,
  } = useQuery(GET_CHILDREN_QUOTES, {
    fetchPolicy: 'network-only',
    variables: getQuoteVariables,
    ssr: false,
    skip: isNewQuote || !data?.getQuote?.hasChildren,
  })

  const childrenQuotes = childrenQuoteList?.getChildrenQuotes

  const sellers = Array.from(
    new Set(quoteState.items.map((item: QuoteItem) => item.seller))
  )

  const externalSellers = sellers.filter((seller) => seller !== '1')

  const {
    data: checkSellerQuotesData,
    loading: checkSellerQuotesLoading,
  } = useQuery(CHECK_SELLER_QUOTES, {
    fetchPolicy: 'network-only',
    ssr: false,
    skip: !isNewQuote,
    variables: { sellers: externalSellers },
  })

  const checkedSellers = checkSellerQuotesData?.checkSellerQuotes

  const hasCheckedExternalSellers = !!checkedSellers?.some(
    (seller: Seller) => seller.id !== '1'
  )

  const {
    data: orderFormData,
    refetch: refetchOrderForm,
  } = useQuery(GET_ORDERFORM, { ssr: false, fetchPolicy: 'network-only' })

  const { data: orderAuthData } = useQuery(GET_AUTH_RULES, { ssr: false })
  const {
    data: permissionsData,
    loading: permissionsLoading,
  } = useQuery(GET_PERMISSIONS, { ssr: false })

  const {
    id = '',
    items = [],
    status = '',
    expirationDate,
    childrenQuantity,
    parentQuote,
    seller,
    sellerName,
  } = data?.getQuote ?? {}

  const { permissions = [] } = permissionsData?.checkUserPermission ?? {}
  const isSalesRep = permissions.some(
    (permission: string) => permission.indexOf('edit-quotes') >= 0
  )

  const quoteUsable = isQuoteUsable(permissions, status)

  const quoteDeclinable =
    permissions.includes('decline-quotes') &&
    (!seller || seller === '1') &&
    !quoteState.hasChildren &&
    status &&
    status !== Status.EXPIRED &&
    status !== Status.DECLINED

  /**
   *  GraphQL Mutations
   */
  const [createQuoteMutation] = useMutation(CREATE_QUOTE)
  const [updateQuote] = useMutation(UPDATE_QUOTE)
  const [mutationUseQuote] = useMutation(USE_QUOTE)
  const [clearCart] = useMutation(CLEAR_CART)
  /**
   * functions
   */
  const setEditable = useCallback(() => {
    let isEditable = true
    let canAddNotes = true

    if (parentQuote && seller && seller !== '1') {
      isEditable = false
    }

    if (isNewQuote && sellers.length > 1 && hasCheckedExternalSellers) {
      canAddNotes = false
    }

    setFormState((f) => {
      return {
        ...f,
        isEditable,
        canAddNotes,
      }
    })
  }, [
    hasCheckedExternalSellers,
    isNewQuote,
    parentQuote,
    seller,
    sellers.length,
  ])

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
          const metricsParam = {
            quoteId: result.data.createQuote,
            sessionResponse,
            workspace,
            sendToSalesRep,
            account,
          }

          sendCreateQuoteMetric(metricsParam)

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

  const handleAfterSaveQuote = () => {
    if (parentQuote && query?.parent !== undefined) {
      navigate({
        page: 'store.b2b-quote-details',
        params: { id: parentQuote },
      })
    } else {
      refetch(getQuoteVariables)
      refetchChildrenQuotes(getQuoteVariables)
    }
  }

  const handleSaveQuote = () => {
    setUpdatingQuoteState(true)
    const {
      id: _id,
      items: _items,
      expirationDate: _expirationDate,
    } = quoteState

    const itemsChanged = !arrayShallowEqual(data.getQuote.items, _items)

    updateQuote({
      variables: {
        id: _id,
        ...(itemsChanged && { items: _items }),
        ...(itemsChanged && { subtotal: updatingSubtotal }),
        ...(noteState && { note: noteState }),
        decline: false,
        expirationDate: _expirationDate,
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
        handleAfterSaveQuote()
      })
  }

  const updateUseState = (quote: Quote, newState: boolean) => {
    if (quote.parentQuote) {
      if (newState) {
        setUsingQuoteChild(quote.id)

        return
      }

      setUsingQuoteChild(undefined)

      return
    }

    setUsingQuoteState(newState)
  }

  const handleUseQuote = (quote: Quote) => {
    updateUseState(quote, true)
    const { id: _id } = quote
    const variables = {
      id: _id,
      orderFormId: orderFormState,
    }

    mutationUseQuote({
      variables,
    })
      .catch((error) => {
        console.error(error)
        toastMessage(quoteMessages.useError)
        updateUseState(quote, false)
      })
      .then(() => {
        const metricsParam: UseQuoteMetricsParams = {
          quoteState: quote,
          orderFormId: variables.orderFormId,
          account,
          sessionResponse,
        }

        sendUseQuoteMetric(metricsParam)
        goToCheckout(checkoutUrl)
        updateUseState(quote, false)
      })
  }

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
        handleAfterSaveQuote()
      })
  }

  const handleUpdateSellingPrice: (
    id: string
  ) => ChangeEventHandler<HTMLInputElement> = (itemId) => (event) => {
    const newItems = quoteState.items.map((item: QuoteItem) => {
      if (item.id === itemId) {
        let newPrice = ((event.target.value as unknown) as number) * 100

        if (newPrice > item.price) {
          newPrice = item.price
        }

        return {
          ...item,
          sellingPrice: newPrice,
          error:
            !newPrice || newPrice / item.price < (100 - maxDiscountState) / 100
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
        const newSellingPrice = Math.round(item.price * ((100 - percent) / 100))

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

  /**
   * effects
   */
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
      (sum: number, item: QuoteItem) => sum + item.price * item.quantity,
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

    const maxDiscountPercentage =
      ruleCollection.find(
        (collection: any) =>
          collection?.trigger?.effect?.description === 'DenyEffect'
      )?.trigger?.condition?.greatherThan ?? MAX_DISCOUNT_PERCENTAGE

    setMaxDiscountState(maxDiscountPercentage)
  }, [orderAuthData])

  useEffect(() => {
    if (!data?.getQuote) return

    const {
      getQuote: {
        id: _id,
        costCenter,
        costCenterName,
        creationDate,
        creatorEmail,
        creatorRole,
        expirationDate: _expirationDate,
        items: _items,
        lastUpdate,
        organization,
        organizationName,
        referenceName,
        status: _status,
        subtotal,
        updateHistory,
        viewedByCustomer,
        viewedBySales,
        hasChildren,
      },
    } = data

    setUpdatingSubtotal(subtotal)
    setQuoteState({
      id: _id,
      costCenter,
      costCenterName,
      creationDate,
      creatorEmail,
      creatorRole,
      expirationDate: _expirationDate,
      items: _items,
      lastUpdate,
      organization,
      organizationName,
      referenceName,
      status: _status,
      subtotal,
      updateHistory,
      viewedByCustomer,
      viewedBySales,
      hasChildren,
    })

    if (
      _status === Status.PENDING ||
      _status === Status.READY ||
      _status === Status.REVISED
    ) {
      setEditable()
    }
  }, [data, setEditable])

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
  }, [isNewQuote, orderFormData, setEditable])

  if (sessionResponse) {
    isAuthenticated =
      sessionResponse?.namespaces?.profile?.isAuthenticated?.value === 'true'

    localStore.setItem(
      'b2bquotes_isAuthenticated',
      JSON.stringify(isAuthenticated)
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
      <QuoteDetailsNotAuthenticated
        isNewQuote={isNewQuote}
        permissionsLoading={permissionsLoading}
        isAuthenticated={isAuthenticated}
        onLinkClick={() => {
          navigate({
            page: 'store.b2b-quotes',
          })
        }}
      />
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
                if (parentQuote && query?.parent !== undefined) {
                  navigate({
                    page: 'store.b2b-quote-details',
                    params: { id: parentQuote },
                  })
                } else {
                  navigate({
                    page: 'store.b2b-quotes',
                  })
                }
              }}
            />
          }
        >
          <PageBlock>
            {loading || childrenQuotesLoading || checkSellerQuotesLoading ? (
              <Spinner />
            ) : (
              <Fragment>
                <AlertMessage quoteState={quoteState} noteState={noteState} />

                <div className="flex flex-column pl5">
                  <div className="mb5 flex flex-column-s flex-row-l justify-between items-center">
                    <QuoteName
                      childrenQuantity={childrenQuantity}
                      sellerName={sellerName || seller}
                      isNewQuote={isNewQuote}
                      quoteState={quoteState}
                      setQuoteState={setQuoteState}
                      formState={formState}
                      onChange={(e: any) => {
                        setQuoteState({
                          ...quoteState,
                          referenceName: e.target.value,
                        })
                      }}
                    />

                    <div className="nowrap">
                      <SaveButtons
                        isNewQuote={isNewQuote}
                        updatingQuoteState={updatingQuoteState}
                        sentToSalesRep={sentToSalesRep}
                        quoteState={quoteState}
                        onSaveForLater={() => {
                          createQuote(false)
                        }}
                        onSaveQuote={() => {
                          if (isNewQuote) {
                            createQuote(!isSalesRep)
                          } else {
                            handleSaveQuote()
                          }
                        }}
                        quoteItems={items}
                        expirationDate={expirationDate}
                        noteState={noteState}
                        isSalesRep={isSalesRep}
                      />
                      {quoteDeclinable && (
                        <span className="mr4">
                          <Button
                            variation="danger"
                            onClick={() => handleDeclineQuote()}
                            disabled={
                              !formState.isEditable || updatingQuoteState
                            }
                          >
                            <FormattedMessage id="store/b2b-quotes.quote-details.decline" />
                          </Button>
                        </span>
                      )}

                      {quoteUsable && (
                        <span className="mr4">
                          <Button
                            variation="primary"
                            onClick={() => handleUseQuote(quoteState)}
                            isLoading={usingQuoteState}
                          >
                            <FormattedMessage id="store/b2b-quotes.quote-details.use-quote" />
                          </Button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {quoteState.hasChildren && !!childrenQuotes?.length ? (
                  childrenQuotes.map((quote: Quote) => (
                    <QuoteChildren
                      key={quote.id}
                      quote={quote}
                      isSalesRep={isSalesRep}
                      usingParentQuote={usingQuoteState}
                      usingQuoteChild={usingQuoteChild}
                      handleUseQuote={handleUseQuote}
                      permissions={permissions}
                    />
                  ))
                ) : (
                  <div className="pa5">
                    <QuoteTable
                      isNewQuote={isNewQuote}
                      quoteState={quoteState}
                      updatingSubtotal={updatingSubtotal}
                      originalSubtotal={originalSubtotal}
                      isSalesRep={isSalesRep}
                      formState={formState}
                      maxDiscountState={maxDiscountState}
                      discountState={discountState}
                      onUpdateSellingPrice={handleUpdateSellingPrice}
                      onUpdateQuantity={handleUpdateQuantity}
                      checkedSellers={checkedSellers}
                    />
                    {formState.isEditable && isSalesRep && (
                      <div className="mt3">
                        <h3 className="t-heading-4 mb4">
                          <FormattedMessage id="store/b2b-quotes.quote-details.apply-discount.title" />
                        </h3>
                        <div className="pa5">
                          <PercentageDiscount
                            updatingSubtotal={updatingSubtotal}
                            originalSubtotal={originalSubtotal}
                            maxDiscountState={maxDiscountState}
                            discountState={discountState}
                            handlePercentageDiscount={handlePercentageDiscount}
                          />
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

                    <QuoteUpdateHistory
                      updateHistory={quoteState.updateHistory}
                    />

                    {formState.canAddNotes && (
                      <div className="mt3 pa5">
                        <Textarea
                          label={formatMessage(quoteMessages.addNote)}
                          value={noteState}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
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

                    {isNewQuote && !formState.canAddNotes && (
                      <div className="mt3 pa5">
                        <Alert type="warning">
                          {formatMessage(
                            quoteMessages.notesAfterCreatedHelpText
                          )}
                        </Alert>
                      </div>
                    )}
                  </div>
                )}
              </Fragment>
            )}
          </PageBlock>
        </Layout>
      </div>
    </Layout>
  )
}

export default QuoteDetails
