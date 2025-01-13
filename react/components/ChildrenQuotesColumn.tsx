import type { FunctionComponent } from 'react'
import React from 'react'
import { useLazyQuery } from 'react-apollo'
import { ButtonPlain, IconCaretDown, IconCaretRight } from 'vtex.styleguide'

import GET_CHILDREN_QUOTES from '../graphql/getChildrenQuotes.graphql'
import { arrayShallowEqual } from '../utils/shallowEquals'
import ButtonCollapseWrapper from './ButtonCollapseWrapper'

type ChildrenQuotesColumnProps = {
  quote: QuoteSimple
  expandedQuotes: string[]
  setExpandedQuotes: React.Dispatch<React.SetStateAction<string[]>>
  childrenQuotes: Record<string, [QuoteSimple]>
  setChildrenQuotes: React.Dispatch<
    React.SetStateAction<Record<string, [QuoteSimple]>>
  >
}

const ChildrenQuotesColumn: FunctionComponent<ChildrenQuotesColumnProps> = ({
  quote,
  expandedQuotes,
  setExpandedQuotes,
  childrenQuotes,
  setChildrenQuotes,
}: ChildrenQuotesColumnProps) => {
  const { hasChildren, id } = quote

  const [fetchChildrenQuotes] = useLazyQuery(GET_CHILDREN_QUOTES, {
    fetchPolicy: 'cache-and-network',
    onCompleted({ getChildrenQuotes }) {
      const [firstChild] = getChildrenQuotes
      const { parentQuote } = firstChild
      const prevChildrenQuotes = childrenQuotes[parentQuote]

      if (
        !prevChildrenQuotes ||
        !arrayShallowEqual(prevChildrenQuotes, getChildrenQuotes)
      ) {
        setChildrenQuotes((prev) => ({
          ...prev,
          [parentQuote]: getChildrenQuotes,
        }))
      }
    },
  })

  if (!hasChildren) return null

  if (expandedQuotes.includes(id)) {
    return (
      <ButtonCollapseWrapper>
        <ButtonPlain
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            setExpandedQuotes((prev) => prev.filter((i) => i !== id))
          }}
        >
          <IconCaretDown size={10} />
        </ButtonPlain>
      </ButtonCollapseWrapper>
    )
  }

  return (
    <ButtonCollapseWrapper>
      <ButtonPlain
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          setExpandedQuotes((prev) => [...prev, id])
          fetchChildrenQuotes({ variables: { id } })
        }}
      >
        <IconCaretRight size={10} />
      </ButtonPlain>
    </ButtonCollapseWrapper>
  )
}

export default ChildrenQuotesColumn
