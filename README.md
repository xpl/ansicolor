# ansicolor<sup>BETA</sup>

A quality library for the ANSI color/style management.

```bash
npm install ansicolor
```

## Why another one?

Other tools lack consistency, failing to solve the simple hierarchy problem:

```javascript
require ('colors') // most popular color utility

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

### Cross-platform rendering

Other tools provide output (rendering), but not input (parsing). Inspection of ANSI colors in arbitrary strings is essential when implementing cross-platform logging — that works not only in terminal, but in browsers too. Modern browsers support color logging with `console.log`, but it does not understand ANSI colors — having a proprietary CSS-based format instead. 

**Ansicolor** solves that problem by converting color codes to argument lists that are understandable by browser's consoles:

```javascript
parsed = color.parse ('foo' + ('bar'.red.underline.bright.inverse + 'baz').bgGreen)

parsed.browserConsoleArguments /* = [
    "%cfoo%cbar%cbaz",
    "",
    "font-weight: bold;font-style: underline;background:rgba(255,51,0,1);color:rgba(0,204,0,1);",
    "background:rgba(0,204,0,1);"
] */

console.log (...parsed.browserConsoleArguments) // prints with colors in Chrome!
```

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

All supported options:

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

## Converting to CSS

Parsing arbitrary strings styled with ANSI escape codes:

```javascript
parsed = color.parse ('foo'.bgBrightRed + 'bar')
                            
```

Will return a pseudo-array of styled spans (iterable with `for ... of` and convertable to an array with spread operator):

```javascript
[{ css: 'background:rgba(255,51,0,1);', text: 'foo' },
 { css: '',                             text: 'bar' } ])]
```

Converting parsed array to argument list (acceptable by Chrome's `console.log`):

```javascript
console.log (...parsed.browserConsoleArguments)
```

Happy logging!


