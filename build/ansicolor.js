"use strict";

/*  ------------------------------------------------------------------------ */

const O = Object;

/*  See https://misc.flogisoft.com/bash/tip_colors_and_formatting
    ------------------------------------------------------------------------ */

const colorCodes = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'lightGray', '', 'default'],
      colorCodesLight = ['darkGray', 'lightRed', 'lightGreen', 'lightYellow', 'lightBlue', 'lightMagenta', 'lightCyan', 'white', ''],
      styleCodes = ['', 'bright', 'dim', 'italic', 'underline', '', '', 'inverse'],
      asBright = { 'red': 'lightRed',
    'green': 'lightGreen',
    'yellow': 'lightYellow',
    'blue': 'lightBlue',
    'magenta': 'lightMagenta',
    'cyan': 'lightCyan',
    'black': 'darkGray',
    'lightGray': 'white' },
      types = { 0: 'style',
    2: 'unstyle',
    3: 'color',
    9: 'colorLight',
    4: 'bgColor',
    10: 'bgColorLight' },
      subtypes = { color: colorCodes,
    colorLight: colorCodesLight,
    bgColor: colorCodes,
    bgColorLight: colorCodesLight,
    style: styleCodes,
    unstyle: styleCodes

    /*  ------------------------------------------------------------------------ */

};class Color {

    constructor(background, name, brightness) {

        this.background = background;
        this.name = name;
        this.brightness = brightness;
    }

    get inverse() {
        return new Color(!this.background, this.name || (this.background ? 'black' : 'white'), this.brightness);
    }

    get clean() {
        const name = this.name === "default" ? "" : this.name;
        const bright = this.brightness === Code.bright;
        const dim = this.brightness === Code.dim;

        if (!name && !bright && !dim) {
            return undefined;
        }

        return {
            name,
            bright,
            dim
        };
    }

    defaultBrightness(value) {

        return new Color(this.background, this.name, this.brightness || value);
    }

    css(inverted) {

        const color = inverted ? this.inverse : this;

        const rgbName = color.brightness === Code.bright && asBright[color.name] || color.name;

        const prop = color.background ? 'background:' : 'color:',
              rgb = Colors.rgb[rgbName],
              alpha = this.brightness === Code.dim ? 0.5 : 1;

        return rgb ? prop + 'rgba(' + [...rgb, alpha].join(',') + ');' : !color.background && alpha < 1 ? 'color:rgba(0,0,0,0.5);' : ''; // Chrome does not support 'opacity' property...
    }
}

/*  ------------------------------------------------------------------------ */

class Code {

    constructor(n) {
        let value = undefined;
        let type = undefined;
        let subtype = undefined;
        let str = "";
        let isBrightness = false;

        if (n !== undefined) {
            value = Number(n);
            type = types[Math.floor(value / 10)];
            subtype = subtypes[type][value % 10];
            str = "\u001b[" + value + "m";
            isBrightness = value === Code.noBrightness || value === Code.bright || value === Code.dim;
        }

        this.value = value;
        this.type = type;
        this.subtype = subtype;
        this.str = str;
        this.isBrightness = isBrightness;
    }

    static str(x) {
        if (x === undefined) return "";
        return "\u001b[" + Number(x) + "m";
    }

    clone() {
        const newCode = new Code(undefined);
        newCode.value = this.value;
        newCode.type = this.type;
        newCode.subtype = this.subtype;
        newCode.str = this.str;
        newCode.isBrightness = this.isBrightness;
        return newCode;
    }
}

/*  ------------------------------------------------------------------------ */

O.assign(Code, {

    reset: 0,
    bright: 1,
    dim: 2,
    inverse: 7,
    noBrightness: 22,
    noItalic: 23,
    noUnderline: 24,
    noInverse: 27,
    noColor: 39,
    noBgColor: 49
});

/*  ------------------------------------------------------------------------ */

const replaceAll = (str, a, b) => str.split(a).join(b);

/*  ANSI brightness codes do not overlap, e.g. "{bright}{dim}foo" will be rendered bright (not dim).
    So we fix it by adding brightness canceling before each brightness code, so the former example gets
    converted to "{noBrightness}{bright}{noBrightness}{dim}foo" – this way it gets rendered as expected.
 */

