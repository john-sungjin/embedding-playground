
import dynamic from 'next/dynamic'
import React from 'react'

const NoSsr: React.FC<{children: React.ReactNode}> = ({children}) => (
  <React.Fragment>{children}</React.Fragment>
)

export default dynamic(() => Promise.resolve(NoSsr), {
  ssr: false
})
