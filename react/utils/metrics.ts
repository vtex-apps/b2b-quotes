import axios from 'axios'

const ANALYTICS_URL = 'https://rc.vtex.com/api/analytics/schemaless-events'

const GRAPHQL_URL = (accountName: string, workspace?: string) => {
  if (workspace) {
    return `https://${workspace}--${accountName}.myvtex.com/_v/private/graphql/v1`
  }

  return `https://${accountName}.myvtex.com/_v/private/graphql/v1`
}

type Metric = {
  name: 'b2b-suite-buyerorg-data'
  kind: 'create-quote-ui-event'
  description: 'Create Quotation Action - UI'
  account: string
}

type QuoteFieldsMetric = {
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
}

type SessionResponse = {
  namespaces: {
    profile: SessionProfile
  }
}

type MetricsParam = {
  quoteId: string
  sessionResponse: SessionResponse
  workspace: string
  account: string
  sendToSalesRep: boolean
}

type QuoteMetric = Metric & { fields: QuoteFieldsMetric }

const fetchMetricsData = async (
  accountName: string,
  workspace: string,
  quoteId: string,
  userEmail: string
) => {
  const query = JSON.stringify({
    query: `query GetMetricsData($id: String, $email: String!) {
      getQuote(id: $id) @context(provider: "vtex.b2b-quotes-graphql") {
        organization
        organizationName
        costCenterName
        referenceName
        creatorRole
        creationDate
      },
      getUserByEmail(email: $email) @context(provider: "vtex.storefront-permissions") {
        costId
    }
  }`,
    variables: { id: quoteId, email: userEmail },
  })

  const { data, errors } = (
    await axios.post(GRAPHQL_URL(accountName, workspace), query)
  ).data

  if (errors) {
    console.error('Graphql errors', errors)
    throw new Error('Graphql Errors when trying get quote and user data')
  }

  const quoteResult = data?.getQuote as Omit<QuoteMetricsData, 'costId'>
  const costId = (data?.getUserByEmail?.[0].costId ?? '') as string

  return {
    ...quoteResult,
    costId,
  }
}

const buildQuoteMetric = async (
  metricsParam: MetricsParam
): Promise<QuoteMetric> => {
  const { namespaces } = metricsParam.sessionResponse
  const userEmail = namespaces?.profile?.email?.value

  const metricsData = await fetchMetricsData(
    metricsParam.account,
    metricsParam.workspace,
    metricsParam.quoteId,
    userEmail
  )

  const metric: QuoteMetric = {
    name: 'b2b-suite-buyerorg-data',
    kind: 'create-quote-ui-event',
    description: 'Create Quotation Action - UI',
    account: metricsParam.account,
    fields: {
      buy_org_id: metricsData.organization,
      buy_org_name: metricsData.organizationName,
      cost_center_id: metricsData.costId,
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
  costId: string
  costCenterName: string
  referenceName: string // quote reference name
  creatorRole: string
  creationDate: string
}

export const sendMetric = async (metricsParam: MetricsParam) => {
  try {
    const metric = await buildQuoteMetric(metricsParam)

    await axios.post(ANALYTICS_URL, metric)
  } catch (error) {
    console.warn('Unable to log metrics', error)
  }
}
