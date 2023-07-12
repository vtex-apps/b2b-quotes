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
  orgId: string
  costCenterId: string
  costCenterName: string
  buyOrgId: string
  buyOrgName: string
  memberId: string
  memberEmail: string
  memberName: string
  role: string
  creationDate: string
  quoteId: string
  quoteReferenceName: string
  sendToSalesRep: boolean
}

export type SessionProfile = {
  id: string
  email: string
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
      orgId: metricsParam.userData?.orgId,
      costCenterId: metricsParam.userData?.costId,
      costCenterName: metricsParam.costCenterName,
      buyOrgId: metricsParam.userData.orgId,
      buyOrgName: metricsParam.buyOrgName,
      memberId: metricsParam.sessionProfile?.id,
      memberEmail: metricsParam.sessionProfile?.email,
      memberName: `${metricsParam.sessionProfile.firstName} ${metricsParam.sessionProfile.lastName}`,
      role: metricsParam.userData?.roleId,
      creationDate: new Date().toISOString(),
      quoteId: metricsParam.quoteId,
      quoteReferenceName: metricsParam.quoteReferenceName,
      sendToSalesRep,
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
