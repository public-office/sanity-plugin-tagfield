import type {SelectStyles} from '../types'

/**
 * Sanity UI paints its theme onto every `Card` as CSS custom properties, and the
 * tag input is always rendered inside one. Reading those variables means the
 * select inherits whatever scheme the Studio has actually resolved.
 *
 * The previous implementation swapped a CSS module in and out based on
 * `usePrefersDark()`, which reports the *operating system* preference. That is
 * the wrong signal: a Studio explicitly set to light while the OS is dark (or
 * vice versa) rendered an unreadable input. Deriving from the custom properties
 * also lets the plugin drop its PostCSS build step entirely.
 */
const color = {
  bg: 'var(--card-bg-color, #fff)',
  fg: 'var(--card-fg-color, #101112)',
  inputFg: 'var(--input-fg-color, var(--card-fg-color, #101112))',
  border: 'var(--card-border-color, #ced2d9)',
  mutedFg: 'var(--card-muted-fg-color, #6e7683)',
  focusRing: 'var(--card-shadow-outline-color, #2276fc)',
} as const

/**
 * Base react-select styles that follow the active Sanity Studio theme.
 *
 * Consumers can still override any of these through the `reactSelectOptions`
 * schema option; those overrides are merged on top of this object.
 */
export const themeAwareStyles: SelectStyles = {
  container: (base) => ({
    ...base,
    fontFamily: 'inherit',
  }),
  control: (base, state) => ({
    ...base,
    'backgroundColor': color.bg,
    'borderColor': state.isFocused ? color.focusRing : color.border,
    'boxShadow': state.isFocused ? `0 0 0 1px ${color.focusRing}` : 'none',
    'transition': 'none',
    '&:hover': {
      borderColor: state.isFocused ? color.focusRing : color.border,
    },
  }),
  input: (base) => ({
    ...base,
    color: color.inputFg,
  }),
  placeholder: (base) => ({
    ...base,
    color: color.mutedFg,
  }),
  singleValue: (base) => ({
    ...base,
    color: color.inputFg,
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: color.bg,
    border: `1px solid ${color.border}`,
    // Keeps the dropdown above neighbouring form fields.
    zIndex: 15,
  }),
  menuPortal: (base) => ({
    ...base,
    // Portalled menus escape the Studio's stacking contexts, so they need to
    // clear dialogs and popovers rather than sibling fields.
    zIndex: 200000,
  }),
  option: (base, state) => ({
    ...base,
    'backgroundColor': state.isFocused || state.isSelected ? color.border : color.bg,
    'color': color.fg,
    '&:active': {
      backgroundColor: color.border,
    },
  }),
  groupHeading: (base) => ({
    ...base,
    color: color.mutedFg,
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: color.mutedFg,
  }),
  loadingMessage: (base) => ({
    ...base,
    color: color.mutedFg,
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: color.border,
  }),
  dropdownIndicator: (base) => ({
    ...base,
    'color': color.mutedFg,
    '&:hover': {color: color.fg},
  }),
  clearIndicator: (base) => ({
    ...base,
    'color': color.mutedFg,
    '&:hover': {color: color.fg},
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: color.border,
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: color.fg,
  }),
  multiValueRemove: (base) => ({
    ...base,
    'color': color.fg,
    '&:hover': {
      backgroundColor: 'transparent',
      color: '#de350b',
    },
  }),
}
