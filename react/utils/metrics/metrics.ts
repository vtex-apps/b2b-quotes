import axios from 'axios'

const ANALYTICS_URL = 'https://rc.vtex.com/api/analytics/schemaless-events'

type CreateQuoteMetric = {
  kind: 'create-quote-ui-event'
  description: 'Create Quotation Action - UI'
}

type UseQuoteMetric = {
  kind: 'use-quote-ui-event'
  description: 'Use Quotation Action - UI'
}

export type Metric = {
  name: 'b2b-suite-buyerorg-data'
  account: string
} & (CreateQuoteMetric | UseQuoteMetric)

export type SessionProfile = {
  id: { value: string }
  email: { value: string }
}

export type SessionResponse = {
  namespaces: {
    profile: SessionProfile
  }
}

export const sendMetric = async (metric: Metric) => {
  try {
    await axios.post(ANALYTICS_URL, metric)
  } catch (error) {
    console.warn('Unable to log metrics', error)
  }
}
