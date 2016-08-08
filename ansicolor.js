"use strict";

const

    O = require ('es7-object-polyfill'),
      
    colorCodes = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', '', 'default'],
    styleCodes = ['', 'bright', 'dim', 'italic', 'underline', '', '', 'inverse'],

    brightCssColors = { black:   [0,     0,   0],
                        red:     [255,  51,   0],
                        green:   [51,  204,  51],
                        yellow:  [255, 153,  51],
                        blue:    [26,  140, 255],
                        magenta: [255,   0, 255],
                        cyan:    [0,   204, 255],
                        white:   [255, 255, 255]    },

    cssColors = {   black:   [0,     0,   0],
                    red:     [204,   0,   0],
                    green:   [0,   204,   0],
                    yellow:  [204, 102,   0],
                    blue:    [0,     0, 255],
                    magenta: [204,   0, 204],
                    cyan:    [0,   153, 255],
                    white:   [255, 255, 255]    },

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

class Color {

    constructor (background, name, brightness) {

        this.background = background
        this.name       = name
        this.brightness = brightness
    }

    get inverse () {
        return new Color (!this.background, this.name || (this.background ? 'black' : 'white'), this.brightness) }

    css (inverted, brightness_) {

        const color = inverted ? this.inverse : this

        const brightness = color.brightness || brightness_

        const prop = (color.background ? 'background:' : 'color:'),
              rgb  = ((brightness === Code.bright) ? brightCssColors : cssColors)[color.name]

        return rgb ? (prop + 'rgba(' + [...rgb, (brightness === Code.dim) ? 0.5 : 1].join (',') + ');') : ''
    }
}

class Code {

    constructor (n) {
        if (n !== undefined) { this.value = Number (n) } }

    get type () {
       return types[Math.floor (this.value / 10)] }

    get subtype () {
        return (subtypes[this.type] || [])[this.value % 10] }

    get str () {
        return this.value ? ('\u001b\[' + this.value + 'm') : '' }

    get isBrightness () {
        return (this.value === Code.noBrightness) || (this.value === Code.bright) || (this.value === Code.dim) }
}

Object.assign (Code, {

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

const camel = (a, b) => a + b.charAt (0).toUpperCase () + b.slice (1)

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
        return this.spans.reduce ((str, p, i) => str + p.text + (p.code ? p.code.str : ''), '') }

/*  Arranges colors in stack and reconstructs proper linear form from that stack    */

    get normalized () {

        const stackBgColor    = [new Code (Code.noBgColor)],
              stackBrightness = [new Code (Code.noBrightness)]
        
        const colorStacks = {
                    color: [new Code (Code.noColor)],
                    bgColor: stackBgColor,
                    bgColorBright: stackBgColor },

              styleStacks = {
                    bright: stackBrightness,
                    dim: stackBrightness,
                    underline: [new Code (Code.noUnderline)],
                    inverse: [new Code (Code.noInverse)],
                    italic: [new Code (Code.noItalic)] }

        return O.assign (new Colors (), {

            spans: this.spans.map ((p, i) => {

                switch (p.code.type) {

                    case 'color':
                    case 'bgColor':
                    case 'bgColorBright':

                        const stack = colorStacks[p.code.type]

                        if (p.code.subtype !== 'default') { stack.unshift (p.code) }
                        else { stack.shift (); return O.assign ({}, p, { code: stack[0] }) }
                        break

                    case 'style':

                        styleStacks[p.code.subtype].unshift (p.code)
                        break

                    case 'unstyle':

                        const s = styleStacks[p.code.subtype]
                        s.shift (); return O.assign ({}, p, { code: s[0] })
                        break
                }
                
                return p
            })
        })
    }

    get styledWithCSS () {

        var color      = new Color (),
            bgColor    = new Color (true /* background */),
            brightness = undefined,
            styles     = new Set ()

        return O.assign (new Colors (), {

            spans: this.spans.map (p => { const c = p.code

                const inverted  = styles.has ('inverse'),
                      underline = styles.has ('underline')   ? 'font-style: underline;' : '',                      
                      italic    = styles.has ('italic')      ? 'text-decoration: italic;' : '',
                      bold      = brightness === Code.bright ? 'font-weight: bold;' : ''

                const styledPart = O.assign ({ css: bold + italic + underline +
                                                        color  .css (inverted, brightness) +
                                                        bgColor.css (inverted) }, p)
                if (c.isBrightness) {
                    brightness = c.value }

                else {

                    switch (p.code.type) {

                        case 'color'        : color   = new Color (false, c.subtype);              break
                        case 'bgColor'      : bgColor = new Color (true,  c.subtype);              break
                        case 'bgColorBright': bgColor = new Color (true,  c.subtype, Code.bright); break

                        case 'style'  : styles.add    (c.subtype); break
                        case 'unstyle': styles.delete (c.subtype); break } }

                return styledPart

            }).filter (s => s.text.length > 0)
        })
    }

/*  Outputs with WebInspector-compatible format     */

    get browserConsoleArguments () {

        const spans = this.styledWithCSS.spans

        return [spans.map (p => ('%c' + p.text)).join (''),
             ...spans.map (p => p.css)]
    }

/*  Installs unsafe String extensions   */

    static get nice () {

        const def = k => O.defineProperty (String.prototype, k,  { get: function () { return Colors[k] (this) } })

        colorCodes.forEach ((k, i) => {
            if (!(k in String.prototype)) {
                [                   k,
                 camel ('bg',       k),
                 camel ('bgBright', k)].forEach (def) } })

        styleCodes.forEach ((k, i) => { if (!(k in String.prototype)) def (k) })

        return Colors
    }

/*  Parsing front-end   */

    static parse (s) {
        return new Colors (s).normalized.styledWithCSS
    }

/*  Iteration protocol  */

    [Symbol.iterator] () {
        return this.spans[Symbol.iterator] ()
    }
}

const normalize = s => new Colors (s).normalized.str
const wrap = (open, close) => s => normalize (('\u001b[' + open + 'm') + s + ('\u001b[' + close + 'm'))

colorCodes.forEach ((k, i) => {
    if (k) {
        Colors[k]                     = wrap (30  + i, Code.noColor)
        Colors[camel ('bg',       k)] = wrap (40  + i, Code.noBgColor)
        Colors[camel ('bgBright', k)] = wrap (100 + i, Code.noBgColor) } })

styleCodes.forEach ((k, i) => {
    if (k) {
        Colors[k] = wrap (i, ((k === 'bright') || (k === 'dim')) ? Code.noBrightness : (20 + i)) } })

module.exports = Colors


