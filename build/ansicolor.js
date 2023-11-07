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
        this.color = {};
        this.bgColor = {};
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
            newSpan.css = bold + italic + underline + foreColor.css(inverted) + bgColor.css(inverted);
            newSpan.bold = !!bold;
            newSpan.color = foreColor.clean;
            newSpan.bgColor = bgColor.clean;
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LENBakJMOztBQW1CVCxhQUFjLENBQUMsR0FBRCxFQUFRLENBQVIsRUFBVyxHQUFYLENBbkJMO0FBb0JULGtCQUFjLENBQUMsR0FBRCxFQUFRLENBQVIsRUFBVyxHQUFYLENBcEJMOztBQXNCVCxVQUFjLENBQUMsQ0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBdEJMO0FBdUJULGVBQWMsQ0FBQyxDQUFELEVBQU0sR0FBTixFQUFXLEdBQVg7O0FBR2xCOztBQTFCYSxDQUFiLENBNEJBLE9BQU8sT0FBUCxHQUFpQixNQUFqQjs7QUFFQSIsImZpbGUiOiJhbnNpY29sb3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBPID0gT2JqZWN0XG5cbi8qICBTZWUgaHR0cHM6Ly9taXNjLmZsb2dpc29mdC5jb20vYmFzaC90aXBfY29sb3JzX2FuZF9mb3JtYXR0aW5nXG4gICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IGNvbG9yQ29kZXMgICAgICA9IFsgICAnYmxhY2snLCAgICAgICdyZWQnLCAgICAgICdncmVlbicsICAgICAgJ3llbGxvdycsICAgICAgJ2JsdWUnLCAgICAgICdtYWdlbnRhJywgICAgICAnY3lhbicsICdsaWdodEdyYXknLCAnJywgJ2RlZmF1bHQnXVxuICAgICwgY29sb3JDb2Rlc0xpZ2h0ID0gWydkYXJrR3JheScsICdsaWdodFJlZCcsICdsaWdodEdyZWVuJywgJ2xpZ2h0WWVsbG93JywgJ2xpZ2h0Qmx1ZScsICdsaWdodE1hZ2VudGEnLCAnbGlnaHRDeWFuJywgJ3doaXRlJywgJyddXG5cbiAgICAsIHN0eWxlQ29kZXMgPSBbJycsICdicmlnaHQnLCAnZGltJywgJ2l0YWxpYycsICd1bmRlcmxpbmUnLCAnJywgJycsICdpbnZlcnNlJ11cblxuICAgICwgYXNCcmlnaHQgPSB7ICdyZWQnOiAgICAgICAnbGlnaHRSZWQnLFxuICAgICAgICAgICAgICAgICAgICdncmVlbic6ICAgICAnbGlnaHRHcmVlbicsXG4gICAgICAgICAgICAgICAgICAgJ3llbGxvdyc6ICAgICdsaWdodFllbGxvdycsXG4gICAgICAgICAgICAgICAgICAgJ2JsdWUnOiAgICAgICdsaWdodEJsdWUnLFxuICAgICAgICAgICAgICAgICAgICdtYWdlbnRhJzogICAnbGlnaHRNYWdlbnRhJyxcbiAgICAgICAgICAgICAgICAgICAnY3lhbic6ICAgICAgJ2xpZ2h0Q3lhbicsXG4gICAgICAgICAgICAgICAgICAgJ2JsYWNrJzogICAgICdkYXJrR3JheScsXG4gICAgICAgICAgICAgICAgICAgJ2xpZ2h0R3JheSc6ICd3aGl0ZScgfVxuXG4gICAgLCB0eXBlcyA9IHsgMDogICdzdHlsZScsXG4gICAgICAgICAgICAgICAgMjogICd1bnN0eWxlJyxcbiAgICAgICAgICAgICAgICAzOiAgJ2NvbG9yJyxcbiAgICAgICAgICAgICAgICA5OiAgJ2NvbG9yTGlnaHQnLFxuICAgICAgICAgICAgICAgIDQ6ICAnYmdDb2xvcicsXG4gICAgICAgICAgICAgICAgMTA6ICdiZ0NvbG9yTGlnaHQnIH1cblxuICAgICwgc3VidHlwZXMgPSB7ICBjb2xvcjogICAgICAgICBjb2xvckNvZGVzLFxuICAgICAgICAgICAgICAgICAgICBjb2xvckxpZ2h0OiAgICBjb2xvckNvZGVzTGlnaHQsXG4gICAgICAgICAgICAgICAgICAgIGJnQ29sb3I6ICAgICAgIGNvbG9yQ29kZXMsXG4gICAgICAgICAgICAgICAgICAgIGJnQ29sb3JMaWdodDogIGNvbG9yQ29kZXNMaWdodCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6ICAgICAgICAgc3R5bGVDb2RlcyxcbiAgICAgICAgICAgICAgICAgICAgdW5zdHlsZTogICAgICAgc3R5bGVDb2RlcyAgICB9XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY2xhc3MgQ29sb3Ige1xuXG4gICAgY29uc3RydWN0b3IgKGJhY2tncm91bmQsIG5hbWUsIGJyaWdodG5lc3MpIHtcblxuICAgICAgICB0aGlzLmJhY2tncm91bmQgPSBiYWNrZ3JvdW5kXG4gICAgICAgIHRoaXMubmFtZSAgICAgICA9IG5hbWVcbiAgICAgICAgdGhpcy5icmlnaHRuZXNzID0gYnJpZ2h0bmVzc1xuICAgIH1cblxuICAgIGdldCBpbnZlcnNlICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2xvciAoIXRoaXMuYmFja2dyb3VuZCwgdGhpcy5uYW1lIHx8ICh0aGlzLmJhY2tncm91bmQgPyAnYmxhY2snIDogJ3doaXRlJyksIHRoaXMuYnJpZ2h0bmVzcylcbiAgICB9XG5cbiAgICBnZXQgY2xlYW4oKSB7XG4gICAgICBjb25zdCBuYW1lID0gdGhpcy5uYW1lID09PSBcImRlZmF1bHRcIiA/IFwiXCIgOiB0aGlzLm5hbWU7XG4gICAgICBjb25zdCBicmlnaHQgPSB0aGlzLmJyaWdodG5lc3MgPT09IENvZGUuYnJpZ2h0O1xuICAgICAgY29uc3QgZGltID0gdGhpcy5icmlnaHRuZXNzID09PSBDb2RlLmRpbTtcblxuICAgICAgaWYgKCFuYW1lICYmICFicmlnaHQgJiYgIWRpbSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBicmlnaHQsXG4gICAgICAgIGRpbSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZGVmYXVsdEJyaWdodG5lc3MgKHZhbHVlKSB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBDb2xvciAodGhpcy5iYWNrZ3JvdW5kLCB0aGlzLm5hbWUsIHRoaXMuYnJpZ2h0bmVzcyB8fCB2YWx1ZSlcbiAgICB9XG5cbiAgICBjc3MgKGludmVydGVkKSB7XG5cbiAgICAgICAgY29uc3QgY29sb3IgPSBpbnZlcnRlZCA/IHRoaXMuaW52ZXJzZSA6IHRoaXNcblxuICAgICAgICBjb25zdCByZ2JOYW1lID0gKChjb2xvci5icmlnaHRuZXNzID09PSBDb2RlLmJyaWdodCkgJiYgYXNCcmlnaHRbY29sb3IubmFtZV0pIHx8IGNvbG9yLm5hbWVcblxuICAgICAgICBjb25zdCBwcm9wID0gKGNvbG9yLmJhY2tncm91bmQgPyAnYmFja2dyb3VuZDonIDogJ2NvbG9yOicpXG4gICAgICAgICAgICAsIHJnYiAgPSBDb2xvcnMucmdiW3JnYk5hbWVdXG4gICAgICAgICAgICAsIGFscGhhID0gKHRoaXMuYnJpZ2h0bmVzcyA9PT0gQ29kZS5kaW0pID8gMC41IDogMVxuXG4gICAgICAgIHJldHVybiByZ2JcbiAgICAgICAgICAgICAgICA/IChwcm9wICsgJ3JnYmEoJyArIFsuLi5yZ2IsIGFscGhhXS5qb2luICgnLCcpICsgJyk7JylcbiAgICAgICAgICAgICAgICA6ICgoIWNvbG9yLmJhY2tncm91bmQgJiYgKGFscGhhIDwgMSkpID8gJ2NvbG9yOnJnYmEoMCwwLDAsMC41KTsnIDogJycpIC8vIENocm9tZSBkb2VzIG5vdCBzdXBwb3J0ICdvcGFjaXR5JyBwcm9wZXJ0eS4uLlxuICAgIH1cbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jbGFzcyBDb2RlIHtcblxuICBjb25zdHJ1Y3RvcihuKSB7XG4gICAgbGV0IHZhbHVlID0gdW5kZWZpbmVkO1xuICAgIGxldCB0eXBlID0gdW5kZWZpbmVkO1xuICAgIGxldCBzdWJ0eXBlID0gdW5kZWZpbmVkO1xuICAgIGxldCBzdHIgPSBcIlwiO1xuICAgIGxldCBpc0JyaWdodG5lc3MgPSBmYWxzZTtcblxuICAgIGlmIChuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhbHVlID0gTnVtYmVyKG4pO1xuICAgICAgdHlwZSA9IHR5cGVzW01hdGguZmxvb3IodmFsdWUgLyAxMCldO1xuICAgICAgc3VidHlwZSA9IHN1YnR5cGVzW3R5cGVdW3ZhbHVlICUgMTBdO1xuICAgICAgc3RyID0gXCJcXHUwMDFiW1wiICsgdmFsdWUgKyBcIm1cIjtcbiAgICAgIGlzQnJpZ2h0bmVzcyA9XG4gICAgICAgIHZhbHVlID09PSBDb2RlLm5vQnJpZ2h0bmVzcyB8fFxuICAgICAgICB2YWx1ZSA9PT0gQ29kZS5icmlnaHQgfHxcbiAgICAgICAgdmFsdWUgPT09IENvZGUuZGltO1xuICAgIH1cblxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuc3VidHlwZSA9IHN1YnR5cGU7XG4gICAgdGhpcy5zdHIgPSBzdHI7XG4gICAgdGhpcy5pc0JyaWdodG5lc3MgPSBpc0JyaWdodG5lc3M7XG4gIH1cblxuICBzdGF0aWMgc3RyKHgpIHtcbiAgICBpZih4ID09PSB1bmRlZmluZWQpIHJldHVybiBcIlwiO1xuICAgIHJldHVybiBcIlxcdTAwMWJbXCIgKyBOdW1iZXIoeCkgKyBcIm1cIjtcbiAgfVxuXG4gIGNsb25lKCkge1xuICAgICAgY29uc3QgbmV3Q29kZSA9IG5ldyBDb2RlKHVuZGVmaW5lZCk7XG4gICAgICBuZXdDb2RlLnZhbHVlID0gdGhpcy52YWx1ZTtcbiAgICAgIG5ld0NvZGUudHlwZSA9IHRoaXMudHlwZTtcbiAgICAgIG5ld0NvZGUuc3VidHlwZSA9IHRoaXMuc3VidHlwZTtcbiAgICAgIG5ld0NvZGUuc3RyID0gdGhpcy5zdHI7XG4gICAgICBuZXdDb2RlLmlzQnJpZ2h0bmVzcyA9IHRoaXMuaXNCcmlnaHRuZXNzO1xuICAgICAgcmV0dXJuIG5ld0NvZGVcbiAgfVxufVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbk8uYXNzaWduIChDb2RlLCB7XG5cbiAgICByZXNldDogICAgICAgIDAsXG4gICAgYnJpZ2h0OiAgICAgICAxLFxuICAgIGRpbTogICAgICAgICAgMixcbiAgICBpbnZlcnNlOiAgICAgIDcsXG4gICAgbm9CcmlnaHRuZXNzOiAyMixcbiAgICBub0l0YWxpYzogICAgIDIzLFxuICAgIG5vVW5kZXJsaW5lOiAgMjQsXG4gICAgbm9JbnZlcnNlOiAgICAyNyxcbiAgICBub0NvbG9yOiAgICAgIDM5LFxuICAgIG5vQmdDb2xvcjogICAgNDlcbn0pXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgcmVwbGFjZUFsbCA9IChzdHIsIGEsIGIpID0+IHN0ci5zcGxpdCAoYSkuam9pbiAoYilcblxuLyogIEFOU0kgYnJpZ2h0bmVzcyBjb2RlcyBkbyBub3Qgb3ZlcmxhcCwgZS5nLiBcInticmlnaHR9e2RpbX1mb29cIiB3aWxsIGJlIHJlbmRlcmVkIGJyaWdodCAobm90IGRpbSkuXG4gICAgU28gd2UgZml4IGl0IGJ5IGFkZGluZyBicmlnaHRuZXNzIGNhbmNlbGluZyBiZWZvcmUgZWFjaCBicmlnaHRuZXNzIGNvZGUsIHNvIHRoZSBmb3JtZXIgZXhhbXBsZSBnZXRzXG4gICAgY29udmVydGVkIHRvIFwie25vQnJpZ2h0bmVzc317YnJpZ2h0fXtub0JyaWdodG5lc3N9e2RpbX1mb29cIiDigJMgdGhpcyB3YXkgaXQgZ2V0cyByZW5kZXJlZCBhcyBleHBlY3RlZC5cbiAqL1xuXG5jb25zdCBkZW5vcm1hbGl6ZUJyaWdodG5lc3MgPSBzID0+IHMucmVwbGFjZSAoLyhcXHUwMDFiXFxbKDF8MiltKS9nLCAnXFx1MDAxYlsyMm0kMScpXG5jb25zdCBub3JtYWxpemVCcmlnaHRuZXNzID0gcyA9PiBzLnJlcGxhY2UgKC9cXHUwMDFiXFxbMjJtKFxcdTAwMWJcXFsoMXwyKW0pL2csICckMScpXG5cbmNvbnN0IHdyYXAgPSAoeCwgb3BlbkNvZGUsIGNsb3NlQ29kZSkgPT4ge1xuXG4gICAgY29uc3Qgb3BlbiAgPSBDb2RlLnN0ciAob3BlbkNvZGUpLFxuICAgICAgICAgIGNsb3NlID0gQ29kZS5zdHIgKGNsb3NlQ29kZSlcblxuICAgIHJldHVybiBTdHJpbmcgKHgpXG4gICAgICAgICAgICAgICAgLnNwbGl0ICgnXFxuJylcbiAgICAgICAgICAgICAgICAubWFwIChsaW5lID0+IGRlbm9ybWFsaXplQnJpZ2h0bmVzcyAob3BlbiArIHJlcGxhY2VBbGwgKG5vcm1hbGl6ZUJyaWdodG5lc3MgKGxpbmUpLCBjbG9zZSwgb3BlbikgKyBjbG9zZSkpXG4gICAgICAgICAgICAgICAgLmpvaW4gKCdcXG4nKVxufVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IGNhbWVsID0gKGEsIGIpID0+IGEgKyBiLmNoYXJBdCAoMCkudG9VcHBlckNhc2UgKCkgKyBiLnNsaWNlICgxKVxuXG5cbmNvbnN0IHN0cmluZ1dyYXBwaW5nTWV0aG9kcyA9ICgoKSA9PiBbXG5cbiAgICAgICAgLi4uY29sb3JDb2Rlcy5tYXAgKChrLCBpKSA9PiAhayA/IFtdIDogWyAvLyBjb2xvciBtZXRob2RzXG5cbiAgICAgICAgICAgIFtrLCAgICAgICAgICAgICAgIDMwICsgaSwgQ29kZS5ub0NvbG9yXSxcbiAgICAgICAgICAgIFtjYW1lbCAoJ2JnJywgayksIDQwICsgaSwgQ29kZS5ub0JnQ29sb3JdLFxuICAgICAgICBdKSxcblxuICAgICAgICAuLi5jb2xvckNvZGVzTGlnaHQubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFsgLy8gbGlnaHQgY29sb3IgbWV0aG9kc1xuXG4gICAgICAgICAgICBbaywgICAgICAgICAgICAgICAgOTAgKyBpLCBDb2RlLm5vQ29sb3JdLFxuICAgICAgICAgICAgW2NhbWVsICgnYmcnLCBrKSwgMTAwICsgaSwgQ29kZS5ub0JnQ29sb3JdLFxuICAgICAgICBdKSxcblxuICAgICAgICAvKiBUSElTIE9ORSBJUyBGT1IgQkFDS1dBUkRTIENPTVBBVElCSUxJVFkgV0lUSCBQUkVWSU9VUyBWRVJTSU9OUyAoaGFkICdicmlnaHQnIGluc3RlYWQgb2YgJ2xpZ2h0JyBmb3IgYmFja2dyb3VuZHMpXG4gICAgICAgICAqL1xuICAgICAgICAuLi5bJycsICdCcmlnaHRSZWQnLCAnQnJpZ2h0R3JlZW4nLCAnQnJpZ2h0WWVsbG93JywgJ0JyaWdodEJsdWUnLCAnQnJpZ2h0TWFnZW50YScsICdCcmlnaHRDeWFuJ10ubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFtcblxuICAgICAgICAgICAgWydiZycgKyBrLCAxMDAgKyBpLCBDb2RlLm5vQmdDb2xvcl0sXG4gICAgICAgIF0pLFxuXG4gICAgICAgIC4uLnN0eWxlQ29kZXMubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFsgLy8gc3R5bGUgbWV0aG9kc1xuXG4gICAgICAgICAgICBbaywgaSwgKChrID09PSAnYnJpZ2h0JykgfHwgKGsgPT09ICdkaW0nKSkgPyBDb2RlLm5vQnJpZ2h0bmVzcyA6ICgyMCArIGkpXVxuICAgICAgICBdKVxuICAgIF1cbiAgICAucmVkdWNlICgoYSwgYikgPT4gYS5jb25jYXQgKGIpKVxuXG4pICgpO1xuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IGFzc2lnblN0cmluZ1dyYXBwaW5nQVBJID0gKHRhcmdldCwgd3JhcEJlZm9yZSA9IHRhcmdldCkgPT5cblxuICAgIHN0cmluZ1dyYXBwaW5nTWV0aG9kcy5yZWR1Y2UgKChtZW1vLCBbaywgb3BlbiwgY2xvc2VdKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8uZGVmaW5lUHJvcGVydHkgKG1lbW8sIGssIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0OiAoKSA9PiBhc3NpZ25TdHJpbmdXcmFwcGluZ0FQSSAoc3RyID0+IHdyYXBCZWZvcmUgKHdyYXAgKHN0ciwgb3BlbiwgY2xvc2UpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldClcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBURVhUICAgID0gMCxcbiAgICAgIEJSQUNLRVQgPSAxLFxuICAgICAgQ09ERSAgICA9IDJcblxuY2xhc3MgU3BhbiB7XG4gIGNvbnN0cnVjdG9yKGNvZGUsIHRleHQpIHtcbiAgICB0aGlzLmNvZGUgPSBjb2RlO1xuICAgIHRoaXMudGV4dCA9IHRleHQ7XG5cbiAgICAvLyBUaG9zZSBhcmUgYWRkZWQgaW4gdGhlIGFjdHVhbCBwYXJzZSwgdGhpcyBpcyBkb25lIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIHRvIGhhdmUgdGhlIHNhbWUgaGlkZGVuIGNsYXNzXG4gICAgdGhpcy5jc3MgPSBcIlwiO1xuICAgIHRoaXMuY29sb3IgPSB7fTtcbiAgICB0aGlzLmJnQ29sb3IgPSB7fTtcbiAgICB0aGlzLmJvbGQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5pbnZlcnNlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuaXRhbGljID0gdW5kZWZpbmVkO1xuICAgIHRoaXMudW5kZXJsaW5lID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuYnJpZ2h0ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZGltID0gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8vIGdldFN0cmluZyBhcyBmdW5jdGlvbiBpbnN0ZWFkIG9mIHN0cmluZyB0byBhbGxvdyBnYXJiYWdlIGNvbGxlY3Rpb25cbmZ1bmN0aW9uKiByYXdQYXJzZShnZXRTdHJpbmcpIHtcbiAgY29uc3Qgc3RhdGVPYmplY3QgPSB7XG4gICAgc3RhdGU6IFRFWFQsXG4gICAgYnVmZmVyOiBcIlwiLFxuICAgIHRleHQ6IFwiXCIsXG4gICAgY29kZTogXCJcIixcbiAgICBjb2RlczogW10sXG4gIH07XG5cbiAgY29uc3QgT05FX01CID0gMTA0ODU3NjtcblxuICAvLyBJbnN0ZWFkIG9mIGhvbGRpbmcgdGhlIHJlZmVyZW5jZSB0byB0aGUgc3RyaW5nIHdlIHNwbGl0IGludG8gY2h1bmtzIG9mIDFNQlxuICAvLyBhbmQgYWZ0ZXIgcHJvY2Vzc2luZyBpcyBmaW5pc2hlZCB3ZSBjYW4gcmVtb3ZlIHRoZSByZWZlcmVuY2Ugc28gaXQgY2FuIGJlIEdDZWRcbiAgY29uc3QgY2h1bmtzID0gc3BsaXRTdHJpbmdUb0NodW5rc09mU2l6ZShnZXRTdHJpbmcoKSwgT05FX01CKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNodW5rcy5sZW5ndGg7IGkrKyl7XG4gICAgICBjb25zdCBjaHVuayA9IGNodW5rc1tpXTtcbiAgICAgIC8vIEZyZWUgbWVtb3J5IGZvciB0aGUgcHJldmlvdXMgY2h1bmtcbiAgICAgIGNodW5rc1tpXSA9IHVuZGVmaW5lZDtcbiAgICAgIHlpZWxkKiBwcm9jZXNzQ2h1bmsoY2h1bmssIHN0YXRlT2JqZWN0KTtcbiAgfVxuXG4gIGlmIChzdGF0ZU9iamVjdC5zdGF0ZSAhPT0gVEVYVCkgc3RhdGVPYmplY3QudGV4dCArPSBzdGF0ZU9iamVjdC5idWZmZXI7XG5cbiAgaWYgKHN0YXRlT2JqZWN0LnRleHQpIHtcbiAgICB5aWVsZCBuZXcgU3BhbihuZXcgQ29kZSgpLCBzdGF0ZU9iamVjdC50ZXh0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzcGxpdFN0cmluZ1RvQ2h1bmtzT2ZTaXplKHN0ciwgY2h1bmtTaXplKSB7XG4gIGNvbnN0IGNodW5rcyA9IFtdO1xuICBjb25zdCBjaHVua3NMZW5ndGggPSBNYXRoLmNlaWwoc3RyLmxlbmd0aCAvIGNodW5rU2l6ZSk7XG5cbiAgZm9yIChsZXQgaSA9IDAsIG8gPSAwOyBpIDwgY2h1bmtzTGVuZ3RoOyArK2ksIG8gKz0gY2h1bmtTaXplKSB7XG4gICAgY2h1bmtzLnB1c2goc3RyLnN1YnN0cmluZyhvLCBvICsgY2h1bmtTaXplKSk7XG4gIH1cblxuICByZXR1cm4gY2h1bmtzO1xufVxuXG5mdW5jdGlvbiogcHJvY2Vzc0NodW5rKGNodW5rLCBzdGF0ZU9iamVjdCkge1xuICBjb25zdCBjaGFycyA9IGNodW5rO1xuICBjb25zdCBjaGFyc0xlbmd0aCA9IGNodW5rLmxlbmd0aDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoYXJzTGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjID0gY2hhcnNbaV07XG5cbiAgICBzdGF0ZU9iamVjdC5idWZmZXIgKz0gYztcblxuICAgIHN3aXRjaCAoc3RhdGVPYmplY3Quc3RhdGUpIHtcbiAgICAgIGNhc2UgVEVYVDpcbiAgICAgICAgaWYgKGMgPT09IFwiXFx1MDAxYlwiKSB7XG4gICAgICAgICAgc3RhdGVPYmplY3Quc3RhdGUgPSBCUkFDS0VUO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LmJ1ZmZlciA9IGM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhdGVPYmplY3QudGV4dCArPSBjO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEJSQUNLRVQ6XG4gICAgICAgIGlmIChjID09PSBcIltcIikge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnN0YXRlID0gQ09ERTtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5jb2RlID0gXCJcIjtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5jb2RlcyA9IFtdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnN0YXRlID0gVEVYVDtcbiAgICAgICAgICBzdGF0ZU9iamVjdC50ZXh0ICs9IHN0YXRlT2JqZWN0LmJ1ZmZlcjtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBDT0RFOlxuICAgICAgICBpZiAoYyA+PSBcIjBcIiAmJiBjIDw9IFwiOVwiKSB7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZSArPSBjO1xuICAgICAgICB9IGVsc2UgaWYgKGMgPT09IFwiO1wiKSB7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZXMucHVzaChuZXcgQ29kZShzdGF0ZU9iamVjdC5jb2RlKSk7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZSA9IFwiXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoYyA9PT0gXCJtXCIpIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5jb2RlID0gc3RhdGVPYmplY3QuY29kZSB8fCBcIjBcIjtcbiAgICAgICAgICBmb3IgKGNvbnN0IGNvZGUgb2Ygc3RhdGVPYmplY3QuY29kZXMpIHtcbiAgICAgICAgICAgIHlpZWxkIG5ldyBTcGFuKGNvZGUsIHN0YXRlT2JqZWN0LnRleHQpO1xuICAgICAgICAgICAgc3RhdGVPYmplY3QudGV4dCA9IFwiXCI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgeWllbGQgbmV3IFNwYW4obmV3IENvZGUoc3RhdGVPYmplY3QuY29kZSksIHN0YXRlT2JqZWN0LnRleHQpO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnRleHQgPSBcIlwiO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnN0YXRlID0gVEVYVDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5zdGF0ZSA9IFRFWFQ7XG4gICAgICAgICAgc3RhdGVPYmplY3QudGV4dCArPSBzdGF0ZU9iamVjdC5idWZmZXI7XG4gICAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIFBhcnNlIGFuc2kgdGV4dFxuICogQHBhcmFtIHtHZW5lcmF0b3I8U3Bhbiwgdm9pZCwgKj59IHJhd1NwYW5zSXRlcmF0b3IgcmF3IHNwYW5zIGl0ZXJhdG9yXG4gKiBAcmV0dXJuIHtHZW5lcmF0b3I8U3Bhbiwgdm9pZCwgKj59XG4gKi9cbmZ1bmN0aW9uKiBwYXJzZUFuc2kocmF3U3BhbnNJdGVyYXRvcikge1xuICAgIGxldCBjb2xvciA9IG5ldyBDb2xvcigpO1xuICAgIGxldCBiZ0NvbG9yID0gbmV3IENvbG9yKHRydWUgLyogYmFja2dyb3VuZCAqLyk7XG4gICAgbGV0IGJyaWdodG5lc3MgPSB1bmRlZmluZWQ7XG4gICAgbGV0IHN0eWxlcyA9IG5ldyBTZXQoKTtcblxuICAgIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgICBjb2xvciA9IG5ldyBDb2xvcigpO1xuICAgICAgICBiZ0NvbG9yID0gbmV3IENvbG9yKHRydWUgLyogYmFja2dyb3VuZCAqLyk7XG4gICAgICAgIGJyaWdodG5lc3MgPSB1bmRlZmluZWQ7XG4gICAgICAgIHN0eWxlcy5jbGVhcigpO1xuICAgIH1cblxuICAgIHJlc2V0KCk7XG5cbiAgICBmb3IgKGNvbnN0IHNwYW4gb2YgcmF3U3BhbnNJdGVyYXRvcikge1xuICAgICAgICBjb25zdCBjID0gc3Bhbi5jb2RlO1xuXG4gICAgICAgIGlmKHNwYW4udGV4dCAhPT0gXCJcIikge1xuICAgICAgICAgICAgY29uc3QgaW52ZXJ0ZWQgPSBzdHlsZXMuaGFzKFwiaW52ZXJzZVwiKTtcbiAgICAgICAgICAgIGNvbnN0IHVuZGVybGluZSA9IHN0eWxlcy5oYXMoXCJ1bmRlcmxpbmVcIilcbiAgICAgICAgICAgICAgICA/IFwidGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XCJcbiAgICAgICAgICAgICAgICA6IFwiXCI7XG4gICAgICAgICAgICBjb25zdCBpdGFsaWMgPSBzdHlsZXMuaGFzKFwiaXRhbGljXCIpID8gXCJmb250LXN0eWxlOiBpdGFsaWM7XCIgOiBcIlwiO1xuICAgICAgICAgICAgY29uc3QgYm9sZCA9IGJyaWdodG5lc3MgPT09IENvZGUuYnJpZ2h0ID8gXCJmb250LXdlaWdodDogYm9sZDtcIiA6IFwiXCI7XG5cbiAgICAgICAgICAgIGNvbnN0IGZvcmVDb2xvciA9IGNvbG9yLmRlZmF1bHRCcmlnaHRuZXNzKGJyaWdodG5lc3MpO1xuXG4gICAgICAgICAgICBjb25zdCBuZXdTcGFuID0gbmV3IFNwYW4oc3Bhbi5jb2RlID8gc3Bhbi5jb2RlLmNsb25lKCkgOiB1bmRlZmluZWQsIHNwYW4udGV4dCk7XG4gICAgICAgICAgICBuZXdTcGFuLmNzcyA9IGJvbGQgKyBpdGFsaWMgKyB1bmRlcmxpbmUgKyBmb3JlQ29sb3IuY3NzKGludmVydGVkKSArIGJnQ29sb3IuY3NzKGludmVydGVkKTtcbiAgICAgICAgICAgIG5ld1NwYW4uYm9sZCA9ICEhYm9sZDtcbiAgICAgICAgICAgIG5ld1NwYW4uY29sb3IgPSBmb3JlQ29sb3IuY2xlYW47XG4gICAgICAgICAgICBuZXdTcGFuLmJnQ29sb3IgPSBiZ0NvbG9yLmNsZWFuO1xuICAgICAgICAgICAgbmV3U3Bhbi5pbnZlcnNlID0gaW52ZXJ0ZWQ7XG4gICAgICAgICAgICBuZXdTcGFuLml0YWxpYyA9ICEhaXRhbGljO1xuICAgICAgICAgICAgbmV3U3Bhbi51bmRlcmxpbmUgPSAhIXVuZGVybGluZTtcbiAgICAgICAgICAgIG5ld1NwYW4uYnJpZ2h0ID0gc3R5bGVzLmhhcyhcImJyaWdodFwiKTtcbiAgICAgICAgICAgIG5ld1NwYW4uZGltID0gc3R5bGVzLmhhcyhcImRpbVwiKTtcblxuICAgICAgICAgICAgeWllbGQgbmV3U3BhbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjLmlzQnJpZ2h0bmVzcykge1xuICAgICAgICAgICAgYnJpZ2h0bmVzcyA9IGMudmFsdWU7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzcGFuLmNvZGUudmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3Bhbi5jb2RlLnZhbHVlID09PSBDb2RlLnJlc2V0KSB7XG4gICAgICAgICAgICByZXNldCgpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHNwYW4uY29kZS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiY29sb3JcIjpcbiAgICAgICAgICAgIGNhc2UgXCJjb2xvckxpZ2h0XCI6XG4gICAgICAgICAgICAgICAgY29sb3IgPSBuZXcgQ29sb3IoZmFsc2UsIGMuc3VidHlwZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgXCJiZ0NvbG9yXCI6XG4gICAgICAgICAgICBjYXNlIFwiYmdDb2xvckxpZ2h0XCI6XG4gICAgICAgICAgICAgICAgYmdDb2xvciA9IG5ldyBDb2xvcih0cnVlLCBjLnN1YnR5cGUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIFwic3R5bGVcIjpcbiAgICAgICAgICAgICAgICBzdHlsZXMuYWRkKGMuc3VidHlwZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidW5zdHlsZVwiOlxuICAgICAgICAgICAgICAgIHN0eWxlcy5kZWxldGUoYy5zdWJ0eXBlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBBTlNJLWVzY2FwZWQgc3RyaW5nLlxuICovXG5jbGFzcyBDb2xvcnMge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocykge1xuICAgICAgICB0aGlzLnNwYW5zID0gcyA/IEFycmF5LmZyb20ocmF3UGFyc2UodHlwZW9mIHMgPT09ICdzdHJpbmcnID8gKCkgPT4gcyA6IHMpKSA6IFtdXG4gICAgfVxuXG4gICAgZ2V0IHN0ciAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNwYW5zLnJlZHVjZSAoKHN0ciwgcCkgPT4gc3RyICsgcC50ZXh0ICsgcC5jb2RlLnN0ciwgJycpXG4gICAgfVxuXG4gICAgZ2V0IHBhcnNlZCAoKSB7XG4gICAgICAgIGNvbnN0IG5ld0NvbG9ycyA9IG5ldyBDb2xvcnMoKTtcblxuICAgICAgICBuZXdDb2xvcnMuc3BhbnMgPSBBcnJheS5mcm9tKHBhcnNlQW5zaSh0aGlzLnNwYW5zKSk7XG5cbiAgICAgICAgcmV0dXJuIG5ld0NvbG9ycztcbiAgICB9XG5cbi8qICBPdXRwdXRzIHdpdGggQ2hyb21lIERldlRvb2xzLWNvbXBhdGlibGUgZm9ybWF0ICAgICAqL1xuXG4gICAgZ2V0IGFzQ2hyb21lQ29uc29sZUxvZ0FyZ3VtZW50cyAoKSB7XG5cbiAgICAgICAgY29uc3Qgc3BhbnMgPSB0aGlzLnBhcnNlZC5zcGFuc1xuXG4gICAgICAgIHJldHVybiBbc3BhbnMubWFwIChzID0+ICgnJWMnICsgcy50ZXh0KSkuam9pbiAoJycpLFxuICAgICAgICAgICAgIC4uLnNwYW5zLm1hcCAocyA9PiBzLmNzcyldXG4gICAgfVxuXG4gICAgZ2V0IGJyb3dzZXJDb25zb2xlQXJndW1lbnRzICgpIC8qIExFR0FDWSwgREVQUkVDQVRFRCAqLyB7IHJldHVybiB0aGlzLmFzQ2hyb21lQ29uc29sZUxvZ0FyZ3VtZW50cyB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBpbnN0YWxscyBTdHJpbmcgcHJvdG90eXBlIGV4dGVuc2lvbnNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlcXVpcmUgKCdhbnNpY29sb3InKS5uaWNlXG4gICAgICogY29uc29sZS5sb2cgKCdmb28nLmJyaWdodC5yZWQpXG4gICAgICovXG4gICAgc3RhdGljIGdldCBuaWNlICgpIHtcblxuICAgICAgICBDb2xvcnMubmFtZXMuZm9yRWFjaCAoayA9PiB7XG4gICAgICAgICAgICBpZiAoIShrIGluIFN0cmluZy5wcm90b3R5cGUpKSB7XG4gICAgICAgICAgICAgICAgTy5kZWZpbmVQcm9wZXJ0eSAoU3RyaW5nLnByb3RvdHlwZSwgaywgeyBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIENvbG9yc1trXSAodGhpcykgfSB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiBDb2xvcnNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBwYXJzZXMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlc1xuICAgICAqIEByZXR1cm4ge0NvbG9yc30gcGFyc2VkIHJlcHJlc2VudGF0aW9uLlxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZSAocykge1xuICAgICAgICByZXR1cm4gbmV3IENvbG9ycyAocykucGFyc2VkXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8ICgpID0+IHN0cmluZ30gcyBzdHJpbmcgb3IgYSBmdW5jdGlvbiByZXR1cm5pbmcgYSBzdHJpbmcgKGZvciBsYXJnZSBzdHJpbmdzIHlvdSBtYXkgd2FudCB0byB1c2UgYSBmdW5jdGlvbiB0byBhdm9pZCBtZW1vcnkgaXNzdWVzKVxuICAgICAqIEByZXR1cm5zIHtHZW5lcmF0b3I8U3Bhbiwgdm9pZCwgKj59IFNwYW5zIGl0ZXJhdG9yXG4gICAgICovXG4gICAgc3RhdGljIHBhcnNlSXRlcmF0b3Iocykge1xuICAgICAgICByZXR1cm4gcGFyc2VBbnNpKHJhd1BhcnNlKHR5cGVvZiBzID09PSBcInN0cmluZ1wiID8gKCkgPT4gcyA6IHMpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBzdHJpcHMgQU5TSSBjb2RlcyBmcm9tIGEgc3RyaW5nXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlcy5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IGNsZWFuIHN0cmluZy5cbiAgICAgKi9cbiAgICBzdGF0aWMgc3RyaXAgKHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSAoL1tcXHUwMDFiXFx1MDA5Yl1bWygpIzs/XSooPzpbMC05XXsxLDR9KD86O1swLTldezAsNH0pKik/WzAtOUEtUFJaY2YtbnFyeT0+PF0vZywgJycpIC8vIGhvcGUgVjggY2FjaGVzIHRoZSByZWdleHBcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBjaGVja3MgaWYgYSB2YWx1ZSBjb250YWlucyBBTlNJIGVzY2FwZSBjb2Rlc1xuICAgICAqIEBwYXJhbSB7YW55fSBzIHZhbHVlIHRvIGNoZWNrXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gaGFzIGNvZGVzXG4gICAgICovXG4gICAgIHN0YXRpYyBpc0VzY2FwZWQgKHMpIHtcbiAgICAgICAgcyA9IFN0cmluZyhzKVxuICAgICAgICByZXR1cm4gQ29sb3JzLnN0cmlwIChzKSAhPT0gcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNwYW5zID0gWy4uLmFuc2kucGFyc2UgKCdcXHUwMDFiWzdtXFx1MDAxYls3bWZvb1xcdTAwMWJbN21iYXJcXHUwMDFiWzI3bScpXVxuICAgICAqL1xuICAgIFtTeW1ib2wuaXRlcmF0b3JdICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3BhbnNbU3ltYm9sLml0ZXJhdG9yXSAoKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIFRoaXMgYWxsb3dzIGFuIGFsdGVybmF0aXZlIGltcG9ydCBzdHlsZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS94cGwvYW5zaWNvbG9yL2lzc3Vlcy83I2lzc3VlY29tbWVudC01Nzg5MjM1NzhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGltcG9ydCB7IGFuc2ljb2xvciwgUGFyc2VkU3BhbiB9IGZyb20gJ2Fuc2ljb2xvcidcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IGFuc2ljb2xvciAoKSB7XG4gICAgICAgIHJldHVybiBDb2xvcnNcbiAgICB9XG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuYXNzaWduU3RyaW5nV3JhcHBpbmdBUEkgKENvbG9ycywgc3RyID0+IHN0cilcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5Db2xvcnMubmFtZXMgPSBzdHJpbmdXcmFwcGluZ01ldGhvZHMubWFwICgoW2tdKSA9PiBrKVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbkNvbG9ycy5yZ2IgPSB7XG5cbiAgICBibGFjazogICAgICAgIFswLCAgICAgMCwgICAwXSxcbiAgICBkYXJrR3JheTogICAgIFsxMDAsIDEwMCwgMTAwXSxcbiAgICBsaWdodEdyYXk6ICAgIFsyMDAsIDIwMCwgMjAwXSxcbiAgICB3aGl0ZTogICAgICAgIFsyNTUsIDI1NSwgMjU1XSxcblxuICAgIHJlZDogICAgICAgICAgWzIwNCwgICAwLCAgIDBdLFxuICAgIGxpZ2h0UmVkOiAgICAgWzI1NSwgIDUxLCAgIDBdLFxuXG4gICAgZ3JlZW46ICAgICAgICBbMCwgICAyMDQsICAgMF0sXG4gICAgbGlnaHRHcmVlbjogICBbNTEsICAyMDQsICA1MV0sXG5cbiAgICB5ZWxsb3c6ICAgICAgIFsyMDQsIDEwMiwgICAwXSxcbiAgICBsaWdodFllbGxvdzogIFsyNTUsIDE1MywgIDUxXSxcblxuICAgIGJsdWU6ICAgICAgICAgWzAsICAgICAwLCAyNTVdLFxuICAgIGxpZ2h0Qmx1ZTogICAgWzI2LCAgMTQwLCAyNTVdLFxuXG4gICAgbWFnZW50YTogICAgICBbMjA0LCAgIDAsIDIwNF0sXG4gICAgbGlnaHRNYWdlbnRhOiBbMjU1LCAgIDAsIDI1NV0sXG5cbiAgICBjeWFuOiAgICAgICAgIFswLCAgIDE1MywgMjU1XSxcbiAgICBsaWdodEN5YW46ICAgIFswLCAgIDIwNCwgMjU1XSxcbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbG9yc1xuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbiJdfQ==