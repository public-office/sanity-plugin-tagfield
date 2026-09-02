import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import Select from 'react-select'
import type {GroupBase, MultiValue, OptionsOrGroups, SingleValue} from 'react-select'
import CreatableSelect from 'react-select/creatable'
import {set, unset, useFormValue} from 'sanity'

import type {
  GeneralSubscription,
  GeneralTag,
  InputOptions,
  RefinedTags,
  SelectProps,
  Tag,
  TagsInputProps,
  TagsSelectProps,
} from '../types'
import {useClient} from '../utils/client'
import {isSchemaMulti, isSchemaReference, setAtPath} from '../utils/helpers'
import {useLoading, useOptions} from '../utils/hooks'
import {prepareTags, revertTags} from '../utils/mutators'
import {
  getPredefinedTags,
  getSelectedTags,
  getTagsFromReference,
  getTagsFromRelated,
} from '../utils/observables'
import {ReferenceCreateWarning, ReferencePredefinedWarning} from './ReferenceWarnings'
import {themeAwareStyles} from './selectStyles'

// TODO: Allow reference creation inline
// TODO: Allow reference merging inline (stretch ??)
// TODO: Allow reference editing inline (stretch ??)
// TODO: Allow reference deleting inline (stretch ??)
// TODO: Allow object merging inline (stretch ??)
// TODO: Allow object editing inline (stretch ??)
// TODO: Allow object deleting inline (stretch ??)

// Stable identities, so that the defaults below never re-trigger the effects
// that depend on them.
const NO_PREDEFINED_TAGS: GeneralTag[] = []
const NO_SELECT_OPTIONS: SelectProps<boolean> = {}

/** The value shape `react-select` hands back on change. */
type SelectValue = MultiValue<Tag> | SingleValue<Tag>

const isTagArray = (value: SelectValue): value is readonly Tag[] => Array.isArray(value)

const warn = (message: string, error: unknown) =>
  console.error(`[sanity-plugin-tagfield] ${message}`, error)

/**
 * Flattens `react-select`'s option list, which may contain groups, into the
 * plain list of tags that `checkValid` is documented to receive.
 */
const flattenOptions = (options: OptionsOrGroups<Tag, GroupBase<Tag>>): Tag[] => {
  const flat: Tag[] = []
  for (const option of options) {
    if (!option) continue
    if ('options' in option) flat.push(...option.options)
    else flat.push(option)
  }
  return flat
}

/**
 * The tag input rendered by the `tag` and `tags` schema types.
 *
 * This is a plain function component: Sanity's form builder never passes a ref
 * to a custom input, so the previous `forwardRef` wrapper forwarded a ref that
 * nothing ever supplied. Dropping it also keeps the component clear of
 * `forwardRef`, which React 19 no longer needs.
 *
 * @public
 */
