# ansicolor

[![Build Status](https://travis-ci.org/xpl/ansicolor.svg?branch=master)](https://travis-ci.org/xpl/ansicolor) [![Coverage Status](https://coveralls.io/repos/github/xpl/ansicolor/badge.svg)](https://coveralls.io/github/xpl/ansicolor) [![npm](https://img.shields.io/npm/v/ansicolor.svg)](https://npmjs.com/package/ansicolor) [![dependencies Status](https://david-dm.org/xpl/ansicolor/status.svg)](https://david-dm.org/xpl/ansicolor)

A JavaScript ANSI color/style management. ANSI parsing. ANSI to CSS. Small, clean, no dependencies.

```bash
npm install ansicolor
```

## What For

- String coloring with ANSI escape codes
- Solves the [style hierarchy problem](#why-another-one) (when other similar tools fail)
- Parsing/removing ANSI style data from strings
- Converting ANSI styles to CSS or a Chrome DevTools-compatible output
- A middleware for your [platform-agnostic logging system](https://github.com/xpl/ololog)

## Why Another One?

Other tools lack consistency, failing to solve a simple hierarchy problem:

```javascript
require ('colors') // a popular color utility

console.log (('foo'.cyan + 'bar').red)
```

![pic](http://cdn.jpg.wtf/futurico/85/9b/1470626860-859b24350e22df74fd7497e9dc0d8d42.png)

WTF?! The `bar` word above should be rendered in red, but it's not! That sucks. It's because ANSI codes are linear, not hierarchical (as with XML/HTML). A special kind of magic is needed to make this work. **Ansicolor** does that magic for you:

```javascript
require ('ansicolor').nice // .nice for unsafe String extensions

console.log (('foo'.cyan + 'bar').red)
```

![pic](http://cdn.jpg.wtf/futurico/3c/61/1470626989-3c61b64d0690b0b413be367841650426.png)

Nice!

## Crash Course

Importing (as methods):

```javascript
import { green, inverse, bgLightCyan, underline, dim } from 'ansicolor'
```
```javascript
const { green, inverse, bgLightCyan, underline, dim } = require ('ansicolor')
```

Usage:

```javascript
console.log ('foo' + green (inverse (bgLightCyan ('bar')) + 'baz') + 'qux')
```
```javascript
console.log (underline.bright.green ('foo' + dim.red.bgLightCyan ('bar'))) // method chaining
```

Importing (as object):

```javascript
import { ansicolor, ParsedSpan } from 'ansicolor' // along with type definitions
```
```javascript
import ansicolor from 'ansicolor'
```

### Nice Mode (not recommended)

```javascript
const ansi = require ('ansicolor').nice
```

The `('ansicolor').nice` export defines styling APIs on the `String` prototype directly. It uses an ad-hoc DSL (sort of) for infix-style string coloring. The `nice` is convenient, but not safe, avoid using it in public modules, as it alters global objects, and that might cause potential hard-to-debug compatibility issues.

```javascript
console.log ('foo'.red.bright + 'bar'.bgYellow.underline.dim)
```

### Supported Styles

```javascript
'foreground colors'
    .red.green.yellow.blue.magenta.cyan.white.darkGray.black
```
```javascript
'light foreground colors'
    .lightRed.lightGreen.lightYellow.lightBlue.lightMagenta.lightCyan.lightGray
```
```javascript
'background colors'
    .bgRed.bgGreen.bgYellow.bgBlue.bgMagenta.bgCyan.bgWhite.bgDarkGray.bgBlack
```
```javascript
'light background colors'
    .bgLightRed.bgLightGreen.bgLightYellow.bgLightBlue.bgLightMagenta.bgLightCyan.bgLightGray
```
```javascript
'styles'
    .bright.dim.italic.underline.inverse // your platform should support italic
```

You also can obtain all those style names (for reflection purposes):

```javascript
const { names } = require ('ansicolor')

names // ['red', 'green', ...
```

## Removing ANSI Styles From Strings

```javascript
const { strip } = require ('ansicolor')

strip ('\u001b[0m\u001b[4m\u001b[42m\u001b[31mfoo\u001b[39m\u001b[49m\u001b[24mfoo\u001b[0m')) // 'foofoo'
```

## Checking If Strings Contain ANSI Codes

```javascript
const { isEscaped, green } = require ('ansicolor')

isEscaped ('text')         // false
isEscaped (green ('text')) // true
```


## Converting to CSS/HTML

Inspection of ANSI styles in arbitrary strings is essential when implementing platform-agnostic logging — that piece of code is available under command line interface and in a browser as well. Here's an example of how you would parse a colored string into an array-like structure. That structure can be traversed later to build HTML/JSON/XML or any other markup/syntax.

```javascript
const { parse } = require ('ansicolor')

const parsed = parse ('foo'.bgLightRed.bright.italic + 'bar'.red.dim)
```

The `ansi.parse ()` method will return a pseudo-array of styled spans, you can iterate over it with a `for ... of` loop and convert it to an array with the *spread operator* (`...`). Also, there's the `.spans` property for obtaining the already-spread array directly:

```javascript
assert.deepEqual (parsed.spans /* or [...parsed] */,

    [ { css: 'font-weight: bold;font-style: italic;background:rgba(255,51,0,1);',
        italic: true,
        bold: true,
        color: { bright: true },
        bgColor: { name: 'lightRed' },
        text: 'foo' },

      { css: 'color:rgba(204,0,0,0.5);',
        color: { name: 'red', dim: true },
        text: 'bar' } ])
```

### Custom Color Themes

You can change default RGB values (won't work in terminals, affects only the ANSI→CSS transformation part):

```javascript
const ansi = require ('ansicolor')

ansi.rgb = {

    black:        [0,     0,   0],    
    darkGray:     [100, 100, 100],
    lightGray:    [200, 200, 200],
    white:        [255, 255, 255],

    red:          [204,   0,   0],
    lightRed:     [255,  51,   0],
    
    green:        [0,   204,   0],
    lightGreen:   [51,  204,  51],
    
    yellow:       [204, 102,   0],
    lightYellow:  [255, 153,  51],
    
    blue:         [0,     0, 255],
    lightBlue:    [26,  140, 255],
    
    magenta:      [204,   0, 204],
    lightMagenta: [255,   0, 255],
    
    cyan:         [0,   153, 255],
    lightCyan:    [0,   204, 255],
}
```

## Chrome DevTools Compatibility

Web browsers usually implement their own proprietary CSS-based color formats for `console.log` and most of them fail to display standard ANSI colors. _Ansicolor_ offers you a helper method to convert ANSI-styled strings to browser-compatible argument lists acceptable by Chrome's `console.log`:

```javascript
const { bgGreen, red, parse } = require ('ansicolor')

const string = 'foo' + bgGreen (red.underline.bright.inverse ('bar') + 'baz')
const parsed = parse (string)

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

Play with this feature online: [demo page](https://xpl.github.io/ololog/). Open the DevTools console and type expressions in the input box to see colored console output.

Happy logging!

## Projects That Use `ansicolor`

- [**Ololog!**](https://github.com/xpl/ololog) — a better `console.log` for the log-driven debugging junkies
- [**CCXT**](https://github.com/ccxt/ccxt) — a cryptocurrency trading API with 130+ exchanges
- [**Grafana**](https://github.com/grafana/grafana) — beautiful monitoring & metric analytics & dashboards

