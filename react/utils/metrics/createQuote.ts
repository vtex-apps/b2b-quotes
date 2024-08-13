import axios from 'axios'

import type { Metric, SessionResponse } from './metrics'
import { sendMetric } from './metrics'

const GRAPHQL_URL = (accountName: string, workspace?: string) => {
  if (workspace) {
    return `https://${workspace}--${accountName}.myvtex.com/_v/private/graphql/v1`
  }

  return `https://${accountName}.myvtex.com/_v/private/graphql/v1`
}

type CreateQuoteFieldsMetric = {
  cost_center_name: string
  buyer_org_id: string
  buyer_org_name: string
  member_id: string
  member_email: string
  role: string
  creation_date: string
  quote_id: string
  quote_reference_name: string
  send_to_sales_rep: boolean
}

type CreateQuoteMetricsParam = {
  quoteId: string
  sessionResponse: SessionResponse
  workspace: string
  account: string
  sendToSalesRep: boolean
}

type CreateQuoteMetric = Metric & { fields: CreateQuoteFieldsMetric }

const fetchMetricsData = async (
  accountName: string,
  workspace: string,
  quoteId: string
) => {
  const query = JSON.stringify({
    query: `query GetMetricsData($id: String) {
      getQuote(id: $id) @context(provider: "vtex.b2b-quotes-graphql") {
        organization
        organizationName
        costCenterName
        referenceName
        creatorRole
        creationDate
      }
    }`,
    variables: { id: quoteId },
  })

  const { data, errors } = (
    await axios.post(GRAPHQL_URL(accountName, workspace), query)
  ).data

  if (errors) {
    console.error('Graphql errors', errors)
    throw new Error('Graphql Errors when trying get quote and user data')
  }

  return data?.getQuote as QuoteMetricsData
}

const buildCreateQuoteMetric = async (
  metricsParam: CreateQuoteMetricsParam
): Promise<CreateQuoteMetric> => {
  const { namespaces } = metricsParam.sessionResponse
  const userEmail = namespaces?.profile?.email?.value

  const metricsData = await fetchMetricsData(
    metricsParam.account,
    metricsParam.workspace,
    metricsParam.quoteId
  )

  const metric: CreateQuoteMetric = {
    name: 'b2b-suite-buyerorg-data',
    kind: 'create-quote-ui-event',
    description: 'Create Quotation Action - UI',
    account: metricsParam.account,
    fields: {
      buyer_org_id: metricsData.organization,
      buyer_org_name: metricsData.organizationName,
      cost_center_name: metricsData.costCenterName,
      member_id: namespaces?.profile?.id?.value,
      member_email: userEmail,
      role: metricsData.creatorRole,
      creation_date: metricsData.creationDate,
      quote_id: metricsParam.quoteId,
      quote_reference_name: metricsData.referenceName,
      send_to_sales_rep: metricsParam.sendToSalesRep,
    },
  }

  return metric
}

type QuoteMetricsData = {
  organization: string // organizationId
  organizationName: string
  costCenterName: string
  referenceName: string // quote reference name
  creatorRole: string
  creationDate: string
}

export const sendCreateQuoteMetric = async (
  metricsParam: CreateQuoteMetricsParam
) => {
  try {
    const metric = await buildCreateQuoteMetric(metricsParam)

    await sendMetric(metric)
  } catch (error) {
    console.warn('Unable to log metrics', error)
  }
}