export const TagsInput = (props: TagsInputProps) => {
  const {
    id, // Stable element id supplied by the form builder
    schemaType, // Schema information
    value, // Current field value
    readOnly, // Boolean if field is not editable
    onChange, // Method to handle patch events
  } = props

  const client = useClient()
  const formDocumentType = useFormValue(['_type'])
  const documentType = typeof formDocumentType === 'string' ? formDocumentType : undefined

  const [selected, setSelected] = useState<RefinedTags>(undefined)
  const [isLoading, , setLoadOption] = useLoading()
  const [options, , setTagOption] = useOptions()

  // get schema types (whether or not array, whether or not reference)
  const isMulti = isSchemaMulti(schemaType)
  const isReference = isSchemaReference(schemaType)

  // Resolve every option once per schema definition. `schemaType.options` is
  // built when the Studio boots and is stable thereafter, so this hands the
  // effects below stable dependencies instead of freshly-allocated defaults.
  const {
    predefinedTags,
    hasPredefinedTags,
    includeFromReference,
    includeFromRelated,
    customLabel,
    customValue,
    allowCreate,
    onCreate,
    checkValid,
    reactSelectOptions,
  } = useMemo(() => {
    const opts: InputOptions = schemaType.options ?? {}
    const resolvedLabel = opts.customLabel ?? 'label'
    const resolvedValue = opts.customValue ?? 'value'

    return {
      predefinedTags: opts.predefinedTags ?? NO_PREDEFINED_TAGS,
      hasPredefinedTags: opts.predefinedTags !== undefined,
      includeFromReference: opts.includeFromReference ?? false,
      includeFromRelated: opts.includeFromRelated ?? false,
      customLabel: resolvedLabel,
      customValue: resolvedValue,
      allowCreate: opts.allowCreate ?? true,
      onCreate:
        opts.onCreate ??
        (async (inputValue: string): Promise<GeneralTag> => {
          const tag: GeneralTag = {}
          setAtPath(tag, resolvedLabel, inputValue)
          setAtPath(tag, resolvedValue, inputValue)
          return tag
        }),
      checkValid:
        opts.checkValid ??
        ((inputValue: string, currentValues: string[]) =>
          !currentValues.includes(inputValue) && !!inputValue && inputValue.trim() === inputValue),
      reactSelectOptions: opts.reactSelectOptions ?? NO_SELECT_OPTIONS,
    }
  }, [schemaType.options])

  // check if reference warnings need to be generated
  const hasOptions = schemaType.options !== undefined
  const isReferenceCreateWarning = hasOptions && allowCreate && isReference
  const isReferencePredefinedWarning = hasOptions && hasPredefinedTags && isReference

  // Subscribe to every source of *selectable* options. Keyed on the resolved
  // schema options rather than running once on mount, so that the input still
  // behaves if any of them change.
  useEffect(() => {
    const subscriptions: GeneralSubscription[] = []

    setLoadOption({predefinedTags: true, referenceTags: true, relatedTags: true})

    subscriptions.push(
      getPredefinedTags({client, predefinedTags, customLabel, customValue}).subscribe({
        next: (tags) => {
          setTagOption({predefinedTags: tags})
          setLoadOption({predefinedTags: false})
        },
        // Without an error handler a failed query left `isLoading` true forever,
        // which permanently disabled the input.
        error: (error: unknown) => {
          warn('could not load predefined tags', error)
          setLoadOption({predefinedTags: false})
        },
      }),
    )

    if (typeof includeFromReference === 'string') {
      subscriptions.push(
        getTagsFromReference({
          client,
          document: includeFromReference,
          customLabel,
          customValue,
        }).subscribe({
          next: (tags) => {
            setTagOption({referenceTags: tags})
            setLoadOption({referenceTags: false})
          },
          error: (error: unknown) => {
            warn(`could not load tags from reference "${includeFromReference}"`, error)
            setLoadOption({referenceTags: false})
          },
        }),
      )
    } else {
      setLoadOption({referenceTags: false})
    }

    if (typeof includeFromRelated === 'string' && documentType) {
      subscriptions.push(
        getTagsFromRelated({
          client,
          documentType,
          field: includeFromRelated,
          isMulti,
          customLabel,
          customValue,
        }).subscribe({
          next: (tags) => {
            setTagOption({relatedTags: tags})
            setLoadOption({relatedTags: false})
          },
          error: (error: unknown) => {
            warn(`could not load tags related by "${includeFromRelated}"`, error)
            setLoadOption({relatedTags: false})
          },
        }),
      )
    } else {
      setLoadOption({relatedTags: false})
    }

    // unsubscribe on unmount
    return () => subscriptions.forEach((subscription) => subscription.unsubscribe())
  }, [
    client,
    customLabel,
    customValue,
    documentType,
    includeFromReference,
    includeFromRelated,
    isMulti,
    predefinedTags,
    setLoadOption,
    setTagOption,
  ])

  // Resolve the stored field value into react-select's shape. Serialising the
  // value gives the effect a primitive dependency, so it re-runs whenever the
  // document actually changes -- including patches that arrive from elsewhere,
  // such as another editor, an undo, or a real-time update. Previously this ran
  // only on mount and the displayed tags silently drifted from the document.
  const valueKey = useMemo(() => JSON.stringify(value ?? null), [value])
  const hasResolvedValue = useRef(false)

  useEffect(() => {
    // Only gate the input on the very first resolution; re-syncing after an edit
    // must not disable the select mid-interaction.
    if (!hasResolvedValue.current) setLoadOption({selectedTags: true})

    const subscription = getSelectedTags({
      client,
      tags: value,
      customLabel,
      customValue,
      isMulti,
    }).subscribe({
      next: (tags) => {
        setSelected(tags)
        hasResolvedValue.current = true
        setLoadOption({selectedTags: false})
      },
      error: (error: unknown) => {
        warn('could not resolve the selected tags', error)
        hasResolvedValue.current = true
        setLoadOption({selectedTags: false})
      },
    })

    return () => subscription.unsubscribe()
    // `value` is deliberately tracked through `valueKey` so that structurally
    // identical values do not trigger a refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey, client, customLabel, customValue, isMulti, setLoadOption])

  // handle any change made to the select
  const handleChange = useCallback(
    (inputValue: SelectValue) => {
      // react-select hands back a readonly array for multi selects; copy it so
      // the rest of the pipeline can treat tags as a plain mutable list.
      const nextValue: RefinedTags = isTagArray(inputValue)
        ? [...inputValue]
        : (inputValue ?? undefined)

      // set the new option
      setSelected(nextValue)

      // revert the tags to their initial values for saving
      const tagsForEvent = revertTags({
        tags: nextValue,
        customLabel,
        customValue,
        isMulti,
        isReference,
      })

      // An emptied field must be unset rather than written as `[]`, which would
      // otherwise leave an empty array behind in the document.
      const isEmpty =
        tagsForEvent === undefined || (Array.isArray(tagsForEvent) && tagsForEvent.length === 0)

      onChange(isEmpty ? unset() : set(tagsForEvent))
    },
    [customLabel, customValue, isMulti, isReference, onChange],
  )

  // when new options are created, use this to handle it
  const handleCreate = useCallback(
    async (inputValue: string) => {
      // since an await is used, briefly set the load state to true
      setLoadOption({handleCreate: true})

      try {
        // prepare the tag based on the option onCreate
        const newCreateValue = await prepareTags({
          client,
          customLabel,
          customValue,
          tags: await onCreate(inputValue),
        })

        if (newCreateValue === undefined) return

        // now that the option is created, pass to the handleChange function
        if (Array.isArray(selected)) {
          const created = Array.isArray(newCreateValue) ? newCreateValue : [newCreateValue]
          handleChange([...selected, ...created])
        } else {
          handleChange(Array.isArray(newCreateValue) ? newCreateValue : newCreateValue)
        }
      } catch (error) {
        warn(`could not create the tag "${inputValue}"`, error)
      } finally {
        // unset the load state
        setLoadOption({handleCreate: false})
      }
    },
    [client, customLabel, customValue, handleChange, onCreate, selected, setLoadOption],
  )

  // set up the options for react-select
  const selectOptions: TagsSelectProps = {
    inputId: id,
    instanceId: id,
    isLoading,
    isMulti,
    options,
    // `undefined` would flip react-select into uncontrolled mode and strand the
    // last rendered selection on screen; `null` is its documented empty value.
    value: selected ?? null,
    isValidNewOption: (
      inputValue: string,
      selectValue: readonly Tag[],
      selectOptionsList: OptionsOrGroups<Tag, GroupBase<Tag>>,
    ) => {
      return checkValid(inputValue, [
        ...flattenOptions(selectOptionsList).map((opt) => opt.value),
        ...selectValue.map((val) => val.value),
      ])
    },
    onCreateOption: handleCreate,
    onChange: handleChange,
    isDisabled: readOnly || isLoading,
    ...reactSelectOptions,
    // Merge per-key so a consumer overriding one slot keeps the themed rest.
    styles: {...themeAwareStyles, ...reactSelectOptions.styles},
  }

  return (
    <>
      {isReferenceCreateWarning && <ReferenceCreateWarning />}
      {isReferencePredefinedWarning && <ReferencePredefinedWarning />}
      {allowCreate && !isReference ? (
        <CreatableSelect {...selectOptions} />
      ) : (
        <Select {...selectOptions} />
      )}
    </>
  )
}
