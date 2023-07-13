import axios from 'axios'

const ANALYTICS_URL = 'https://rc.vtex.com/api/analytics/schemaless-events'

export type UserData = {
  id: string
  canImpersonate: boolean
  orgId: string
  clId: string
  costId: string
  roleId: string
}

export type MetricsParam = {
  sessionProfile: SessionProfile
  accountName: string
  userData: UserData
  costCenterName: string
  buyOrgName: string
  quoteId: string
  quoteReferenceName: string
}

type Metric = {
  name: 'b2b-suite-buyerorg-data'
  kind: 'create-quote-ui-event'
  description: 'Create Quotation Action - UI'
  account: string
}

type QuoteFieldsMetric = {
  org_id: string
  cost_center_id: string
  cost_center_name: string
  buy_org_id: string
  buy_org_name: string
  member_id: string
  member_email: string
  role: string
  creation_date: string
  quote_id: string
  quote_reference_name: string
  send_to_sales_rep: boolean
}

export type SessionProfile = {
  id: { value: string }
  email: { value: string }

  firstName?: string
  lastName?: string
}

export type QuoteMetric = Metric & { fields: QuoteFieldsMetric }

export const buildQuoteMetric = (
  sendToSalesRep: boolean,
  metricsParam: MetricsParam
): QuoteMetric => {
  const metric: QuoteMetric = {
    name: 'b2b-suite-buyerorg-data',
    kind: 'create-quote-ui-event',
    description: 'Create Quotation Action - UI',
    account: metricsParam.accountName,
    fields: {
      org_id: metricsParam.userData?.orgId,
      cost_center_id: metricsParam.userData?.costId,
      cost_center_name: metricsParam.costCenterName,
      buy_org_id: metricsParam.userData.orgId,
      buy_org_name: metricsParam.buyOrgName,
      member_id: metricsParam.sessionProfile?.id?.value,
      member_email: metricsParam.sessionProfile?.email.value,
      role: metricsParam.userData?.roleId,
      creation_date: new Date().toISOString(),
      quote_id: metricsParam.quoteId,
      quote_reference_name: metricsParam.quoteReferenceName,
      send_to_sales_rep: sendToSalesRep,
    },
  }

  return metric
}

export const sendMetric = async (
  sendToSalesRep: boolean,
  metricsParam: MetricsParam
) => {
  try {
    const metric = buildQuoteMetric(sendToSalesRep, metricsParam)

    axios.post(ANALYTICS_URL, metric)
  } catch (error) {
    console.error('Unable to log metrics', error)
  }
}
