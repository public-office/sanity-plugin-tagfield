import {useCallback, useMemo, useState} from 'react'

import type {Tag} from '../types'
import {filterUniqueTags} from './helpers'

const EMPTY_TAGS: Tag[] = []

type LoadingOptions = {[key: string]: boolean}
interface UseLoadingInput {
  initialLoadingOptions?: LoadingOptions
  initialState?: boolean
}

/**
 * Expands on a basic `isLoading` state by allowing multiple keyed options with separate loading states to be tracked
 *
 * The aggregate state is derived during render rather than mirrored into a second
 * `useState` + `useEffect` pair. That removes a render cycle per update and, more
 * importantly, removes the mount-time flicker where the input briefly reported
 * "loaded" before its subscriptions had registered themselves.
 *
 * @param initialLoadingOptions An object with several keys, each defining a boolean state of loaded/not loaded
 * @param initialState The initial state (whether or not it should start in a loading state or a loaded state)
 * @returns An array containing the overall loading state, the individual loading states, and a function to change the loading states respectively
 */
export const useLoading = ({
  initialLoadingOptions = {},
  initialState = true,
}: UseLoadingInput = {}): [boolean, LoadingOptions, (properties: LoadingOptions) => void] => {
  const [loadingOptions, setLoadingOptions] = useState<LoadingOptions>(initialLoadingOptions)

  const setLoadOption = useCallback((properties: LoadingOptions) => {
    setLoadingOptions((oldValue) => {
      // Bail out of the update entirely when nothing actually changed, so that
      // repeated `setLoadOption({x: false})` calls cannot trigger re-renders.
      for (const key of Object.keys(properties)) {
        if (oldValue[key] !== properties[key]) return {...oldValue, ...properties}
      }
      return oldValue
    })
  }, [])

  const isLoading = useMemo(() => {
    const keys = Object.keys(loadingOptions)
    if (!keys.length) return initialState
    return keys.some((key) => loadingOptions[key])
  }, [loadingOptions, initialState])

  return [isLoading, loadingOptions, setLoadOption]
}

type Options = {[key: string]: Tag[]}
interface UseOptionsInput {
  initialState?: Tag[]
}

/**
 * Expands on a basic list of tag options by allowing groups of tags to be passed
 * @param initialState A list of tags (i.e. {label: string, value: string})
 * @returns An array containing a full list of tags, a list of tags keyed by respective groups, and a function to change/add a group of tag options respectively
 */
export const useOptions = ({initialState = EMPTY_TAGS}: UseOptionsInput = {}): [
  Tag[],
  Options,
  (properties: Options) => void,
] => {
  const [groupOptions, setGroupOptions] = useState<Options>({})

  const setTagOption = useCallback((properties: Options) => {
    setGroupOptions((oldValue) => ({...oldValue, ...properties}))
  }, [])

  const options = useMemo(() => {
    const keys = Object.keys(groupOptions)
    if (!keys.length) return filterUniqueTags(initialState)

    const opts: Tag[] = []
    for (const group of keys) {
      if (Array.isArray(groupOptions[group])) opts.push(...groupOptions[group])
    }

    return filterUniqueTags(opts)
  }, [groupOptions, initialState])

  return [options, groupOptions, setTagOption]
}
