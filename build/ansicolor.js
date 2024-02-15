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
            if (type === undefined || subtypes[type] === undefined) {
                return;
            }
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QVksRUFBWixDQVhMOztBQWFULFlBQWMsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFhLENBQWIsQ0FiTDtBQWNULGlCQUFjLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBWSxFQUFaLENBZEw7O0FBZ0JULFVBQWMsQ0FBQyxDQUFELEVBQVEsQ0FBUixFQUFXLEdBQVgsQ0FoQkw7QUFpQlQsZUFBYyxDQUFDLEVBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxDQWpCTDs7QUFtQlQsYUFBYyxDQUFDLEdBQUQsRUFBUSxDQUFSLEVBQVcsR0FBWCxDQW5CTDtBQW9CVCxrQkFBYyxDQUFDLEdBQUQsRUFBUSxDQUFSLEVBQVcsR0FBWCxDQXBCTDs7QUFzQlQsVUFBYyxDQUFDLENBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxDQXRCTDtBQXVCVCxlQUFjLENBQUMsQ0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYOztBQUdsQjs7QUExQmEsQ0FBYixDQTRCQSxPQUFPLE9BQVAsR0FBaUIsTUFBakI7O0FBRUEiLCJmaWxlIjoiYW5zaWNvbG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgTyA9IE9iamVjdFxuXG4vKiAgU2VlIGh0dHBzOi8vbWlzYy5mbG9naXNvZnQuY29tL2Jhc2gvdGlwX2NvbG9yc19hbmRfZm9ybWF0dGluZ1xuICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBjb2xvckNvZGVzICAgICAgPSBbICAgJ2JsYWNrJywgICAgICAncmVkJywgICAgICAnZ3JlZW4nLCAgICAgICd5ZWxsb3cnLCAgICAgICdibHVlJywgICAgICAnbWFnZW50YScsICAgICAgJ2N5YW4nLCAnbGlnaHRHcmF5JywgJycsICdkZWZhdWx0J11cbiAgICAsIGNvbG9yQ29kZXNMaWdodCA9IFsnZGFya0dyYXknLCAnbGlnaHRSZWQnLCAnbGlnaHRHcmVlbicsICdsaWdodFllbGxvdycsICdsaWdodEJsdWUnLCAnbGlnaHRNYWdlbnRhJywgJ2xpZ2h0Q3lhbicsICd3aGl0ZScsICcnXVxuXG4gICAgLCBzdHlsZUNvZGVzID0gWycnLCAnYnJpZ2h0JywgJ2RpbScsICdpdGFsaWMnLCAndW5kZXJsaW5lJywgJycsICcnLCAnaW52ZXJzZSddXG5cbiAgICAsIGFzQnJpZ2h0ID0geyAncmVkJzogICAgICAgJ2xpZ2h0UmVkJyxcbiAgICAgICAgICAgICAgICAgICAnZ3JlZW4nOiAgICAgJ2xpZ2h0R3JlZW4nLFxuICAgICAgICAgICAgICAgICAgICd5ZWxsb3cnOiAgICAnbGlnaHRZZWxsb3cnLFxuICAgICAgICAgICAgICAgICAgICdibHVlJzogICAgICAnbGlnaHRCbHVlJyxcbiAgICAgICAgICAgICAgICAgICAnbWFnZW50YSc6ICAgJ2xpZ2h0TWFnZW50YScsXG4gICAgICAgICAgICAgICAgICAgJ2N5YW4nOiAgICAgICdsaWdodEN5YW4nLFxuICAgICAgICAgICAgICAgICAgICdibGFjayc6ICAgICAnZGFya0dyYXknLFxuICAgICAgICAgICAgICAgICAgICdsaWdodEdyYXknOiAnd2hpdGUnIH1cblxuICAgICwgdHlwZXMgPSB7IDA6ICAnc3R5bGUnLFxuICAgICAgICAgICAgICAgIDI6ICAndW5zdHlsZScsXG4gICAgICAgICAgICAgICAgMzogICdjb2xvcicsXG4gICAgICAgICAgICAgICAgOTogICdjb2xvckxpZ2h0JyxcbiAgICAgICAgICAgICAgICA0OiAgJ2JnQ29sb3InLFxuICAgICAgICAgICAgICAgIDEwOiAnYmdDb2xvckxpZ2h0JyB9XG5cbiAgICAsIHN1YnR5cGVzID0geyAgY29sb3I6ICAgICAgICAgY29sb3JDb2RlcyxcbiAgICAgICAgICAgICAgICAgICAgY29sb3JMaWdodDogICAgY29sb3JDb2Rlc0xpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBiZ0NvbG9yOiAgICAgICBjb2xvckNvZGVzLFxuICAgICAgICAgICAgICAgICAgICBiZ0NvbG9yTGlnaHQ6ICBjb2xvckNvZGVzTGlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiAgICAgICAgIHN0eWxlQ29kZXMsXG4gICAgICAgICAgICAgICAgICAgIHVuc3R5bGU6ICAgICAgIHN0eWxlQ29kZXMgICAgfVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNsYXNzIENvbG9yIHtcblxuICAgIGNvbnN0cnVjdG9yIChiYWNrZ3JvdW5kLCBuYW1lLCBicmlnaHRuZXNzKSB7XG5cbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kID0gYmFja2dyb3VuZFxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lXG4gICAgICAgIHRoaXMuYnJpZ2h0bmVzcyA9IGJyaWdodG5lc3NcbiAgICB9XG5cbiAgICBnZXQgaW52ZXJzZSAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29sb3IgKCF0aGlzLmJhY2tncm91bmQsIHRoaXMubmFtZSB8fCAodGhpcy5iYWNrZ3JvdW5kID8gJ2JsYWNrJyA6ICd3aGl0ZScpLCB0aGlzLmJyaWdodG5lc3MpXG4gICAgfVxuXG4gICAgZ2V0IGNsZWFuKCkge1xuICAgICAgY29uc3QgbmFtZSA9IHRoaXMubmFtZSA9PT0gXCJkZWZhdWx0XCIgPyBcIlwiIDogdGhpcy5uYW1lO1xuICAgICAgY29uc3QgYnJpZ2h0ID0gdGhpcy5icmlnaHRuZXNzID09PSBDb2RlLmJyaWdodDtcbiAgICAgIGNvbnN0IGRpbSA9IHRoaXMuYnJpZ2h0bmVzcyA9PT0gQ29kZS5kaW07XG5cbiAgICAgIGlmICghbmFtZSAmJiAhYnJpZ2h0ICYmICFkaW0pIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgYnJpZ2h0LFxuICAgICAgICBkaW0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGRlZmF1bHRCcmlnaHRuZXNzICh2YWx1ZSkge1xuXG4gICAgICAgIHJldHVybiBuZXcgQ29sb3IgKHRoaXMuYmFja2dyb3VuZCwgdGhpcy5uYW1lLCB0aGlzLmJyaWdodG5lc3MgfHwgdmFsdWUpXG4gICAgfVxuXG4gICAgY3NzIChpbnZlcnRlZCkge1xuXG4gICAgICAgIGNvbnN0IGNvbG9yID0gaW52ZXJ0ZWQgPyB0aGlzLmludmVyc2UgOiB0aGlzXG5cbiAgICAgICAgY29uc3QgcmdiTmFtZSA9ICgoY29sb3IuYnJpZ2h0bmVzcyA9PT0gQ29kZS5icmlnaHQpICYmIGFzQnJpZ2h0W2NvbG9yLm5hbWVdKSB8fCBjb2xvci5uYW1lXG5cbiAgICAgICAgY29uc3QgcHJvcCA9IChjb2xvci5iYWNrZ3JvdW5kID8gJ2JhY2tncm91bmQ6JyA6ICdjb2xvcjonKVxuICAgICAgICAgICAgLCByZ2IgID0gQ29sb3JzLnJnYltyZ2JOYW1lXVxuICAgICAgICAgICAgLCBhbHBoYSA9ICh0aGlzLmJyaWdodG5lc3MgPT09IENvZGUuZGltKSA/IDAuNSA6IDFcblxuICAgICAgICByZXR1cm4gcmdiXG4gICAgICAgICAgICAgICAgPyAocHJvcCArICdyZ2JhKCcgKyBbLi4ucmdiLCBhbHBoYV0uam9pbiAoJywnKSArICcpOycpXG4gICAgICAgICAgICAgICAgOiAoKCFjb2xvci5iYWNrZ3JvdW5kICYmIChhbHBoYSA8IDEpKSA/ICdjb2xvcjpyZ2JhKDAsMCwwLDAuNSk7JyA6ICcnKSAvLyBDaHJvbWUgZG9lcyBub3Qgc3VwcG9ydCAnb3BhY2l0eScgcHJvcGVydHkuLi5cbiAgICB9XG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY2xhc3MgQ29kZSB7XG5cbiAgY29uc3RydWN0b3Iobikge1xuICAgIGxldCB2YWx1ZSA9IHVuZGVmaW5lZDtcbiAgICBsZXQgdHlwZSA9IHVuZGVmaW5lZDtcbiAgICBsZXQgc3VidHlwZSA9IHVuZGVmaW5lZDtcbiAgICBsZXQgc3RyID0gXCJcIjtcbiAgICBsZXQgaXNCcmlnaHRuZXNzID0gZmFsc2U7XG5cbiAgICBpZiAobiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB2YWx1ZSA9IE51bWJlcihuKTtcbiAgICAgIHR5cGUgPSB0eXBlc1tNYXRoLmZsb29yKHZhbHVlIC8gMTApXTtcbiAgICAgIGlmICh0eXBlID09PSB1bmRlZmluZWQgfHwgc3VidHlwZXNbdHlwZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzdWJ0eXBlID0gc3VidHlwZXNbdHlwZV1bdmFsdWUgJSAxMF07XG4gICAgICBzdHIgPSBcIlxcdTAwMWJbXCIgKyB2YWx1ZSArIFwibVwiO1xuICAgICAgaXNCcmlnaHRuZXNzID1cbiAgICAgICAgdmFsdWUgPT09IENvZGUubm9CcmlnaHRuZXNzIHx8XG4gICAgICAgIHZhbHVlID09PSBDb2RlLmJyaWdodCB8fFxuICAgICAgICB2YWx1ZSA9PT0gQ29kZS5kaW07XG4gICAgfVxuXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5zdWJ0eXBlID0gc3VidHlwZTtcbiAgICB0aGlzLnN0ciA9IHN0cjtcbiAgICB0aGlzLmlzQnJpZ2h0bmVzcyA9IGlzQnJpZ2h0bmVzcztcbiAgfVxuXG4gIHN0YXRpYyBzdHIoeCkge1xuICAgIGlmKHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIFwiXCI7XG4gICAgcmV0dXJuIFwiXFx1MDAxYltcIiArIE51bWJlcih4KSArIFwibVwiO1xuICB9XG5cbiAgY2xvbmUoKSB7XG4gICAgICBjb25zdCBuZXdDb2RlID0gbmV3IENvZGUodW5kZWZpbmVkKTtcbiAgICAgIG5ld0NvZGUudmFsdWUgPSB0aGlzLnZhbHVlO1xuICAgICAgbmV3Q29kZS50eXBlID0gdGhpcy50eXBlO1xuICAgICAgbmV3Q29kZS5zdWJ0eXBlID0gdGhpcy5zdWJ0eXBlO1xuICAgICAgbmV3Q29kZS5zdHIgPSB0aGlzLnN0cjtcbiAgICAgIG5ld0NvZGUuaXNCcmlnaHRuZXNzID0gdGhpcy5pc0JyaWdodG5lc3M7XG4gICAgICByZXR1cm4gbmV3Q29kZVxuICB9XG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuTy5hc3NpZ24gKENvZGUsIHtcblxuICAgIHJlc2V0OiAgICAgICAgMCxcbiAgICBicmlnaHQ6ICAgICAgIDEsXG4gICAgZGltOiAgICAgICAgICAyLFxuICAgIGludmVyc2U6ICAgICAgNyxcbiAgICBub0JyaWdodG5lc3M6IDIyLFxuICAgIG5vSXRhbGljOiAgICAgMjMsXG4gICAgbm9VbmRlcmxpbmU6ICAyNCxcbiAgICBub0ludmVyc2U6ICAgIDI3LFxuICAgIG5vQ29sb3I6ICAgICAgMzksXG4gICAgbm9CZ0NvbG9yOiAgICA0OVxufSlcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCByZXBsYWNlQWxsID0gKHN0ciwgYSwgYikgPT4gc3RyLnNwbGl0IChhKS5qb2luIChiKVxuXG4vKiAgQU5TSSBicmlnaHRuZXNzIGNvZGVzIGRvIG5vdCBvdmVybGFwLCBlLmcuIFwie2JyaWdodH17ZGltfWZvb1wiIHdpbGwgYmUgcmVuZGVyZWQgYnJpZ2h0IChub3QgZGltKS5cbiAgICBTbyB3ZSBmaXggaXQgYnkgYWRkaW5nIGJyaWdodG5lc3MgY2FuY2VsaW5nIGJlZm9yZSBlYWNoIGJyaWdodG5lc3MgY29kZSwgc28gdGhlIGZvcm1lciBleGFtcGxlIGdldHNcbiAgICBjb252ZXJ0ZWQgdG8gXCJ7bm9CcmlnaHRuZXNzfXticmlnaHR9e25vQnJpZ2h0bmVzc317ZGltfWZvb1wiIOKAkyB0aGlzIHdheSBpdCBnZXRzIHJlbmRlcmVkIGFzIGV4cGVjdGVkLlxuICovXG5cbmNvbnN0IGRlbm9ybWFsaXplQnJpZ2h0bmVzcyA9IHMgPT4gcy5yZXBsYWNlICgvKFxcdTAwMWJcXFsoMXwyKW0pL2csICdcXHUwMDFiWzIybSQxJylcbmNvbnN0IG5vcm1hbGl6ZUJyaWdodG5lc3MgPSBzID0+IHMucmVwbGFjZSAoL1xcdTAwMWJcXFsyMm0oXFx1MDAxYlxcWygxfDIpbSkvZywgJyQxJylcblxuY29uc3Qgd3JhcCA9ICh4LCBvcGVuQ29kZSwgY2xvc2VDb2RlKSA9PiB7XG5cbiAgICBjb25zdCBvcGVuICA9IENvZGUuc3RyIChvcGVuQ29kZSksXG4gICAgICAgICAgY2xvc2UgPSBDb2RlLnN0ciAoY2xvc2VDb2RlKVxuXG4gICAgcmV0dXJuIFN0cmluZyAoeClcbiAgICAgICAgICAgICAgICAuc3BsaXQgKCdcXG4nKVxuICAgICAgICAgICAgICAgIC5tYXAgKGxpbmUgPT4gZGVub3JtYWxpemVCcmlnaHRuZXNzIChvcGVuICsgcmVwbGFjZUFsbCAobm9ybWFsaXplQnJpZ2h0bmVzcyAobGluZSksIGNsb3NlLCBvcGVuKSArIGNsb3NlKSlcbiAgICAgICAgICAgICAgICAuam9pbiAoJ1xcbicpXG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgY2FtZWwgPSAoYSwgYikgPT4gYSArIGIuY2hhckF0ICgwKS50b1VwcGVyQ2FzZSAoKSArIGIuc2xpY2UgKDEpXG5cblxuY29uc3Qgc3RyaW5nV3JhcHBpbmdNZXRob2RzID0gKCgpID0+IFtcblxuICAgICAgICAuLi5jb2xvckNvZGVzLm1hcCAoKGssIGkpID0+ICFrID8gW10gOiBbIC8vIGNvbG9yIG1ldGhvZHNcblxuICAgICAgICAgICAgW2ssICAgICAgICAgICAgICAgMzAgKyBpLCBDb2RlLm5vQ29sb3JdLFxuICAgICAgICAgICAgW2NhbWVsICgnYmcnLCBrKSwgNDAgKyBpLCBDb2RlLm5vQmdDb2xvcl0sXG4gICAgICAgIF0pLFxuXG4gICAgICAgIC4uLmNvbG9yQ29kZXNMaWdodC5tYXAgKChrLCBpKSA9PiAhayA/IFtdIDogWyAvLyBsaWdodCBjb2xvciBtZXRob2RzXG5cbiAgICAgICAgICAgIFtrLCAgICAgICAgICAgICAgICA5MCArIGksIENvZGUubm9Db2xvcl0sXG4gICAgICAgICAgICBbY2FtZWwgKCdiZycsIGspLCAxMDAgKyBpLCBDb2RlLm5vQmdDb2xvcl0sXG4gICAgICAgIF0pLFxuXG4gICAgICAgIC8qIFRISVMgT05FIElTIEZPUiBCQUNLV0FSRFMgQ09NUEFUSUJJTElUWSBXSVRIIFBSRVZJT1VTIFZFUlNJT05TIChoYWQgJ2JyaWdodCcgaW5zdGVhZCBvZiAnbGlnaHQnIGZvciBiYWNrZ3JvdW5kcylcbiAgICAgICAgICovXG4gICAgICAgIC4uLlsnJywgJ0JyaWdodFJlZCcsICdCcmlnaHRHcmVlbicsICdCcmlnaHRZZWxsb3cnLCAnQnJpZ2h0Qmx1ZScsICdCcmlnaHRNYWdlbnRhJywgJ0JyaWdodEN5YW4nXS5tYXAgKChrLCBpKSA9PiAhayA/IFtdIDogW1xuXG4gICAgICAgICAgICBbJ2JnJyArIGssIDEwMCArIGksIENvZGUubm9CZ0NvbG9yXSxcbiAgICAgICAgXSksXG5cbiAgICAgICAgLi4uc3R5bGVDb2Rlcy5tYXAgKChrLCBpKSA9PiAhayA/IFtdIDogWyAvLyBzdHlsZSBtZXRob2RzXG5cbiAgICAgICAgICAgIFtrLCBpLCAoKGsgPT09ICdicmlnaHQnKSB8fCAoayA9PT0gJ2RpbScpKSA/IENvZGUubm9CcmlnaHRuZXNzIDogKDIwICsgaSldXG4gICAgICAgIF0pXG4gICAgXVxuICAgIC5yZWR1Y2UgKChhLCBiKSA9PiBhLmNvbmNhdCAoYikpXG5cbikgKCk7XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgYXNzaWduU3RyaW5nV3JhcHBpbmdBUEkgPSAodGFyZ2V0LCB3cmFwQmVmb3JlID0gdGFyZ2V0KSA9PlxuXG4gICAgc3RyaW5nV3JhcHBpbmdNZXRob2RzLnJlZHVjZSAoKG1lbW8sIFtrLCBvcGVuLCBjbG9zZV0pID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTy5kZWZpbmVQcm9wZXJ0eSAobWVtbywgaywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXQ6ICgpID0+IGFzc2lnblN0cmluZ1dyYXBwaW5nQVBJIChzdHIgPT4gd3JhcEJlZm9yZSAod3JhcCAoc3RyLCBvcGVuLCBjbG9zZSkpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0KVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IFRFWFQgICAgPSAwLFxuICAgICAgQlJBQ0tFVCA9IDEsXG4gICAgICBDT0RFICAgID0gMlxuXG5jbGFzcyBTcGFuIHtcbiAgY29uc3RydWN0b3IoY29kZSwgdGV4dCkge1xuICAgIHRoaXMuY29kZSA9IGNvZGU7XG4gICAgdGhpcy50ZXh0ID0gdGV4dDtcblxuICAgIC8vIFRob3NlIGFyZSBhZGRlZCBpbiB0aGUgYWN0dWFsIHBhcnNlLCB0aGlzIGlzIGRvbmUgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgdG8gaGF2ZSB0aGUgc2FtZSBoaWRkZW4gY2xhc3NcbiAgICB0aGlzLmNzcyA9IFwiXCI7XG4gICAgdGhpcy5jb2xvciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmJnQ29sb3IgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5ib2xkID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuaW52ZXJzZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLml0YWxpYyA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnVuZGVybGluZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmJyaWdodCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmRpbSA9IHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vLyBnZXRTdHJpbmcgYXMgZnVuY3Rpb24gaW5zdGVhZCBvZiBzdHJpbmcgdG8gYWxsb3cgZ2FyYmFnZSBjb2xsZWN0aW9uXG5mdW5jdGlvbiogcmF3UGFyc2UoZ2V0U3RyaW5nKSB7XG4gIGNvbnN0IHN0YXRlT2JqZWN0ID0ge1xuICAgIHN0YXRlOiBURVhULFxuICAgIGJ1ZmZlcjogXCJcIixcbiAgICB0ZXh0OiBcIlwiLFxuICAgIGNvZGU6IFwiXCIsXG4gICAgY29kZXM6IFtdLFxuICB9O1xuXG4gIGNvbnN0IE9ORV9NQiA9IDEwNDg1NzY7XG5cbiAgLy8gSW5zdGVhZCBvZiBob2xkaW5nIHRoZSByZWZlcmVuY2UgdG8gdGhlIHN0cmluZyB3ZSBzcGxpdCBpbnRvIGNodW5rcyBvZiAxTUJcbiAgLy8gYW5kIGFmdGVyIHByb2Nlc3NpbmcgaXMgZmluaXNoZWQgd2UgY2FuIHJlbW92ZSB0aGUgcmVmZXJlbmNlIHNvIGl0IGNhbiBiZSBHQ2VkXG4gIGNvbnN0IGNodW5rcyA9IHNwbGl0U3RyaW5nVG9DaHVua3NPZlNpemUoZ2V0U3RyaW5nKCksIE9ORV9NQik7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaHVua3MubGVuZ3RoOyBpKyspe1xuICAgICAgY29uc3QgY2h1bmsgPSBjaHVua3NbaV07XG4gICAgICAvLyBGcmVlIG1lbW9yeSBmb3IgdGhlIHByZXZpb3VzIGNodW5rXG4gICAgICBjaHVua3NbaV0gPSB1bmRlZmluZWQ7XG4gICAgICB5aWVsZCogcHJvY2Vzc0NodW5rKGNodW5rLCBzdGF0ZU9iamVjdCk7XG4gIH1cblxuICBpZiAoc3RhdGVPYmplY3Quc3RhdGUgIT09IFRFWFQpIHN0YXRlT2JqZWN0LnRleHQgKz0gc3RhdGVPYmplY3QuYnVmZmVyO1xuXG4gIGlmIChzdGF0ZU9iamVjdC50ZXh0KSB7XG4gICAgeWllbGQgbmV3IFNwYW4obmV3IENvZGUoKSwgc3RhdGVPYmplY3QudGV4dCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3BsaXRTdHJpbmdUb0NodW5rc09mU2l6ZShzdHIsIGNodW5rU2l6ZSkge1xuICBjb25zdCBjaHVua3MgPSBbXTtcbiAgY29uc3QgY2h1bmtzTGVuZ3RoID0gTWF0aC5jZWlsKHN0ci5sZW5ndGggLyBjaHVua1NpemUpO1xuXG4gIGZvciAobGV0IGkgPSAwLCBvID0gMDsgaSA8IGNodW5rc0xlbmd0aDsgKytpLCBvICs9IGNodW5rU2l6ZSkge1xuICAgIGNodW5rcy5wdXNoKHN0ci5zdWJzdHJpbmcobywgbyArIGNodW5rU2l6ZSkpO1xuICB9XG5cbiAgcmV0dXJuIGNodW5rcztcbn1cblxuZnVuY3Rpb24qIHByb2Nlc3NDaHVuayhjaHVuaywgc3RhdGVPYmplY3QpIHtcbiAgY29uc3QgY2hhcnMgPSBjaHVuaztcbiAgY29uc3QgY2hhcnNMZW5ndGggPSBjaHVuay5sZW5ndGg7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGFyc0xlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYyA9IGNoYXJzW2ldO1xuXG4gICAgc3RhdGVPYmplY3QuYnVmZmVyICs9IGM7XG5cbiAgICBzd2l0Y2ggKHN0YXRlT2JqZWN0LnN0YXRlKSB7XG4gICAgICBjYXNlIFRFWFQ6XG4gICAgICAgIGlmIChjID09PSBcIlxcdTAwMWJcIikge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnN0YXRlID0gQlJBQ0tFVDtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5idWZmZXIgPSBjO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnRleHQgKz0gYztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBCUkFDS0VUOlxuICAgICAgICBpZiAoYyA9PT0gXCJbXCIpIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5zdGF0ZSA9IENPREU7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZSA9IFwiXCI7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZXMgPSBbXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5zdGF0ZSA9IFRFWFQ7XG4gICAgICAgICAgc3RhdGVPYmplY3QudGV4dCArPSBzdGF0ZU9iamVjdC5idWZmZXI7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgQ09ERTpcbiAgICAgICAgaWYgKGMgPj0gXCIwXCIgJiYgYyA8PSBcIjlcIikge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LmNvZGUgKz0gYztcbiAgICAgICAgfSBlbHNlIGlmIChjID09PSBcIjtcIikge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LmNvZGVzLnB1c2gobmV3IENvZGUoc3RhdGVPYmplY3QuY29kZSkpO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LmNvZGUgPSBcIlwiO1xuICAgICAgICB9IGVsc2UgaWYgKGMgPT09IFwibVwiKSB7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZSA9IHN0YXRlT2JqZWN0LmNvZGUgfHwgXCIwXCI7XG4gICAgICAgICAgZm9yIChjb25zdCBjb2RlIG9mIHN0YXRlT2JqZWN0LmNvZGVzKSB7XG4gICAgICAgICAgICB5aWVsZCBuZXcgU3Bhbihjb2RlLCBzdGF0ZU9iamVjdC50ZXh0KTtcbiAgICAgICAgICAgIHN0YXRlT2JqZWN0LnRleHQgPSBcIlwiO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHlpZWxkIG5ldyBTcGFuKG5ldyBDb2RlKHN0YXRlT2JqZWN0LmNvZGUpLCBzdGF0ZU9iamVjdC50ZXh0KTtcbiAgICAgICAgICBzdGF0ZU9iamVjdC50ZXh0ID0gXCJcIjtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5zdGF0ZSA9IFRFWFQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhdGVPYmplY3Quc3RhdGUgPSBURVhUO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnRleHQgKz0gc3RhdGVPYmplY3QuYnVmZmVyO1xuICAgICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBQYXJzZSBhbnNpIHRleHRcbiAqIEBwYXJhbSB7R2VuZXJhdG9yPFNwYW4sIHZvaWQsICo+fSByYXdTcGFuc0l0ZXJhdG9yIHJhdyBzcGFucyBpdGVyYXRvclxuICogQHJldHVybiB7R2VuZXJhdG9yPFNwYW4sIHZvaWQsICo+fVxuICovXG5mdW5jdGlvbiogcGFyc2VBbnNpKHJhd1NwYW5zSXRlcmF0b3IpIHtcbiAgICBsZXQgY29sb3IgPSBuZXcgQ29sb3IoKTtcbiAgICBsZXQgYmdDb2xvciA9IG5ldyBDb2xvcih0cnVlIC8qIGJhY2tncm91bmQgKi8pO1xuICAgIGxldCBicmlnaHRuZXNzID0gdW5kZWZpbmVkO1xuICAgIGxldCBzdHlsZXMgPSBuZXcgU2V0KCk7XG5cbiAgICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgICAgY29sb3IgPSBuZXcgQ29sb3IoKTtcbiAgICAgICAgYmdDb2xvciA9IG5ldyBDb2xvcih0cnVlIC8qIGJhY2tncm91bmQgKi8pO1xuICAgICAgICBicmlnaHRuZXNzID0gdW5kZWZpbmVkO1xuICAgICAgICBzdHlsZXMuY2xlYXIoKTtcbiAgICB9XG5cbiAgICByZXNldCgpO1xuXG4gICAgZm9yIChjb25zdCBzcGFuIG9mIHJhd1NwYW5zSXRlcmF0b3IpIHtcbiAgICAgICAgY29uc3QgYyA9IHNwYW4uY29kZTtcblxuICAgICAgICBpZihzcGFuLnRleHQgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGludmVydGVkID0gc3R5bGVzLmhhcyhcImludmVyc2VcIik7XG4gICAgICAgICAgICBjb25zdCB1bmRlcmxpbmUgPSBzdHlsZXMuaGFzKFwidW5kZXJsaW5lXCIpXG4gICAgICAgICAgICAgICAgPyBcInRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1wiXG4gICAgICAgICAgICAgICAgOiBcIlwiO1xuICAgICAgICAgICAgY29uc3QgaXRhbGljID0gc3R5bGVzLmhhcyhcIml0YWxpY1wiKSA/IFwiZm9udC1zdHlsZTogaXRhbGljO1wiIDogXCJcIjtcbiAgICAgICAgICAgIGNvbnN0IGJvbGQgPSBicmlnaHRuZXNzID09PSBDb2RlLmJyaWdodCA/IFwiZm9udC13ZWlnaHQ6IGJvbGQ7XCIgOiBcIlwiO1xuXG4gICAgICAgICAgICBjb25zdCBmb3JlQ29sb3IgPSBjb2xvci5kZWZhdWx0QnJpZ2h0bmVzcyhicmlnaHRuZXNzKTtcblxuICAgICAgICAgICAgY29uc3QgbmV3U3BhbiA9IG5ldyBTcGFuKHNwYW4uY29kZSA/IHNwYW4uY29kZS5jbG9uZSgpIDogdW5kZWZpbmVkLCBzcGFuLnRleHQpO1xuXG4gICAgICAgICAgICBuZXdTcGFuLmNzcyA9IHNwYW4uY3NzID8gc3Bhbi5jc3MgOiBib2xkICsgaXRhbGljICsgdW5kZXJsaW5lICsgZm9yZUNvbG9yLmNzcyhpbnZlcnRlZCkgKyBiZ0NvbG9yLmNzcyhpbnZlcnRlZCk7XG4gICAgICAgICAgICBuZXdTcGFuLmJvbGQgPSBzcGFuLmJvbGQgPyBzcGFuLmJvbGQgOiAhIWJvbGQ7XG4gICAgICAgICAgICBuZXdTcGFuLmNvbG9yID0gc3Bhbi5jb2xvciA/IHNwYW4uY29sb3IgOiBmb3JlQ29sb3IuY2xlYW47XG4gICAgICAgICAgICBuZXdTcGFuLmJnQ29sb3IgPSBzcGFuLmJnQ29sb3IgPyBzcGFuLmJnQ29sb3IgOiBiZ0NvbG9yLmNsZWFuO1xuICAgICAgICAgICAgbmV3U3Bhbi5pbnZlcnNlID0gaW52ZXJ0ZWQ7XG4gICAgICAgICAgICBuZXdTcGFuLml0YWxpYyA9ICEhaXRhbGljO1xuICAgICAgICAgICAgbmV3U3Bhbi51bmRlcmxpbmUgPSAhIXVuZGVybGluZTtcbiAgICAgICAgICAgIG5ld1NwYW4uYnJpZ2h0ID0gc3R5bGVzLmhhcyhcImJyaWdodFwiKTtcbiAgICAgICAgICAgIG5ld1NwYW4uZGltID0gc3R5bGVzLmhhcyhcImRpbVwiKTtcblxuICAgICAgICAgICAgeWllbGQgbmV3U3BhbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjLmlzQnJpZ2h0bmVzcykge1xuICAgICAgICAgICAgYnJpZ2h0bmVzcyA9IGMudmFsdWU7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzcGFuLmNvZGUudmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3Bhbi5jb2RlLnZhbHVlID09PSBDb2RlLnJlc2V0KSB7XG4gICAgICAgICAgICByZXNldCgpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHNwYW4uY29kZS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiY29sb3JcIjpcbiAgICAgICAgICAgIGNhc2UgXCJjb2xvckxpZ2h0XCI6XG4gICAgICAgICAgICAgICAgY29sb3IgPSBuZXcgQ29sb3IoZmFsc2UsIGMuc3VidHlwZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgXCJiZ0NvbG9yXCI6XG4gICAgICAgICAgICBjYXNlIFwiYmdDb2xvckxpZ2h0XCI6XG4gICAgICAgICAgICAgICAgYmdDb2xvciA9IG5ldyBDb2xvcih0cnVlLCBjLnN1YnR5cGUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIFwic3R5bGVcIjpcbiAgICAgICAgICAgICAgICBzdHlsZXMuYWRkKGMuc3VidHlwZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidW5zdHlsZVwiOlxuICAgICAgICAgICAgICAgIHN0eWxlcy5kZWxldGUoYy5zdWJ0eXBlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBBTlNJLWVzY2FwZWQgc3RyaW5nLlxuICovXG5jbGFzcyBDb2xvcnMge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocykge1xuICAgICAgICB0aGlzLnNwYW5zID0gcyA/IEFycmF5LmZyb20ocmF3UGFyc2UodHlwZW9mIHMgPT09ICdzdHJpbmcnID8gKCkgPT4gcyA6IHMpKSA6IFtdXG4gICAgfVxuXG4gICAgZ2V0IHN0ciAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNwYW5zLnJlZHVjZSAoKHN0ciwgcCkgPT4gc3RyICsgcC50ZXh0ICsgcC5jb2RlLnN0ciwgJycpXG4gICAgfVxuXG4gICAgZ2V0IHBhcnNlZCAoKSB7XG4gICAgICAgIGNvbnN0IG5ld0NvbG9ycyA9IG5ldyBDb2xvcnMoKTtcblxuICAgICAgICBuZXdDb2xvcnMuc3BhbnMgPSBBcnJheS5mcm9tKHBhcnNlQW5zaSh0aGlzLnNwYW5zKSk7XG5cbiAgICAgICAgcmV0dXJuIG5ld0NvbG9ycztcbiAgICB9XG5cbi8qICBPdXRwdXRzIHdpdGggQ2hyb21lIERldlRvb2xzLWNvbXBhdGlibGUgZm9ybWF0ICAgICAqL1xuXG4gICAgZ2V0IGFzQ2hyb21lQ29uc29sZUxvZ0FyZ3VtZW50cyAoKSB7XG5cbiAgICAgICAgY29uc3Qgc3BhbnMgPSB0aGlzLnBhcnNlZC5zcGFuc1xuXG4gICAgICAgIHJldHVybiBbc3BhbnMubWFwIChzID0+ICgnJWMnICsgcy50ZXh0KSkuam9pbiAoJycpLFxuICAgICAgICAgICAgIC4uLnNwYW5zLm1hcCAocyA9PiBzLmNzcyldXG4gICAgfVxuXG4gICAgZ2V0IGJyb3dzZXJDb25zb2xlQXJndW1lbnRzICgpIC8qIExFR0FDWSwgREVQUkVDQVRFRCAqLyB7IHJldHVybiB0aGlzLmFzQ2hyb21lQ29uc29sZUxvZ0FyZ3VtZW50cyB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBpbnN0YWxscyBTdHJpbmcgcHJvdG90eXBlIGV4dGVuc2lvbnNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlcXVpcmUgKCdhbnNpY29sb3InKS5uaWNlXG4gICAgICogY29uc29sZS5sb2cgKCdmb28nLmJyaWdodC5yZWQpXG4gICAgICovXG4gICAgc3RhdGljIGdldCBuaWNlICgpIHtcblxuICAgICAgICBDb2xvcnMubmFtZXMuZm9yRWFjaCAoayA9PiB7XG4gICAgICAgICAgICBpZiAoIShrIGluIFN0cmluZy5wcm90b3R5cGUpKSB7XG4gICAgICAgICAgICAgICAgTy5kZWZpbmVQcm9wZXJ0eSAoU3RyaW5nLnByb3RvdHlwZSwgaywgeyBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIENvbG9yc1trXSAodGhpcykgfSB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiBDb2xvcnNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBwYXJzZXMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlc1xuICAgICAqIEByZXR1cm4ge0NvbG9yc30gcGFyc2VkIHJlcHJlc2VudGF0aW9uLlxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZSAocykge1xuICAgICAgICByZXR1cm4gbmV3IENvbG9ycyAocykucGFyc2VkXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8ICgpID0+IHN0cmluZ30gcyBzdHJpbmcgb3IgYSBmdW5jdGlvbiByZXR1cm5pbmcgYSBzdHJpbmcgKGZvciBsYXJnZSBzdHJpbmdzIHlvdSBtYXkgd2FudCB0byB1c2UgYSBmdW5jdGlvbiB0byBhdm9pZCBtZW1vcnkgaXNzdWVzKVxuICAgICAqIEByZXR1cm5zIHtHZW5lcmF0b3I8U3Bhbiwgdm9pZCwgKj59IFNwYW5zIGl0ZXJhdG9yXG4gICAgICovXG4gICAgc3RhdGljIHBhcnNlSXRlcmF0b3Iocykge1xuICAgICAgICByZXR1cm4gcGFyc2VBbnNpKHJhd1BhcnNlKHR5cGVvZiBzID09PSBcInN0cmluZ1wiID8gKCkgPT4gcyA6IHMpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBzdHJpcHMgQU5TSSBjb2RlcyBmcm9tIGEgc3RyaW5nXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlcy5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IGNsZWFuIHN0cmluZy5cbiAgICAgKi9cbiAgICBzdGF0aWMgc3RyaXAgKHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSAoL1tcXHUwMDFiXFx1MDA5Yl1bWygpIzs/XSooPzpbMC05XXsxLDR9KD86O1swLTldezAsNH0pKik/WzAtOUEtUFJaY2YtbnFyeT0+PF0vZywgJycpIC8vIGhvcGUgVjggY2FjaGVzIHRoZSByZWdleHBcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBjaGVja3MgaWYgYSB2YWx1ZSBjb250YWlucyBBTlNJIGVzY2FwZSBjb2Rlc1xuICAgICAqIEBwYXJhbSB7YW55fSBzIHZhbHVlIHRvIGNoZWNrXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gaGFzIGNvZGVzXG4gICAgICovXG4gICAgIHN0YXRpYyBpc0VzY2FwZWQgKHMpIHtcbiAgICAgICAgcyA9IFN0cmluZyhzKVxuICAgICAgICByZXR1cm4gQ29sb3JzLnN0cmlwIChzKSAhPT0gcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNwYW5zID0gWy4uLmFuc2kucGFyc2UgKCdcXHUwMDFiWzdtXFx1MDAxYls3bWZvb1xcdTAwMWJbN21iYXJcXHUwMDFiWzI3bScpXVxuICAgICAqL1xuICAgIFtTeW1ib2wuaXRlcmF0b3JdICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3BhbnNbU3ltYm9sLml0ZXJhdG9yXSAoKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIFRoaXMgYWxsb3dzIGFuIGFsdGVybmF0aXZlIGltcG9ydCBzdHlsZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS94cGwvYW5zaWNvbG9yL2lzc3Vlcy83I2lzc3VlY29tbWVudC01Nzg5MjM1NzhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGltcG9ydCB7IGFuc2ljb2xvciwgUGFyc2VkU3BhbiB9IGZyb20gJ2Fuc2ljb2xvcidcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IGFuc2ljb2xvciAoKSB7XG4gICAgICAgIHJldHVybiBDb2xvcnNcbiAgICB9XG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuYXNzaWduU3RyaW5nV3JhcHBpbmdBUEkgKENvbG9ycywgc3RyID0+IHN0cilcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5Db2xvcnMubmFtZXMgPSBzdHJpbmdXcmFwcGluZ01ldGhvZHMubWFwICgoW2tdKSA9PiBrKVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbkNvbG9ycy5yZ2IgPSB7XG5cbiAgICBibGFjazogICAgICAgIFswLCAgICAgMCwgICAwXSxcbiAgICBkYXJrR3JheTogICAgIFsxMDAsIDEwMCwgMTAwXSxcbiAgICBsaWdodEdyYXk6ICAgIFsyMDAsIDIwMCwgMjAwXSxcbiAgICB3aGl0ZTogICAgICAgIFsyNTUsIDI1NSwgMjU1XSxcblxuICAgIHJlZDogICAgICAgICAgWzIwNCwgICAwLCAgIDBdLFxuICAgIGxpZ2h0UmVkOiAgICAgWzI1NSwgIDUxLCAgIDBdLFxuXG4gICAgZ3JlZW46ICAgICAgICBbMCwgICAyMDQsICAgMF0sXG4gICAgbGlnaHRHcmVlbjogICBbNTEsICAyMDQsICA1MV0sXG5cbiAgICB5ZWxsb3c6ICAgICAgIFsyMDQsIDEwMiwgICAwXSxcbiAgICBsaWdodFllbGxvdzogIFsyNTUsIDE1MywgIDUxXSxcblxuICAgIGJsdWU6ICAgICAgICAgWzAsICAgICAwLCAyNTVdLFxuICAgIGxpZ2h0Qmx1ZTogICAgWzI2LCAgMTQwLCAyNTVdLFxuXG4gICAgbWFnZW50YTogICAgICBbMjA0LCAgIDAsIDIwNF0sXG4gICAgbGlnaHRNYWdlbnRhOiBbMjU1LCAgIDAsIDI1NV0sXG5cbiAgICBjeWFuOiAgICAgICAgIFswLCAgIDE1MywgMjU1XSxcbiAgICBsaWdodEN5YW46ICAgIFswLCAgIDIwNCwgMjU1XSxcbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbG9yc1xuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbiJdfQ==