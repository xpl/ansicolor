"use strict";

/*  ------------------------------------------------------------------------ */

const O = Object

/*  ------------------------------------------------------------------------ */

const

    colorCodes = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', '', 'default'],
    styleCodes = ['', 'bright', 'dim', 'italic', 'underline', '', '', 'inverse'],

    types = {   0:  'style',
                2:  'unstyle',
                3:  'color',
                4:  'bgColor',
                10: 'bgColorBright' },

    subtypes = {    color:         colorCodes,
                    bgColor:       colorCodes,
                    bgColorBright: colorCodes,
                    style:         styleCodes,
                    unstyle:       styleCodes    }

/*  ------------------------------------------------------------------------ */

const clean = obj => {
                for (const k in obj) { if (!obj[k]) { delete obj[k] } }
                return (O.keys (obj).length === 0) ? undefined : obj
            }

/*  ------------------------------------------------------------------------ */

class Color {

    constructor (background, name, brightness) {

        this.background = background
        this.name = name
        this.brightness = brightness
    }

    get inverse () {
        return new Color (!this.background, this.name || (this.background ? 'black' : 'white'), this.brightness)
    }

    get clean () {
        return clean ({ name:   this.name === 'default' ? '' : this.name,
                        bright: this.brightness === Code.bright,
                        dim:    this.brightness === Code.dim })
    }

    defaultBrightness (value) {

        return new Color (this.background, this.name, this.brightness || value)
    }

    css (inverted) {

        const color = inverted ? this.inverse : this

        const prop = (color.background ? 'background:' : 'color:'),
              rgb  = ((this.brightness === Code.bright) ? Colors.rgbBright : Colors.rgb)[color.name]

        const alpha = (this.brightness === Code.dim) ? 0.5 : 1

        return rgb
                ? (prop + 'rgba(' + [...rgb, alpha].join (',') + ');')
                : ((!color.background && (alpha < 1)) ? 'color:rgba(0,0,0,0.5);' : '') // Chrome does not support 'opacity' property...
    }
}

/*  ------------------------------------------------------------------------ */

class Code {

    constructor (n) {
        if (n !== undefined) { this.value = Number (n) } }

    get type () {
       return types[Math.floor (this.value / 10)] }

    get subtype () {
        return subtypes[this.type][this.value % 10] }

    get str () {
        return (this.value ? ('\u001b\[' + this.value + 'm') : '') }

    static str (x) {
        return new Code (x).str }

    get isBrightness () {
        return (this.value === Code.noBrightness) || (this.value === Code.bright) || (this.value === Code.dim) }
}

/*  ------------------------------------------------------------------------ */

O.assign (Code, {

    bright:       1,
    dim:          2,
    inverse:      7,
    noBrightness: 22,
    noItalic:     23,
    noUnderline:  24,
    noInverse:    27,
    noColor:      39,
    noBgColor:    49
})

/*  ------------------------------------------------------------------------ */

const camel = (a, b) => a + b.charAt (0).toUpperCase () + b.slice (1)

const replaceAll = (str, a, b) => str.split (a).join (b)

/*  ANSI brightness codes do not overlap, e.g. "{bright}{dim}foo" will be rendered bright (not dim).
    So we fix it by adding brightness canceling before each brightness code, so the former example gets
    converted to "{noBrightness}{bright}{noBrightness}{dim}foo" – this way it gets rendered as expected.
 */

