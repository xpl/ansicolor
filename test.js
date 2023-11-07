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

        assert.deepEqual (parsed.spans, [
            {
                css: 'font-weight: bold;font-style: italic;text-decoration: underline;background:rgba(255,51,0,1);',
                italic: true,
                bold: true,
                underline: true,
                bright: false,
                dim: false,
                inverse: false,
                color: { bright: true,
                    dim: false,
                    name: undefined,
                },
                bgColor: {
                    bright: false,
                    dim: false,
                    name: 'lightRed'
                },
                text: 'foo',
                code: {
                    isBrightness: false,
                    str: '\u001b[49m',
                    subtype: 'default',
                    type: 'bgColor',
                    value: 49
                }
            },
            {
                bgColor: undefined,
                bold: false,
                bright: false,
                code: {
                    isBrightness: false,
                    str: "\u001b[39m",
                    subtype: "default",
                    type: "color",
                    value: 39
                },
                color: {
                    bright: false,
                    dim: true,
                    name: "red",
                },
                css: "color:rgba(204,0,0,0.5);",
                dim: false,
                inverse: false,
                italic: false,
                text: "bar",
                underline: false,
            }
            ])
    })

    it ('brightness semantics (CSS)', () => {

        const parsed = ansi.parse ('foo'.bright.red)

        assert.deepEqual (parsed.spans,[{
                    bgColor: undefined,
                    bold: true,
                    bright: false,
                    code: {
                        isBrightness: true,
                        str: '\u001b[22m',
                        subtype: 'dim',
                        type: 'unstyle',
                        value: 22,
                    },
                    color: {
                        bright: true,
                        dim: false,
                        name: 'red',
                    },
                    css: 'font-weight: bold;color:rgba(255,51,0,1);',
                    dim: false,
                    inverse: false,
                    italic: false,
                    text: 'foo',
                    underline: false,
        }])
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

        assert.deepEqual (ansi.parse ('foo'.dim).spans,[
            {
                bgColor: undefined,
                bold: false,
                bright: false,
                code: {
                    isBrightness: true,
                    str: '\u001b[22m',
                    subtype: 'dim',
                    type: 'unstyle',
                    value: 22,
                },
                color: {
                    bright: false,
                    dim: true,
                    name: undefined,
                },
                css: 'color:rgba(0,0,0,0.5);',
                dim: false,
                inverse: false,
                italic: false,
                text: 'foo',
                underline: false,
            }
        ])
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

    it ('explicit reset code works', () => {

        assert.deepEqual (ansi.parse ('\u001b[1m\u001b[31mbold_red\u001b[0mreset').spans, [
            {
                bgColor: undefined,
                bold: true,
                bright: false,
                code: {
                    isBrightness: false,
                    str: '\u001b[0m',
                    subtype: '',
                    type: 'style',
                    value: 0,
                },
                color: {
                    bright: true,
                    dim: false,
                    name: 'red',
                },
                css: 'font-weight: bold;color:rgba(255,51,0,1);',
                dim: false,
                inverse: false,
                italic: false,
                text: 'bold_red',
                underline: false,
            },
        {
            bgColor: undefined,
            bold: false,
            bright: false,
            code: {
            isBrightness: false,
            str: '',
            subtype: undefined,
            type: undefined,
            value: undefined,
        },
            color: undefined,
            css: '',
            dim: false,
            inverse: false,
            italic: false,
            text: 'reset',
            underline: false,
        }
        ])
    })

    it ('implicit reset code works', () => {

        assert.deepEqual (ansi.parse ('\u001b[1m\u001b[31mbold_red\u001b[mreset').spans,

            [
                {
                    bgColor: undefined,
                    bold: true,
                    bright: false,
                    code: {
                        isBrightness: false,
                        str: '\u001b[0m',
                        subtype: '',
                        type: 'style',
                        value: 0,
                    },
                    color: {
                        bright: true,
                        dim: false,
                        name: 'red',
                    },
                    css: 'font-weight: bold;color:rgba(255,51,0,1);',
                    dim: false,
                    inverse: false,
                    italic: false,
                    text: 'bold_red',
                    underline: false,
                },
                {
                    bgColor: undefined,
                    bold: false,
                    bright: false,
                    code: {
                        isBrightness: false,
                        str: '',
                        subtype: undefined,
                        type: undefined,
                        value: undefined,
                    },
                    color: undefined,
                    css: '',
                    dim: false,
                    inverse: false,
                    italic: false,
                    text: 'reset',
                    underline: false,
                }
            ])
    })

    it ('parsing a string with no codes', () => {

        assert.deepEqual (ansi.parse ('foobar').spans,[
            {
                bgColor: undefined,
                bold: false,
                bright: false,
                code: {
                    isBrightness: false,
                    str: '',
                    subtype: undefined,
                    type: undefined,
                    value: undefined,
                },
                color: undefined,
                css: '',
                dim: false,
                inverse: false,
                italic: false,
                text: 'foobar',
                underline: false,
            }
        ])
    })

    it ('combined codes work', () => {

        assert.deepEqual (ansi.parse ('\u001b[2;31mfoo🕵️‍bar\u001b[0mbaz').spans,[
            {
                bgColor: undefined,
                bold: false,
                bright: false,
                code: {
                    isBrightness: false,
                    str: '\u001b[0m',
                    subtype: '',
                    type: 'style',
                    value: 0,
                },
                color: {
                    bright: false,
                    dim: true,
                    name: 'red',
                },
                css: 'color:rgba(204,0,0,0.5);',
                dim: false,
                inverse: false,
                italic: false,
                text: 'foo🕵️‍bar',
                underline: false,
            },
            {
                bgColor: undefined,
                bold: false,
                bright: false,
                code: {
                    isBrightness: false,
                    str: '',
                    subtype: undefined,
                    type: undefined,
                    value: undefined,
                },
                color: undefined,
                css: '',
                dim: false,
                inverse: false,
                italic: false,
                text: 'baz',
                underline: false,
            }
        ])
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

    it ('accepting certain non-string values works', () => {

        same (ansi.cyan(42),        '\u001b[36m42\u001b[39m')
        same (ansi.cyan(null),      '\u001b[36mnull\u001b[39m')
        same (ansi.cyan(undefined), '\u001b[36mundefined\u001b[39m')
    })

    it ('isEscaped works', () => {
        assert.equal (ansi.isEscaped(ansi.red('foo')), true);
        assert.equal (ansi.isEscaped('foo'),           false);
        assert.equal (ansi.isEscaped(null),            false);
        assert.equal (ansi.isEscaped(undefined),       false);
        assert.equal (ansi.isEscaped(42),              false);
    })
})

