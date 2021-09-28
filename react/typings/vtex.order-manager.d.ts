/* eslint-disable no-restricted-syntax */
declare module 'vtex.order-manager/OrderQueue' {
  export * from 'vtex.order-manager/react/OrderQueue'
  export { default } from 'vtex.order-manager/react/OrderQueue'

  export enum QueueStatus {
    PENDING = 'Pending',
    FULFILLED = 'Fulfilled',
  }
}

declare module 'vtex.order-manager/OrderForm' {
  export * from 'vtex.order-manager/react/OrderForm'
  export { default } from 'vtex.order-manager/react/OrderForm'
}

declare module 'vtex.order-manager/constants' {
  export * from 'vtex.order-manager/react/constants'
}
