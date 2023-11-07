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
        this.color = "";
        this.bgColor = "";
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

        const inverted = styles.has("inverse");
        const underline = styles.has("underline") ? "text-decoration: underline;" : "";
        const italic = styles.has("italic") ? "font-style: italic;" : "";
        const bold = brightness === Code.bright ? "font-weight: bold;" : "";

        const foreColor = color.defaultBrightness(brightness);

        span.css = bold + italic + underline + foreColor.css(inverted) + bgColor.css(inverted);
        span.bold = !!bold;
        span.color = foreColor.clean;
        span.bgColor = bgColor.clean;
        span.inverse = inverted;
        span.italic = !!italic;
        span.underline = !!underline;
        span.bright = styles.has("bright");
        span.dim = styles.has("dim");

        if (span.text !== "") {
            yield span;
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFjLENBQUMsQ0FBRCxFQUFRLENBQVIsRUFBYSxDQUFiLENBRkw7QUFHVCxjQUFjLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBSEw7QUFJVCxlQUFjLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBSkw7QUFLVCxXQUFjLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBTEw7O0FBT1QsU0FBYyxDQUFDLEdBQUQsRUFBUSxDQUFSLEVBQWEsQ0FBYixDQVBMO0FBUVQsY0FBYyxDQUFDLEdBQUQsRUFBTyxFQUFQLEVBQWEsQ0FBYixDQVJMOztBQVVULFdBQWMsQ0FBQyxDQUFELEVBQU0sR0FBTixFQUFhLENBQWIsQ0FWTDtBQVdULGdCQUFjLENBQUMsRUFBRCxFQUFNLEdBQU4sRUFBWSxFQUFaLENBWEw7O0FBYVQsWUFBYyxDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQWEsQ0FBYixDQWJMO0FBY1QsaUJBQWMsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFZLEVBQVosQ0FkTDs7QUFnQlQsVUFBYyxDQUFDLENBQUQsRUFBUSxDQUFSLEVBQVcsR0FBWCxDQWhCTDtBQWlCVCxlQUFjLENBQUMsRUFBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBakJMOztBQW1CVCxhQUFjLENBQUMsR0FBRCxFQUFRLENBQVIsRUFBVyxHQUFYLENBbkJMO0FBb0JULGtCQUFjLENBQUMsR0FBRCxFQUFRLENBQVIsRUFBVyxHQUFYLENBcEJMOztBQXNCVCxVQUFjLENBQUMsQ0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBdEJMO0FBdUJULGVBQWMsQ0FBQyxDQUFELEVBQU0sR0FBTixFQUFXLEdBQVg7O0FBR2xCOztBQTFCYSxDQUFiLENBNEJBLE9BQU8sT0FBUCxHQUFpQixNQUFqQjs7QUFFQSIsImZpbGUiOiJhbnNpY29sb3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBPID0gT2JqZWN0XG5cbi8qICBTZWUgaHR0cHM6Ly9taXNjLmZsb2dpc29mdC5jb20vYmFzaC90aXBfY29sb3JzX2FuZF9mb3JtYXR0aW5nXG4gICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IGNvbG9yQ29kZXMgICAgICA9IFsgICAnYmxhY2snLCAgICAgICdyZWQnLCAgICAgICdncmVlbicsICAgICAgJ3llbGxvdycsICAgICAgJ2JsdWUnLCAgICAgICdtYWdlbnRhJywgICAgICAnY3lhbicsICdsaWdodEdyYXknLCAnJywgJ2RlZmF1bHQnXVxuICAgICwgY29sb3JDb2Rlc0xpZ2h0ID0gWydkYXJrR3JheScsICdsaWdodFJlZCcsICdsaWdodEdyZWVuJywgJ2xpZ2h0WWVsbG93JywgJ2xpZ2h0Qmx1ZScsICdsaWdodE1hZ2VudGEnLCAnbGlnaHRDeWFuJywgJ3doaXRlJywgJyddXG5cbiAgICAsIHN0eWxlQ29kZXMgPSBbJycsICdicmlnaHQnLCAnZGltJywgJ2l0YWxpYycsICd1bmRlcmxpbmUnLCAnJywgJycsICdpbnZlcnNlJ11cblxuICAgICwgYXNCcmlnaHQgPSB7ICdyZWQnOiAgICAgICAnbGlnaHRSZWQnLFxuICAgICAgICAgICAgICAgICAgICdncmVlbic6ICAgICAnbGlnaHRHcmVlbicsXG4gICAgICAgICAgICAgICAgICAgJ3llbGxvdyc6ICAgICdsaWdodFllbGxvdycsXG4gICAgICAgICAgICAgICAgICAgJ2JsdWUnOiAgICAgICdsaWdodEJsdWUnLFxuICAgICAgICAgICAgICAgICAgICdtYWdlbnRhJzogICAnbGlnaHRNYWdlbnRhJyxcbiAgICAgICAgICAgICAgICAgICAnY3lhbic6ICAgICAgJ2xpZ2h0Q3lhbicsXG4gICAgICAgICAgICAgICAgICAgJ2JsYWNrJzogICAgICdkYXJrR3JheScsXG4gICAgICAgICAgICAgICAgICAgJ2xpZ2h0R3JheSc6ICd3aGl0ZScgfVxuXG4gICAgLCB0eXBlcyA9IHsgMDogICdzdHlsZScsXG4gICAgICAgICAgICAgICAgMjogICd1bnN0eWxlJyxcbiAgICAgICAgICAgICAgICAzOiAgJ2NvbG9yJyxcbiAgICAgICAgICAgICAgICA5OiAgJ2NvbG9yTGlnaHQnLFxuICAgICAgICAgICAgICAgIDQ6ICAnYmdDb2xvcicsXG4gICAgICAgICAgICAgICAgMTA6ICdiZ0NvbG9yTGlnaHQnIH1cblxuICAgICwgc3VidHlwZXMgPSB7ICBjb2xvcjogICAgICAgICBjb2xvckNvZGVzLFxuICAgICAgICAgICAgICAgICAgICBjb2xvckxpZ2h0OiAgICBjb2xvckNvZGVzTGlnaHQsXG4gICAgICAgICAgICAgICAgICAgIGJnQ29sb3I6ICAgICAgIGNvbG9yQ29kZXMsXG4gICAgICAgICAgICAgICAgICAgIGJnQ29sb3JMaWdodDogIGNvbG9yQ29kZXNMaWdodCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6ICAgICAgICAgc3R5bGVDb2RlcyxcbiAgICAgICAgICAgICAgICAgICAgdW5zdHlsZTogICAgICAgc3R5bGVDb2RlcyAgICB9XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY2xhc3MgQ29sb3Ige1xuXG4gICAgY29uc3RydWN0b3IgKGJhY2tncm91bmQsIG5hbWUsIGJyaWdodG5lc3MpIHtcblxuICAgICAgICB0aGlzLmJhY2tncm91bmQgPSBiYWNrZ3JvdW5kXG4gICAgICAgIHRoaXMubmFtZSAgICAgICA9IG5hbWVcbiAgICAgICAgdGhpcy5icmlnaHRuZXNzID0gYnJpZ2h0bmVzc1xuICAgIH1cblxuICAgIGdldCBpbnZlcnNlICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2xvciAoIXRoaXMuYmFja2dyb3VuZCwgdGhpcy5uYW1lIHx8ICh0aGlzLmJhY2tncm91bmQgPyAnYmxhY2snIDogJ3doaXRlJyksIHRoaXMuYnJpZ2h0bmVzcylcbiAgICB9XG5cbiAgICBnZXQgY2xlYW4oKSB7XG4gICAgICBjb25zdCBuYW1lID0gdGhpcy5uYW1lID09PSBcImRlZmF1bHRcIiA/IFwiXCIgOiB0aGlzLm5hbWU7XG4gICAgICBjb25zdCBicmlnaHQgPSB0aGlzLmJyaWdodG5lc3MgPT09IENvZGUuYnJpZ2h0O1xuICAgICAgY29uc3QgZGltID0gdGhpcy5icmlnaHRuZXNzID09PSBDb2RlLmRpbTtcblxuICAgICAgaWYgKCFuYW1lICYmICFicmlnaHQgJiYgIWRpbSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBicmlnaHQsXG4gICAgICAgIGRpbSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZGVmYXVsdEJyaWdodG5lc3MgKHZhbHVlKSB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBDb2xvciAodGhpcy5iYWNrZ3JvdW5kLCB0aGlzLm5hbWUsIHRoaXMuYnJpZ2h0bmVzcyB8fCB2YWx1ZSlcbiAgICB9XG5cbiAgICBjc3MgKGludmVydGVkKSB7XG5cbiAgICAgICAgY29uc3QgY29sb3IgPSBpbnZlcnRlZCA/IHRoaXMuaW52ZXJzZSA6IHRoaXNcblxuICAgICAgICBjb25zdCByZ2JOYW1lID0gKChjb2xvci5icmlnaHRuZXNzID09PSBDb2RlLmJyaWdodCkgJiYgYXNCcmlnaHRbY29sb3IubmFtZV0pIHx8IGNvbG9yLm5hbWVcblxuICAgICAgICBjb25zdCBwcm9wID0gKGNvbG9yLmJhY2tncm91bmQgPyAnYmFja2dyb3VuZDonIDogJ2NvbG9yOicpXG4gICAgICAgICAgICAsIHJnYiAgPSBDb2xvcnMucmdiW3JnYk5hbWVdXG4gICAgICAgICAgICAsIGFscGhhID0gKHRoaXMuYnJpZ2h0bmVzcyA9PT0gQ29kZS5kaW0pID8gMC41IDogMVxuXG4gICAgICAgIHJldHVybiByZ2JcbiAgICAgICAgICAgICAgICA/IChwcm9wICsgJ3JnYmEoJyArIFsuLi5yZ2IsIGFscGhhXS5qb2luICgnLCcpICsgJyk7JylcbiAgICAgICAgICAgICAgICA6ICgoIWNvbG9yLmJhY2tncm91bmQgJiYgKGFscGhhIDwgMSkpID8gJ2NvbG9yOnJnYmEoMCwwLDAsMC41KTsnIDogJycpIC8vIENocm9tZSBkb2VzIG5vdCBzdXBwb3J0ICdvcGFjaXR5JyBwcm9wZXJ0eS4uLlxuICAgIH1cbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jbGFzcyBDb2RlIHtcblxuICBjb25zdHJ1Y3RvcihuKSB7XG4gICAgbGV0IHZhbHVlID0gdW5kZWZpbmVkO1xuICAgIGxldCB0eXBlID0gdW5kZWZpbmVkO1xuICAgIGxldCBzdWJ0eXBlID0gdW5kZWZpbmVkO1xuICAgIGxldCBzdHIgPSBcIlwiO1xuICAgIGxldCBpc0JyaWdodG5lc3MgPSBmYWxzZTtcblxuICAgIGlmIChuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhbHVlID0gTnVtYmVyKG4pO1xuICAgICAgdHlwZSA9IHR5cGVzW01hdGguZmxvb3IodmFsdWUgLyAxMCldO1xuICAgICAgc3VidHlwZSA9IHN1YnR5cGVzW3R5cGVdW3ZhbHVlICUgMTBdO1xuICAgICAgc3RyID0gXCJcXHUwMDFiW1wiICsgdmFsdWUgKyBcIm1cIjtcbiAgICAgIGlzQnJpZ2h0bmVzcyA9XG4gICAgICAgIHZhbHVlID09PSBDb2RlLm5vQnJpZ2h0bmVzcyB8fFxuICAgICAgICB2YWx1ZSA9PT0gQ29kZS5icmlnaHQgfHxcbiAgICAgICAgdmFsdWUgPT09IENvZGUuZGltO1xuICAgIH1cblxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuc3VidHlwZSA9IHN1YnR5cGU7XG4gICAgdGhpcy5zdHIgPSBzdHI7XG4gICAgdGhpcy5pc0JyaWdodG5lc3MgPSBpc0JyaWdodG5lc3M7XG4gIH1cblxuICBzdGF0aWMgc3RyKHgpIHtcbiAgICBpZih4ID09PSB1bmRlZmluZWQpIHJldHVybiBcIlwiO1xuICAgIHJldHVybiBcIlxcdTAwMWJbXCIgKyBOdW1iZXIoeCkgKyBcIm1cIjtcbiAgfVxufVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbk8uYXNzaWduIChDb2RlLCB7XG5cbiAgICByZXNldDogICAgICAgIDAsXG4gICAgYnJpZ2h0OiAgICAgICAxLFxuICAgIGRpbTogICAgICAgICAgMixcbiAgICBpbnZlcnNlOiAgICAgIDcsXG4gICAgbm9CcmlnaHRuZXNzOiAyMixcbiAgICBub0l0YWxpYzogICAgIDIzLFxuICAgIG5vVW5kZXJsaW5lOiAgMjQsXG4gICAgbm9JbnZlcnNlOiAgICAyNyxcbiAgICBub0NvbG9yOiAgICAgIDM5LFxuICAgIG5vQmdDb2xvcjogICAgNDlcbn0pXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgcmVwbGFjZUFsbCA9IChzdHIsIGEsIGIpID0+IHN0ci5zcGxpdCAoYSkuam9pbiAoYilcblxuLyogIEFOU0kgYnJpZ2h0bmVzcyBjb2RlcyBkbyBub3Qgb3ZlcmxhcCwgZS5nLiBcInticmlnaHR9e2RpbX1mb29cIiB3aWxsIGJlIHJlbmRlcmVkIGJyaWdodCAobm90IGRpbSkuXG4gICAgU28gd2UgZml4IGl0IGJ5IGFkZGluZyBicmlnaHRuZXNzIGNhbmNlbGluZyBiZWZvcmUgZWFjaCBicmlnaHRuZXNzIGNvZGUsIHNvIHRoZSBmb3JtZXIgZXhhbXBsZSBnZXRzXG4gICAgY29udmVydGVkIHRvIFwie25vQnJpZ2h0bmVzc317YnJpZ2h0fXtub0JyaWdodG5lc3N9e2RpbX1mb29cIiDigJMgdGhpcyB3YXkgaXQgZ2V0cyByZW5kZXJlZCBhcyBleHBlY3RlZC5cbiAqL1xuXG5jb25zdCBkZW5vcm1hbGl6ZUJyaWdodG5lc3MgPSBzID0+IHMucmVwbGFjZSAoLyhcXHUwMDFiXFxbKDF8MiltKS9nLCAnXFx1MDAxYlsyMm0kMScpXG5jb25zdCBub3JtYWxpemVCcmlnaHRuZXNzID0gcyA9PiBzLnJlcGxhY2UgKC9cXHUwMDFiXFxbMjJtKFxcdTAwMWJcXFsoMXwyKW0pL2csICckMScpXG5cbmNvbnN0IHdyYXAgPSAoeCwgb3BlbkNvZGUsIGNsb3NlQ29kZSkgPT4ge1xuXG4gICAgY29uc3Qgb3BlbiAgPSBDb2RlLnN0ciAob3BlbkNvZGUpLFxuICAgICAgICAgIGNsb3NlID0gQ29kZS5zdHIgKGNsb3NlQ29kZSlcblxuICAgIHJldHVybiBTdHJpbmcgKHgpXG4gICAgICAgICAgICAgICAgLnNwbGl0ICgnXFxuJylcbiAgICAgICAgICAgICAgICAubWFwIChsaW5lID0+IGRlbm9ybWFsaXplQnJpZ2h0bmVzcyAob3BlbiArIHJlcGxhY2VBbGwgKG5vcm1hbGl6ZUJyaWdodG5lc3MgKGxpbmUpLCBjbG9zZSwgb3BlbikgKyBjbG9zZSkpXG4gICAgICAgICAgICAgICAgLmpvaW4gKCdcXG4nKVxufVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IGNhbWVsID0gKGEsIGIpID0+IGEgKyBiLmNoYXJBdCAoMCkudG9VcHBlckNhc2UgKCkgKyBiLnNsaWNlICgxKVxuXG5cbmNvbnN0IHN0cmluZ1dyYXBwaW5nTWV0aG9kcyA9ICgoKSA9PiBbXG5cbiAgICAgICAgLi4uY29sb3JDb2Rlcy5tYXAgKChrLCBpKSA9PiAhayA/IFtdIDogWyAvLyBjb2xvciBtZXRob2RzXG5cbiAgICAgICAgICAgIFtrLCAgICAgICAgICAgICAgIDMwICsgaSwgQ29kZS5ub0NvbG9yXSxcbiAgICAgICAgICAgIFtjYW1lbCAoJ2JnJywgayksIDQwICsgaSwgQ29kZS5ub0JnQ29sb3JdLFxuICAgICAgICBdKSxcblxuICAgICAgICAuLi5jb2xvckNvZGVzTGlnaHQubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFsgLy8gbGlnaHQgY29sb3IgbWV0aG9kc1xuXG4gICAgICAgICAgICBbaywgICAgICAgICAgICAgICAgOTAgKyBpLCBDb2RlLm5vQ29sb3JdLFxuICAgICAgICAgICAgW2NhbWVsICgnYmcnLCBrKSwgMTAwICsgaSwgQ29kZS5ub0JnQ29sb3JdLFxuICAgICAgICBdKSxcblxuICAgICAgICAvKiBUSElTIE9ORSBJUyBGT1IgQkFDS1dBUkRTIENPTVBBVElCSUxJVFkgV0lUSCBQUkVWSU9VUyBWRVJTSU9OUyAoaGFkICdicmlnaHQnIGluc3RlYWQgb2YgJ2xpZ2h0JyBmb3IgYmFja2dyb3VuZHMpXG4gICAgICAgICAqL1xuICAgICAgICAuLi5bJycsICdCcmlnaHRSZWQnLCAnQnJpZ2h0R3JlZW4nLCAnQnJpZ2h0WWVsbG93JywgJ0JyaWdodEJsdWUnLCAnQnJpZ2h0TWFnZW50YScsICdCcmlnaHRDeWFuJ10ubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFtcblxuICAgICAgICAgICAgWydiZycgKyBrLCAxMDAgKyBpLCBDb2RlLm5vQmdDb2xvcl0sXG4gICAgICAgIF0pLFxuXG4gICAgICAgIC4uLnN0eWxlQ29kZXMubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFsgLy8gc3R5bGUgbWV0aG9kc1xuXG4gICAgICAgICAgICBbaywgaSwgKChrID09PSAnYnJpZ2h0JykgfHwgKGsgPT09ICdkaW0nKSkgPyBDb2RlLm5vQnJpZ2h0bmVzcyA6ICgyMCArIGkpXVxuICAgICAgICBdKVxuICAgIF1cbiAgICAucmVkdWNlICgoYSwgYikgPT4gYS5jb25jYXQgKGIpKVxuXG4pICgpO1xuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IGFzc2lnblN0cmluZ1dyYXBwaW5nQVBJID0gKHRhcmdldCwgd3JhcEJlZm9yZSA9IHRhcmdldCkgPT5cblxuICAgIHN0cmluZ1dyYXBwaW5nTWV0aG9kcy5yZWR1Y2UgKChtZW1vLCBbaywgb3BlbiwgY2xvc2VdKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8uZGVmaW5lUHJvcGVydHkgKG1lbW8sIGssIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0OiAoKSA9PiBhc3NpZ25TdHJpbmdXcmFwcGluZ0FQSSAoc3RyID0+IHdyYXBCZWZvcmUgKHdyYXAgKHN0ciwgb3BlbiwgY2xvc2UpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldClcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBURVhUICAgID0gMCxcbiAgICAgIEJSQUNLRVQgPSAxLFxuICAgICAgQ09ERSAgICA9IDJcblxuY2xhc3MgU3BhbiB7XG4gIGNvbnN0cnVjdG9yKGNvZGUsIHRleHQpIHtcbiAgICB0aGlzLmNvZGUgPSBjb2RlO1xuICAgIHRoaXMudGV4dCA9IHRleHQ7XG5cbiAgICAvLyBUaG9zZSBhcmUgYWRkZWQgaW4gdGhlIGFjdHVhbCBwYXJzZSwgdGhpcyBpcyBkb25lIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIHRvIGhhdmUgdGhlIHNhbWUgaGlkZGVuIGNsYXNzXG4gICAgdGhpcy5jc3MgPSBcIlwiO1xuICAgIHRoaXMuY29sb3IgPSBcIlwiO1xuICAgIHRoaXMuYmdDb2xvciA9IFwiXCI7XG4gICAgdGhpcy5ib2xkID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuaW52ZXJzZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLml0YWxpYyA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnVuZGVybGluZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmJyaWdodCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmRpbSA9IHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vLyBnZXRTdHJpbmcgYXMgZnVuY3Rpb24gaW5zdGVhZCBvZiBzdHJpbmcgdG8gYWxsb3cgZ2FyYmFnZSBjb2xsZWN0aW9uXG5mdW5jdGlvbiogcmF3UGFyc2UoZ2V0U3RyaW5nKSB7XG4gIGNvbnN0IHN0YXRlT2JqZWN0ID0ge1xuICAgIHN0YXRlOiBURVhULFxuICAgIGJ1ZmZlcjogXCJcIixcbiAgICB0ZXh0OiBcIlwiLFxuICAgIGNvZGU6IFwiXCIsXG4gICAgY29kZXM6IFtdLFxuICB9O1xuXG4gIGNvbnN0IE9ORV9NQiA9IDEwNDg1NzY7XG5cbiAgLy8gSW5zdGVhZCBvZiBob2xkaW5nIHRoZSByZWZlcmVuY2UgdG8gdGhlIHN0cmluZyB3ZSBzcGxpdCBpbnRvIGNodW5rcyBvZiAxTUJcbiAgLy8gYW5kIGFmdGVyIHByb2Nlc3NpbmcgaXMgZmluaXNoZWQgd2UgY2FuIHJlbW92ZSB0aGUgcmVmZXJlbmNlIHNvIGl0IGNhbiBiZSBHQ2VkXG4gIGNvbnN0IGNodW5rcyA9IHNwbGl0U3RyaW5nVG9DaHVua3NPZlNpemUoZ2V0U3RyaW5nKCksIE9ORV9NQik7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaHVua3MubGVuZ3RoOyBpKyspe1xuICAgICAgY29uc3QgY2h1bmsgPSBjaHVua3NbaV07XG4gICAgICAvLyBGcmVlIG1lbW9yeSBmb3IgdGhlIHByZXZpb3VzIGNodW5rXG4gICAgICBjaHVua3NbaV0gPSB1bmRlZmluZWQ7XG4gICAgICB5aWVsZCogcHJvY2Vzc0NodW5rKGNodW5rLCBzdGF0ZU9iamVjdCk7XG4gIH1cblxuICBpZiAoc3RhdGVPYmplY3Quc3RhdGUgIT09IFRFWFQpIHN0YXRlT2JqZWN0LnRleHQgKz0gc3RhdGVPYmplY3QuYnVmZmVyO1xuXG4gIGlmIChzdGF0ZU9iamVjdC50ZXh0KSB7XG4gICAgeWllbGQgbmV3IFNwYW4obmV3IENvZGUoKSwgc3RhdGVPYmplY3QudGV4dCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3BsaXRTdHJpbmdUb0NodW5rc09mU2l6ZShzdHIsIGNodW5rU2l6ZSkge1xuICBjb25zdCBjaHVua3MgPSBbXTtcbiAgY29uc3QgY2h1bmtzTGVuZ3RoID0gTWF0aC5jZWlsKHN0ci5sZW5ndGggLyBjaHVua1NpemUpO1xuXG4gIGZvciAobGV0IGkgPSAwLCBvID0gMDsgaSA8IGNodW5rc0xlbmd0aDsgKytpLCBvICs9IGNodW5rU2l6ZSkge1xuICAgIGNodW5rcy5wdXNoKHN0ci5zdWJzdHJpbmcobywgbyArIGNodW5rU2l6ZSkpO1xuICB9XG5cbiAgcmV0dXJuIGNodW5rcztcbn1cblxuZnVuY3Rpb24qIHByb2Nlc3NDaHVuayhjaHVuaywgc3RhdGVPYmplY3QpIHtcbiAgY29uc3QgY2hhcnMgPSBjaHVuaztcbiAgY29uc3QgY2hhcnNMZW5ndGggPSBjaHVuay5sZW5ndGg7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGFyc0xlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYyA9IGNoYXJzW2ldO1xuXG4gICAgc3RhdGVPYmplY3QuYnVmZmVyICs9IGM7XG5cbiAgICBzd2l0Y2ggKHN0YXRlT2JqZWN0LnN0YXRlKSB7XG4gICAgICBjYXNlIFRFWFQ6XG4gICAgICAgIGlmIChjID09PSBcIlxcdTAwMWJcIikge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnN0YXRlID0gQlJBQ0tFVDtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5idWZmZXIgPSBjO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnRleHQgKz0gYztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBCUkFDS0VUOlxuICAgICAgICBpZiAoYyA9PT0gXCJbXCIpIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5zdGF0ZSA9IENPREU7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZSA9IFwiXCI7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZXMgPSBbXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5zdGF0ZSA9IFRFWFQ7XG4gICAgICAgICAgc3RhdGVPYmplY3QudGV4dCArPSBzdGF0ZU9iamVjdC5idWZmZXI7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgQ09ERTpcbiAgICAgICAgaWYgKGMgPj0gXCIwXCIgJiYgYyA8PSBcIjlcIikge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LmNvZGUgKz0gYztcbiAgICAgICAgfSBlbHNlIGlmIChjID09PSBcIjtcIikge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LmNvZGVzLnB1c2gobmV3IENvZGUoc3RhdGVPYmplY3QuY29kZSkpO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LmNvZGUgPSBcIlwiO1xuICAgICAgICB9IGVsc2UgaWYgKGMgPT09IFwibVwiKSB7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZSA9IHN0YXRlT2JqZWN0LmNvZGUgfHwgXCIwXCI7XG4gICAgICAgICAgZm9yIChjb25zdCBjb2RlIG9mIHN0YXRlT2JqZWN0LmNvZGVzKSB7XG4gICAgICAgICAgICB5aWVsZCBuZXcgU3Bhbihjb2RlLCBzdGF0ZU9iamVjdC50ZXh0KTtcbiAgICAgICAgICAgIHN0YXRlT2JqZWN0LnRleHQgPSBcIlwiO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHlpZWxkIG5ldyBTcGFuKG5ldyBDb2RlKHN0YXRlT2JqZWN0LmNvZGUpLCBzdGF0ZU9iamVjdC50ZXh0KTtcbiAgICAgICAgICBzdGF0ZU9iamVjdC50ZXh0ID0gXCJcIjtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5zdGF0ZSA9IFRFWFQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhdGVPYmplY3Quc3RhdGUgPSBURVhUO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnRleHQgKz0gc3RhdGVPYmplY3QuYnVmZmVyO1xuICAgICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBQYXJzZSBhbnNpIHRleHRcbiAqIEBwYXJhbSB7R2VuZXJhdG9yPFNwYW4sIHZvaWQsICo+fSByYXdTcGFuc0l0ZXJhdG9yIHJhdyBzcGFucyBpdGVyYXRvclxuICogQHJldHVybiB7R2VuZXJhdG9yPFNwYW4sIHZvaWQsICo+fVxuICovXG5mdW5jdGlvbiogcGFyc2VBbnNpKHJhd1NwYW5zSXRlcmF0b3IpIHtcbiAgICBsZXQgY29sb3IgPSBuZXcgQ29sb3IoKTtcbiAgICBsZXQgYmdDb2xvciA9IG5ldyBDb2xvcih0cnVlIC8qIGJhY2tncm91bmQgKi8pO1xuICAgIGxldCBicmlnaHRuZXNzID0gdW5kZWZpbmVkO1xuICAgIGxldCBzdHlsZXMgPSBuZXcgU2V0KCk7XG5cbiAgICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgICAgY29sb3IgPSBuZXcgQ29sb3IoKTtcbiAgICAgICAgYmdDb2xvciA9IG5ldyBDb2xvcih0cnVlIC8qIGJhY2tncm91bmQgKi8pO1xuICAgICAgICBicmlnaHRuZXNzID0gdW5kZWZpbmVkO1xuICAgICAgICBzdHlsZXMuY2xlYXIoKTtcbiAgICB9XG5cbiAgICByZXNldCgpO1xuXG4gICAgZm9yIChjb25zdCBzcGFuIG9mIHJhd1NwYW5zSXRlcmF0b3IpIHtcbiAgICAgICAgY29uc3QgYyA9IHNwYW4uY29kZTtcblxuICAgICAgICBjb25zdCBpbnZlcnRlZCA9IHN0eWxlcy5oYXMoXCJpbnZlcnNlXCIpO1xuICAgICAgICBjb25zdCB1bmRlcmxpbmUgPSBzdHlsZXMuaGFzKFwidW5kZXJsaW5lXCIpXG4gICAgICAgICAgICA/IFwidGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XCJcbiAgICAgICAgICAgIDogXCJcIjtcbiAgICAgICAgY29uc3QgaXRhbGljID0gc3R5bGVzLmhhcyhcIml0YWxpY1wiKSA/IFwiZm9udC1zdHlsZTogaXRhbGljO1wiIDogXCJcIjtcbiAgICAgICAgY29uc3QgYm9sZCA9IGJyaWdodG5lc3MgPT09IENvZGUuYnJpZ2h0ID8gXCJmb250LXdlaWdodDogYm9sZDtcIiA6IFwiXCI7XG5cbiAgICAgICAgY29uc3QgZm9yZUNvbG9yID0gY29sb3IuZGVmYXVsdEJyaWdodG5lc3MoYnJpZ2h0bmVzcyk7XG5cbiAgICAgICAgc3Bhbi5jc3MgPSBib2xkICsgaXRhbGljICsgdW5kZXJsaW5lICsgZm9yZUNvbG9yLmNzcyhpbnZlcnRlZCkgKyBiZ0NvbG9yLmNzcyhpbnZlcnRlZCk7XG4gICAgICAgIHNwYW4uYm9sZCA9ICEhYm9sZDtcbiAgICAgICAgc3Bhbi5jb2xvciA9IGZvcmVDb2xvci5jbGVhbjtcbiAgICAgICAgc3Bhbi5iZ0NvbG9yID0gYmdDb2xvci5jbGVhbjtcbiAgICAgICAgc3Bhbi5pbnZlcnNlID0gaW52ZXJ0ZWQ7XG4gICAgICAgIHNwYW4uaXRhbGljID0gISFpdGFsaWM7XG4gICAgICAgIHNwYW4udW5kZXJsaW5lID0gISF1bmRlcmxpbmU7XG4gICAgICAgIHNwYW4uYnJpZ2h0ID0gc3R5bGVzLmhhcyhcImJyaWdodFwiKTtcbiAgICAgICAgc3Bhbi5kaW0gPSBzdHlsZXMuaGFzKFwiZGltXCIpO1xuXG4gICAgICAgIGlmKHNwYW4udGV4dCAhPT0gXCJcIikge1xuICAgICAgICAgICAgeWllbGQgc3BhbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjLmlzQnJpZ2h0bmVzcykge1xuICAgICAgICAgICAgYnJpZ2h0bmVzcyA9IGMudmFsdWU7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzcGFuLmNvZGUudmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3Bhbi5jb2RlLnZhbHVlID09PSBDb2RlLnJlc2V0KSB7XG4gICAgICAgICAgICByZXNldCgpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHNwYW4uY29kZS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiY29sb3JcIjpcbiAgICAgICAgICAgIGNhc2UgXCJjb2xvckxpZ2h0XCI6XG4gICAgICAgICAgICAgICAgY29sb3IgPSBuZXcgQ29sb3IoZmFsc2UsIGMuc3VidHlwZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgXCJiZ0NvbG9yXCI6XG4gICAgICAgICAgICBjYXNlIFwiYmdDb2xvckxpZ2h0XCI6XG4gICAgICAgICAgICAgICAgYmdDb2xvciA9IG5ldyBDb2xvcih0cnVlLCBjLnN1YnR5cGUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIFwic3R5bGVcIjpcbiAgICAgICAgICAgICAgICBzdHlsZXMuYWRkKGMuc3VidHlwZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidW5zdHlsZVwiOlxuICAgICAgICAgICAgICAgIHN0eWxlcy5kZWxldGUoYy5zdWJ0eXBlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBBTlNJLWVzY2FwZWQgc3RyaW5nLlxuICovXG5jbGFzcyBDb2xvcnMge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocykge1xuICAgICAgICB0aGlzLnNwYW5zID0gcyA/IEFycmF5LmZyb20ocmF3UGFyc2UodHlwZW9mIHMgPT09ICdzdHJpbmcnID8gKCkgPT4gcyA6IHMpKSA6IFtdXG4gICAgfVxuXG4gICAgZ2V0IHN0ciAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNwYW5zLnJlZHVjZSAoKHN0ciwgcCkgPT4gc3RyICsgcC50ZXh0ICsgcC5jb2RlLnN0ciwgJycpXG4gICAgfVxuXG4gICAgZ2V0IHBhcnNlZCAoKSB7XG4gICAgICAgIGNvbnN0IG5ld0NvbG9ycyA9IG5ldyBDb2xvcnMoKTtcblxuICAgICAgICBuZXdDb2xvcnMuc3BhbnMgPSBBcnJheS5mcm9tKHBhcnNlQW5zaSh0aGlzLnNwYW5zKSk7XG5cbiAgICAgICAgcmV0dXJuIG5ld0NvbG9ycztcbiAgICB9XG5cbi8qICBPdXRwdXRzIHdpdGggQ2hyb21lIERldlRvb2xzLWNvbXBhdGlibGUgZm9ybWF0ICAgICAqL1xuXG4gICAgZ2V0IGFzQ2hyb21lQ29uc29sZUxvZ0FyZ3VtZW50cyAoKSB7XG5cbiAgICAgICAgY29uc3Qgc3BhbnMgPSB0aGlzLnBhcnNlZC5zcGFuc1xuXG4gICAgICAgIHJldHVybiBbc3BhbnMubWFwIChzID0+ICgnJWMnICsgcy50ZXh0KSkuam9pbiAoJycpLFxuICAgICAgICAgICAgIC4uLnNwYW5zLm1hcCAocyA9PiBzLmNzcyldXG4gICAgfVxuXG4gICAgZ2V0IGJyb3dzZXJDb25zb2xlQXJndW1lbnRzICgpIC8qIExFR0FDWSwgREVQUkVDQVRFRCAqLyB7IHJldHVybiB0aGlzLmFzQ2hyb21lQ29uc29sZUxvZ0FyZ3VtZW50cyB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBpbnN0YWxscyBTdHJpbmcgcHJvdG90eXBlIGV4dGVuc2lvbnNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlcXVpcmUgKCdhbnNpY29sb3InKS5uaWNlXG4gICAgICogY29uc29sZS5sb2cgKCdmb28nLmJyaWdodC5yZWQpXG4gICAgICovXG4gICAgc3RhdGljIGdldCBuaWNlICgpIHtcblxuICAgICAgICBDb2xvcnMubmFtZXMuZm9yRWFjaCAoayA9PiB7XG4gICAgICAgICAgICBpZiAoIShrIGluIFN0cmluZy5wcm90b3R5cGUpKSB7XG4gICAgICAgICAgICAgICAgTy5kZWZpbmVQcm9wZXJ0eSAoU3RyaW5nLnByb3RvdHlwZSwgaywgeyBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIENvbG9yc1trXSAodGhpcykgfSB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiBDb2xvcnNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBwYXJzZXMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlc1xuICAgICAqIEByZXR1cm4ge0NvbG9yc30gcGFyc2VkIHJlcHJlc2VudGF0aW9uLlxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZSAocykge1xuICAgICAgICByZXR1cm4gbmV3IENvbG9ycyAocykucGFyc2VkXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8ICgpID0+IHN0cmluZ30gcyBzdHJpbmcgb3IgYSBmdW5jdGlvbiByZXR1cm5pbmcgYSBzdHJpbmcgKGZvciBsYXJnZSBzdHJpbmdzIHlvdSBtYXkgd2FudCB0byB1c2UgYSBmdW5jdGlvbiB0byBhdm9pZCBtZW1vcnkgaXNzdWVzKVxuICAgICAqIEByZXR1cm5zIHtHZW5lcmF0b3I8U3Bhbiwgdm9pZCwgKj59IFNwYW5zIGl0ZXJhdG9yXG4gICAgICovXG4gICAgc3RhdGljIHBhcnNlSXRlcmF0b3Iocykge1xuICAgICAgICByZXR1cm4gcGFyc2VBbnNpKHJhd1BhcnNlKHR5cGVvZiBzID09PSBcInN0cmluZ1wiID8gKCkgPT4gcyA6IHMpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBzdHJpcHMgQU5TSSBjb2RlcyBmcm9tIGEgc3RyaW5nXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlcy5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IGNsZWFuIHN0cmluZy5cbiAgICAgKi9cbiAgICBzdGF0aWMgc3RyaXAgKHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSAoL1tcXHUwMDFiXFx1MDA5Yl1bWygpIzs/XSooPzpbMC05XXsxLDR9KD86O1swLTldezAsNH0pKik/WzAtOUEtUFJaY2YtbnFyeT0+PF0vZywgJycpIC8vIGhvcGUgVjggY2FjaGVzIHRoZSByZWdleHBcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBjaGVja3MgaWYgYSB2YWx1ZSBjb250YWlucyBBTlNJIGVzY2FwZSBjb2Rlc1xuICAgICAqIEBwYXJhbSB7YW55fSBzIHZhbHVlIHRvIGNoZWNrXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gaGFzIGNvZGVzXG4gICAgICovXG4gICAgIHN0YXRpYyBpc0VzY2FwZWQgKHMpIHtcbiAgICAgICAgcyA9IFN0cmluZyhzKVxuICAgICAgICByZXR1cm4gQ29sb3JzLnN0cmlwIChzKSAhPT0gcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNwYW5zID0gWy4uLmFuc2kucGFyc2UgKCdcXHUwMDFiWzdtXFx1MDAxYls3bWZvb1xcdTAwMWJbN21iYXJcXHUwMDFiWzI3bScpXVxuICAgICAqL1xuICAgIFtTeW1ib2wuaXRlcmF0b3JdICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3BhbnNbU3ltYm9sLml0ZXJhdG9yXSAoKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIFRoaXMgYWxsb3dzIGFuIGFsdGVybmF0aXZlIGltcG9ydCBzdHlsZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS94cGwvYW5zaWNvbG9yL2lzc3Vlcy83I2lzc3VlY29tbWVudC01Nzg5MjM1NzhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGltcG9ydCB7IGFuc2ljb2xvciwgUGFyc2VkU3BhbiB9IGZyb20gJ2Fuc2ljb2xvcidcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IGFuc2ljb2xvciAoKSB7XG4gICAgICAgIHJldHVybiBDb2xvcnNcbiAgICB9XG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuYXNzaWduU3RyaW5nV3JhcHBpbmdBUEkgKENvbG9ycywgc3RyID0+IHN0cilcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5Db2xvcnMubmFtZXMgPSBzdHJpbmdXcmFwcGluZ01ldGhvZHMubWFwICgoW2tdKSA9PiBrKVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbkNvbG9ycy5yZ2IgPSB7XG5cbiAgICBibGFjazogICAgICAgIFswLCAgICAgMCwgICAwXSxcbiAgICBkYXJrR3JheTogICAgIFsxMDAsIDEwMCwgMTAwXSxcbiAgICBsaWdodEdyYXk6ICAgIFsyMDAsIDIwMCwgMjAwXSxcbiAgICB3aGl0ZTogICAgICAgIFsyNTUsIDI1NSwgMjU1XSxcblxuICAgIHJlZDogICAgICAgICAgWzIwNCwgICAwLCAgIDBdLFxuICAgIGxpZ2h0UmVkOiAgICAgWzI1NSwgIDUxLCAgIDBdLFxuXG4gICAgZ3JlZW46ICAgICAgICBbMCwgICAyMDQsICAgMF0sXG4gICAgbGlnaHRHcmVlbjogICBbNTEsICAyMDQsICA1MV0sXG5cbiAgICB5ZWxsb3c6ICAgICAgIFsyMDQsIDEwMiwgICAwXSxcbiAgICBsaWdodFllbGxvdzogIFsyNTUsIDE1MywgIDUxXSxcblxuICAgIGJsdWU6ICAgICAgICAgWzAsICAgICAwLCAyNTVdLFxuICAgIGxpZ2h0Qmx1ZTogICAgWzI2LCAgMTQwLCAyNTVdLFxuXG4gICAgbWFnZW50YTogICAgICBbMjA0LCAgIDAsIDIwNF0sXG4gICAgbGlnaHRNYWdlbnRhOiBbMjU1LCAgIDAsIDI1NV0sXG5cbiAgICBjeWFuOiAgICAgICAgIFswLCAgIDE1MywgMjU1XSxcbiAgICBsaWdodEN5YW46ICAgIFswLCAgIDIwNCwgMjU1XSxcbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbG9yc1xuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbiJdfQ==