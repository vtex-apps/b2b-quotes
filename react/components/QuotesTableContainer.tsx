import type { FunctionComponent, ChangeEvent } from 'react'
import React, { useState } from 'react'
import { useQuery } from 'react-apollo'
import { FormattedMessage } from 'react-intl'
import { useRuntime } from 'vtex.render-runtime'
import { Layout, PageHeader, PageBlock, Spinner } from 'vtex.styleguide'

import { useSessionResponse } from '../utils/helpers'
import QuotesTable from './QuotesTable'
import GET_QUOTES from '../graphql/getQuotes.graphql'
import GET_MAIN_ORGANIZATION from '../graphql/getMainOrganization.graphql'
import GET_PERMISSIONS from '../graphql/getPermissions.graphql'
import storageFactory from '../utils/storage'

const localStore = storageFactory(() => localStorage)

let isAuthenticated =
  JSON.parse(String(localStore.getItem('b2bquotes_isAuthenticated'))) ?? false

const QuotesTableContainer: FunctionComponent = () => {
  const { navigate, rootPath } = useRuntime()
  const [paginationState, setPaginationStateOriginal] = useState({
    page: 1,
    pageSize: 25,
  })

  const setPaginationState = (
    paginationArgs: typeof paginationState,
    scrollToTop = true
  ) => {
    setPaginationStateOriginal(paginationArgs)

    if (scrollToTop) {
      window.scrollTo(0, 0)
    }
  }

  const [filterState, setFilterState] = useState({
    filterStatements: [] as FilterStatement[],
    organization: [] as string[],
    costCenter: [] as string[],
    status: [] as string[],
  })

  const [searchState, setSearchState] = useState({
    searchValue: '',
  })

  const [sortState, setSortState] = useState({
    sortOrder: 'DESC',
    sortedBy: 'lastUpdate',
  })

  const sessionResponse: any = useSessionResponse()

  if (sessionResponse) {
    isAuthenticated =
      sessionResponse?.namespaces?.profile?.isAuthenticated?.value === 'true'

    localStore.setItem(
      'b2bquotes_isAuthenticated',
      JSON.stringify(isAuthenticated)
    )
  }

  const { data: permissionsData, loading: permissionsLoading } = useQuery(
    GET_PERMISSIONS,
    {
      ssr: false,
      skip: !isAuthenticated,
    }
  )

  const {
    data: mainOrganizationData,
    loading: mainOrganizationLoading,
  } = useQuery(GET_MAIN_ORGANIZATION, {
    ssr: false,
  })

  const { data, loading, refetch } = useQuery(GET_QUOTES, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    ssr: false,
  })

  const handlePrevClick = () => {
    if (paginationState.page === 1) return

    const newPage = paginationState.page - 1

    setPaginationState({
      ...paginationState,
      page: newPage,
    })

    refetch({
      page: newPage,
      pageSize: paginationState.pageSize,
      organization: filterState.organization,
      costCenter: filterState.costCenter,
      status: filterState.status,
      search: searchState.searchValue,
      sortOrder: sortState.sortOrder,
      sortedBy: sortState.sortedBy,
    })
  }

  const handleNextClick = () => {
    const newPage = paginationState.page + 1

    setPaginationState({
      ...paginationState,
      page: newPage,
    })

    refetch({
      page: newPage,
      pageSize: paginationState.pageSize,
      organization: filterState.organization,
      costCenter: filterState.costCenter,
      status: filterState.status,
      search: searchState.searchValue,
      sortOrder: sortState.sortOrder,
      sortedBy: sortState.sortedBy,
    })
  }

  const handleRowsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const {
      target: { value },
    } = e

    setPaginationState({
      page: 1,
      pageSize: +value,
    })

    refetch({
      page: 1,
      pageSize: +value,
      organization: filterState.organization,
      costCenter: filterState.costCenter,
      status: filterState.status,
      search: searchState.searchValue,
      sortOrder: sortState.sortOrder,
      sortedBy: sortState.sortedBy,
    })
  }

  const handleFiltersChange = (statements: FilterStatement[]) => {
    const organizations = [] as string[]
    const costCenters = [] as string[]
    const statuses = [] as string[]

    statements.forEach((statement) => {
      if (!statement?.object) return
      const { subject, object } = statement

      switch (subject) {
        case 'status': {
          if (!object || typeof object !== 'object') return
          const keys = Object.keys(object)
          const isAllTrue = !keys.some((key) => !object[key])
          const isAllFalse = !keys.some((key) => object[key])
          const trueKeys = keys.filter((key) => object[key])

          if (isAllTrue) break
          if (isAllFalse) statuses.push('none')
          statuses.push(...trueKeys)
          break
        }

        case 'organizationAndCostCenter': {
          if (!object || typeof object !== 'object') return

          if (object.organizationId) {
            organizations.push(object.organizationId as string)
          }

          if (object.costCenterId) {
            costCenters.push(object.costCenterId as string)
          }

          break
        }

        default:
          break
      }
    })

    setFilterState({
      status: statuses,
      organization: organizations,
      costCenter: costCenters,
      filterStatements: statements,
    })

    setPaginationState(
      {
        ...paginationState,
        page: 1,
      },
      false
    )

    refetch({
      page: 1,
      pageSize: paginationState.pageSize,
      search: searchState.searchValue,
      sortOrder: sortState.sortOrder,
      sortedBy: sortState.sortedBy,
      status: statuses,
      organization: organizations,
      costCenter: costCenters,
    })
  }

  const handleInputSearchChange = (e: React.FormEvent<HTMLInputElement>) => {
    const {
      currentTarget: { value },
    } = e

    setSearchState({
      searchValue: value,
    })
  }

  const handleInputSearchClear = () => {
    setSearchState({
      searchValue: '',
    })

    refetch({
      page: 1,
      pageSize: paginationState.pageSize,
      organization: filterState.organization,
      costCenter: filterState.costCenter,
      status: filterState.status,
      search: '',
      sortOrder: sortState.sortOrder,
      sortedBy: sortState.sortedBy,
    })
  }

  const handleInputSearchSubmit = () => {
    refetch({
      page: 1,
      pageSize: paginationState.pageSize,
      organization: filterState.organization,
      costCenter: filterState.costCenter,
      status: filterState.status,
      search: searchState.searchValue,
      sortOrder: sortState.sortOrder,
      sortedBy: sortState.sortedBy,
    })
  }

  const handleSort = ({
    sortOrder,
    sortedBy,
  }: {
    sortOrder: string
    sortedBy: string
  }) => {
    setSortState({
      sortOrder,
      sortedBy,
    })
    refetch({
      page: 1,
      pageSize: paginationState.pageSize,
      organization: filterState.organization,
      costCenter: filterState.costCenter,
      status: filterState.status,
      search: searchState.searchValue,
      sortOrder,
      sortedBy,
    })
  }

  const QuotesTablePageHeader = () => {
    return (
      <PageHeader
        title={<FormattedMessage id="store/b2b-quotes.quotes-table.title" />}
        linkLabel={<FormattedMessage id="store/b2b-quotes.back" />}
        onLinkClick={() =>
          navigate({
            to: `${rootPath ?? ''}/account`,
          })
        }
      />
    )
  }

  if (
    !isAuthenticated ||
    !permissionsData?.checkUserPermission?.permissions?.length ||
    !permissionsData.checkUserPermission.permissions.some(
      (permission: string) => permission.indexOf('access-quotes') >= 0
    )
  ) {
    const message = isAuthenticated ? (
      <FormattedMessage id="store/b2b-quotes.error.notPermitted" />
    ) : (
      <FormattedMessage id="store/b2b-quotes.error.notAuthenticated" />
    )

    return (
      <Layout fullWidth>
        <div className="mw9 center">
          <Layout fullWidth pageHeader={<QuotesTablePageHeader />}>
            <PageBlock>{permissionsLoading ? <Spinner /> : message}</PageBlock>
          </Layout>
        </div>
      </Layout>
    )
  }

  return (
    <Layout fullWidth>
      <div className="mw9 center">
        <Layout fullWidth pageHeader={<QuotesTablePageHeader />}>
          <QuotesTable
            quotes={data?.getQuotes?.data ?? []}
            mainOrganizationId={
              mainOrganizationData?.getOrganizationByIdStorefront?.id
            }
            permissions={permissionsData.checkUserPermission.permissions}
            page={paginationState.page}
            pageSize={paginationState.pageSize}
            total={data?.getQuotes?.pagination?.total ?? 0}
            loading={loading || permissionsLoading || mainOrganizationLoading}
            handlePrevClick={handlePrevClick}
            handleNextClick={handleNextClick}
            filterStatements={filterState.filterStatements}
            handleFiltersChange={handleFiltersChange}
            handleInputSearchChange={handleInputSearchChange}
            handleInputSearchClear={handleInputSearchClear}
            handleInputSearchSubmit={handleInputSearchSubmit}
            handleRowsChange={handleRowsChange}
            handleSort={handleSort}
            searchValue={searchState.searchValue}
            sortOrder={sortState.sortOrder}
            sortedBy={sortState.sortedBy}
          />
        </Layout>
      </div>
    </Layout>
  )
}

export default QuotesTableContainer
