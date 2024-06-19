import React, { Fragment, useEffect, useState } from 'react'
import { Modal, Button } from 'vtex.styleguide'
import { defineMessages, useIntl } from 'react-intl'
import { useRuntime } from 'vtex.render-runtime'
import { useCheckoutURL } from 'vtex.checkout-resources/Utils'
import { useMutation, useQuery } from 'react-apollo'
import { OrderForm } from 'vtex.order-manager'

import CLEAR_CART from '../graphql/clearCartMutation.graphql'
import GET_ORDERFORM from '../graphql/orderForm.gql'
import ORDERFORM_CUSTOM_DATA from '../graphql/setOrderFormCustomData.graphql'

const storePrefix = 'store/b2b-quotes.'

const messages = defineMessages({
  title: {
    id: `${storePrefix}quote-locking.title`,
  },
  message: {
    id: `${storePrefix}quote-locking.message`,
  },
  returnToCheckout: {
    id: `${storePrefix}quote-locking.return-to-checkout`,
  },
  clearCart: {
    id: `${storePrefix}quote-locking.clear-cart`,
  },
})

const useCheckout = () => {
  const { url: checkoutUrl, major } = useCheckoutURL()
  const { navigate, rootPath = '' } = useRuntime()

  const goToCheckout = (url: string) => {
    if (major > 0 && url === checkoutUrl) {
      navigate({ to: url })
    } else {
      window.location.href = `${rootPath}${url}`
    }
  }

  return goToCheckout
}

const B2BQuotesLockingModal = () => {
  const { formatMessage } = useIntl()
  const [open, setOpen] = useState(false)
  const goToCheckout = useCheckout()
  const { url: checkoutUrl } = useCheckoutURL()
  const [clearCart] = useMutation(CLEAR_CART)
  const [setOrderFormCustomData] = useMutation(ORDERFORM_CUSTOM_DATA)
  const [loading, setLoading] = useState(false)
  const { setOrderForm }: OrderFormContext = OrderForm.useOrderForm()
  const { data: orderFormData } = useQuery(GET_ORDERFORM, {
    ssr: false,
    fetchPolicy: 'network-only',
  })

  const handleClearCart = async () => {
    setLoading(true)
    const { orderForm } = orderFormData
    const { orderFormId } = orderForm

    try {
      await clearCart({
        variables: {
          orderFormId,
        },
      })
      await setOrderFormCustomData({
        variables: {
          orderFormId,
          appId: 'b2b-quotes-graphql',
          value: 0,
          field: 'quoteId',
        },
      })
    } catch (e) {
      console.error(e)
    }

    setLoading(false)
    setOpen(false)
    setOrderForm({
      ...orderForm,
      items: [],
    })
  }

  const handleReturnToCheckout = () => {
    setOpen(false)
    goToCheckout(checkoutUrl)
  }

  useEffect(() => {
    if (!orderFormData) {
      return
    }

    const { orderForm } = orderFormData
    const { customData, items } = orderForm

    if (
      !customData?.customApps ||
      !customData?.customApps.some(
        (item: any) => item.id === 'b2b-quotes-graphql'
      )
    ) {
      return
    }

    const index = customData.customApps.findIndex((item: any) => {
      return item.id === 'b2b-quotes-graphql'
    })

    const { quoteId } = customData.customApps[index].fields

    if (
      index !== -1 &&
      quoteId &&
      parseInt(quoteId, 10) !== 0 &&
      items?.length > 0
    ) {
      setOpen(true)
    }
  }, [orderFormData])

  return (
    <Fragment>
      {open && (
        <Modal
          onClose={() => handleClearCart()}
          closeOnEsc={false}
          showCloseButton={false}
          closeOnOverlayClick={false}
          isOpen={open}
          showCloseIcon={false}
          bottomBar={
            <div className="flex-s w-100-s items-center-s flex-column-s flex-column-reverse-s justify-end-m flex-row-m">
              <span className="mr4 ">
                <Button
                  isLoading={loading}
                  variation="tertiary"
                  onClick={handleClearCart}
                >
                  {formatMessage(messages.clearCart)}
                </Button>
              </span>
              <span>
                <Button
                  disabled={loading}
                  variation="primary"
                  onClick={handleReturnToCheckout}
                >
                  {formatMessage(messages.returnToCheckout)}
                </Button>
              </span>
            </div>
          }
        >
          <div>
            <h1>{formatMessage(messages.title)}</h1>
            <p>{formatMessage(messages.message)}</p>
          </div>
        </Modal>
      )}
    </Fragment>
  )
}

export default B2BQuotesLockingModal
