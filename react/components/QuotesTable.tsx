/* eslint-disable react/display-name */
import type { FunctionComponent, ChangeEvent } from 'react'
import React from 'react'
import { PageBlock, Table, Tag, Checkbox } from 'vtex.styleguide'
import { useIntl } from 'react-intl'
import { FormattedCurrency } from 'vtex.format-currency'
import { useRuntime } from 'vtex.render-runtime'

import { tableMessages } from '../utils/messages'
import OrganizationAndCostCenterFilter from './OrganizationAndCostCenterFilter'
import type { OrgAndCC } from './OrganizationAndCostCenterFilter'

interface QuotesTableProps {
  permissions: string[]
  mainOrganizationId: string
  quotes: QuoteSimple[]
  page: number
  pageSize: number
  total: number
  loading: boolean
  handlePrevClick: () => void
  handleNextClick: () => void
  handleRowsChange: (e: ChangeEvent<HTMLInputElement>) => void
  searchValue: string
  handleInputSearchChange: (e: React.FormEvent<HTMLInputElement>) => void
  handleInputSearchClear: () => void
  handleInputSearchSubmit: () => void
  handleNewQuote?: () => void
  sortedBy: string
  sortOrder: string
  handleSort: ({
    sortOrder,
    sortedBy,
  }: {
    sortOrder: string
    sortedBy: string
  }) => void
  filterStatements: unknown[]
  handleFiltersChange: (statements: FilterStatement[]) => void
}

interface CellRendererProps {
  cellData: unknown
  rowData: QuoteSimple
  updateCellMeasurements: () => void
}

export const labelTypeByStatusMap: Record<string, string> = {
  ready: 'success',
  placed: 'neutral',
  declined: 'error',
  expired: 'error',
  pending: 'warning',
  revised: 'warning',
}

