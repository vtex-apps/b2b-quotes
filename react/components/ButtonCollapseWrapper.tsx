import type { FunctionComponent } from 'react'
import React from 'react'

const ButtonCollapseWrapper: FunctionComponent = ({ children }) => {
  return (
    <div className="absolute left-0 w-100 h-100" style={{ display: 'grid' }}>
      {children}
    </div>
  )
}

export default ButtonCollapseWrapper
