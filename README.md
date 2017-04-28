# ansicolor

A quality library for the ANSI color/style management.

```bash
npm install ansicolor
```

## What for

- String coloring with ANSI escape codes
- Solves the style [hierarchy problem](https://github.com/xpl/ansicolor#why-another-one) (at which other similar tools fail)
- Parsing/removing ANSI style data from strings
- Converting ANSI styles to a Chrome DevTools-compatible output ([interactive demo](https://xpl.github.io/ansicolor/))
- A middleware for your platform-agnostic logging system

## Recent updates / changelog

- You can now change the default RGB values for CSS output
- `.parse ()` now returns full span style data (ex. `{ italic: true, bgColor: { name: 'red', dim: true }, ...`)
- `.strip ()` for removing ANSI codes
- `.names` for run-time reflection

## Why another one?

Other tools lack consistency, failing to solve the simple hierarchy problem:

```javascript
require ('colors') // a popular color utility

console.log (('foo'.cyan + 'bar').red)
```

![pic](http://wtf.jpg.wtf/85/9b/1470626860-859b24350e22df74fd7497e9dc0d8d42.png)

WTF, `bar` is not rendered red! It sucks. **Ansicolor** arranges styles in stack and reconstructs proper linear form from that stack:

```javascript
require ('ansicolor').nice // .nice for unsafe String extensions

console.log (('foo'.cyan + 'bar').red)
```

![pic](http://wtf.jpg.wtf/3c/61/1470626989-3c61b64d0690b0b413be367841650426.png)

Nice!

## Crash course

String wrapping (safe):

```javascript
color = require ('ansicolor')

console.log ('foo' + color.green (color.inverse (color.bgBrightCyan ('bar')) + 'baz') + 'qux')
```

String wrapping (unsafe):

```javascript
require ('ansicolor').nice

console.log ('foo'.red.bright + 'bar'.bgYellow.underline.dim)
```

## Supported styles

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
    .bright.dim.italic.underline.inverse // italic may lack support on your platform
```

You also can read these method names programmatically:

```javascript
color.names // [ 'black', 'bgBlack', 'bgBrightBlack', 'red', 'bgRed', ...
```

## Removing ANSI styles from a string

```javascript
color.strip ('\u001b[0m\u001b[4m\u001b[42m\u001b[31mfoo\u001b[39m\u001b[49m\u001b[24mfoo\u001b[0m')) // 'foofoo'
```

## Reading style information / CSS output

Inspection of ANSI styles in arbitrary strings is essential when implementing platform-agnostic logging — that works not only in terminal, but in browsers too. Here's how you do it:

```javascript
const parsed = color.parse ('foo'.bgBrightRed.bright.italic + 'bar'.red.dim)
```

It will return a pseudo-array of styled spans, iterable with `for ... of` and convertable to an array with spread operator. There also exists `.spans` property for obtaining the actual array directly:

```javascript
assert.deepEqual (parsed.spans /* or [...parsed] */,

    [ { css: 'font-weight: bold;text-decoration: italic;background:rgba(255,51,0,1);',
        italic: true,
        bold: true,
        color: { bright: true },
        bgColor: { name: 'red', bright: true },
        text: 'foo' },

      { css: 'color:rgba(204,0,0,0.5);',
        color: { name: 'red', dim: true },
        text: 'bar' } ])
```

## Custom color theme

You can change the default RGB values:

```javascript
color.rgb = {

    black:   [0,     0,   0],
    red:     [204,   0,   0],
    green:   [0,   204,   0],
    yellow:  [204, 102,   0],
    blue:    [0,     0, 255],
    magenta: [204,   0, 204],
    cyan:    [0,   153, 255],
    white:   [255, 255, 255]
}

color.rgbBright = {

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

Some browsers support color logging with `console.log`, but they don't understand ANSI colors, implementing a proprietary CSS-based format instead. _Ansicolor_ can help you with converting styled strings to argument lists acceptable by Chrome's `console.log`:

```javascript
const string = 'foo' + ('bar'.red.underline.bright.inverse + 'baz').bgGreen
const parsed = color.parse (string)

console.log (...parsed.asChromeConsoleLogArguments) // prints with colors in Chrome!
```

Here's what the format looks like:

```javascript
parsed.asChromeConsoleLogArguments // [ "%cfoo%cbar%cbaz",
                                   //   "",
                                   //   "font-weight: bold;font-style: underline;background:rgba(255,51,0,1);color:rgba(0,204,0,1);",
                                   //   "background:rgba(0,204,0,1);"
                                   // ]
```

You can even play with this feature online: [demo page](https://xpl.github.io/ansicolor/). Open the DevTools console and type expressions in the input box to see how it renders.

Happy logging!


