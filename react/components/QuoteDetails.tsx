/* eslint-disable react/display-name */
import type { FunctionComponent, ChangeEventHandler } from 'react'
import React, { useState, useEffect, Fragment } from 'react'
import { useIntl, defineMessages, FormattedMessage } from 'react-intl'
import { useQuery, useMutation } from 'react-apollo'
import { useRuntime } from 'vtex.render-runtime'
import {
  Layout,
  PageHeader,
  PageBlock,
  Button,
  Table,
  Card,
  Slider,
  Tag,
  Textarea,
  Input,
  InputCurrency,
} from 'vtex.styleguide'
import { formatCurrency, FormattedCurrency } from 'vtex.format-currency'
import { useOrderForm } from 'vtex.order-manager/OrderForm'
import { useCheckoutURL } from 'vtex.checkout-resources/Utils'

import { arrayShallowEqual } from '../utils/shallowEquals'
import useCheckout from '../modules/checkoutHook'
import { labelTypeByStatusMap } from './QuotesTable'
import GET_PERMISSIONS from '../graphql/getPermissions.graphql'
import GET_QUOTE from '../graphql/getQuote.graphql'
import UPDATE_QUOTE from '../graphql/updateQuote.graphql'
import USE_QUOTE from '../graphql/useQuote.graphql'
import GET_AUTH_RULES from '../graphql/getDimension.graphql'

const storePrefix = 'store/b2b-quotes.'

const messages = defineMessages({
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
})

