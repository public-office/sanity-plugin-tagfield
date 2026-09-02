import type {
  GroupBase,
  Props,
  SelectComponentsConfig,
  SelectInstance,
  StylesConfig,
} from 'react-select'
import type {CreatableProps} from 'react-select/creatable'
import type {Subscription} from 'rxjs'
import type {
  ArrayOfObjectsInputProps,
  ArraySchemaType,
  ObjectInputProps,
  ObjectSchemaType,
  ReferenceSchemaType,
} from 'sanity'

/**
 * @public
 */
export type GeneralSubscription = Subscription | {unsubscribe: () => any}

/**
 * @public
 */
export interface RefTag {
  _key?: string
  _ref: string
  _type: string
}

/**
 * @public
 */
export interface GeneralTag {
  [key: string]: any
}

/**
 * @public
 */
export interface Tag {
  _type: 'tag'
  _key: string
  label: string
  value: string
  [key: string]: any
}

/**
 * @public
 */
export type UnrefinedTags = RefTag | GeneralTag | RefTag[] | GeneralTag[] | undefined

/**
 * @public
 */
export type RefinedTags = Tag | Tag[] | undefined

/**
 * @public
 */
export type PredefinedTags =
  | GeneralTag[]
  | RefTag[]
  | GeneralTag
  | RefTag
  | (() => Promise<GeneralTag[] | RefTag[] | GeneralTag | RefTag>)
  | (() => GeneralTag[] | RefTag[] | GeneralTag | RefTag)

/**
 * @public
 */
export interface InputOptions {
  predefinedTags?: PredefinedTags
  includeFromReference?: false | string
  includeFromRelated?: false | string
  customLabel?: string
  customValue?: string
  allowCreate?: boolean
  onCreate?: (inputValue: string) => GeneralTag | Promise<GeneralTag>
  checkValid?: (inputValue: string, currentValues: string[]) => boolean
  reactSelectOptions?: Props<Tag, boolean, GroupBase<Tag>>
}

/**
 * @public
 */
export type SelectProps<IsMulti extends boolean = true> = Props<Tag, IsMulti, GroupBase<Tag>>
/**
 * @public
 */
export type SelectComponents<IsMulti extends boolean = true> = SelectComponentsConfig<
  Tag,
  IsMulti,
  GroupBase<Tag>
>
/**
 * The props actually handed to `react-select`. `isValidNewOption` and friends
 * live on the creatable variant only, so the two prop sets are combined rather
 * than papered over with a cast.
 *
 * @public
 */
export type TagsSelectProps = SelectProps<boolean> &
  Partial<CreatableProps<Tag, boolean, GroupBase<Tag>>>

/**
 * @public
 */
export type SelectStyles<IsMulti extends boolean = boolean> = StylesConfig<
  Tag,
  IsMulti,
  GroupBase<Tag>
>

/**
 * The imperative handle exposed by `react-select`. Replaces the previous deep
 * import of `react-select/dist/declarations/src/stateManager`, which reached
 * into the package internals and broke under modern module resolution.
 *
 * @public
 */
export type TagsSelectInstance = SelectInstance<Tag, boolean, GroupBase<Tag>>

/**
 * @public
 */
export type InputType = (ArraySchemaType | ReferenceSchemaType | ObjectSchemaType) & {
  options?: InputOptions
}

type TagSchema = ObjectSchemaType & {options?: InputOptions}
type TagArraySchema = ArraySchemaType & {options?: InputOptions}
type TagRefSchema = ReferenceSchemaType & {options?: InputOptions}

/**
 * @public
 */
export type TagsSchema = TagSchema | TagArraySchema | TagRefSchema

type TagInputProps = ObjectInputProps<Tag, TagSchema>
type TagArrayInputProps = ArrayOfObjectsInputProps<Tag, TagArraySchema>
type TagRefInputProps = ObjectInputProps<Tag, TagRefSchema>
type TagRefArrayInputProps = ArrayOfObjectsInputProps<Tag, TagArraySchema>

/**
 * @public
 */
export type TagsInputProps =
  | TagInputProps
  | TagArrayInputProps
  | TagRefInputProps
  | TagRefArrayInputProps
