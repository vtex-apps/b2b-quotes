export const enum Status {
  EXPIRED = 'expired',
  PLACED = 'placed',
  DECLINED = 'declined',
  READY = 'ready',
  REVISED = 'revised',
  PENDING = 'pending',
}

export const LabelByStatusMap: Record<string, string> = {
  [Status.READY]: 'success',
  [Status.PLACED]: 'neutral',
  [Status.DECLINED]: 'error',
  [Status.EXPIRED]: 'error',
  [Status.PENDING]: 'warning',
  [Status.REVISED]: 'warning',
}
