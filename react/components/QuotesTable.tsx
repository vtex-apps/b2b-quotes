/* eslint-disable react/display-name */
import type { FunctionComponent, ChangeEvent } from 'react'
import React from 'react'
import { Table, Tag, Checkbox, Input } from 'vtex.styleguide'
import { useIntl, defineMessages } from 'react-intl'
import { FormattedCurrency } from 'vtex.format-currency'
import { useRuntime } from 'vtex.render-runtime'

interface QuotesTableProps {
  permissions: string[]
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

const storePrefix = 'store/b2b-quotes.'

const messages = defineMessages({
  details: {
    id: `${storePrefix}quotes-table.details.label`,
  },
  refName: {
    id: `${storePrefix}quotes-table.referenceName.title`,
  },
  subtotal: {
    id: `${storePrefix}quotes-table.subtotal.title`,
  },
  email: {
    id: `${storePrefix}quotes-table.creatorEmail.title`,
  },
  creationDate: {
    id: `${storePrefix}quotes-table.creationDate.title`,
  },
  expirationDate: {
    id: `${storePrefix}quotes-table.expirationDate.title`,
  },
  status: {
    id: `${storePrefix}quotes-table.status.title`,
  },
  lastUpdate: {
    id: `${storePrefix}quotes-table.lastUpdate.title`,
  },
  organization: {
    id: `${storePrefix}quotes-table.organization.title`,
  },
  costCenter: {
    id: `${storePrefix}quotes-table.costCenter.title`,
  },
  any: {
    id: `${storePrefix}quotes-table.filters.any`,
  },
  is: {
    id: `${storePrefix}quotes-table.filters.is`,
  },
  emptyState: {
    id: `${storePrefix}quotes-table.empty-state-label`,
  },
  showRows: {
    id: `${storePrefix}quotes-table.showRows`,
  },
  of: {
    id: `${storePrefix}quotes-table.of`,
  },
  placeholderSearch: {
    id: `${storePrefix}quotes-table.search.placeholder`,
  },
  toggleFields: {
    id: `${storePrefix}quotes-table.toggleFields.label`,
  },
  showAllFields: {
    id: `${storePrefix}quotes-table.toggleFields.showAllLabel`,
  },
  hideAllFields: {
    id: `${storePrefix}quotes-table.toggleFields.hideAllLabel`,
  },
  newQuote: {
    id: `${storePrefix}quotes-table.newLine.label`,
  },
  clearFilters: {
    id: `${storePrefix}quotes-table.clearFilters.label`,
  },
  statusFilter: {
    id: `${storePrefix}quotes-table.statusFilter.label`,
  },
  filtersAll: {
    id: `${storePrefix}quotes-table.filters.all`,
  },
  filtersNone: {
    id: `${storePrefix}quotes-table.filters.none`,
  },
  filtersIncludes: {
    id: `${storePrefix}quotes-table.filters.includes`,
  },
})

const QuotesTable: FunctionComponent<QuotesTableProps> = ({
  permissions,
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
      label: () => formatMessage(messages.details),
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
        title: formatMessage(messages.refName),
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
        title: formatMessage(messages.subtotal),
        headerRight: true,
        cellRenderer: ({ rowData: { subtotal } }: CellRendererProps) => (
          <div className="w-100 tr">
            <FormattedCurrency value={subtotal / 100} />
          </div>
        ),
      },
      creatorEmail: {
        title: formatMessage(messages.email),
      },
      creationDate: {
        title: formatMessage(messages.creationDate),
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
        title: formatMessage(messages.expirationDate),
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
        title: formatMessage(messages.status),
        cellRenderer: ({ rowData: { status } }: CellRendererProps) => (
          <Tag type={labelTypeByStatusMap[status]}>{status}</Tag>
        ),
        sortable: true,
      },
      lastUpdate: {
        title: formatMessage(messages.lastUpdate),
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
        title: formatMessage(messages.organization),
        sortable: true,
        cellRenderer: ({
          rowData: { organizationName },
        }: CellRendererProps) => {
          return <>{organizationName}</>
        },
      },
      costCenter: {
        title: formatMessage(messages.costCenter),
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
      const newValue = {
        ...(value || initialValue),
        [key]: value ? !value[key] : false,
      }

      return newValue
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

  const simpleInputObject = ({
    value,
    onChange,
  }: {
    value: string
    onChange: any
  }) => {
    return (
      <Input
        value={value || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
      />
    )
  }

  const simpleInputVerbsAndLabel = () => {
    return {
      renderFilterLabel: (st: any) => {
        if (!st || !st.object) {
          // you should treat empty object cases only for alwaysVisibleFilters
          return formatMessage(messages.any)
        }

        return `${formatMessage(messages.is)} ${st.object}`
      },
      verbs: [
        {
          label: formatMessage(messages.is),
          value: '=',
          object: simpleInputObject,
        },
      ],
    }
  }

  return (
    <div className="pa9 mh9">
      <Table
        fullWidth
        items={quotes}
        loading={loading}
        schema={getSchema()}
        lineActions={lineActions}
        fixFirstColumn
        emptyStateLabel={formatMessage(messages.emptyState)}
        pagination={{
          onNextClick: handleNextClick,
          onPrevClick: handlePrevClick,
          onRowsChange: handleRowsChange,
          currentItemFrom: (page - 1) * pageSize + 1,
          currentItemTo: total < page * pageSize ? total : page * pageSize,
          textShowRows: formatMessage(messages.showRows),
          textOf: formatMessage(messages.of),
          totalItems: total,
          rowsOptions: [25, 50, 100],
        }}
        toolbar={{
          inputSearch: {
            value: searchValue,
            placeholder: formatMessage(messages.placeholderSearch),
            onChange: handleInputSearchChange,
            onClear: handleInputSearchClear,
            onSubmit: handleInputSearchSubmit,
          },
          fields: {
            label: formatMessage(messages.toggleFields),
            showAllLabel: formatMessage(messages.showAllFields),
            hideAllLabel: formatMessage(messages.hideAllFields),
          },
          newLine: {
            label: formatMessage(messages.newQuote),
            handleCallback: handleNewQuote,
          },
        }}
        sort={{
          sortedBy,
          sortOrder,
        }}
        onSort={handleSort}
        filters={{
          alwaysVisibleFilters: ['status'],
          statements: filterStatements,
          onChangeStatements: handleFiltersChange,
          clearAllFiltersButtonLabel: formatMessage(messages.clearFilters),
          collapseLeft: true,
          options: {
            status: {
              label: formatMessage(messages.statusFilter),
              renderFilterLabel: (st: any) => {
                if (!st || !st.object) {
                  // you should treat empty object cases only for alwaysVisibleFilters
                  return formatMessage(messages.filtersAll)
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

                return `${
                  isAllTrue
                    ? formatMessage(messages.filtersAll)
                    : isAllFalse
                    ? formatMessage(messages.filtersNone)
                    : `${trueKeysLabel}`
                }`
              },
              verbs: [
                {
                  label: formatMessage(messages.filtersIncludes),
                  value: 'includes',
                  object: statusSelectorObject,
                },
              ],
            },
            ...(showOrganizationFilter && {
              organization: {
                label: formatMessage(messages.organization),
                ...simpleInputVerbsAndLabel(),
              },
            }),
            ...(showCostCenterFilter && {
              costCenter: {
                label: formatMessage(messages.costCenter),
                ...simpleInputVerbsAndLabel(),
              },
            }),
          },
        }}
      />
    </div>
  )
}

export default QuotesTable
