# PostCSS Old Safari Logical Properties Polyfill

[PostCSS](https://github.com/postcss/postcss) plugin that polyfill logical properties that are not supported in Safari 12–14:
- inset-*
  - inset-block-start
  - inset-block-end
  - inset-inline-start
  - inset-inline-end
- logical border-radius:
  - border-start-start-radius
  - border-start-end-radius
  - border-end-start-radius
  - border-end-end-radius

## Install

Npm:

```
npm install -D postcss-old-safari-logical-properties-polyfill
```

Yarn:

```
yarn add -D postcss-old-safari-logical-properties-polyfill
```

## Usage

See [PostCSS docs](https://github.com/postcss/postcss-load-config#usage) for examples how to enable the plugin for your environment. Use `postcss-old-safari-logical-properties-polyfill` instead of `postcss-plugin` in the examples.

The plugin supports options listed below.

```js
const pluginOptions = {
    preserve: true, // If set to false, polyfilled properties will be removed
}
```

## Known issues

- May lead to infinite loop with `preserve: true`.
- Unnecessary ltr/rtl duplication for `top`/`bottom` rules.

---
Based on [erickskrauch/postcss-logical-properties-polyfill](https://github.com/erickskrauch/postcss-logical-properties-polyfill).