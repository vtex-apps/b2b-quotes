import axios from 'axios'
import { useQuery } from 'react-apollo'
import { useAdmin } from '@vtex/raccoon-next'

import GET_QUOTE from '../../graphql/getQuote.graphql'
import GET_COSTCENTERS_BY_ORGANIZATION_ID from '../graphql/getCostCentersByOrganizationId.graphql'
import GET_PERMISSIONS from '../../graphql/getPermissions.graphql'

const ANALYTICS_URL = 'https://rc.vtex.com/api/analytics/schemaless-events'

type Metric = {
  name: 'b2b-suite-buyerorg-data'
  kind: 'event'
  description: 'Create Quotation Action - UI'
  account: string
}

export type QuoteData = {
  id: string
  referenceName: string
  creatorEmail: string
  creatorRole: string
  creationDate: string
  organization: string // buyOrg id
  organizationName: string // buyOrg name
  costCenterName: string
}

type QuoteFieldsMetric = {
  orgId: string
  costCenterId: string
  costCenterName: string
  buyerOrgId: string
  buyerOrgName: string
  memberId: string
  memberEmail: string
  memberName: string
  roleId: string
  roleName: string
  creationDate: string
  quotationId: string
  quoteReferenceName: string
  sendToSalesRep: boolean
}

export type SessionProfile = {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

type CostCenter = {
  id: string
  name: string
}

type Role = {
  id: string
  name: string
}

export type QuoteMetric = Metric & { fields: QuoteFieldsMetric }

const getCostCenter = (
  buyOrgId: string,
  costCenterName: string
): CostCenter => {
  // const costCenters = useQuery(
  //   GET_COSTCENTERS_BY_ORGANIZATION_ID,
  //   {
  //     variables: { id: buyOrgId, search: costCenterName },
  //     ssr: false,
  //     notifyOnNetworkStatusChange: true,
  //   }
  // ).data as CostCenter[]

  // return costCenters?.[0]

  return {
    id: 'teste',
    name: 'teste',
  }
}

const getRole = (): Role => {
  // const role = useQuery(GET_PERMISSIONS, { ssr: false }).data as Role
  // return role
  return {
    id: 'teste',
    name: 'teste',
  }
}

export const buildQuoteMetric = (
  sendToSalesRep: boolean,
  sessionProfile: SessionProfile,
  quoteId: string,
  quote: QuoteData
): QuoteMetric => {
  // const quote = useQuery(GET_QUOTE, {
  //       variables: { id: quoteId }
  //     }).data as QuoteData

  const costCenter = getCostCenter(quote.organization, quote.costCenterName)
  const role = getRole()

  const metric: QuoteMetric = {
    name: 'b2b-suite-buyerorg-data',
    kind: 'event',
    description: 'Create Quotation Action - UI',
    account: 'TESTE', // useAdmin().account,
    fields: {
      orgId: quote.organization,
      costCenterId: costCenter.id,
      costCenterName: quote.costCenterName,
      buyerOrgId: quote.organization,
      buyerOrgName: quote.organizationName,
      memberId: sessionProfile.id,
      memberEmail: quote.creatorEmail,
      memberName: `${sessionProfile.firstName} ${sessionProfile.lastName}`,
      roleId: role.id,
      roleName: role.name,
      creationDate: new Date().toISOString(),
      quotationId: quoteId,
      quoteReferenceName: quote.referenceName,
      sendToSalesRep,
    },
  }

  return metric
}

export const sendMetric = (
  sendToSalesRep: boolean,
  sessionProfile: SessionProfile,
  quoteId: string
) => {
  try {
    const metric = buildQuoteMetric(sendToSalesRep, sessionProfile, quoteId)

    axios.post(ANALYTICS_URL, metric)
  } catch (error) {
    console.error('Unable to log metrics', error) // TODO-existe log no IO?
  }
}
