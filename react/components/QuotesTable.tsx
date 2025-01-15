/* eslint-disable react/display-name */
import type { FunctionComponent, ChangeEvent } from 'react'
import React from 'react'
import {
  PageBlock,
  Table,
  Tag,
  Checkbox,
  Spinner,
  Tooltip,
} from 'vtex.styleguide'
import { useIntl, FormattedMessage } from 'react-intl'
import { FormattedCurrency } from 'vtex.format-currency'
import { useRuntime } from 'vtex.render-runtime'

import { tableMessages, statusMessages } from '../utils/messages'
import ChildrenQuotesColumn from './ChildrenQuotesColumn'
import OrganizationAndCostCenterFilter from './OrganizationAndCostCenterFilter'
import type { OrgAndCC } from './OrganizationAndCostCenterFilter'
import { LabelByStatusMap } from '../utils/status'
import { getEmptySimpleQuote } from '../utils/helpers'

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

const QuotesTable: FunctionComponent<QuotesTableProps> = ({
  permissions,
  mainOrganizationId,
  quotes: mainQuotes,
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

  const [expandedQuotes, setExpandedQuotes] = React.useState<string[]>([])
  const [childrenQuotes, setChildrenQuotes] = React.useState<
    Record<string, [QuoteSimple]>
  >({})

  const quotes: QuoteSimple[] = []

  for (const quote of mainQuotes) {
    quotes.push(quote)

    if (quote.hasChildren && expandedQuotes.includes(quote.id)) {
      if (childrenQuotes[quote.id]) {
        quotes.push(
          ...childrenQuotes[quote.id].map((child) => ({
            ...child,
            referenceName:
              child.sellerName ?? child.seller ?? child.referenceName,
          }))
        )
      } else {
        for (let i = 0; i < (quote.childrenQuantity ?? 1); i++) {
          quotes.push(getEmptySimpleQuote(quote.id))
        }
      }
    }
  }

  const cleanChildrenStates = () => {
    setExpandedQuotes([])
    setChildrenQuotes({})
  }

  const someHasChildren = quotes.some((quote) => quote.hasChildren)
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
      ...(someHasChildren && {
        hasChildren: {
          title: ' ',
          width: 25,
          cellRenderer: ({ rowData }: CellRendererProps) => {
            return (
              <ChildrenQuotesColumn
                quote={rowData}
                childrenQuotes={childrenQuotes}
                setChildrenQuotes={setChildrenQuotes}
                expandedQuotes={expandedQuotes}
                setExpandedQuotes={setExpandedQuotes}
              />
            )
          },
        },
      }),
      referenceName: {
        title: formatMessage(tableMessages.refName),
        width: 200,
        cellRenderer: ({
          rowData: {
            viewedByCustomer,
            viewedBySales,
            referenceName,
            parentQuote,
            rowLoading,
            childrenQuantity,
          },
        }: CellRendererProps) => {
          let renderedName = <>{rowLoading ? <Spinner /> : referenceName}</>

          if (
            (isSalesRep && !viewedBySales) ||
            (!isSalesRep && !viewedByCustomer)
          ) {
            renderedName = <strong>{referenceName}</strong>
          }

          return (
            <Tooltip
              label={`${referenceName}${
                childrenQuantity ? ` (${childrenQuantity})` : ''
              }`}
            >
              <div {...(!!parentQuote && { className: 'pl7' })}>
                {renderedName}
                {!!childrenQuantity && (
                  <span className="c-muted-2 pl3">({childrenQuantity})</span>
                )}
              </div>
            </Tooltip>
          )
        },
      },
      subtotal: {
        title: formatMessage(tableMessages.subtotal),
        headerRight: true,
        cellRenderer: ({
          rowData: { subtotal, rowLoading },
        }: CellRendererProps) => {
          return (
            <div className="w-100 tr">
              {rowLoading ? (
                '---'
              ) : (
                <FormattedCurrency value={subtotal / 100} />
              )}
            </div>
          )
        },
      },
      creatorEmail: {
        title: formatMessage(tableMessages.email),
        cellRenderer: ({
          rowData: { creatorEmail, rowLoading },
        }: CellRendererProps) => {
          if (rowLoading) return '---'

          return <>{creatorEmail}</>
        },
      },
      creationDate: {
        title: formatMessage(tableMessages.creationDate),
        cellRenderer: ({
          rowData: { creationDate, rowLoading },
        }: CellRendererProps) => {
          if (rowLoading) return '---'

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
        cellRenderer: ({
          rowData: { expirationDate, rowLoading },
        }: CellRendererProps) => {
          if (!expirationDate || rowLoading) return '---'

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
        cellRenderer: ({
          rowData: { status, rowLoading },
        }: CellRendererProps) => {
          if (rowLoading) return '---'

          return (
            <Tag type={LabelByStatusMap[status]}>
              <FormattedMessage
                id={statusMessages[status as keyof typeof statusMessages].id}
              />
            </Tag>
          )
        },
        sortable: true,
      },
      lastUpdate: {
        title: formatMessage(tableMessages.lastUpdate),
        cellRenderer: ({
          rowData: { lastUpdate, rowLoading },
        }: CellRendererProps) => {
          if (rowLoading) return '---'

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
          rowData: { organizationName, rowLoading },
        }: CellRendererProps) => {
          if (rowLoading) return '---'

          return <>{organizationName}</>
        },
      },
      costCenter: {
        title: formatMessage(tableMessages.costCenter),
        sortable: true,
        cellRenderer: ({
          rowData: { costCenterName, rowLoading },
        }: CellRendererProps) => {
          if (rowLoading) return '---'

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
                label={formatMessage(
                  statusMessages[opt as keyof typeof statusMessages]
                )}
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
        density="low"
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
        emptyStateLabel={formatMessage(tableMessages.emptyState)}
        pagination={{
          onNextClick: () => {
            cleanChildrenStates()
            handleNextClick()
          },
          onPrevClick: () => {
            cleanChildrenStates()
            handlePrevClick()
          },
          onRowsChange: (e: ChangeEvent<HTMLInputElement>) => {
            cleanChildrenStates()
            handleRowsChange(e)
          },
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
            onChange: (e: React.FormEvent<HTMLInputElement>) => {
              cleanChildrenStates()
              handleInputSearchChange(e)
            },
            onClear: () => {
              cleanChildrenStates()
              handleInputSearchClear()
            },
            onSubmit: () => {
              cleanChildrenStates()
              handleInputSearchSubmit()
            },
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
        onSort={(sortArgs: { sortOrder: string; sortedBy: string }) => {
          cleanChildrenStates()
          handleSort(sortArgs)
        }}
        filters={{
          alwaysVisibleFilters: [
            'status',
            ...(showCostCenterFilter ? ['organizationAndCostCenter'] : []),
          ],
          statements: filterStatements,
          onChangeStatements: (statements: FilterStatement[]) => {
            cleanChildrenStates()
            handleFiltersChange(statements)
          },
          clearAllFiltersButtonLabel: formatMessage(tableMessages.clearFilters),
          collapseLeft: true,
          options: {
            status: {
              label: formatMessage(tableMessages.statusFilter),
              renderFilterLabel: (st: any) => {
                if (!st?.object) {
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
                  if (!st?.object) {
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