const QuotesTable: FunctionComponent<QuotesTableProps> = ({
  permissions,
  mainOrganizationId,
  quotes,
  page,
  pageSize,
  total,
  loading,
  handleNextClick,
  handlePrevClick,
  handleRowsChange,
  searchValue,
  handleInputSearchChange,
  handleInputSearchClear,
  handleInputSearchSubmit,
  sortedBy,
  sortOrder,
  handleSort,
  filterStatements,
  handleFiltersChange,
}) => {
  const { formatMessage, formatDate } = useIntl()
  const { navigate } = useRuntime()
  const isSalesRep = permissions.some(
    (permission) => permission.indexOf('edit-quotes') >= 0
  )

  const showOrganizationFilter = permissions.includes('access-quotes-all')
  const showCostCenterFilter =
    showOrganizationFilter || permissions.includes('access-quotes-organization')

  const handleNewQuote = () => {
    navigate({ page: 'store.create-b2b-quote' })
  }

  const lineActions = [
    {
      label: () => formatMessage(tableMessages.details),
      onClick: ({ rowData: { id } }: CellRendererProps) => {
        if (!id) return

        navigate({
          page: 'store.b2b-quote-details',
          params: { id },
        })
      },
    },
  ]

  const getSchema = () => ({
    properties: {
      referenceName: {
        title: formatMessage(tableMessages.refName),
        width: 200,
        cellRenderer: ({
          rowData: { viewedByCustomer, viewedBySales, referenceName },
        }: CellRendererProps) => {
          let renderedName = <>{referenceName}</>

          if (
            (isSalesRep && !viewedBySales) ||
            (!isSalesRep && !viewedByCustomer)
          ) {
            renderedName = <strong>{referenceName}</strong>
          }

          return renderedName
        },
      },
      subtotal: {
        title: formatMessage(tableMessages.subtotal),
        headerRight: true,
        cellRenderer: ({ rowData: { subtotal } }: CellRendererProps) => (
          <div className="w-100 tr">
            <FormattedCurrency value={subtotal / 100} />
          </div>
        ),
      },
      creatorEmail: {
        title: formatMessage(tableMessages.email),
      },
      creationDate: {
        title: formatMessage(tableMessages.creationDate),
        cellRenderer: ({ rowData: { creationDate } }: CellRendererProps) => {
          return (
            <>
              {formatDate(creationDate, {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
              })}
            </>
          )
        },
        sortable: true,
      },
      expirationDate: {
        title: formatMessage(tableMessages.expirationDate),
        cellRenderer: ({ rowData: { expirationDate } }: CellRendererProps) => {
          return (
            <>
              {formatDate(expirationDate, {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
              })}
            </>
          )
        },
        sortable: true,
      },
      status: {
        title: formatMessage(tableMessages.status),
        cellRenderer: ({ rowData: { status } }: CellRendererProps) => (
          <Tag type={labelTypeByStatusMap[status]}>{status}</Tag>
        ),
        sortable: true,
      },
      lastUpdate: {
        title: formatMessage(tableMessages.lastUpdate),
        cellRenderer: ({ rowData: { lastUpdate } }: CellRendererProps) => {
          return (
            <>
              {formatDate(lastUpdate, {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
              })}
            </>
          )
        },
        sortable: true,
      },
      organization: {
        title: formatMessage(tableMessages.organization),
        sortable: true,
        cellRenderer: ({
          rowData: { organizationName },
        }: CellRendererProps) => {
          return <>{organizationName}</>
        },
      },
      costCenter: {
        title: formatMessage(tableMessages.costCenter),
        sortable: true,
        cellRenderer: ({ rowData: { costCenterName } }: CellRendererProps) => {
          return <>{costCenterName}</>
        },
      },
    },
  })

  const statusSelectorObject = ({
    value,
    onChange,
  }: {
    value: Record<string, unknown>
    onChange: any
  }) => {
    const initialValue = {
      ready: true,
      placed: true,
      declined: true,
      expired: true,
      pending: true,
      revised: true,
      ...(value || {}),
    } as Record<string, unknown>

    const toggleValueByKey = (key: string) => {
      return {
        ...(value || initialValue),
        [key]: value ? !value[key] : false,
      }
    }

    return (
      <div>
        {Object.keys(initialValue).map((opt, index) => {
          return (
            <div className="mb3" key={`status-select-object-${opt}-${index}`}>
              <Checkbox
                checked={value ? value[opt] : initialValue[opt]}
                label={opt}
                name="status-checkbox-group"
                onChange={() => {
                  const newValue = toggleValueByKey(`${opt}`)
                  const newValueKeys = Object.keys(newValue)
                  const isEmptyFilter = !newValueKeys.some(
                    (key) => !newValue[key]
                  )

                  onChange(isEmptyFilter ? null : newValue)
                }}
                value={opt}
              />
            </div>
          )
        })}
      </div>
    )
  }

  const organizationFilter = ({
    value,
    onChange,
  }: {
    value: OrgAndCC
    onChange: any
  }) => {
    let orgId = value?.organizationId || ''

    if (!showOrganizationFilter) {
      orgId = mainOrganizationId
    }

    return (
      <OrganizationAndCostCenterFilter
        showOrganizationFilter={showOrganizationFilter}
        organizationId={orgId}
        costCenterId={value?.costCenterId || ''}
        onChange={({ organizationId, costCenterId }: OrgAndCC) =>
          onChange({ organizationId, costCenterId })
        }
      />
    )
  }

  return (
    <PageBlock>
      <Table
        fullWidth
        items={quotes}
        loading={loading}
        schema={getSchema()}
        lineActions={lineActions}
        onRowClick={({ rowData: { id } }: CellRendererProps) => {
          if (!id) return

          navigate({
            page: 'store.b2b-quote-details',
            params: { id },
          })
        }}
        fixFirstColumn
        emptyStateLabel={formatMessage(tableMessages.emptyState)}
        pagination={{
          onNextClick: handleNextClick,
          onPrevClick: handlePrevClick,
          onRowsChange: handleRowsChange,
          currentItemFrom: (page - 1) * pageSize + 1,
          currentItemTo: total < page * pageSize ? total : page * pageSize,
          textShowRows: formatMessage(tableMessages.showRows),
          textOf: formatMessage(tableMessages.of),
          totalItems: total,
          rowsOptions: [25, 50, 100],
        }}
        toolbar={{
          inputSearch: {
            value: searchValue,
            placeholder: formatMessage(tableMessages.placeholderSearch),
            onChange: handleInputSearchChange,
            onClear: handleInputSearchClear,
            onSubmit: handleInputSearchSubmit,
          },
          fields: {
            label: formatMessage(tableMessages.toggleFields),
            showAllLabel: formatMessage(tableMessages.showAllFields),
            hideAllLabel: formatMessage(tableMessages.hideAllFields),
          },
          newLine: {
            label: formatMessage(tableMessages.newQuote),
            handleCallback: handleNewQuote,
          },
        }}
        sort={{
          sortedBy,
          sortOrder,
        }}
        onSort={handleSort}
        filters={{
          alwaysVisibleFilters: [
            'status',
            ...(showCostCenterFilter ? ['organizationAndCostCenter'] : []),
          ],
          statements: filterStatements,
          onChangeStatements: handleFiltersChange,
          clearAllFiltersButtonLabel: formatMessage(tableMessages.clearFilters),
          collapseLeft: true,
          options: {
            status: {
              label: formatMessage(tableMessages.statusFilter),
              renderFilterLabel: (st: any) => {
                if (!st || !st.object) {
                  // you should treat empty object cases only for alwaysVisibleFilters
                  return formatMessage(tableMessages.filtersAll)
                }

                const keys = st.object ? Object.keys(st.object) : []
                const isAllTrue = !keys.some((key) => !st.object[key])
                const isAllFalse = !keys.some((key) => st.object[key])
                const trueKeys = keys.filter((key) => st.object[key])
                let trueKeysLabel = ''

                trueKeys.forEach((key, index) => {
                  trueKeysLabel += `${key}${
                    index === trueKeys.length - 1 ? '' : ', '
                  }`
                })

                if (isAllTrue) {
                  return formatMessage(tableMessages.filtersAll)
                }

                if (isAllFalse) {
                  return formatMessage(tableMessages.filtersNone)
                }

                return `${trueKeysLabel}`
              },
              verbs: [
                {
                  label: formatMessage(tableMessages.filtersIncludes),
                  value: 'includes',
                  object: statusSelectorObject,
                },
              ],
            },
            ...(showCostCenterFilter && {
              organizationAndCostCenter: {
                label: formatMessage(tableMessages.organizationAndCostCenter),
                renderFilterLabel: (st: any) => {
                  if (!st || !st.object) {
                    // you should treat empty object cases only for alwaysVisibleFilters
                    return formatMessage(tableMessages.filtersAll)
                  }

                  return '...'
                },
                verbs: [
                  {
                    label: '',
                    value: '=',
                    object: organizationFilter,
                  },
                ],
              },
            }),
          },
        }}
      />
    </PageBlock>
  )
}

export default QuotesTable
