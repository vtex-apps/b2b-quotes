import type { FunctionComponent, ChangeEvent } from 'react'
import React, { Fragment, useState, useEffect } from 'react'
import { useQuery } from 'react-apollo'
import { FormattedMessage } from 'react-intl'
import { PageHeader } from 'vtex.styleguide'

import QuotesTable from './QuotesTable'
import GET_QUOTES from '../graphql/getQuotes.graphql'
import GET_PERMISSIONS from '../graphql/getPermissions.graphql'
import { getSession } from '../modules/session'
import storageFactory from '../utils/storage'

const localStore = storageFactory(() => localStorage)

const useSessionResponse = () => {
  const [session, setSession] = useState<unknown>()
  const sessionPromise = getSession()

  useEffect(() => {
    if (!sessionPromise) {
      return
    }

    sessionPromise.then((sessionResponse) => {
      const { response } = sessionResponse

      setSession(response)
    })
  }, [sessionPromise])

  return session
}

let isAuthenticated =
  JSON.parse(String(localStore.getItem('orderquote_isAuthenticated'))) ?? false

const QuotesTableContainer: FunctionComponent = () => {
  const [paginationState, setPaginationState] = useState({
    page: 1,
    pageSize: 25,
  })

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
      'orderquote_isAuthenticated',
      JSON.stringify(isAuthenticated)
    )
  }

  const { data: permissionsData } = useQuery(GET_PERMISSIONS, {
    ssr: false,
    skip: !isAuthenticated,
  })

  const { data, loading, fetchMore } = useQuery(GET_QUOTES, { ssr: false })

  if (!data || (isAuthenticated && !permissionsData)) return null

  const handlePrevClick = () => {
    if (paginationState.page === 1) return

    const newPage = paginationState.page - 1

    setPaginationState({
      ...paginationState,
      page: newPage,
    })

    fetchMore({
      variables: {
        page: newPage,
        pageSize: paginationState.pageSize,
        organization: filterState.organization,
        costCenter: filterState.costCenter,
        status: filterState.status,
        search: searchState.searchValue,
        sortOrder: sortState.sortOrder,
        sortedBy: sortState.sortedBy,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev

        return fetchMoreResult
      },
    })
  }

  const handleNextClick = () => {
    const newPage = paginationState.page + 1

    setPaginationState({
      ...paginationState,
      page: newPage,
    })

    fetchMore({
      variables: {
        page: newPage,
        pageSize: paginationState.pageSize,
        organization: filterState.organization,
        costCenter: filterState.costCenter,
        status: filterState.status,
        search: searchState.searchValue,
        sortOrder: sortState.sortOrder,
        sortedBy: sortState.sortedBy,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev

        return fetchMoreResult
      },
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

    fetchMore({
      variables: {
        page: 1,
        pageSize: +value,
        organization: filterState.organization,
        costCenter: filterState.costCenter,
        status: filterState.status,
        search: searchState.searchValue,
        sortOrder: sortState.sortOrder,
        sortedBy: sortState.sortedBy,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev

        return fetchMoreResult
      },
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

        case 'organization': {
          if (!object || typeof object !== 'string') return

          organizations.push(object)
          break
        }

        case 'costCenter': {
          if (!object || typeof object !== 'string') return

          costCenters.push(object)
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

    setPaginationState({
      ...paginationState,
      page: 1,
    })

    fetchMore({
      variables: {
        page: 1,
        pageSize: paginationState.pageSize,
        search: searchState.searchValue,
        sortOrder: sortState.sortOrder,
        sortedBy: sortState.sortedBy,
        status: statuses,
        organization: organizations,
        costCenter: costCenters,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev

        return fetchMoreResult
      },
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

    fetchMore({
      variables: {
        page: 1,
        pageSize: paginationState.pageSize,
        organization: filterState.organization,
        costCenter: filterState.costCenter,
        status: filterState.status,
        search: '',
        sortOrder: sortState.sortOrder,
        sortedBy: sortState.sortedBy,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev

        return fetchMoreResult
      },
    })
  }

  const handleInputSearchSubmit = () => {
    fetchMore({
      variables: {
        page: 1,
        pageSize: paginationState.pageSize,
        organization: filterState.organization,
        costCenter: filterState.costCenter,
        status: filterState.status,
        search: searchState.searchValue,
        sortOrder: sortState.sortOrder,
        sortedBy: sortState.sortedBy,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev

        return fetchMoreResult
      },
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
    fetchMore({
      variables: {
        page: 1,
        pageSize: paginationState.pageSize,
        organization: filterState.organization,
        costCenter: filterState.costCenter,
        status: filterState.status,
        search: searchState.searchValue,
        sortOrder,
        sortedBy,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev

        return fetchMoreResult
      },
    })
  }

  const QuotesTablePageHeader = () => {
    return (
      <PageHeader
        title={<FormattedMessage id="store/b2b-quotes.quotes-table.title" />}
      />
    )
  }

  if (
    !isAuthenticated ||
    !permissionsData.checkUserPermission?.permissions?.length ||
    !permissionsData.checkUserPermission.permissions.some(
      (permission: string) => permission.indexOf('access-quotes') >= 0
    )
  ) {
    return (
      <Fragment>
        <QuotesTablePageHeader />
        <div className="flex flex-row ph5 ph7-ns">
          <div className="flex flex-column w-100">
            <div className="mb5">
              {!isAuthenticated ? (
                <FormattedMessage id="store/b2b-quotes.error.notAuthenticated" />
              ) : (
                <FormattedMessage id="store/b2b-quotes.error.notPermitted" />
              )}
            </div>
          </div>
        </div>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <QuotesTablePageHeader />
      <QuotesTable
        quotes={data.getQuotes?.data ?? []}
        permissions={permissionsData.checkUserPermission.permissions}
        page={paginationState.page}
        pageSize={paginationState.pageSize}
        total={data.getQuotes?.pagination?.total ?? 0}
        loading={loading}
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
    </Fragment>
  )
}

export default QuotesTableContainer
