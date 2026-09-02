import {SchemaTypeDefinition} from 'sanity'

import {TagsInput} from '../components/TagsInput'

/**
 * @public
 */
export const tagsSchema: SchemaTypeDefinition = {
  name: 'tags',
  title: 'Tags',
  type: 'array',
  components: {
    input: TagsInput,
  },
  of: [{type: 'tag'}],
}