const denormalizeBrightness = s => s.replace(/(\u001b\[(1|2)m)/g, '\u001b[22m$1');
const normalizeBrightness = s => s.replace(/\u001b\[22m(\u001b\[(1|2)m)/g, '$1');

const wrap = (x, openCode, closeCode) => {

    const open = Code.str(openCode),
          close = Code.str(closeCode);

    return String(x).split('\n').map(line => denormalizeBrightness(open + replaceAll(normalizeBrightness(line), close, open) + close)).join('\n');
};

/*  ------------------------------------------------------------------------ */

const camel = (a, b) => a + b.charAt(0).toUpperCase() + b.slice(1);

const stringWrappingMethods = (() => [...colorCodes.map((k, i) => !k ? [] : [// color methods

[k, 30 + i, Code.noColor], [camel('bg', k), 40 + i, Code.noBgColor]]), ...colorCodesLight.map((k, i) => !k ? [] : [// light color methods

[k, 90 + i, Code.noColor], [camel('bg', k), 100 + i, Code.noBgColor]]),

/* THIS ONE IS FOR BACKWARDS COMPATIBILITY WITH PREVIOUS VERSIONS (had 'bright' instead of 'light' for backgrounds)
 */
...['', 'BrightRed', 'BrightGreen', 'BrightYellow', 'BrightBlue', 'BrightMagenta', 'BrightCyan'].map((k, i) => !k ? [] : [['bg' + k, 100 + i, Code.noBgColor]]), ...styleCodes.map((k, i) => !k ? [] : [// style methods

[k, i, k === 'bright' || k === 'dim' ? Code.noBrightness : 20 + i]])].reduce((a, b) => a.concat(b)))();

/*  ------------------------------------------------------------------------ */

const assignStringWrappingAPI = (target, wrapBefore = target) => stringWrappingMethods.reduce((memo, [k, open, close]) => O.defineProperty(memo, k, {
    get: () => assignStringWrappingAPI(str => wrapBefore(wrap(str, open, close)))
}), target);

/*  ------------------------------------------------------------------------ */

const TEXT = 0,
      BRACKET = 1,
      CODE = 2;

class Span {
    constructor(code, text) {
        this.code = code;
        this.text = text;

        // Those are added in the actual parse, this is done for performance reasons to have the same hidden class
        this.css = "";
        this.color = undefined;
        this.bgColor = undefined;
        this.bold = undefined;
        this.inverse = undefined;
        this.italic = undefined;
        this.underline = undefined;
        this.bright = undefined;
        this.dim = undefined;
    }
}

// getString as function instead of string to allow garbage collection
function* rawParse(getString) {
    const stateObject = {
        state: TEXT,
        buffer: "",
        text: "",
        code: "",
        codes: []
    };

    const ONE_MB = 1048576;

    // Instead of holding the reference to the string we split into chunks of 1MB
    // and after processing is finished we can remove the reference so it can be GCed
    const chunks = splitStringToChunksOfSize(getString(), ONE_MB);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        // Free memory for the previous chunk
        chunks[i] = undefined;
        yield* processChunk(chunk, stateObject);
    }

    if (stateObject.state !== TEXT) stateObject.text += stateObject.buffer;

    if (stateObject.text) {
        yield new Span(new Code(), stateObject.text);
    }
}

function splitStringToChunksOfSize(str, chunkSize) {
    const chunks = [];
    const chunksLength = Math.ceil(str.length / chunkSize);

    for (let i = 0, o = 0; i < chunksLength; ++i, o += chunkSize) {
        chunks.push(str.substring(o, o + chunkSize));
    }

    return chunks;
}

function* processChunk(chunk, stateObject) {
    const chars = chunk;
    const charsLength = chunk.length;

    for (let i = 0; i < charsLength; i++) {
        const c = chars[i];

        stateObject.buffer += c;

        switch (stateObject.state) {
            case TEXT:
                if (c === "\u001b") {
                    stateObject.state = BRACKET;
                    stateObject.buffer = c;
                } else {
                    stateObject.text += c;
                }
                break;

            case BRACKET:
                if (c === "[") {
                    stateObject.state = CODE;
                    stateObject.code = "";
                    stateObject.codes = [];
                } else {
                    stateObject.state = TEXT;
                    stateObject.text += stateObject.buffer;
                }
                break;

            case CODE:
                if (c >= "0" && c <= "9") {
                    stateObject.code += c;
                } else if (c === ";") {
                    stateObject.codes.push(new Code(stateObject.code));
                    stateObject.code = "";
                } else if (c === "m") {
                    stateObject.code = stateObject.code || "0";
                    for (const code of stateObject.codes) {
                        yield new Span(code, stateObject.text);
                        stateObject.text = "";
                    }

                    yield new Span(new Code(stateObject.code), stateObject.text);
                    stateObject.text = "";
                    stateObject.state = TEXT;
                } else {
                    stateObject.state = TEXT;
                    stateObject.text += stateObject.buffer;
                }
        }
    }
}

/**
 * Parse ansi text
 * @param {Generator<Span, void, *>} rawSpansIterator raw spans iterator
 * @return {Generator<Span, void, *>}
 */
function* parseAnsi(rawSpansIterator) {
    let color = new Color();
    let bgColor = new Color(true /* background */);
    let brightness = undefined;
    let styles = new Set();

    function reset() {
        color = new Color();
        bgColor = new Color(true /* background */);
        brightness = undefined;
        styles.clear();
    }

    reset();

    for (const span of rawSpansIterator) {
        const c = span.code;

        if (span.text !== "") {
            const inverted = styles.has("inverse");
            const underline = styles.has("underline") ? "text-decoration: underline;" : "";
            const italic = styles.has("italic") ? "font-style: italic;" : "";
            const bold = brightness === Code.bright ? "font-weight: bold;" : "";

            const foreColor = color.defaultBrightness(brightness);

            const newSpan = new Span(span.code ? span.code.clone() : undefined, span.text);

            newSpan.css = span.css ? span.css : bold + italic + underline + foreColor.css(inverted) + bgColor.css(inverted);
            newSpan.bold = span.bold ? span.bold : !!bold;
            newSpan.color = span.color ? span.color : foreColor.clean;
            newSpan.bgColor = span.bgColor ? span.bgColor : bgColor.clean;
            newSpan.inverse = inverted;
            newSpan.italic = !!italic;
            newSpan.underline = !!underline;
            newSpan.bright = styles.has("bright");
            newSpan.dim = styles.has("dim");

            yield newSpan;
        }

        if (c.isBrightness) {
            brightness = c.value;
            continue;
        }

        if (span.code.value === undefined) {
            continue;
        }

        if (span.code.value === Code.reset) {
            reset();
            continue;
        }

        switch (span.code.type) {
            case "color":
            case "colorLight":
                color = new Color(false, c.subtype);
                break;

            case "bgColor":
            case "bgColorLight":
                bgColor = new Color(true, c.subtype);
                break;

            case "style":
                styles.add(c.subtype);
                break;
            case "unstyle":
                styles.delete(c.subtype);
                break;
        }
    }
}

/*  ------------------------------------------------------------------------ */

/**
 * Represents an ANSI-escaped string.
 */
class Colors {

    /**
     * @param {string} s a string containing ANSI escape codes.
     */
    constructor(s) {
        this.spans = s ? Array.from(rawParse(typeof s === 'string' ? () => s : s)) : [];
    }

    get str() {
        return this.spans.reduce((str, p) => str + p.text + p.code.str, '');
    }

    get parsed() {
        const newColors = new Colors();

        newColors.spans = Array.from(parseAnsi(this.spans));

        return newColors;
    }

    /*  Outputs with Chrome DevTools-compatible format     */

    get asChromeConsoleLogArguments() {

        const spans = this.parsed.spans;

        return [spans.map(s => '%c' + s.text).join(''), ...spans.map(s => s.css)];
    }

    get browserConsoleArguments() /* LEGACY, DEPRECATED */{
        return this.asChromeConsoleLogArguments;
    }

    /**
     * @desc installs String prototype extensions
     * @example
     * require ('ansicolor').nice
     * console.log ('foo'.bright.red)
     */
    static get nice() {

        Colors.names.forEach(k => {
            if (!(k in String.prototype)) {
                O.defineProperty(String.prototype, k, { get: function () {
                        return Colors[k](this);
                    } });
            }
        });

        return Colors;
    }

    /**
     * @desc parses a string containing ANSI escape codes
     * @return {Colors} parsed representation.
     */
    static parse(s) {
        return new Colors(s).parsed;
    }

    /**
     *
     * @param {string | () => string} s string or a function returning a string (for large strings you may want to use a function to avoid memory issues)
     * @returns {Generator<Span, void, *>} Spans iterator
     */
    static parseIterator(s) {
        return parseAnsi(rawParse(typeof s === "string" ? () => s : s));
    }

    /**
     * @desc strips ANSI codes from a string
     * @param {string} s a string containing ANSI escape codes.
     * @return {string} clean string.
     */
    static strip(s) {
        return s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g, ''); // hope V8 caches the regexp
    }

    /**
     * @desc checks if a value contains ANSI escape codes
     * @param {any} s value to check
     * @return {boolean} has codes
     */
    static isEscaped(s) {
        s = String(s);
        return Colors.strip(s) !== s;
    }

    /**
     * @example
     * const spans = [...ansi.parse ('\u001b[7m\u001b[7mfoo\u001b[7mbar\u001b[27m')]
     */
    [Symbol.iterator]() {
        return this.spans[Symbol.iterator]();
    }

    /**
     * @desc This allows an alternative import style, see https://github.com/xpl/ansicolor/issues/7#issuecomment-578923578
     * @example
     * import { ansicolor, ParsedSpan } from 'ansicolor'
     */
    static get ansicolor() {
        return Colors;
    }
}

/*  ------------------------------------------------------------------------ */

assignStringWrappingAPI(Colors, str => str);

/*  ------------------------------------------------------------------------ */

Colors.names = stringWrappingMethods.map(([k]) => k);

/*  ------------------------------------------------------------------------ */

Colors.rgb = {

    black: [0, 0, 0],
    darkGray: [100, 100, 100],
    lightGray: [200, 200, 200],
    white: [255, 255, 255],

    red: [204, 0, 0],
    lightRed: [255, 51, 0],

    green: [0, 204, 0],
    lightGreen: [51, 204, 51],

    yellow: [204, 102, 0],
    lightYellow: [255, 153, 51],

    blue: [0, 0, 255],
    lightBlue: [26, 140, 255],

    magenta: [204, 0, 204],
    lightMagenta: [255, 0, 255],

    cyan: [0, 153, 255],
    lightCyan: [0, 204, 255]

    /*  ------------------------------------------------------------------------ */

};module.exports = Colors;

/*  ------------------------------------------------------------------------ */

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFjLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBWSxFQUFaLENBZEw7O0FBZ0JULFVBQWMsQ0FBQyxDQUFELEVBQVEsQ0FBUixFQUFXLEdBQVgsQ0FoQkw7QUFpQlQsZUFBYyxDQUFDLEVBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxDQWpCTDs7QUFtQlQsYUFBYyxDQUFDLEdBQUQsRUFBUSxDQUFSLEVBQVcsR0FBWCxDQW5CTDtBQW9CVCxrQkFBYyxDQUFDLEdBQUQsRUFBUSxDQUFSLEVBQVcsR0FBWCxDQXBCTDs7QUFzQlQsVUFBYyxDQUFDLENBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxDQXRCTDtBQXVCVCxlQUFjLENBQUMsQ0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYOztBQUdsQjs7QUExQmEsQ0FBYixDQTRCQSxPQUFPLE9BQVAsR0FBaUIsTUFBakI7O0FBRUEiLCJmaWxlIjoiYW5zaWNvbG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgTyA9IE9iamVjdFxuXG4vKiAgU2VlIGh0dHBzOi8vbWlzYy5mbG9naXNvZnQuY29tL2Jhc2gvdGlwX2NvbG9yc19hbmRfZm9ybWF0dGluZ1xuICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBjb2xvckNvZGVzICAgICAgPSBbICAgJ2JsYWNrJywgICAgICAncmVkJywgICAgICAnZ3JlZW4nLCAgICAgICd5ZWxsb3cnLCAgICAgICdibHVlJywgICAgICAnbWFnZW50YScsICAgICAgJ2N5YW4nLCAnbGlnaHRHcmF5JywgJycsICdkZWZhdWx0J11cbiAgICAsIGNvbG9yQ29kZXNMaWdodCA9IFsnZGFya0dyYXknLCAnbGlnaHRSZWQnLCAnbGlnaHRHcmVlbicsICdsaWdodFllbGxvdycsICdsaWdodEJsdWUnLCAnbGlnaHRNYWdlbnRhJywgJ2xpZ2h0Q3lhbicsICd3aGl0ZScsICcnXVxuXG4gICAgLCBzdHlsZUNvZGVzID0gWycnLCAnYnJpZ2h0JywgJ2RpbScsICdpdGFsaWMnLCAndW5kZXJsaW5lJywgJycsICcnLCAnaW52ZXJzZSddXG5cbiAgICAsIGFzQnJpZ2h0ID0geyAncmVkJzogICAgICAgJ2xpZ2h0UmVkJyxcbiAgICAgICAgICAgICAgICAgICAnZ3JlZW4nOiAgICAgJ2xpZ2h0R3JlZW4nLFxuICAgICAgICAgICAgICAgICAgICd5ZWxsb3cnOiAgICAnbGlnaHRZZWxsb3cnLFxuICAgICAgICAgICAgICAgICAgICdibHVlJzogICAgICAnbGlnaHRCbHVlJyxcbiAgICAgICAgICAgICAgICAgICAnbWFnZW50YSc6ICAgJ2xpZ2h0TWFnZW50YScsXG4gICAgICAgICAgICAgICAgICAgJ2N5YW4nOiAgICAgICdsaWdodEN5YW4nLFxuICAgICAgICAgICAgICAgICAgICdibGFjayc6ICAgICAnZGFya0dyYXknLFxuICAgICAgICAgICAgICAgICAgICdsaWdodEdyYXknOiAnd2hpdGUnIH1cblxuICAgICwgdHlwZXMgPSB7IDA6ICAnc3R5bGUnLFxuICAgICAgICAgICAgICAgIDI6ICAndW5zdHlsZScsXG4gICAgICAgICAgICAgICAgMzogICdjb2xvcicsXG4gICAgICAgICAgICAgICAgOTogICdjb2xvckxpZ2h0JyxcbiAgICAgICAgICAgICAgICA0OiAgJ2JnQ29sb3InLFxuICAgICAgICAgICAgICAgIDEwOiAnYmdDb2xvckxpZ2h0JyB9XG5cbiAgICAsIHN1YnR5cGVzID0geyAgY29sb3I6ICAgICAgICAgY29sb3JDb2RlcyxcbiAgICAgICAgICAgICAgICAgICAgY29sb3JMaWdodDogICAgY29sb3JDb2Rlc0xpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBiZ0NvbG9yOiAgICAgICBjb2xvckNvZGVzLFxuICAgICAgICAgICAgICAgICAgICBiZ0NvbG9yTGlnaHQ6ICBjb2xvckNvZGVzTGlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiAgICAgICAgIHN0eWxlQ29kZXMsXG4gICAgICAgICAgICAgICAgICAgIHVuc3R5bGU6ICAgICAgIHN0eWxlQ29kZXMgICAgfVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNsYXNzIENvbG9yIHtcblxuICAgIGNvbnN0cnVjdG9yIChiYWNrZ3JvdW5kLCBuYW1lLCBicmlnaHRuZXNzKSB7XG5cbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kID0gYmFja2dyb3VuZFxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lXG4gICAgICAgIHRoaXMuYnJpZ2h0bmVzcyA9IGJyaWdodG5lc3NcbiAgICB9XG5cbiAgICBnZXQgaW52ZXJzZSAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29sb3IgKCF0aGlzLmJhY2tncm91bmQsIHRoaXMubmFtZSB8fCAodGhpcy5iYWNrZ3JvdW5kID8gJ2JsYWNrJyA6ICd3aGl0ZScpLCB0aGlzLmJyaWdodG5lc3MpXG4gICAgfVxuXG4gICAgZ2V0IGNsZWFuKCkge1xuICAgICAgY29uc3QgbmFtZSA9IHRoaXMubmFtZSA9PT0gXCJkZWZhdWx0XCIgPyBcIlwiIDogdGhpcy5uYW1lO1xuICAgICAgY29uc3QgYnJpZ2h0ID0gdGhpcy5icmlnaHRuZXNzID09PSBDb2RlLmJyaWdodDtcbiAgICAgIGNvbnN0IGRpbSA9IHRoaXMuYnJpZ2h0bmVzcyA9PT0gQ29kZS5kaW07XG5cbiAgICAgIGlmICghbmFtZSAmJiAhYnJpZ2h0ICYmICFkaW0pIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgYnJpZ2h0LFxuICAgICAgICBkaW0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGRlZmF1bHRCcmlnaHRuZXNzICh2YWx1ZSkge1xuXG4gICAgICAgIHJldHVybiBuZXcgQ29sb3IgKHRoaXMuYmFja2dyb3VuZCwgdGhpcy5uYW1lLCB0aGlzLmJyaWdodG5lc3MgfHwgdmFsdWUpXG4gICAgfVxuXG4gICAgY3NzIChpbnZlcnRlZCkge1xuXG4gICAgICAgIGNvbnN0IGNvbG9yID0gaW52ZXJ0ZWQgPyB0aGlzLmludmVyc2UgOiB0aGlzXG5cbiAgICAgICAgY29uc3QgcmdiTmFtZSA9ICgoY29sb3IuYnJpZ2h0bmVzcyA9PT0gQ29kZS5icmlnaHQpICYmIGFzQnJpZ2h0W2NvbG9yLm5hbWVdKSB8fCBjb2xvci5uYW1lXG5cbiAgICAgICAgY29uc3QgcHJvcCA9IChjb2xvci5iYWNrZ3JvdW5kID8gJ2JhY2tncm91bmQ6JyA6ICdjb2xvcjonKVxuICAgICAgICAgICAgLCByZ2IgID0gQ29sb3JzLnJnYltyZ2JOYW1lXVxuICAgICAgICAgICAgLCBhbHBoYSA9ICh0aGlzLmJyaWdodG5lc3MgPT09IENvZGUuZGltKSA/IDAuNSA6IDFcblxuICAgICAgICByZXR1cm4gcmdiXG4gICAgICAgICAgICAgICAgPyAocHJvcCArICdyZ2JhKCcgKyBbLi4ucmdiLCBhbHBoYV0uam9pbiAoJywnKSArICcpOycpXG4gICAgICAgICAgICAgICAgOiAoKCFjb2xvci5iYWNrZ3JvdW5kICYmIChhbHBoYSA8IDEpKSA/ICdjb2xvcjpyZ2JhKDAsMCwwLDAuNSk7JyA6ICcnKSAvLyBDaHJvbWUgZG9lcyBub3Qgc3VwcG9ydCAnb3BhY2l0eScgcHJvcGVydHkuLi5cbiAgICB9XG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY2xhc3MgQ29kZSB7XG5cbiAgY29uc3RydWN0b3Iobikge1xuICAgIGxldCB2YWx1ZSA9IHVuZGVmaW5lZDtcbiAgICBsZXQgdHlwZSA9IHVuZGVmaW5lZDtcbiAgICBsZXQgc3VidHlwZSA9IHVuZGVmaW5lZDtcbiAgICBsZXQgc3RyID0gXCJcIjtcbiAgICBsZXQgaXNCcmlnaHRuZXNzID0gZmFsc2U7XG5cbiAgICBpZiAobiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB2YWx1ZSA9IE51bWJlcihuKTtcbiAgICAgIHR5cGUgPSB0eXBlc1tNYXRoLmZsb29yKHZhbHVlIC8gMTApXTtcbiAgICAgIHN1YnR5cGUgPSBzdWJ0eXBlc1t0eXBlXVt2YWx1ZSAlIDEwXTtcbiAgICAgIHN0ciA9IFwiXFx1MDAxYltcIiArIHZhbHVlICsgXCJtXCI7XG4gICAgICBpc0JyaWdodG5lc3MgPVxuICAgICAgICB2YWx1ZSA9PT0gQ29kZS5ub0JyaWdodG5lc3MgfHxcbiAgICAgICAgdmFsdWUgPT09IENvZGUuYnJpZ2h0IHx8XG4gICAgICAgIHZhbHVlID09PSBDb2RlLmRpbTtcbiAgICB9XG5cbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLnN1YnR5cGUgPSBzdWJ0eXBlO1xuICAgIHRoaXMuc3RyID0gc3RyO1xuICAgIHRoaXMuaXNCcmlnaHRuZXNzID0gaXNCcmlnaHRuZXNzO1xuICB9XG5cbiAgc3RhdGljIHN0cih4KSB7XG4gICAgaWYoeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gXCJcIjtcbiAgICByZXR1cm4gXCJcXHUwMDFiW1wiICsgTnVtYmVyKHgpICsgXCJtXCI7XG4gIH1cblxuICBjbG9uZSgpIHtcbiAgICAgIGNvbnN0IG5ld0NvZGUgPSBuZXcgQ29kZSh1bmRlZmluZWQpO1xuICAgICAgbmV3Q29kZS52YWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgICBuZXdDb2RlLnR5cGUgPSB0aGlzLnR5cGU7XG4gICAgICBuZXdDb2RlLnN1YnR5cGUgPSB0aGlzLnN1YnR5cGU7XG4gICAgICBuZXdDb2RlLnN0ciA9IHRoaXMuc3RyO1xuICAgICAgbmV3Q29kZS5pc0JyaWdodG5lc3MgPSB0aGlzLmlzQnJpZ2h0bmVzcztcbiAgICAgIHJldHVybiBuZXdDb2RlXG4gIH1cbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5PLmFzc2lnbiAoQ29kZSwge1xuXG4gICAgcmVzZXQ6ICAgICAgICAwLFxuICAgIGJyaWdodDogICAgICAgMSxcbiAgICBkaW06ICAgICAgICAgIDIsXG4gICAgaW52ZXJzZTogICAgICA3LFxuICAgIG5vQnJpZ2h0bmVzczogMjIsXG4gICAgbm9JdGFsaWM6ICAgICAyMyxcbiAgICBub1VuZGVybGluZTogIDI0LFxuICAgIG5vSW52ZXJzZTogICAgMjcsXG4gICAgbm9Db2xvcjogICAgICAzOSxcbiAgICBub0JnQ29sb3I6ICAgIDQ5XG59KVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IHJlcGxhY2VBbGwgPSAoc3RyLCBhLCBiKSA9PiBzdHIuc3BsaXQgKGEpLmpvaW4gKGIpXG5cbi8qICBBTlNJIGJyaWdodG5lc3MgY29kZXMgZG8gbm90IG92ZXJsYXAsIGUuZy4gXCJ7YnJpZ2h0fXtkaW19Zm9vXCIgd2lsbCBiZSByZW5kZXJlZCBicmlnaHQgKG5vdCBkaW0pLlxuICAgIFNvIHdlIGZpeCBpdCBieSBhZGRpbmcgYnJpZ2h0bmVzcyBjYW5jZWxpbmcgYmVmb3JlIGVhY2ggYnJpZ2h0bmVzcyBjb2RlLCBzbyB0aGUgZm9ybWVyIGV4YW1wbGUgZ2V0c1xuICAgIGNvbnZlcnRlZCB0byBcIntub0JyaWdodG5lc3N9e2JyaWdodH17bm9CcmlnaHRuZXNzfXtkaW19Zm9vXCIg4oCTIHRoaXMgd2F5IGl0IGdldHMgcmVuZGVyZWQgYXMgZXhwZWN0ZWQuXG4gKi9cblxuY29uc3QgZGVub3JtYWxpemVCcmlnaHRuZXNzID0gcyA9PiBzLnJlcGxhY2UgKC8oXFx1MDAxYlxcWygxfDIpbSkvZywgJ1xcdTAwMWJbMjJtJDEnKVxuY29uc3Qgbm9ybWFsaXplQnJpZ2h0bmVzcyA9IHMgPT4gcy5yZXBsYWNlICgvXFx1MDAxYlxcWzIybShcXHUwMDFiXFxbKDF8MiltKS9nLCAnJDEnKVxuXG5jb25zdCB3cmFwID0gKHgsIG9wZW5Db2RlLCBjbG9zZUNvZGUpID0+IHtcblxuICAgIGNvbnN0IG9wZW4gID0gQ29kZS5zdHIgKG9wZW5Db2RlKSxcbiAgICAgICAgICBjbG9zZSA9IENvZGUuc3RyIChjbG9zZUNvZGUpXG5cbiAgICByZXR1cm4gU3RyaW5nICh4KVxuICAgICAgICAgICAgICAgIC5zcGxpdCAoJ1xcbicpXG4gICAgICAgICAgICAgICAgLm1hcCAobGluZSA9PiBkZW5vcm1hbGl6ZUJyaWdodG5lc3MgKG9wZW4gKyByZXBsYWNlQWxsIChub3JtYWxpemVCcmlnaHRuZXNzIChsaW5lKSwgY2xvc2UsIG9wZW4pICsgY2xvc2UpKVxuICAgICAgICAgICAgICAgIC5qb2luICgnXFxuJylcbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBjYW1lbCA9IChhLCBiKSA9PiBhICsgYi5jaGFyQXQgKDApLnRvVXBwZXJDYXNlICgpICsgYi5zbGljZSAoMSlcblxuXG5jb25zdCBzdHJpbmdXcmFwcGluZ01ldGhvZHMgPSAoKCkgPT4gW1xuXG4gICAgICAgIC4uLmNvbG9yQ29kZXMubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFsgLy8gY29sb3IgbWV0aG9kc1xuXG4gICAgICAgICAgICBbaywgICAgICAgICAgICAgICAzMCArIGksIENvZGUubm9Db2xvcl0sXG4gICAgICAgICAgICBbY2FtZWwgKCdiZycsIGspLCA0MCArIGksIENvZGUubm9CZ0NvbG9yXSxcbiAgICAgICAgXSksXG5cbiAgICAgICAgLi4uY29sb3JDb2Rlc0xpZ2h0Lm1hcCAoKGssIGkpID0+ICFrID8gW10gOiBbIC8vIGxpZ2h0IGNvbG9yIG1ldGhvZHNcblxuICAgICAgICAgICAgW2ssICAgICAgICAgICAgICAgIDkwICsgaSwgQ29kZS5ub0NvbG9yXSxcbiAgICAgICAgICAgIFtjYW1lbCAoJ2JnJywgayksIDEwMCArIGksIENvZGUubm9CZ0NvbG9yXSxcbiAgICAgICAgXSksXG5cbiAgICAgICAgLyogVEhJUyBPTkUgSVMgRk9SIEJBQ0tXQVJEUyBDT01QQVRJQklMSVRZIFdJVEggUFJFVklPVVMgVkVSU0lPTlMgKGhhZCAnYnJpZ2h0JyBpbnN0ZWFkIG9mICdsaWdodCcgZm9yIGJhY2tncm91bmRzKVxuICAgICAgICAgKi9cbiAgICAgICAgLi4uWycnLCAnQnJpZ2h0UmVkJywgJ0JyaWdodEdyZWVuJywgJ0JyaWdodFllbGxvdycsICdCcmlnaHRCbHVlJywgJ0JyaWdodE1hZ2VudGEnLCAnQnJpZ2h0Q3lhbiddLm1hcCAoKGssIGkpID0+ICFrID8gW10gOiBbXG5cbiAgICAgICAgICAgIFsnYmcnICsgaywgMTAwICsgaSwgQ29kZS5ub0JnQ29sb3JdLFxuICAgICAgICBdKSxcblxuICAgICAgICAuLi5zdHlsZUNvZGVzLm1hcCAoKGssIGkpID0+ICFrID8gW10gOiBbIC8vIHN0eWxlIG1ldGhvZHNcblxuICAgICAgICAgICAgW2ssIGksICgoayA9PT0gJ2JyaWdodCcpIHx8IChrID09PSAnZGltJykpID8gQ29kZS5ub0JyaWdodG5lc3MgOiAoMjAgKyBpKV1cbiAgICAgICAgXSlcbiAgICBdXG4gICAgLnJlZHVjZSAoKGEsIGIpID0+IGEuY29uY2F0IChiKSlcblxuKSAoKTtcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBhc3NpZ25TdHJpbmdXcmFwcGluZ0FQSSA9ICh0YXJnZXQsIHdyYXBCZWZvcmUgPSB0YXJnZXQpID0+XG5cbiAgICBzdHJpbmdXcmFwcGluZ01ldGhvZHMucmVkdWNlICgobWVtbywgW2ssIG9wZW4sIGNsb3NlXSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPLmRlZmluZVByb3BlcnR5IChtZW1vLCBrLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldDogKCkgPT4gYXNzaWduU3RyaW5nV3JhcHBpbmdBUEkgKHN0ciA9PiB3cmFwQmVmb3JlICh3cmFwIChzdHIsIG9wZW4sIGNsb3NlKSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQpXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgVEVYVCAgICA9IDAsXG4gICAgICBCUkFDS0VUID0gMSxcbiAgICAgIENPREUgICAgPSAyXG5cbmNsYXNzIFNwYW4ge1xuICBjb25zdHJ1Y3Rvcihjb2RlLCB0ZXh0KSB7XG4gICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICB0aGlzLnRleHQgPSB0ZXh0O1xuXG4gICAgLy8gVGhvc2UgYXJlIGFkZGVkIGluIHRoZSBhY3R1YWwgcGFyc2UsIHRoaXMgaXMgZG9uZSBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyB0byBoYXZlIHRoZSBzYW1lIGhpZGRlbiBjbGFzc1xuICAgIHRoaXMuY3NzID0gXCJcIjtcbiAgICB0aGlzLmNvbG9yID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuYmdDb2xvciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmJvbGQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5pbnZlcnNlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuaXRhbGljID0gdW5kZWZpbmVkO1xuICAgIHRoaXMudW5kZXJsaW5lID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuYnJpZ2h0ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZGltID0gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8vIGdldFN0cmluZyBhcyBmdW5jdGlvbiBpbnN0ZWFkIG9mIHN0cmluZyB0byBhbGxvdyBnYXJiYWdlIGNvbGxlY3Rpb25cbmZ1bmN0aW9uKiByYXdQYXJzZShnZXRTdHJpbmcpIHtcbiAgY29uc3Qgc3RhdGVPYmplY3QgPSB7XG4gICAgc3RhdGU6IFRFWFQsXG4gICAgYnVmZmVyOiBcIlwiLFxuICAgIHRleHQ6IFwiXCIsXG4gICAgY29kZTogXCJcIixcbiAgICBjb2RlczogW10sXG4gIH07XG5cbiAgY29uc3QgT05FX01CID0gMTA0ODU3NjtcblxuICAvLyBJbnN0ZWFkIG9mIGhvbGRpbmcgdGhlIHJlZmVyZW5jZSB0byB0aGUgc3RyaW5nIHdlIHNwbGl0IGludG8gY2h1bmtzIG9mIDFNQlxuICAvLyBhbmQgYWZ0ZXIgcHJvY2Vzc2luZyBpcyBmaW5pc2hlZCB3ZSBjYW4gcmVtb3ZlIHRoZSByZWZlcmVuY2Ugc28gaXQgY2FuIGJlIEdDZWRcbiAgY29uc3QgY2h1bmtzID0gc3BsaXRTdHJpbmdUb0NodW5rc09mU2l6ZShnZXRTdHJpbmcoKSwgT05FX01CKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNodW5rcy5sZW5ndGg7IGkrKyl7XG4gICAgICBjb25zdCBjaHVuayA9IGNodW5rc1tpXTtcbiAgICAgIC8vIEZyZWUgbWVtb3J5IGZvciB0aGUgcHJldmlvdXMgY2h1bmtcbiAgICAgIGNodW5rc1tpXSA9IHVuZGVmaW5lZDtcbiAgICAgIHlpZWxkKiBwcm9jZXNzQ2h1bmsoY2h1bmssIHN0YXRlT2JqZWN0KTtcbiAgfVxuXG4gIGlmIChzdGF0ZU9iamVjdC5zdGF0ZSAhPT0gVEVYVCkgc3RhdGVPYmplY3QudGV4dCArPSBzdGF0ZU9iamVjdC5idWZmZXI7XG5cbiAgaWYgKHN0YXRlT2JqZWN0LnRleHQpIHtcbiAgICB5aWVsZCBuZXcgU3BhbihuZXcgQ29kZSgpLCBzdGF0ZU9iamVjdC50ZXh0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzcGxpdFN0cmluZ1RvQ2h1bmtzT2ZTaXplKHN0ciwgY2h1bmtTaXplKSB7XG4gIGNvbnN0IGNodW5rcyA9IFtdO1xuICBjb25zdCBjaHVua3NMZW5ndGggPSBNYXRoLmNlaWwoc3RyLmxlbmd0aCAvIGNodW5rU2l6ZSk7XG5cbiAgZm9yIChsZXQgaSA9IDAsIG8gPSAwOyBpIDwgY2h1bmtzTGVuZ3RoOyArK2ksIG8gKz0gY2h1bmtTaXplKSB7XG4gICAgY2h1bmtzLnB1c2goc3RyLnN1YnN0cmluZyhvLCBvICsgY2h1bmtTaXplKSk7XG4gIH1cblxuICByZXR1cm4gY2h1bmtzO1xufVxuXG5mdW5jdGlvbiogcHJvY2Vzc0NodW5rKGNodW5rLCBzdGF0ZU9iamVjdCkge1xuICBjb25zdCBjaGFycyA9IGNodW5rO1xuICBjb25zdCBjaGFyc0xlbmd0aCA9IGNodW5rLmxlbmd0aDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoYXJzTGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjID0gY2hhcnNbaV07XG5cbiAgICBzdGF0ZU9iamVjdC5idWZmZXIgKz0gYztcblxuICAgIHN3aXRjaCAoc3RhdGVPYmplY3Quc3RhdGUpIHtcbiAgICAgIGNhc2UgVEVYVDpcbiAgICAgICAgaWYgKGMgPT09IFwiXFx1MDAxYlwiKSB7XG4gICAgICAgICAgc3RhdGVPYmplY3Quc3RhdGUgPSBCUkFDS0VUO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LmJ1ZmZlciA9IGM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhdGVPYmplY3QudGV4dCArPSBjO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEJSQUNLRVQ6XG4gICAgICAgIGlmIChjID09PSBcIltcIikge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnN0YXRlID0gQ09ERTtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5jb2RlID0gXCJcIjtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5jb2RlcyA9IFtdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnN0YXRlID0gVEVYVDtcbiAgICAgICAgICBzdGF0ZU9iamVjdC50ZXh0ICs9IHN0YXRlT2JqZWN0LmJ1ZmZlcjtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBDT0RFOlxuICAgICAgICBpZiAoYyA+PSBcIjBcIiAmJiBjIDw9IFwiOVwiKSB7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZSArPSBjO1xuICAgICAgICB9IGVsc2UgaWYgKGMgPT09IFwiO1wiKSB7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZXMucHVzaChuZXcgQ29kZShzdGF0ZU9iamVjdC5jb2RlKSk7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZSA9IFwiXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoYyA9PT0gXCJtXCIpIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5jb2RlID0gc3RhdGVPYmplY3QuY29kZSB8fCBcIjBcIjtcbiAgICAgICAgICBmb3IgKGNvbnN0IGNvZGUgb2Ygc3RhdGVPYmplY3QuY29kZXMpIHtcbiAgICAgICAgICAgIHlpZWxkIG5ldyBTcGFuKGNvZGUsIHN0YXRlT2JqZWN0LnRleHQpO1xuICAgICAgICAgICAgc3RhdGVPYmplY3QudGV4dCA9IFwiXCI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgeWllbGQgbmV3IFNwYW4obmV3IENvZGUoc3RhdGVPYmplY3QuY29kZSksIHN0YXRlT2JqZWN0LnRleHQpO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnRleHQgPSBcIlwiO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnN0YXRlID0gVEVYVDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5zdGF0ZSA9IFRFWFQ7XG4gICAgICAgICAgc3RhdGVPYmplY3QudGV4dCArPSBzdGF0ZU9iamVjdC5idWZmZXI7XG4gICAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIFBhcnNlIGFuc2kgdGV4dFxuICogQHBhcmFtIHtHZW5lcmF0b3I8U3Bhbiwgdm9pZCwgKj59IHJhd1NwYW5zSXRlcmF0b3IgcmF3IHNwYW5zIGl0ZXJhdG9yXG4gKiBAcmV0dXJuIHtHZW5lcmF0b3I8U3Bhbiwgdm9pZCwgKj59XG4gKi9cbmZ1bmN0aW9uKiBwYXJzZUFuc2kocmF3U3BhbnNJdGVyYXRvcikge1xuICAgIGxldCBjb2xvciA9IG5ldyBDb2xvcigpO1xuICAgIGxldCBiZ0NvbG9yID0gbmV3IENvbG9yKHRydWUgLyogYmFja2dyb3VuZCAqLyk7XG4gICAgbGV0IGJyaWdodG5lc3MgPSB1bmRlZmluZWQ7XG4gICAgbGV0IHN0eWxlcyA9IG5ldyBTZXQoKTtcblxuICAgIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgICBjb2xvciA9IG5ldyBDb2xvcigpO1xuICAgICAgICBiZ0NvbG9yID0gbmV3IENvbG9yKHRydWUgLyogYmFja2dyb3VuZCAqLyk7XG4gICAgICAgIGJyaWdodG5lc3MgPSB1bmRlZmluZWQ7XG4gICAgICAgIHN0eWxlcy5jbGVhcigpO1xuICAgIH1cblxuICAgIHJlc2V0KCk7XG5cbiAgICBmb3IgKGNvbnN0IHNwYW4gb2YgcmF3U3BhbnNJdGVyYXRvcikge1xuICAgICAgICBjb25zdCBjID0gc3Bhbi5jb2RlO1xuXG4gICAgICAgIGlmKHNwYW4udGV4dCAhPT0gXCJcIikge1xuICAgICAgICAgICAgY29uc3QgaW52ZXJ0ZWQgPSBzdHlsZXMuaGFzKFwiaW52ZXJzZVwiKTtcbiAgICAgICAgICAgIGNvbnN0IHVuZGVybGluZSA9IHN0eWxlcy5oYXMoXCJ1bmRlcmxpbmVcIilcbiAgICAgICAgICAgICAgICA/IFwidGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XCJcbiAgICAgICAgICAgICAgICA6IFwiXCI7XG4gICAgICAgICAgICBjb25zdCBpdGFsaWMgPSBzdHlsZXMuaGFzKFwiaXRhbGljXCIpID8gXCJmb250LXN0eWxlOiBpdGFsaWM7XCIgOiBcIlwiO1xuICAgICAgICAgICAgY29uc3QgYm9sZCA9IGJyaWdodG5lc3MgPT09IENvZGUuYnJpZ2h0ID8gXCJmb250LXdlaWdodDogYm9sZDtcIiA6IFwiXCI7XG5cbiAgICAgICAgICAgIGNvbnN0IGZvcmVDb2xvciA9IGNvbG9yLmRlZmF1bHRCcmlnaHRuZXNzKGJyaWdodG5lc3MpO1xuXG4gICAgICAgICAgICBjb25zdCBuZXdTcGFuID0gbmV3IFNwYW4oc3Bhbi5jb2RlID8gc3Bhbi5jb2RlLmNsb25lKCkgOiB1bmRlZmluZWQsIHNwYW4udGV4dCk7XG5cbiAgICAgICAgICAgIG5ld1NwYW4uY3NzID0gc3Bhbi5jc3MgPyBzcGFuLmNzcyA6IGJvbGQgKyBpdGFsaWMgKyB1bmRlcmxpbmUgKyBmb3JlQ29sb3IuY3NzKGludmVydGVkKSArIGJnQ29sb3IuY3NzKGludmVydGVkKTtcbiAgICAgICAgICAgIG5ld1NwYW4uYm9sZCA9IHNwYW4uYm9sZCA/IHNwYW4uYm9sZCA6ICEhYm9sZDtcbiAgICAgICAgICAgIG5ld1NwYW4uY29sb3IgPSBzcGFuLmNvbG9yID8gc3Bhbi5jb2xvciA6IGZvcmVDb2xvci5jbGVhbjtcbiAgICAgICAgICAgIG5ld1NwYW4uYmdDb2xvciA9IHNwYW4uYmdDb2xvciA/IHNwYW4uYmdDb2xvciA6IGJnQ29sb3IuY2xlYW47XG4gICAgICAgICAgICBuZXdTcGFuLmludmVyc2UgPSBpbnZlcnRlZDtcbiAgICAgICAgICAgIG5ld1NwYW4uaXRhbGljID0gISFpdGFsaWM7XG4gICAgICAgICAgICBuZXdTcGFuLnVuZGVybGluZSA9ICEhdW5kZXJsaW5lO1xuICAgICAgICAgICAgbmV3U3Bhbi5icmlnaHQgPSBzdHlsZXMuaGFzKFwiYnJpZ2h0XCIpO1xuICAgICAgICAgICAgbmV3U3Bhbi5kaW0gPSBzdHlsZXMuaGFzKFwiZGltXCIpO1xuXG4gICAgICAgICAgICB5aWVsZCBuZXdTcGFuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGMuaXNCcmlnaHRuZXNzKSB7XG4gICAgICAgICAgICBicmlnaHRuZXNzID0gYy52YWx1ZTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNwYW4uY29kZS52YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzcGFuLmNvZGUudmFsdWUgPT09IENvZGUucmVzZXQpIHtcbiAgICAgICAgICAgIHJlc2V0KCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAoc3Bhbi5jb2RlLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJjb2xvclwiOlxuICAgICAgICAgICAgY2FzZSBcImNvbG9yTGlnaHRcIjpcbiAgICAgICAgICAgICAgICBjb2xvciA9IG5ldyBDb2xvcihmYWxzZSwgYy5zdWJ0eXBlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBcImJnQ29sb3JcIjpcbiAgICAgICAgICAgIGNhc2UgXCJiZ0NvbG9yTGlnaHRcIjpcbiAgICAgICAgICAgICAgICBiZ0NvbG9yID0gbmV3IENvbG9yKHRydWUsIGMuc3VidHlwZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgXCJzdHlsZVwiOlxuICAgICAgICAgICAgICAgIHN0eWxlcy5hZGQoYy5zdWJ0eXBlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ1bnN0eWxlXCI6XG4gICAgICAgICAgICAgICAgc3R5bGVzLmRlbGV0ZShjLnN1YnR5cGUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIEFOU0ktZXNjYXBlZCBzdHJpbmcuXG4gKi9cbmNsYXNzIENvbG9ycyB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcyBhIHN0cmluZyBjb250YWluaW5nIEFOU0kgZXNjYXBlIGNvZGVzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChzKSB7XG4gICAgICAgIHRoaXMuc3BhbnMgPSBzID8gQXJyYXkuZnJvbShyYXdQYXJzZSh0eXBlb2YgcyA9PT0gJ3N0cmluZycgPyAoKSA9PiBzIDogcykpIDogW11cbiAgICB9XG5cbiAgICBnZXQgc3RyICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3BhbnMucmVkdWNlICgoc3RyLCBwKSA9PiBzdHIgKyBwLnRleHQgKyBwLmNvZGUuc3RyLCAnJylcbiAgICB9XG5cbiAgICBnZXQgcGFyc2VkICgpIHtcbiAgICAgICAgY29uc3QgbmV3Q29sb3JzID0gbmV3IENvbG9ycygpO1xuXG4gICAgICAgIG5ld0NvbG9ycy5zcGFucyA9IEFycmF5LmZyb20ocGFyc2VBbnNpKHRoaXMuc3BhbnMpKTtcblxuICAgICAgICByZXR1cm4gbmV3Q29sb3JzO1xuICAgIH1cblxuLyogIE91dHB1dHMgd2l0aCBDaHJvbWUgRGV2VG9vbHMtY29tcGF0aWJsZSBmb3JtYXQgICAgICovXG5cbiAgICBnZXQgYXNDaHJvbWVDb25zb2xlTG9nQXJndW1lbnRzICgpIHtcblxuICAgICAgICBjb25zdCBzcGFucyA9IHRoaXMucGFyc2VkLnNwYW5zXG5cbiAgICAgICAgcmV0dXJuIFtzcGFucy5tYXAgKHMgPT4gKCclYycgKyBzLnRleHQpKS5qb2luICgnJyksXG4gICAgICAgICAgICAgLi4uc3BhbnMubWFwIChzID0+IHMuY3NzKV1cbiAgICB9XG5cbiAgICBnZXQgYnJvd3NlckNvbnNvbGVBcmd1bWVudHMgKCkgLyogTEVHQUNZLCBERVBSRUNBVEVEICovIHsgcmV0dXJuIHRoaXMuYXNDaHJvbWVDb25zb2xlTG9nQXJndW1lbnRzIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIGluc3RhbGxzIFN0cmluZyBwcm90b3R5cGUgZXh0ZW5zaW9uc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVxdWlyZSAoJ2Fuc2ljb2xvcicpLm5pY2VcbiAgICAgKiBjb25zb2xlLmxvZyAoJ2ZvbycuYnJpZ2h0LnJlZClcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IG5pY2UgKCkge1xuXG4gICAgICAgIENvbG9ycy5uYW1lcy5mb3JFYWNoIChrID0+IHtcbiAgICAgICAgICAgIGlmICghKGsgaW4gU3RyaW5nLnByb3RvdHlwZSkpIHtcbiAgICAgICAgICAgICAgICBPLmRlZmluZVByb3BlcnR5IChTdHJpbmcucHJvdG90eXBlLCBrLCB7IGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gQ29sb3JzW2tdICh0aGlzKSB9IH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIENvbG9yc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIHBhcnNlcyBhIHN0cmluZyBjb250YWluaW5nIEFOU0kgZXNjYXBlIGNvZGVzXG4gICAgICogQHJldHVybiB7Q29sb3JzfSBwYXJzZWQgcmVwcmVzZW50YXRpb24uXG4gICAgICovXG4gICAgc3RhdGljIHBhcnNlIChzKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29sb3JzIChzKS5wYXJzZWRcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nIHwgKCkgPT4gc3RyaW5nfSBzIHN0cmluZyBvciBhIGZ1bmN0aW9uIHJldHVybmluZyBhIHN0cmluZyAoZm9yIGxhcmdlIHN0cmluZ3MgeW91IG1heSB3YW50IHRvIHVzZSBhIGZ1bmN0aW9uIHRvIGF2b2lkIG1lbW9yeSBpc3N1ZXMpXG4gICAgICogQHJldHVybnMge0dlbmVyYXRvcjxTcGFuLCB2b2lkLCAqPn0gU3BhbnMgaXRlcmF0b3JcbiAgICAgKi9cbiAgICBzdGF0aWMgcGFyc2VJdGVyYXRvcihzKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUFuc2kocmF3UGFyc2UodHlwZW9mIHMgPT09IFwic3RyaW5nXCIgPyAoKSA9PiBzIDogcykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIHN0cmlwcyBBTlNJIGNvZGVzIGZyb20gYSBzdHJpbmdcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcyBhIHN0cmluZyBjb250YWluaW5nIEFOU0kgZXNjYXBlIGNvZGVzLlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gY2xlYW4gc3RyaW5nLlxuICAgICAqL1xuICAgIHN0YXRpYyBzdHJpcCAocykge1xuICAgICAgICByZXR1cm4gcy5yZXBsYWNlICgvW1xcdTAwMWJcXHUwMDliXVtbKCkjOz9dKig/OlswLTldezEsNH0oPzo7WzAtOV17MCw0fSkqKT9bMC05QS1QUlpjZi1ucXJ5PT48XS9nLCAnJykgLy8gaG9wZSBWOCBjYWNoZXMgdGhlIHJlZ2V4cFxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIGNoZWNrcyBpZiBhIHZhbHVlIGNvbnRhaW5zIEFOU0kgZXNjYXBlIGNvZGVzXG4gICAgICogQHBhcmFtIHthbnl9IHMgdmFsdWUgdG8gY2hlY2tcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBoYXMgY29kZXNcbiAgICAgKi9cbiAgICAgc3RhdGljIGlzRXNjYXBlZCAocykge1xuICAgICAgICBzID0gU3RyaW5nKHMpXG4gICAgICAgIHJldHVybiBDb2xvcnMuc3RyaXAgKHMpICE9PSBzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3Qgc3BhbnMgPSBbLi4uYW5zaS5wYXJzZSAoJ1xcdTAwMWJbN21cXHUwMDFiWzdtZm9vXFx1MDAxYls3bWJhclxcdTAwMWJbMjdtJyldXG4gICAgICovXG4gICAgW1N5bWJvbC5pdGVyYXRvcl0gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zcGFuc1tTeW1ib2wuaXRlcmF0b3JdICgpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGRlc2MgVGhpcyBhbGxvd3MgYW4gYWx0ZXJuYXRpdmUgaW1wb3J0IHN0eWxlLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3hwbC9hbnNpY29sb3IvaXNzdWVzLzcjaXNzdWVjb21tZW50LTU3ODkyMzU3OFxuICAgICAqIEBleGFtcGxlXG4gICAgICogaW1wb3J0IHsgYW5zaWNvbG9yLCBQYXJzZWRTcGFuIH0gZnJvbSAnYW5zaWNvbG9yJ1xuICAgICAqL1xuICAgIHN0YXRpYyBnZXQgYW5zaWNvbG9yICgpIHtcbiAgICAgICAgcmV0dXJuIENvbG9yc1xuICAgIH1cbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5hc3NpZ25TdHJpbmdXcmFwcGluZ0FQSSAoQ29sb3JzLCBzdHIgPT4gc3RyKVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbkNvbG9ycy5uYW1lcyA9IHN0cmluZ1dyYXBwaW5nTWV0aG9kcy5tYXAgKChba10pID0+IGspXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuQ29sb3JzLnJnYiA9IHtcblxuICAgIGJsYWNrOiAgICAgICAgWzAsICAgICAwLCAgIDBdLFxuICAgIGRhcmtHcmF5OiAgICAgWzEwMCwgMTAwLCAxMDBdLFxuICAgIGxpZ2h0R3JheTogICAgWzIwMCwgMjAwLCAyMDBdLFxuICAgIHdoaXRlOiAgICAgICAgWzI1NSwgMjU1LCAyNTVdLFxuXG4gICAgcmVkOiAgICAgICAgICBbMjA0LCAgIDAsICAgMF0sXG4gICAgbGlnaHRSZWQ6ICAgICBbMjU1LCAgNTEsICAgMF0sXG5cbiAgICBncmVlbjogICAgICAgIFswLCAgIDIwNCwgICAwXSxcbiAgICBsaWdodEdyZWVuOiAgIFs1MSwgIDIwNCwgIDUxXSxcblxuICAgIHllbGxvdzogICAgICAgWzIwNCwgMTAyLCAgIDBdLFxuICAgIGxpZ2h0WWVsbG93OiAgWzI1NSwgMTUzLCAgNTFdLFxuXG4gICAgYmx1ZTogICAgICAgICBbMCwgICAgIDAsIDI1NV0sXG4gICAgbGlnaHRCbHVlOiAgICBbMjYsICAxNDAsIDI1NV0sXG5cbiAgICBtYWdlbnRhOiAgICAgIFsyMDQsICAgMCwgMjA0XSxcbiAgICBsaWdodE1hZ2VudGE6IFsyNTUsICAgMCwgMjU1XSxcblxuICAgIGN5YW46ICAgICAgICAgWzAsICAgMTUzLCAyNTVdLFxuICAgIGxpZ2h0Q3lhbjogICAgWzAsICAgMjA0LCAyNTVdLFxufVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3JzXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuIl19