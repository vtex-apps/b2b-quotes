import type { FunctionComponent, Component } from 'react'

declare global {
  interface StorefrontFunctionComponent<P = unknown>
    extends FunctionComponent<P> {
    getSchema?(props: P): Record<string, unknown>
    schema?: Record<string, unknown>
  }

  interface StorefrontComponent<P = unknown, S = unknown>
    extends Component<P, S> {
    getSchema?(props: P): Record<string, unknown>
    schema: Record<string, unknown>
  }
}