const denormalizeBrightness = s => s.replace (/(\u001b\[(1|2)m)/g, '\u001b[22m$1')
const normalizeBrightness = s => s.replace (/\u001b\[22m(\u001b\[(1|2)m)/g, '$1')

const wrap = (x, openCode, closeCode) => {

    const open  = Code.str (openCode),
          close = Code.str (closeCode)

    return String (x)
                .split ('\n')
                .map (line => denormalizeBrightness (open + replaceAll (normalizeBrightness (line), close, open) + close))
                .join ('\n')
}

/*  ------------------------------------------------------------------------ */

const stringWrappingMethods = (() => [

        ...colorCodes.map ((k, i) => !k ? [] : [ // color methods

            [k,                     30 + i,  Code.noColor],
            [camel ('bg', k),       40 + i,  Code.noBgColor],
            [camel ('bgBright', k), 100 + i, Code.noBgColor]
        ]),

        ...styleCodes.map ((k, i) => !k ? [] : [ // style methods

            [k, i, ((k === 'bright') || (k === 'dim')) ? Code.noBrightness : (20 + i)]
        ])
    ]
    .reduce ((a, b) => a.concat (b))
    
) ();

/*  ------------------------------------------------------------------------ */

const assignStringWrappingAPI = (target, wrapBefore = target) =>

    stringWrappingMethods.reduce ((memo, [k, open, close]) =>
                                        O.defineProperty (memo, k, {
                                            get: () => assignStringWrappingAPI (str => wrapBefore (wrap (str, open, close)))
                                        }),

                                  target)

/*  ------------------------------------------------------------------------ */

class Colors {

    constructor (s) {

        if (s) {

            const r = /\u001b\[(\d+)m/g

            const spans = s.split (/\u001b\[\d+m/)
            const codes = []

            for (let match; match = r.exec (s);) codes.push (match[1])

            this.spans = spans.map ((s, i) => ({ text: s, code: new Code (codes[i]) })) 
        }

        else {
            this.spans = []
        }
    }

    get str () {
        return this.spans.reduce ((str, p) => str + p.text + p.code.str, '')
    }

    get parsed () {

        var color      = new Color (),
            bgColor    = new Color (true /* background */),
            brightness = undefined,
            styles     = new Set ()

        return O.assign (new Colors (), {

            spans: this.spans.map (span => {

                const c = span.code

                const inverted  = styles.has ('inverse'),
                      underline = styles.has ('underline')   ? 'text-decoration: underline;' : '',                      
                      italic    = styles.has ('italic')      ? 'font-style: italic;' : '',
                      bold      = brightness === Code.bright ? 'font-weight: bold;' : ''

                const foreColor = color.defaultBrightness (brightness)

                const styledSpan = O.assign (
                                    { css: bold + italic + underline + foreColor.css (inverted) + bgColor.css (inverted) },
                                        clean ({ bold: !!bold, color: foreColor.clean, bgColor: bgColor.clean }),
                                            span)

                for (const k of styles) { styledSpan[k] = true }

                if (c.isBrightness) {

                    brightness = c.value
                
                } else {

                    switch (span.code.type) {

                        case 'color'        : color   = new Color (false, c.subtype);              break
                        case 'bgColor'      : bgColor = new Color (true,  c.subtype);              break
                        case 'bgColorBright': bgColor = new Color (true,  c.subtype, Code.bright); break

                        case 'style'  : styles.add    (c.subtype); break
                        case 'unstyle': styles.delete (c.subtype); break
                    }
                }

                return styledSpan

            }).filter (s => s.text.length > 0)
        })
    }

/*  Outputs with Chrome DevTools-compatible format     */

    get asChromeConsoleLogArguments () {

        const spans = this.parsed.spans

        return [spans.map (s => ('%c' + s.text)).join (''),
             ...spans.map (s => s.css)]
    }

    get browserConsoleArguments () /* LEGACY, DEPRECATED */ { return this.asChromeConsoleLogArguments }

/*  Installs unsafe String extensions   */

    static get nice () {

        Colors.names.forEach (k => {
            if (!(k in String.prototype)) {
                O.defineProperty (String.prototype, k, { get: function () { return Colors[k] (this) } })
            }
        })

        return Colors
    }

/*  Parsing front-end   */

    static parse (s) {
        return new Colors (s).parsed
    }

/*  Stripping   */

    static strip (s) {
        return s.replace (/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g, '') // hope V8 caches the regexp
    }

/*  Iteration protocol  */

    [Symbol.iterator] () {
        return this.spans[Symbol.iterator] ()
    }
}

/*  ------------------------------------------------------------------------ */

assignStringWrappingAPI (Colors, str => str)

/*  ------------------------------------------------------------------------ */

Colors.names = stringWrappingMethods.map (([k]) => k)

/*  ------------------------------------------------------------------------ */

Colors.rgb = {

    black:   [0,     0,   0],
    red:     [204,   0,   0],
    green:   [0,   204,   0],
    yellow:  [204, 102,   0],
    blue:    [0,     0, 255],
    magenta: [204,   0, 204],
    cyan:    [0,   153, 255],
    white:   [255, 255, 255]
}

Colors.rgbBright = {

    black:   [0,     0,   0],
    red:     [255,  51,   0],
    green:   [51,  204,  51],
    yellow:  [255, 153,  51],
    blue:    [26,  140, 255],
    magenta: [255,   0, 255],
    cyan:    [0,   204, 255],
    white:   [255, 255, 255]
}

/*  ------------------------------------------------------------------------ */

module.exports = Colors

/*  ------------------------------------------------------------------------ */

