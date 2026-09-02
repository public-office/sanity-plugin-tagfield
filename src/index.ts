import {definePlugin} from 'sanity'

import {tagSchema} from './schemas/tag'
import {tagsSchema} from './schemas/tags'

/**
 * Reserved for future configuration. The plugin currently takes no options.
 *
 * @public
 */
export type TagsPluginConfig = Record<string, never>

/**
 * @public
 */
export const tags = definePlugin<TagsPluginConfig | void>(() => ({
  name: 'sanity-plugin-tagfield',
  schema: {
    types: [tagSchema, tagsSchema],
  },
}))

export {TagsInput} from './components/TagsInput'
export {tagSchema} from './schemas/tag'
export {tagsSchema} from './schemas/tags'
export type {
  GeneralTag,
  InputOptions,
  PredefinedTags,
  RefTag,
  RefinedTags,
  SelectComponents,
  SelectProps,
  SelectStyles,
  Tag,
  TagsInputProps,
  TagsSchema,
  TagsSelectInstance,
  UnrefinedTags,
} from './types'
