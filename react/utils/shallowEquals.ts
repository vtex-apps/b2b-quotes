export function shallowEqual(
  object1: Record<string, unknown>,
  object2: Record<string, unknown>
) {
  const keys1 = Object.keys(object1)
  const keys2 = Object.keys(object2)

  if (keys1.length !== keys2.length) {
    return false
  }

  for (const key of keys1) {
    if (object1[key] !== object2[key]) {
      return false
    }
  }

  return true
}

export function arrayShallowEqual(
  array1: Array<Record<string, any>>,
  array2: Array<Record<string, any>>
) {
  let equal = true

  for (const [index, member] of array1.entries()) {
    if (!shallowEqual(member, array2[index])) {
      equal = false
      break
    }
  }

  return equal
}
