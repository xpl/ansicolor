"use strict";

/*  ------------------------------------------------------------------------ */

const assert = require ('assert'),
      ansi   = require (process.env.ANSICOLOR_MODULE).nice

/*  ------------------------------------------------------------------------ */

describe ('ansicolor', () => {

    const dbg = s => s.replace (/\u001b\[(\d+)m/g, '\u001b[36m{$1}\u001b[39m')

    const same = (a, b) => {

        console.log ('\n')

        console.log ('expected:', b)
        console.log ('         ', dbg (b), '\n')

        console.log ('actual  :', a)
        console.log ('         ', dbg (a), '\n')

        assert.equal (a, b)
    }

    it ('works', () => {

        same ('foo' + ansi.green (ansi.inverse (ansi.bgLightCyan ('bar') + 'baz') + 'qux'),
              'foo\u001b[32m\u001b[7m\u001b[106mbar\u001b[49mbaz\u001b[27mqux\u001b[39m')
    })

    it ('chaining works', () => {

        same (ansi.underline.bright.green ('chai' + ansi.dim.red.bgLightCyan ('ning')),
             '\u001b[4m\u001b[22m\u001b[1m\u001b[32mchai\u001b[22m\u001b[2m\u001b[31m\u001b[106mning\u001b[49m\u001b[32m\u001b[22m\u001b[1m\u001b[39m\u001b[22m\u001b[24m')
    })

    it ('nice mode works', () => {

        ansi.nice // shouldn't mess up with repeated calls
        ansi.nice

        same ('foo' + ('bar'.red.underline.bright + 'baz').green.underline + 'qux',
              'foo\u001b[4m\u001b[32m\u001b[22m\u001b[1m\u001b[4m\u001b[31mbar\u001b[32m\u001b[4m\u001b[22mbaz\u001b[39m\u001b[24mqux')
    })

    it ('brightness hierarchy works', () => {

        same (('foo' + 'bar'.dim + 'baz').bright, '\u001b[22m\u001b[1mfoo\u001b[22m\u001b[2mbar\u001b[22m\u001b[1mbaz\u001b[22m')
    })

    it ('hierarchy works', () => {

        same ((('red'.red + 'green').green + 'blue').blue, '\u001b[34m\u001b[32m\u001b[31mred\u001b[32mgreen\u001b[34mblue\u001b[39m')

        same (('foo'.cyan         + 'bar').red,         '\u001b[31m\u001b[36mfoo\u001b[31mbar\u001b[39m')
        same (('foo'.bgCyan       + 'bar').bgRed,       '\u001b[41m\u001b[46mfoo\u001b[41mbar\u001b[49m')
        same (('foo'.bgLightCyan  + 'bar').bgLightRed,  '\u001b[101m\u001b[106mfoo\u001b[101mbar\u001b[49m')
        same (('foo'.underline    + 'bar').underline,   '\u001b[4m\u001b[4mfoo\u001b[4mbar\u001b[24m')

        same (('foo'.bright  + 'bar').bright,   '\u001b[22m\u001b[1m\u001b[22m\u001b[1mfoo\u001b[22m\u001b[1mbar\u001b[22m')
        same (('foo'.dim     + 'bar').dim,      '\u001b[22m\u001b[2m\u001b[22m\u001b[2mfoo\u001b[22m\u001b[2mbar\u001b[22m')
        same (('foo'.inverse + 'bar').inverse,  '\u001b[7m\u001b[7mfoo\u001b[7mbar\u001b[27m')
    })

    it ('basic parsing works', () => {

        const parsed = ansi.parse ('foo'.bgLightRed.bright.italic.underline + 'bar'.red.dim)

        // assert.deepEqual ([...parsed], parsed.spans) // not working in node v4
        assert.equal (parsed[Symbol.iterator] ().next ().value.text, 'foo')

        assert.deepEqual (parsed.spans,

            [ { css: 'font-weight: bold;font-style: italic;text-decoration: underline;background:rgba(255,51,0,1);',
                italic: true,
                bold: true,
                underline: true,
                color: { bright: true },
                bgColor: { name: 'lightRed' },
                text: 'foo',
                code: { value: 49 } },

              { css: 'color:rgba(204,0,0,0.5);',
                color: { name: 'red', dim: true },
                text: 'bar',
                code: { value: 39 } } ])
    })

    it ('brightness semantics (CSS)', () => {

        const parsed = ansi.parse ('foo'.bright.red)

        assert.deepEqual (parsed.spans,[ {  css: 'font-weight: bold;color:rgba(255,51,0,1);',
                                            bold: true,
                                            color: { name: 'red', bright: true },
                                            text: 'foo',
                                            code: { value: 22 } }])
    })

    it ('asChromeConsoleLogArguments works', () => {

        const parsed = ansi.parse ('foo' + ('bar'.red.underline.bright.inverse + 'baz').bgGreen)

        assert.deepEqual (parsed.asChromeConsoleLogArguments, parsed.browserConsoleArguments) // legacy API

        assert.deepEqual (parsed.asChromeConsoleLogArguments, [

                            "%cfoo%cbar%cbaz",
                            "",
                            "font-weight: bold;text-decoration: underline;background:rgba(255,51,0,1);color:rgba(0,204,0,1);",
                            "background:rgba(0,204,0,1);"
                        ])
    })

    it ('.dim works in CSS (there was a bug)', () => {

        assert.deepEqual (ansi.parse ('foo'.dim).spans, [ { css: 'color:rgba(0,0,0,0.5);', color: { dim: true }, text: 'foo', code: { value: 22 } } ])
    })

    it ('stripping works', () => { // clauses were copypasted from strip-ansi

        assert.equal ('foofoo', ansi.strip ('\u001b[0m\u001b[4m\u001b[42m\u001b[31mfoo\u001b[39m\u001b[49m\u001b[24mfoo\u001b[0m'))
        assert.equal ('bar',    ansi.strip ('\x1b[0;33;49;3;9;4mbar\x1b[0m'))
    })

    it ('color names enumeration works', () => {

        assert.deepEqual (ansi.names, [
            'black',
            'bgBlack',
            'red',
            'bgRed',
            'green',
            'bgGreen',
            'yellow',
            'bgYellow',
            'blue',
            'bgBlue',
            'magenta',
            'bgMagenta',
            'cyan',
            'bgCyan',
            'lightGray',
            'bgLightGray',
            'default',
            'bgDefault',
            'darkGray',
            'bgDarkGray',
            'lightRed',
            'bgLightRed',
            'lightGreen',
            'bgLightGreen',
            'lightYellow',
            'bgLightYellow',
            'lightBlue',
            'bgLightBlue',
            'lightMagenta',
            'bgLightMagenta',
            'lightCyan',
            'bgLightCyan',
            'white',
            'bgWhite',
            'bgBrightRed',
            'bgBrightGreen',
            'bgBrightYellow',
            'bgBrightBlue',
            'bgBrightMagenta',
            'bgBrightCyan',
            'bright',
            'dim',
            'italic',
            'underline',
            'inverse'
        ])
    })

    it ('type coercion works', () => {

        assert.equal (ansi.red (123), ansi.red ('123'))
    })

    it ('newline separation works', () => {

        assert.equal ('foo\nbar\nbaz'.red, 'foo'.red + '\n' + 'bar'.red + '\n' + 'baz'.red)
    })

    it ('inverse works', () => {

        same ('bgRed.inverse'.bgRed.inverse, '\u001b[7m\u001b[41mbgRed.inverse\u001b[49m\u001b[27m')

        assert.equal (ansi.parse ('foo'.bgRed.inverse).spans[0].css, 'background:rgba(255,255,255,1);color:rgba(204,0,0,1);')
    })

    it ('.str works', () => {

        assert.equal (new ansi ('foo\u001b[32m\u001b[7m\u001b[106mbar\u001b[49mbaz\u001b[27mqux\u001b[39m').str,
                                'foo\u001b[32m\u001b[7m\u001b[106mbar\u001b[49mbaz\u001b[27mqux\u001b[39m')
    })

    it ('compatible with previous versions where Light was called Bright in bg methods', () => {
        
        same ('foo'.bgLightCyan, 'foo'.bgBrightCyan)
    })

    it ('reset code works', () => {

        assert.deepEqual (ansi.parse ('\u001b[1m\u001b[31mbold_red\u001b[0mreset').spans,

            [ { css: 'font-weight: bold;color:rgba(255,51,0,1);',
                bold: true,
                color: { name: 'red', bright: true },
                text: 'bold_red',
                code: { value: 0 } },

              { css: '',
                text: 'reset',
                code: {} }
        ])
    })

    it ('parsing a string with no codes', () => {

        assert.deepEqual (ansi.parse ('foobar').spans,

            [ { css: '',
                text: 'foobar',
                code: {} }
        ])
    })

    it ('combined codes work', () => {

        assert.deepEqual (ansi.parse ('\u001b[2;31mfoo🕵️‍bar\u001b[0mbaz').spans,

            [ { css: 'color:rgba(204,0,0,0.5);',
                color: { name: 'red', dim: true },
                text: 'foo🕵️‍bar',
                code: { value: 0 } },
              { css: '', text: 'baz', code: {} } ])
    })

    it ('broken codes do not parse', () => {

        assert.equal (ansi.parse ('\u001b2;31mfoo').spans[0].text, '\u001b2;31mfoo')
        assert.equal (ansi.parse ('\u001b[2;xmfoo').spans[0].text, '\u001b[2;xmfoo')
        assert.equal (ansi.parse ('\u001b[0').spans[0].text, '\u001b[0')
    })

    it ('changing .rgb works', () => {

        ansi.rgb.red = [255,0,0]

        assert.equal (ansi.parse ('foo'.red.bgLightRed).spans[0].css, 'color:rgba(255,0,0,1);background:rgba(255,51,0,1);')
    })
})



