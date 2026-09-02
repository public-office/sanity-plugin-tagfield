# sanity-plugin-tagfield

> This is a **Sanity Studio v4 / v5 / v6** plugin, built for **React 19**.
>
> A maintained fork of [`sanity-plugin-tags`](https://github.com/pcbowers/sanity-plugin-tags)
> by P Christopher Bowers, rewritten for React 19. MIT, as the original.

A multi-tag input for sanity studio. Fully featured with autocomplete capabilities, live updates, predefined tag options, style and component customizability, and much more.

## Install

```sh
npm install sanity-plugin-tagfield
```

### Requirements

| Requirement       | Supported               |
| ----------------- | ----------------------- |
| React             | 19                      |
| Sanity Studio     | v4, v5, v6              |
| styled-components | 6.1+                    |
| Node              | >=20.19 <22, or >=22.12 |

React 19 is required rather than optional: `@sanity/ui` v4 imports
`react/compiler-runtime`, which only exists in React 19, and Sanity Studio v5+
dropped React 18 outright. Studios still on React 18 should stay on
`sanity-plugin-tags@2` (the upstream package).

The package is published as **ESM only**, matching Sanity Studio v5+. Node's
`require(esm)` support means a CommonJS consumer still loads it correctly.

## Use

Add it as a plugin in `sanity.config.ts` (or .js):

```ts
import {defineConfig} from 'sanity'
import {tags} from 'sanity-plugin-tagfield'

export default defineConfig({
  //...
  plugins: [tags({})],
})
```

Simply use 'tag' or 'tags' as a type (single or multi select respectively) in your fields. If you want autocompletion, set the `includeFromRelated` option to the name of your field.

That's it! It will even update the autocompletion list live as changes are made to other documents!

Dive into the [Options Section](#options) for more advanced use cases like predefined tags and the `onCreate` hook.

```javascript
{
  name: 'myTags',
  title: 'Tags',
  type: 'tags',
  options: {
    includeFromRelated: 'myTags'
    ...
  }
}
```

## Options

```typescript
{
  name: string,
  type: "tags" | "tag",
  options: {
    predefinedTags?: Tag | Tag[] | () => Tag[] | Tag | () => Promise<Tag[] | Tag>
    includeFromReference?: false | string
    includeFromRelated?: false | string
    customLabel?: string
    customValue?: string
    allowCreate?: boolean
    onCreate?: (inputValue: string) => Tag | Promise<Tag>
    checkValid?: (inputValue: string, currentValues: string[]) => boolean
    reactSelectOptions?: {
      [key: string]: any
    }
  },
  //... all other Sanity Properties
},
```

### What is a Tag?

A tag is simply an object with a label and value. Example:

```json
{
  "label": "My Tag",
  "value": "my-tag"
}
```

This can be used for all sorts of things: categorization, single select, and much more. Essentially, if you want to limit people to a single or multi list of strings, tags will fit your use case perfectly.

### predefinedTags

`default: []`

This option allows you to add any tags that you would like to the autocomplete list. This can take any form from a single tag to an array of tags, to a function that dynamically returns a tag or tags.

```javascript
{
  // ...
  predefinedTags: { label: "My Tag", value: 'my-tag' }
  // ...
}
```

```javascript
{
  // ...
  predefinedTags: [
    {label: 'My Tag 1', value: 'my-tag-1'},
    {label: 'My Tag 2', value: 'my-tag-2'},
  ]
  // ...
}
```

```javascript
{
  // ...
  predefinedTags: async () => client.fetch(...)
  // ...
}
```

### includeFromReference

`default: false`

If you already have a sanity schema that contains a tag-like structure and want to add them to the autocomplete list, set this option to the name of your sanity schema document. This option applies no filters. If you would like to filter, use the `predefinedTags` option.

```javascript
{
  // ...
  includeFromReference: 'category'
  // ...
}
```

### includeFromRelated

`default: false`

This option is similar to `includeFromReference`, but it allows you to add to the autocomplete list from a field in the related document. Typically, you would set this option to the name of the current field to allow autocompletion for tags that were already selected previously.

```javascript
{
  // ...
  includeFromRelated: 'category'
  // ...
}
```

### customLabel

`default: 'label'`

If you want to change the label key for your tags, set this option. Useful when you want to use the default label key to store some other value.

_Note: If you set this option, all tags specified by `predefinedTags` and the structure returned by `onCreate` **must** use this custom label_

```javascript
{
  // ...
  customLabel: 'myLabelKey'
  // ...
}
```

### customValue

`default: 'value'`

If you want to change the value key for your tags, set this option. Useful when you want to use the default value key to store some other value.

_Note: If you set this option, all tags specified by `predefinedTags` and the structure returned by `onCreate` **must** use this custom value_

```javascript
{
  // ...
  customValue: 'myValueKey'
  // ...
}
```

### allowCreate

`default: true`

By default, new tags can be created inline from this input. If you implement the input with a reference, this does not work. See [Parts](#parts) for more information.

```javascript
{
  // ...
  allowCreate: false
  // ...
}
```

### onCreate

`default: (value) => ({ [customLabel]: value, [customValue]: value})`

If you want to edit the label or value of the tag when a new one is created before saving it, use this hook. You do **not** need to specify this property if you set `customLabel` or `customValue` and like the default value. If you do specify it, make sure it returns an object that contains the custom label key and the custom value key. This hook provides an easy solution for 'slugifying' the label.

```javascript
{
  // ...
  onCreate: (value) => ({
    label: value,
    value: value.toLowerCase().replace(/\W/g, '-'),
  })
  // ...
}
```

### checkValid

`default: (inputValue: string, currentValues: string[]) => !currentValues.includes(inputValue) && !!inputValue && inputValue.trim() === inputValue`

This allows you to check the validity of a tag when creation is allowed. `inputValue` contains the string of the input while `currentValues` contains an array of strings that represent all of the values of any options available to select as well as any already-selected options.

```javascript
{
  // ...
  checkValid: (input, values) => {
    return (
      !!input &&
      input.trim() === input &&
      !values.includes(input.trim().toLowerCase().replace(/\W/g, '-'))
    )
  }
  // ...
}
```

### reactSelectOptions

`default: {}`

The input component uses [React Select](https://react-select.com/home) under the hood. If you want to change and override any of the options passed to the select component, specify this option. Specify this option at your own risk!

If you want to override React Select's components see [Parts](#parts) for more information.

```javascript
{
  // ...
  reactSelectOptions: {
    closeMenuOnSelect: false
  }
  // ...
}
```

## Develop & test

```sh
npm install
npm run build      # verify the package and build dist/
npm run typecheck  # tsc --noEmit
npm run lint       # oxlint
npm run format     # oxfmt
npm run link-watch # hot-reload into a local studio
```

## Contribute

I love feedback, and any help is appreciated! Feel free to install the plugin, submit an issue, or open a PR.

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.

## A note on the build config

`tsconfig.dist.json` sets `"jsx": "react-jsx"` and `package.json` disables
plugin-kit's `tsconfig` check. plugin-kit recommends `"jsx": "preserve"`, but
`@sanity/pkg-utils` v12 reads the JSX mode from that file — with `preserve` it
emits **raw, untranspiled JSX into `dist/`**, which throws
`SyntaxError: Unexpected token '<'` in any consumer that does not transform
JSX inside `node_modules`. `react-jsx` produces the correct
`react/jsx-runtime` output.

## Migrating from sanity-plugin-tags

This package keeps the schema types, the field shape and every documented option
of `sanity-plugin-tags` v2, so a studio moving across needs no changes beyond
swapping the dependency and the import. Be aware of the following:

- **ESM only.** `main`, `module` and the `require` export condition are gone.
- **React 19 required.** `react-select` is now `^5.10.2`, the first release to
  declare React 19 support. React 18 studios should stay on `sanity-plugin-tags@2`.
- **`TagsInput` no longer forwards a ref.** Sanity's form builder never passed
  one, so the old `forwardRef` wrapper forwarded a ref that nothing supplied.
  React 19 also no longer needs `forwardRef`.
- **The Sanity v2 compatibility shim was removed**, along with `sanity.json` and
  the `@sanity/incompatible-plugin` dependency.
- **Theming follows the Studio, not the OS.** Colours are read from Sanity UI's
  CSS custom properties instead of swapping a stylesheet based on
  `usePrefersDark()`, so a Studio forced to light while the OS is dark now
  renders correctly. This also removed the PostCSS build step.

### Fixes that change stored data

- **Multi-reference tag fields now write a `_key`.** Previously reference array
  items were saved without one, which Sanity reports as "missing keys".
- **Clearing a field now emits `unset()`** instead of writing an empty array.
- **`_key` falls back sensibly.** An existing `_key` is preserved, so upgrading
  does not churn keys on existing documents. Fields configured with a
  `customValue` path previously produced an `undefined` key.

## Acknowledgements

This plugin is based off of [sanity-plugin-autocomplete-tags](https://github.com/rosnovsky/sanity-plugin-autocomplete-tags), though it enhances it by adding a couple additional options while improving support for default sanity values like `initialValues` and `readOnly`.
