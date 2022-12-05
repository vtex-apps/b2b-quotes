/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback } from 'react'
import { useQuery } from 'react-apollo'
import { useIntl } from 'react-intl'
import { AutocompleteInput } from 'vtex.styleguide'

import { tableMessages } from '../utils/messages'
import GET_ORGANIZATIONS from '../graphql/getOrganizations.graphql'
import GET_ORGANIZATION_BY_ID from '../graphql/getOrganization.graphql'
import GET_COSTCENTERS_BY_ORGANIZATION_ID from '../graphql/getCostCentersByOrganizationId.graphql'
import GET_COSTCENTER_BY_ID from '../graphql/getCostCenter.graphql'

const initialState = {
  search: '',
  page: 1,
  pageSize: 25,
  sortOrder: 'ASC',
  sortedBy: 'name',
}

export interface OrgAndCC {
  organizationId: string
  costCenterId: string
}

interface Value {
  value: string | null
  label: string
}

interface OrganizationOrCostCenter {
  id: string
  name: string
}

interface Props {
  onChange: (value: OrgAndCC) => void
  showOrganizationFilter: boolean
  organizationId: string
  costCenterId: string
}

interface OrgProps {
  onChange: (value: string) => void
  organizationId: string
}

interface CCProps {
  onChange: (value: string) => void
  organizationId: string
  costCenterId: string
}

const mapOrgOrCostCenter = (item: OrganizationOrCostCenter) => {
  return {
    value: item.id,
    label: item.name,
  }
}

const OrganizationsAutocomplete = ({ onChange, organizationId }: OrgProps) => {
  const { formatMessage } = useIntl()
  const [term, setTerm] = useState('')
  const [values, setValues] = useState([] as Value[])
  const { data, loading, refetch } = useQuery(GET_ORGANIZATIONS, {
    variables: { ...initialState, status: ['active', 'on-hold', 'inactive'] },
    ssr: false,
    notifyOnNetworkStatusChange: true,
  })

  const { data: organization } = useQuery(GET_ORGANIZATION_BY_ID, {
    variables: { id: organizationId },
    ssr: false,
    fetchPolicy: 'network-only',
    skip: !organizationId,
    notifyOnNetworkStatusChange: true,
  })

  useEffect(() => {
    if (organization?.getOrganizationById) {
      setValues([mapOrgOrCostCenter(organization.getOrganizationById)])
    }
  }, [organization])

  useEffect(() => {
    if (data?.getOrganizations?.data) {
      setValues(
        data.getOrganizations.data.map((item: OrganizationOrCostCenter) =>
          mapOrgOrCostCenter(item)
        )
      )
    }
  }, [data])

  useEffect(() => {
    if (term && term.length > 2) {
      refetch({
        ...initialState,
        status: ['active', 'on-hold', 'inactive'],
        search: term,
      })
    } else if (term === '') {
      onChange('')
    }
  }, [term, onChange, refetch])

  const options = {
    onSelect: (value: Value) => {
      setTerm(value.label ?? '')
      onChange(value.value ?? '')
    },
    loading,
    value: values,
  }

  const input = {
    onChange: (_term: string) => {
      setTerm(_term)
    },
    onClear: () => onChange(''),
    placeholder: formatMessage(tableMessages.searchOrganization),
    value: term,
  }

  return <AutocompleteInput input={input} options={options} />
}

const CostCentersAutocomplete = ({
  onChange,
  organizationId,
  costCenterId,
}: CCProps) => {
  const { formatMessage } = useIntl()
  const [term, setTerm] = useState('')
  const [values, setValues] = useState([] as Value[])
  const { data, loading, refetch } = useQuery(
    GET_COSTCENTERS_BY_ORGANIZATION_ID,
    {
      variables: { ...initialState, id: organizationId },
      ssr: false,
      notifyOnNetworkStatusChange: true,
    }
  )

  const { data: costCenter } = useQuery(GET_COSTCENTER_BY_ID, {
    variables: { id: costCenterId },
    ssr: false,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  })

  const options = {
    onSelect: (value: Value) => onChange(value.value ?? ''),
    loading,
    value: values,
  }

  const onClear = useCallback(() => {
    setTerm('')
    onChange('')
  }, [setTerm, onChange])

  useEffect(() => {
    if (!organizationId) return

    refetch({
      ...initialState,
      id: organizationId,
    })
  }, [organizationId, refetch])

  useEffect(() => {
    if (!costCenter) {
      return
    }

    const { name, id } = costCenter.getCostCenterById

    setTerm(name)
    onChange(id)
  }, [costCenter])

  useEffect(() => {
    if (data?.getCostCentersByOrganizationId?.data) {
      setValues(
        data.getCostCentersByOrganizationId.data.map(
          (item: OrganizationOrCostCenter) => mapOrgOrCostCenter(item)
        )
      )
    }
  }, [data])

  useEffect(() => {
    if (term && term.length > 2) {
      refetch({
        ...initialState,
        id: organizationId,
        search: term,
      })
    } else if (term === '') {
      onClear()
    }
  }, [term, organizationId, refetch])

  const input = {
    onChange: (_term: string) => {
      setTerm(_term)
    },
    onClear,
    placeholder: formatMessage(tableMessages.searchCostCenter),
    value: term,
  }

  if (!organizationId) return null

  return <AutocompleteInput input={input} options={options} />
}

const OrganizationAndCostCenterFilter = ({
  onChange,
  showOrganizationFilter = false,
  organizationId,
  costCenterId,
}: Props) => {
  const [orgState, setOrgState] = useState(organizationId)
  const [costCenterState, setCostCenterState] = useState(costCenterId)

  const onChangeOrganization = useCallback((value: string) => {
    setOrgState(value)
    setCostCenterState('')
  }, [])

  const onChangeCostCenter = useCallback(
    (value: string) => {
      onChange({ organizationId: orgState, costCenterId: value })
    },
    [orgState, onChange]
  )

  return (
    <div>
      {showOrganizationFilter && (
        <OrganizationsAutocomplete
          onChange={onChangeOrganization}
          organizationId={organizationId}
        />
      )}
      <CostCentersAutocomplete
        onChange={onChangeCostCenter}
        organizationId={orgState}
        costCenterId={costCenterState}
      />
    </div>
  )
}

export default OrganizationAndCostCenterFilter