const QuoteDetails: FunctionComponent = () => {
  const {
    culture,
    culture: { currency: currencyCode, locale },
    route: { params },
    navigate,
  } = useRuntime()

  const intl = useIntl()
  const { formatMessage, formatDate } = intl
  const { url: checkoutUrl } = useCheckoutURL()
  const goToCheckout = useCheckout()

  const { orderForm } = useOrderForm()
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

  const [noteState, setNoteState] = useState('')

  const [discountState, setDiscountState] = useState(0)
  const [quoteError, setQuoteError] = useState('')
  const [updatingQuoteState, setUpdatingQuoteState] = useState(false)
  const [usingQuoteState, setUsingQuoteState] = useState(false)

  const { data } = useQuery(GET_QUOTE, {
    variables: { id: params?.id },
    ssr: false,
    skip: !params?.id,
  })

  const { data: orderAuthData } = useQuery(GET_AUTH_RULES, { ssr: false })
  const { data: permissionsData } = useQuery(GET_PERMISSIONS, { ssr: false })
  const {
    permissions = [],
  } = permissionsData?.checkUserPermissions?.permissions

  const isSalesRep = permissions.some(
    (permission: string) => permission.indexOf('edit-quotes') >= 0
  )

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(orderAuthData)
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
    setQuoteError('')
    const { id, items, subtotal } = quoteState

    updateQuote({
      variables: {
        id,
        items,
        subtotal,
        note: '',
        decline: false,
      },
    })
      .catch((error) => {
        console.error(error)
        setQuoteError(formatMessage(messages.updateError))
        setUpdatingQuoteState(false)
      })
      .then(() => {
        setUpdatingQuoteState(false)
      })
  }

  const handleUseQuote = () => {
    setUsingQuoteState(true)
    setQuoteError('')
    const { id } = quoteState
    const variables = {
      id,
      orderFormId: orderForm.id,
    }

    mutationUseQuote({
      variables,
    })
      .catch((error) => {
        console.error(error)
        setQuoteError(formatMessage(messages.useError))
        setUsingQuoteState(false)
      })
      .then(() => {
        goToCheckout(checkoutUrl)
        setUsingQuoteState(false)
      })
  }

  if (!data?.getQuote) return null

  const {
    getQuote: { subtotal, items, id },
  } = data

  const handleDeclineQuote = () => {
    // use data from original graphQL query, not from state
    updateQuote({
      variables: {
        id,
        items,
        subtotal,
        note: '',
        decline: true,
      },
    })
  }

  const handleUpdateSellingPrice: (
    id: string
  ) => ChangeEventHandler<HTMLInputElement> = (itemId) => (event) => {
    let newSubtotal = 0
    const newItems = quoteState.items.map((item: QuoteItem) => {
      if (item.id === itemId) {
        newSubtotal += +event.target.value * item.quantity * 100

        return {
          ...item,
          sellingPrice: ((event.target.value as unknown) as number) * 100,
        }
      }

      newSubtotal += item.sellingPrice * item.quantity

      return item
    })

    setQuoteState({
      ...quoteState,
      items: newItems,
      subtotal: newSubtotal,
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
      const newSellingPrice = item.sellingPrice * ((100 - percent) / 100)

      newSubtotal += newSellingPrice * item.quantity

      newItems.push({ ...item, sellingPrice: newSellingPrice })
    })

    setQuoteState({
      ...quoteState,
      items: newItems,
      subtotal: newSubtotal,
    })
  }

  return (
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
        >
          {quoteError && <div className="mb3 danger">{quoteError}</div>}
          <div className="nowrap">
            {isSalesRep ||
              (permissions.includes('decline-quotes') && (
                <span className="mr4">
                  <Button
                    variation="danger"
                    onClick={() => handleDeclineQuote()}
                    loading={updatingQuoteState}
                    disabled={!formState.isEditable}
                  >
                    <FormattedMessage id="store/b2b-quotes.quote-details.decline" />
                  </Button>
                </span>
              ))}
            <span>
              <Button
                variation="primary"
                onClick={() => handleSaveQuote()}
                loading={updatingQuoteState}
                disabled={
                  quoteState.items.length &&
                  noteState === '' &&
                  arrayShallowEqual(items, quoteState.items)
                }
              >
                {isSalesRep ? (
                  <FormattedMessage id="store/b2b-quotes.quote-details.save" />
                ) : (
                  <FormattedMessage id="store/b2b-quotes.quote-details.submit-to-sales-rep" />
                )}
              </Button>
            </span>
            {permissions.includes('use-quotes') && (
              <span className="mr4">
                <Button
                  variation="primary"
                  onClick={() => handleUseQuote()}
                  loading={usingQuoteState}
                >
                  <FormattedMessage id="store/b2b-quotes.quote-details.use-quote" />
                </Button>
              </span>
            )}
          </div>
        </PageHeader>
      }
    >
      <PageBlock>
        <div className="pa5">
          <Table
            totalizers={[
              {
                label: formatMessage(messages.subtotal),
                value: formatPrice(quoteState.subtotal),
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
            disableHeader
            fullWidth
            schema={{
              properties: {
                imageUrl: {
                  title: formatMessage(messages.image),
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
                      <div>
                        <span>{rowData.name}</span>
                        {rowData.skuName !== rowData.name && (
                          <Fragment>
                            <br />
                            <span className="t-mini">{rowData.skuName}</span>
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
                  width: 200,
                  cellRenderer: ({
                    cellData: sellingPrice,
                    rowData: { id: itemId },
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
                            (rowData.sellingPrice * rowData.quantity) / 100
                          }
                        />
                      </span>
                    )
                  },
                  width: 150,
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
              <Slider
                onChange={([value]: [number]) => {
                  handlePercentageDiscount(value)
                }}
                min={0}
                max={100}
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
                    <p>
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
                          status: update.status,
                          index,
                        }}
                      />
                    </p>
                    <p>
                      <b>
                        <FormattedMessage id="store/b2b-quotes.quote-details.update-history.notes" />
                      </b>
                      <br />
                      {update.note}
                    </p>
                  </Card>
                </div>
              )
            })}
          </div>
          {formState.isEditable && (
            <div className="mt3">
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
          {
            // TODO: Do not allow discount that would not pass order authorization rules
          }
        </div>
      </PageBlock>
    </Layout>
  )
}

export default QuoteDetails
