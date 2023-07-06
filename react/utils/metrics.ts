import axios from 'axios'

const ANALYTICS_URL = 'https://rc.vtex.com/api/analytics/schemaless-events'

type Metric = {
  name: 'b2b-suite-buyerorg-data'
  kind: 'event'
  description: 'Create Quotation Action - UI'
  account: string
}

type QuotationFieldsMetric = {
  orgId: string
  costId: string
  buyerOrg: string
  memberId: string
  memberEmail: string
  memberName: string
  roleId: string
  creationDate: string
  quotationId: string
  sendToSalesRep: boolean
}

export type SessionProfile = {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

export type QuotenMetric = Metric & { fields: QuotationFieldsMetric }

export const buildQuoteMetric = (
  sessionProfile: SessionProfile,
  quoteId: string
): QuotenMetric => {
  return null
  // const metric: QuotenMetric = {
  //     name: 'b2b-suite-buyerorg-data',
  //     kind: 'event',
  //     description: 'Create Quotation Action - UI',
  //     account: ,
  //     fields: {
  //       orgId: ,
  //       costId: ,
  //       buyerOrg: ,
  //       memberId: sessionProfile.id,
  //       memberEmail: sessionProfile.email,
  //       memberName: `${sessionProfile.firstName} ${sessionProfile.lastName}`,
  //       roleId: ,
  //       creationDate: (new Date()).toISOString(),
  //       quotationId: result.data.createQuote,
  //       sendToSalesRep
  //     }

  //   }
}

export const sendMetric = (sessionProfile: SessionProfile, quoteId: string) => {
  try {
    const metric = buildQuoteMetric(sessionProfile, quoteId)

    axios.post(ANALYTICS_URL, metric)
  } catch (error) {
    console.error('Unable to log metrics', error) // TODO-existe log no IO?
  }
}

// useQuery(GET_QUOTE, {
//     variables: { id: params?.id },
//     ssr: false,
//     skip: isNewQuote,
//   })

// {
//     "id": "a94efd50-1b76-11ee-83ab-0adc9b832d19",
//     "referenceName": "Tesdte",
//     "creatorEmail": "fernando.barros+sales.admin@vtex.com.br",
//     "creatorRole": "sales-admin",
//     "creationDate": "2023-07-05T20:58:20.208Z",
//     "organization": "d9e51195-0c39-11ed-835d-0ac601682b29",
//     "organizationName": "VTEX",
//     "costCenterName": "VTEX SP",
//     "__typename": "Quote"
//   }
