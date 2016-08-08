"use strict";

const assert = require ('assert'),
      color  = require ('./ansicolor').nice

describe ('ansicolor', () => {

    const same = (a, b) => {

        console.log ('\n')
        console.log (a)
        console.log (a.replace (/\u001b/g, '\\u001b'))

        assert.equal (a, b)
    }

    it ('safe mode works', () => {

        same ('foo' + color.green (color.inverse (color.bgBrightCyan ('bar') + 'baz') + 'qux'),
              'foo\u001b[32m\u001b[7m\u001b[106mbar\u001b[49mbaz\u001b[27mqux\u001b[39m')
    })

    it ('nice mode works', () => {

        same ('foo' + ('bar'.red.underline.bright + 'baz').green.underline + 'qux',
              'foo\u001b[4m\u001b[32m\u001b[1m\u001b[4m\u001b[31mbar\u001b[32m\u001b[4m\u001b[22mbaz\u001b[31m\u001b[24mqux')
    })

    it ('brightness hierarchy works', () => {

        same (('foo'.dim + 'bar').bright,      '\u001b[2mfoobar\u001b[22m')
    })

    it ('hierarchy works', () => {

        same (('foo'.cyan         + 'bar').red,         '\u001b[31m\u001b[36mfoo\u001b[31mbar\u001b[39m')
        same (('foo'.bgCyan       + 'bar').bgRed,       '\u001b[41m\u001b[46mfoo\u001b[41mbar\u001b[49m')
        same (('foo'.bgBrightCyan + 'bar').bgBrightRed, '\u001b[101m\u001b[106mfoo\u001b[101mbar\u001b[49m')
        same (('foo'.underline    + 'bar').underline,   '\u001b[4m\u001b[4mfoo\u001b[4mbar\u001b[24m')


        same (('foo'.bright  + 'bar').bright,   '\u001b[1m\u001b[1mfoo\u001b[1mbar\u001b[22m')
        same (('foo'.dim     + 'bar').dim,      '\u001b[2m\u001b[2mfoo\u001b[2mbar\u001b[22m')
        same (('foo'.inverse + 'bar').inverse,  '\u001b[7m\u001b[7mfoo\u001b[7mbar\u001b[27m')
    })

    it ('basic parsing works', () => {

        assert.deepEqual ([...color.parse ('foo'.bgBrightRed + 'bar')], [
                            { css: 'background:rgba(255,51,0,1);', text: 'foo', code: { value: 49 } },
                            { css: '',                             text: 'bar', code: {} } ])
    })

    it ('browserConsoleArguments works', () => {

        const parsed = color.parse ('foo' + ('bar'.red.underline.bright.inverse + 'baz').bgGreen)

        assert.deepEqual (parsed.browserConsoleArguments, [
            "%cfoo%cbar%cbaz",
            "",
            "font-weight: bold;font-style: underline;background:rgba(255,51,0,1);color:rgba(0,204,0,1);",
            "background:rgba(0,204,0,1);"
        ])
    })
})