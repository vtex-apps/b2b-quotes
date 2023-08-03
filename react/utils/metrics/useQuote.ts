import type { Metric, SessionResponse } from './metrics'
import { sendMetric } from './metrics'

type UseQuoteFieldsMetric = {
  quote_id: string
  quote_reference_name: string
  order_form_id: string
  quote_creation_date: string
  quote_use_date: string
  creator_email: string
  user_email: string
  cost_center_name: string
  buyer_org_id: string
  buyer_org_name: string
  quote_last_update: string
}

type UseQuoteMetric = Metric & { fields: UseQuoteFieldsMetric }

export type UseQuoteMetricsParams = {
  quoteState: Quote
  orderFormId: string
  account: string
  sessionResponse: SessionResponse
}

const buildUseQuoteMetric = (
  metricsParam: UseQuoteMetricsParams
): UseQuoteMetric => {
  const { quoteState, orderFormId, account, sessionResponse } = metricsParam

  const metric: UseQuoteMetric = {
    name: 'b2b-suite-buyerorg-data',
    kind: 'use-quote-ui-event',
    description: 'Use Quotation Action - UI',
    account,
    fields: {
      buyer_org_id: quoteState.organization,
      buyer_org_name: quoteState.organizationName,
      cost_center_name: quoteState.costCenterName,
      quote_id: quoteState.id,
      quote_reference_name: quoteState.referenceName,
      order_form_id: orderFormId,
      quote_creation_date: quoteState.creationDate,
      quote_use_date: new Date().toISOString(),
      creator_email: quoteState.creatorEmail,
      user_email: sessionResponse.namespaces?.profile?.email?.value,
      quote_last_update: quoteState.lastUpdate,
    },
  }

  return metric
}

export const sendUseQuoteMetric = async (
  metricsParam: UseQuoteMetricsParams
) => {
  try {
    const metric = buildUseQuoteMetric(metricsParam)

    await sendMetric(metric)
  } catch (error) {
    console.warn('Unable to log metrics', error)
  }
}
