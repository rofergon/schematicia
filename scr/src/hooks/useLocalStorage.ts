import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'

function readValue<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') {
    return initialValue
  }

  try {
    const item = window.localStorage.getItem(key)
    if (item === null) {
      return initialValue
    }

    return JSON.parse(item) as T
  } catch (error) {
    console.warn(`No fue posible leer la clave "${key}" de localStorage`, error)
    return initialValue
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): readonly [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => readValue(key, initialValue))

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.warn(`No fue posible escribir la clave "${key}" en localStorage`, error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}
