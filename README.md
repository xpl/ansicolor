# ansicolor

[![Build Status](https://travis-ci.org/xpl/ansicolor.svg?branch=master)](https://travis-ci.org/xpl/ansicolor) [![Coverage Status](https://coveralls.io/repos/github/xpl/ansicolor/badge.svg)](https://coveralls.io/github/xpl/ansicolor) [![npm](https://img.shields.io/npm/v/ansicolor.svg)](https://npmjs.com/package/ansicolor) [![devDependencies Status](https://david-dm.org/xpl/ansicolor/dev-status.svg)](https://david-dm.org/xpl/ansicolor?type=dev)

A quality library for the ANSI color/style management. Small. Clean. No dependencies.

```bash
npm install ansicolor
```

## What for

- String coloring with ANSI escape codes
- Solves the [style hierarchy problem](#why-another-one) (where other similar tools fail)
- Parsing/removing ANSI style data from strings
- Converting ANSI styles to CSS or a Chrome DevTools-compatible output
- A middleware for your [platform-agnostic logging system](https://github.com/xpl/ololog)

## Why another one?

Other tools lack consistency, failing to solve a simple hierarchy problem:

```javascript
require ('colors') // a popular color utility

console.log (('foo'.cyan + 'bar').red)
```

![pic](http://cdn.jpg.wtf/futurico/85/9b/1470626860-859b24350e22df74fd7497e9dc0d8d42.png)

WTF?! The `bar` word above should be rendered in red, but it's not! It sucks. That is because ANSI codes are linear, not hierarchical (as with XML/HTML). A special kind of magic is needed to make this work. **Ansicolor** does that magic for you:

```javascript
require ('ansicolor').nice // .nice for unsafe String extensions

console.log (('foo'.cyan + 'bar').red)
```

![pic](http://cdn.jpg.wtf/futurico/3c/61/1470626989-3c61b64d0690b0b413be367841650426.png)

Nice!

## Crash course

### Safe mode (default)

```javascript
ansi = require ('ansicolor')
```
```javascript
console.log ('foo' + ansi.green (ansi.inverse (ansi.bgBrightCyan ('bar')) + 'baz') + 'qux')
```
```javascript
console.log (ansi.underline.bright.green ('foo' + ansi.dim.red.bgBrightCyan ('bar'))) // method chaining
```

### Nice mode (by request)

```javascript
ansi = require ('ansicolor').nice
```

The `('ansicolor').nice` export defines styling APIs on the `String` prototype directly. It uses an ad-hoc DSL (sort of) for infix-style string coloring. The `nice` is convenient, but not safe, avoid using it in public modules, as it may alter global objects causing potential hard-to-debug compatibility issues.

```javascript
console.log ('foo'.red.bright + 'bar'.bgYellow.underline.dim)
```

### Supported styles

```javascript
'foreground colors'
    .black.red.green.yellow.blue.magenta.cyan.white
```
```javascript
'background colors'
    .bgBlack.bgRed.bgGreen.bgYellow.bgBlue.bgMagenta.bgCyan.bgWhite
```
```javascript
'bright background colors'
    .bgBrightBlack.bgBrightRed.bgBrightGreen.bgBrightYellow.bgBrightBlue.bgBrightMagenta.bgBrightCyan.bgBrightWhite
```
```javascript
'styles'
    .bright.dim.italic.underline.inverse // your platform should support italic
```

You also can use these method names programmatically:

```javascript
ansi.names // [ 'black', 'bgBlack', 'bgBrightBlack', 'red', 'bgRed', ...
```

## Removing ANSI styles from a string

```javascript
ansi.strip ('\u001b[0m\u001b[4m\u001b[42m\u001b[31mfoo\u001b[39m\u001b[49m\u001b[24mfoo\u001b[0m')) // 'foofoo'
```

## Reading style information / CSS output

Inspection of ANSI styles in arbitrary strings is essential when implementing platform-agnostic logging — that piece of code is available under command line interface and in a browser as well. Here's an example of how you would parse a colored string into an array-like structure. That structure can be traversed later to build HTML/JSON/XML or any other markup/syntax.

```javascript
const parsed = ansi.parse ('foo'.bgBrightRed.bright.italic + 'bar'.red.dim)
```

The `ansi.parse ()` method will return a pseudo-array of styled spans, you can iterate over it with a `for ... of` loop and convert it to an array with *spread operator*. Also, there's the `.spans` property for obtaining the already-spread array directly:

```javascript
assert.deepEqual (parsed.spans /* or [...parsed] */,

    [ { css: 'font-weight: bold;font-style: italic;background:rgba(255,51,0,1);',
        italic: true,
        bold: true,
        color: { bright: true },
        bgColor: { name: 'red', bright: true },
        text: 'foo' },

      { css: 'color:rgba(204,0,0,0.5);',
        color: { name: 'red', dim: true },
        text: 'bar' } ])
```

### Custom color theme

You can change the default RGB values:

```javascript
ansi.rgb = {

    black:   [0,     0,   0],
    red:     [204,   0,   0],
    green:   [0,   204,   0],
    yellow:  [204, 102,   0],
    blue:    [0,     0, 255],
    magenta: [204,   0, 204],
    cyan:    [0,   153, 255],
    white:   [255, 255, 255]
}

ansi.rgbBright = {

    black:   [0,     0,   0],
    red:     [255,  51,   0],
    green:   [51,  204,  51],
    yellow:  [255, 153,  51],
    blue:    [26,  140, 255],
    magenta: [255,   0, 255],
    cyan:    [0,   204, 255],
    white:   [255, 255, 255]
}
```

## Chrome DevTools compatibility

Web browsers usually implement their own proprietary CSS-based color formats for `console.log` and most of them fail to display standard ANSI colors. _Ansicolor_ offers you a helper method to convert ANSI-styled strings to browser-compatible argument lists acceptable by Chrome's `console.log`:

```javascript
const string = 'foo' + ('bar'.red.underline.bright.inverse + 'baz').bgGreen
const parsed = ansi.parse (string)

console.log (...parsed.asChromeConsoleLogArguments) // prints with colors in Chrome!
```

Here's what the format looks like:

```javascript
parsed.asChromeConsoleLogArguments // [ "%cfoo%cbar%cbaz",
                                   //   "",
                                   //   "font-weight: bold;text-decoration: underline;background:rgba(255,51,0,1);color:rgba(0,204,0,1);",
                                   //   "background:rgba(0,204,0,1);"
                                   // ]
```

Play with this feature online: [demo page](https://xpl.github.io/ansicolor/). Open the DevTools console and type expressions in the input box to see colored console output.

Happy logging!

## See also

- [Ololog!](https://github.com/xpl/ololog)
