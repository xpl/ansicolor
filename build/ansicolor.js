"use strict";

/*  ------------------------------------------------------------------------ */

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _marked = /*#__PURE__*/regeneratorRuntime.mark(rawParse),
    _marked2 = /*#__PURE__*/regeneratorRuntime.mark(processChunk),
    _marked3 = /*#__PURE__*/regeneratorRuntime.mark(parseAnsi);

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var O = Object;

/*  See https://misc.flogisoft.com/bash/tip_colors_and_formatting
    ------------------------------------------------------------------------ */

var colorCodes = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'lightGray', '', 'default'],
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

};
var Color = function () {
    function Color(background, name, brightness) {
        _classCallCheck(this, Color);

        this.background = background;
        this.name = name;
        this.brightness = brightness;
    }

    _createClass(Color, [{
        key: 'defaultBrightness',
        value: function defaultBrightness(value) {

            return new Color(this.background, this.name, this.brightness || value);
        }
    }, {
        key: 'css',
        value: function css(inverted) {

            var color = inverted ? this.inverse : this;

            var rgbName = color.brightness === Code.bright && asBright[color.name] || color.name;

            var prop = color.background ? 'background:' : 'color:',
                rgb = Colors.rgb[rgbName],
                alpha = this.brightness === Code.dim ? 0.5 : 1;

            return rgb ? prop + 'rgba(' + [].concat(_toConsumableArray(rgb), [alpha]).join(',') + ');' : !color.background && alpha < 1 ? 'color:rgba(0,0,0,0.5);' : ''; // Chrome does not support 'opacity' property...
        }
    }, {
        key: 'inverse',
        get: function get() {
            return new Color(!this.background, this.name || (this.background ? 'black' : 'white'), this.brightness);
        }
    }, {
        key: 'clean',
        get: function get() {
            var name = this.name === "default" ? "" : this.name;
            var bright = this.brightness === Code.bright;
            var dim = this.brightness === Code.dim;

            if (!name && !bright && !dim) {
                return undefined;
            }

            return {
                name: name,
                bright: bright,
                dim: dim
            };
        }
    }]);

    return Color;
}();

/*  ------------------------------------------------------------------------ */

var Code = function () {
    function Code(n) {
        _classCallCheck(this, Code);

        var value = undefined;
        var type = undefined;
        var subtype = undefined;
        var str = "";
        var isBrightness = false;

        if (n !== undefined) {
            value = Number(n);
            type = types[Math.floor(value / 10)];
            subtype = subtypes[type][value % 10];
            str = '\x1B[' + value + "m";
            isBrightness = value === Code.noBrightness || value === Code.bright || value === Code.dim;
        }

        this.value = value;
        this.type = type;
        this.subtype = subtype;
        this.str = str;
        this.isBrightness = isBrightness;
    }

    _createClass(Code, null, [{
        key: 'str',
        value: function str(x) {
            if (x === undefined) return "";
            return '\x1B[' + Number(x) + "m";
        }
    }]);

    return Code;
}();

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

var replaceAll = function replaceAll(str, a, b) {
    return str.split(a).join(b);
};

/*  ANSI brightness codes do not overlap, e.g. "{bright}{dim}foo" will be rendered bright (not dim).
    So we fix it by adding brightness canceling before each brightness code, so the former example gets
    converted to "{noBrightness}{bright}{noBrightness}{dim}foo" – this way it gets rendered as expected.
 */

var denormalizeBrightness = function denormalizeBrightness(s) {
    return s.replace(/(\u001b\[(1|2)m)/g, '\x1B[22m$1');
};
var normalizeBrightness = function normalizeBrightness(s) {
    return s.replace(/\u001b\[22m(\u001b\[(1|2)m)/g, '$1');
};

var wrap = function wrap(x, openCode, closeCode) {

    var open = Code.str(openCode),
        close = Code.str(closeCode);

    return String(x).split('\n').map(function (line) {
        return denormalizeBrightness(open + replaceAll(normalizeBrightness(line), close, open) + close);
    }).join('\n');
};

/*  ------------------------------------------------------------------------ */

var camel = function camel(a, b) {
    return a + b.charAt(0).toUpperCase() + b.slice(1);
};

var stringWrappingMethods = function () {
    return [].concat(_toConsumableArray(colorCodes.map(function (k, i) {
        return !k ? [] : [// color methods

        [k, 30 + i, Code.noColor], [camel('bg', k), 40 + i, Code.noBgColor]];
    })), _toConsumableArray(colorCodesLight.map(function (k, i) {
        return !k ? [] : [// light color methods

        [k, 90 + i, Code.noColor], [camel('bg', k), 100 + i, Code.noBgColor]];
    })), _toConsumableArray(['', 'BrightRed', 'BrightGreen', 'BrightYellow', 'BrightBlue', 'BrightMagenta', 'BrightCyan'].map(function (k, i) {
        return !k ? [] : [['bg' + k, 100 + i, Code.noBgColor]];
    })), _toConsumableArray(styleCodes.map(function (k, i) {
        return !k ? [] : [// style methods

        [k, i, k === 'bright' || k === 'dim' ? Code.noBrightness : 20 + i]];
    }))).reduce(function (a, b) {
        return a.concat(b);
    });
}();

/*  ------------------------------------------------------------------------ */

var assignStringWrappingAPI = function assignStringWrappingAPI(target) {
    var wrapBefore = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : target;
    return stringWrappingMethods.reduce(function (memo, _ref) {
        var _ref2 = _slicedToArray(_ref, 3),
            k = _ref2[0],
            open = _ref2[1],
            close = _ref2[2];

        return O.defineProperty(memo, k, {
            get: function get() {
                return assignStringWrappingAPI(function (str) {
                    return wrapBefore(wrap(str, open, close));
                });
            }
        });
    }, target);
};

/*  ------------------------------------------------------------------------ */

var TEXT = 0,
    BRACKET = 1,
    CODE = 2;

var Span = function Span(code, text) {
    _classCallCheck(this, Span);

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
};

// getString as function instead of string to allow garbage collection


function rawParse(getString) {
    var stateObject, ONE_MB, chunks, i, chunk;
    return regeneratorRuntime.wrap(function rawParse$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    stateObject = {
                        state: TEXT,
                        buffer: "",
                        text: "",
                        code: "",
                        codes: []
                    };
                    ONE_MB = 1048576;

                    // Instead of holding the reference to the string we split into chunks of 1MB
                    // and after processing is finished we can remove the reference so it can be GCed

                    chunks = splitStringToChunksOfSize(getString(), ONE_MB);
                    i = 0;

                case 4:
                    if (!(i < chunks.length)) {
                        _context.next = 11;
                        break;
                    }

                    chunk = chunks[i];
                    // Free memory for the previous chunk

                    chunks[i] = undefined;
                    return _context.delegateYield(processChunk(chunk, stateObject), 't0', 8);

                case 8:
                    i++;
                    _context.next = 4;
                    break;

                case 11:

                    if (stateObject.state !== TEXT) stateObject.text += stateObject.buffer;

                    if (!stateObject.text) {
                        _context.next = 15;
                        break;
                    }

                    _context.next = 15;
                    return new Span(new Code(), stateObject.text);

                case 15:
                case 'end':
                    return _context.stop();
            }
        }
    }, _marked, this);
}

function splitStringToChunksOfSize(str, chunkSize) {
    var chunks = [];
    var chunksLength = Math.ceil(str.length / chunkSize);

    for (var i = 0, o = 0; i < chunksLength; ++i, o += chunkSize) {
        chunks.push(str.substring(o, o + chunkSize));
    }

    return chunks;
}

function processChunk(chunk, stateObject) {
    var chars, charsLength, i, c, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, code;

    return regeneratorRuntime.wrap(function processChunk$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    chars = chunk;
                    charsLength = chunk.length;
                    i = 0;

                case 3:
                    if (!(i < charsLength)) {
                        _context2.next = 62;
                        break;
                    }

                    c = chars[i];


                    stateObject.buffer += c;

                    _context2.t0 = stateObject.state;
                    _context2.next = _context2.t0 === TEXT ? 9 : _context2.t0 === BRACKET ? 11 : _context2.t0 === CODE ? 13 : 59;
                    break;

                case 9:
                    if (c === '\x1B') {
                        stateObject.state = BRACKET;
                        stateObject.buffer = c;
                    } else {
                        stateObject.text += c;
                    }
                    return _context2.abrupt('break', 59);

                case 11:
                    if (c === "[") {
                        stateObject.state = CODE;
                        stateObject.code = "";
                        stateObject.codes = [];
                    } else {
                        stateObject.state = TEXT;
                        stateObject.text += stateObject.buffer;
                    }
                    return _context2.abrupt('break', 59);

                case 13:
                    if (!(c >= "0" && c <= "9")) {
                        _context2.next = 17;
                        break;
                    }

                    stateObject.code += c;
                    _context2.next = 59;
                    break;

                case 17:
                    if (!(c === ";")) {
                        _context2.next = 22;
                        break;
                    }

                    stateObject.codes.push(new Code(stateObject.code));
                    stateObject.code = "";
                    _context2.next = 59;
                    break;

                case 22:
                    if (!(c === "m")) {
                        _context2.next = 57;
                        break;
                    }

                    stateObject.code = stateObject.code || "0";
                    _iteratorNormalCompletion = true;
                    _didIteratorError = false;
                    _iteratorError = undefined;
                    _context2.prev = 27;
                    _iterator = stateObject.codes[Symbol.iterator]();

                case 29:
                    if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                        _context2.next = 37;
                        break;
                    }

                    code = _step.value;
                    _context2.next = 33;
                    return new Span(code, stateObject.text);

                case 33:
                    stateObject.text = "";

                case 34:
                    _iteratorNormalCompletion = true;
                    _context2.next = 29;
                    break;

                case 37:
                    _context2.next = 43;
                    break;

                case 39:
                    _context2.prev = 39;
                    _context2.t1 = _context2['catch'](27);
                    _didIteratorError = true;
                    _iteratorError = _context2.t1;

                case 43:
                    _context2.prev = 43;
                    _context2.prev = 44;

                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }

                case 46:
                    _context2.prev = 46;

                    if (!_didIteratorError) {
                        _context2.next = 49;
                        break;
                    }

                    throw _iteratorError;

                case 49:
                    return _context2.finish(46);

                case 50:
                    return _context2.finish(43);

                case 51:
                    _context2.next = 53;
                    return new Span(new Code(stateObject.code), stateObject.text);

                case 53:
                    stateObject.text = "";
                    stateObject.state = TEXT;
                    _context2.next = 59;
                    break;

                case 57:
                    stateObject.state = TEXT;
                    stateObject.text += stateObject.buffer;

                case 59:
                    i++;
                    _context2.next = 3;
                    break;

                case 62:
                case 'end':
                    return _context2.stop();
            }
        }
    }, _marked2, this, [[27, 39, 43, 51], [44,, 46, 50]]);
}

/**
 * Parse ansi text
 * @param {Generator<Span, void, *>} rawSpansIterator raw spans iterator
 * @return {Generator<Span, void, *>}
 */
function parseAnsi(rawSpansIterator) {
    var color, bgColor, brightness, styles, reset, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, span, c, inverted, underline, italic, bold, foreColor;

    return regeneratorRuntime.wrap(function parseAnsi$(_context3) {
        while (1) {
            switch (_context3.prev = _context3.next) {
                case 0:
                    reset = function reset() {
                        color = new Color();
                        bgColor = new Color(true /* background */);
                        brightness = undefined;
                        styles.clear();
                    };

                    color = new Color();
                    bgColor = new Color(true /* background */);
                    brightness = undefined;
                    styles = new Set();


                    reset();

                    _iteratorNormalCompletion2 = true;
                    _didIteratorError2 = false;
                    _iteratorError2 = undefined;
                    _context3.prev = 9;
                    _iterator2 = rawSpansIterator[Symbol.iterator]();

                case 11:
                    if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                        _context3.next = 52;
                        break;
                    }

                    span = _step2.value;
                    c = span.code;
                    inverted = styles.has("inverse");
                    underline = styles.has("underline") ? "text-decoration: underline;" : "";
                    italic = styles.has("italic") ? "font-style: italic;" : "";
                    bold = brightness === Code.bright ? "font-weight: bold;" : "";
                    foreColor = color.defaultBrightness(brightness);


                    span.css = bold + italic + underline + foreColor.css(inverted) + bgColor.css(inverted);
                    span.bold = !!bold;
                    span.color = foreColor.clean;
                    span.bgColor = bgColor.clean;
                    span.inverse = inverted;
                    span.italic = !!italic;
                    span.underline = !!underline;
                    span.bright = styles.has("bright");
                    span.dim = styles.has("dim");

                    _context3.next = 30;
                    return span;

                case 30:
                    if (!c.isBrightness) {
                        _context3.next = 33;
                        break;
                    }

                    brightness = c.value;
                    return _context3.abrupt('continue', 49);

                case 33:
                    if (!(span.code.value === undefined)) {
                        _context3.next = 35;
                        break;
                    }

                    return _context3.abrupt('continue', 49);

                case 35:
                    if (!(span.code.value === Code.reset)) {
                        _context3.next = 38;
                        break;
                    }

                    reset();
                    return _context3.abrupt('continue', 49);

                case 38:
                    _context3.t0 = span.code.type;
                    _context3.next = _context3.t0 === "color" ? 41 : _context3.t0 === "colorLight" ? 41 : _context3.t0 === "bgColor" ? 43 : _context3.t0 === "bgColorLight" ? 43 : _context3.t0 === "style" ? 45 : _context3.t0 === "unstyle" ? 47 : 49;
                    break;

                case 41:
                    color = new Color(false, c.subtype);
                    return _context3.abrupt('break', 49);

                case 43:
                    bgColor = new Color(true, c.subtype);
                    return _context3.abrupt('break', 49);

                case 45:
                    styles.add(c.subtype);
                    return _context3.abrupt('break', 49);

                case 47:
                    styles.delete(c.subtype);
                    return _context3.abrupt('break', 49);

                case 49:
                    _iteratorNormalCompletion2 = true;
                    _context3.next = 11;
                    break;

                case 52:
                    _context3.next = 58;
                    break;

                case 54:
                    _context3.prev = 54;
                    _context3.t1 = _context3['catch'](9);
                    _didIteratorError2 = true;
                    _iteratorError2 = _context3.t1;

                case 58:
                    _context3.prev = 58;
                    _context3.prev = 59;

                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }

                case 61:
                    _context3.prev = 61;

                    if (!_didIteratorError2) {
                        _context3.next = 64;
                        break;
                    }

                    throw _iteratorError2;

                case 64:
                    return _context3.finish(61);

                case 65:
                    return _context3.finish(58);

                case 66:
                case 'end':
                    return _context3.stop();
            }
        }
    }, _marked3, this, [[9, 54, 58, 66], [59,, 61, 65]]);
}

/*  ------------------------------------------------------------------------ */

/**
 * Represents an ANSI-escaped string.
 */

var Colors = function () {

    /**
     * @param {string} s a string containing ANSI escape codes.
     */
    function Colors(s) {
        _classCallCheck(this, Colors);

        this.spans = s ? Array.from(rawParse(typeof s === 'string' ? function () {
            return s;
        } : s)) : [];
    }

    _createClass(Colors, [{
        key: Symbol.iterator,


        /**
         * @example
         * const spans = [...ansi.parse ('\u001b[7m\u001b[7mfoo\u001b[7mbar\u001b[27m')]
         */
        value: function value() {
            return this.spans[Symbol.iterator]();
        }

        /**
         * @desc This allows an alternative import style, see https://github.com/xpl/ansicolor/issues/7#issuecomment-578923578
         * @example
         * import { ansicolor, ParsedSpan } from 'ansicolor'
         */

    }, {
        key: 'str',
        get: function get() {
            return this.spans.reduce(function (str, p) {
                return str + p.text + p.code.str;
            }, '');
        }
    }, {
        key: 'parsed',
        get: function get() {
            var newColors = new Colors();

            newColors.spans = Array.from(parseAnsi(this.spans));

            return newColors;
        }

        /*  Outputs with Chrome DevTools-compatible format     */

    }, {
        key: 'asChromeConsoleLogArguments',
        get: function get() {

            var spans = this.parsed.spans;

            return [spans.map(function (s) {
                return '%c' + s.text;
            }).join('')].concat(_toConsumableArray(spans.map(function (s) {
                return s.css;
            })));
        }
    }, {
        key: 'browserConsoleArguments',
        get: function get() /* LEGACY, DEPRECATED */{
            return this.asChromeConsoleLogArguments;
        }

        /**
         * @desc installs String prototype extensions
         * @example
         * require ('ansicolor').nice
         * console.log ('foo'.bright.red)
         */

    }], [{
        key: 'parse',


        /**
         * @desc parses a string containing ANSI escape codes
         * @return {Colors} parsed representation.
         */
        value: function parse(s) {
            return new Colors(s).parsed;
        }

        /**
         *
         * @param {string | () => string} s string or a function returning a string (for large strings you may want to use a function to avoid memory issues)
         * @returns {Generator<Span, void, *>} Spans iterator
         */

    }, {
        key: 'parseIterator',
        value: function parseIterator(s) {
            return parseAnsi(rawParse(typeof s === "string" ? function () {
                return s;
            } : s));
        }

        /**
         * @desc strips ANSI codes from a string
         * @param {string} s a string containing ANSI escape codes.
         * @return {string} clean string.
         */

    }, {
        key: 'strip',
        value: function strip(s) {
            return s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g, ''); // hope V8 caches the regexp
        }

        /**
         * @desc checks if a value contains ANSI escape codes
         * @param {any} s value to check
         * @return {boolean} has codes
         */

    }, {
        key: 'isEscaped',
        value: function isEscaped(s) {
            s = String(s);
            return Colors.strip(s) !== s;
        }
    }, {
        key: 'nice',
        get: function get() {

            Colors.names.forEach(function (k) {
                if (!(k in String.prototype)) {
                    O.defineProperty(String.prototype, k, { get: function get() {
                            return Colors[k](this);
                        } });
                }
            });

            return Colors;
        }
    }, {
        key: 'ansicolor',
        get: function get() {
            return Colors;
        }
    }]);

    return Colors;
}();

/*  ------------------------------------------------------------------------ */

assignStringWrappingAPI(Colors, function (str) {
    return str;
});

/*  ------------------------------------------------------------------------ */

Colors.names = stringWrappingMethods.map(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 1),
        k = _ref4[0];

    return k;
});

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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QXVCVCxlQUFjLENBQUMsQ0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYOztBQUdsQjs7QUExQmEsQ0FBYixDQTRCQSxPQUFPLE9BQVAsR0FBaUIsTUFBakI7O0FBRUEiLCJmaWxlIjoiYW5zaWNvbG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgTyA9IE9iamVjdFxuXG4vKiAgU2VlIGh0dHBzOi8vbWlzYy5mbG9naXNvZnQuY29tL2Jhc2gvdGlwX2NvbG9yc19hbmRfZm9ybWF0dGluZ1xuICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBjb2xvckNvZGVzICAgICAgPSBbICAgJ2JsYWNrJywgICAgICAncmVkJywgICAgICAnZ3JlZW4nLCAgICAgICd5ZWxsb3cnLCAgICAgICdibHVlJywgICAgICAnbWFnZW50YScsICAgICAgJ2N5YW4nLCAnbGlnaHRHcmF5JywgJycsICdkZWZhdWx0J11cbiAgICAsIGNvbG9yQ29kZXNMaWdodCA9IFsnZGFya0dyYXknLCAnbGlnaHRSZWQnLCAnbGlnaHRHcmVlbicsICdsaWdodFllbGxvdycsICdsaWdodEJsdWUnLCAnbGlnaHRNYWdlbnRhJywgJ2xpZ2h0Q3lhbicsICd3aGl0ZScsICcnXVxuXG4gICAgLCBzdHlsZUNvZGVzID0gWycnLCAnYnJpZ2h0JywgJ2RpbScsICdpdGFsaWMnLCAndW5kZXJsaW5lJywgJycsICcnLCAnaW52ZXJzZSddXG5cbiAgICAsIGFzQnJpZ2h0ID0geyAncmVkJzogICAgICAgJ2xpZ2h0UmVkJyxcbiAgICAgICAgICAgICAgICAgICAnZ3JlZW4nOiAgICAgJ2xpZ2h0R3JlZW4nLFxuICAgICAgICAgICAgICAgICAgICd5ZWxsb3cnOiAgICAnbGlnaHRZZWxsb3cnLFxuICAgICAgICAgICAgICAgICAgICdibHVlJzogICAgICAnbGlnaHRCbHVlJyxcbiAgICAgICAgICAgICAgICAgICAnbWFnZW50YSc6ICAgJ2xpZ2h0TWFnZW50YScsXG4gICAgICAgICAgICAgICAgICAgJ2N5YW4nOiAgICAgICdsaWdodEN5YW4nLFxuICAgICAgICAgICAgICAgICAgICdibGFjayc6ICAgICAnZGFya0dyYXknLFxuICAgICAgICAgICAgICAgICAgICdsaWdodEdyYXknOiAnd2hpdGUnIH1cblxuICAgICwgdHlwZXMgPSB7IDA6ICAnc3R5bGUnLFxuICAgICAgICAgICAgICAgIDI6ICAndW5zdHlsZScsXG4gICAgICAgICAgICAgICAgMzogICdjb2xvcicsXG4gICAgICAgICAgICAgICAgOTogICdjb2xvckxpZ2h0JyxcbiAgICAgICAgICAgICAgICA0OiAgJ2JnQ29sb3InLFxuICAgICAgICAgICAgICAgIDEwOiAnYmdDb2xvckxpZ2h0JyB9XG5cbiAgICAsIHN1YnR5cGVzID0geyAgY29sb3I6ICAgICAgICAgY29sb3JDb2RlcyxcbiAgICAgICAgICAgICAgICAgICAgY29sb3JMaWdodDogICAgY29sb3JDb2Rlc0xpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBiZ0NvbG9yOiAgICAgICBjb2xvckNvZGVzLFxuICAgICAgICAgICAgICAgICAgICBiZ0NvbG9yTGlnaHQ6ICBjb2xvckNvZGVzTGlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiAgICAgICAgIHN0eWxlQ29kZXMsXG4gICAgICAgICAgICAgICAgICAgIHVuc3R5bGU6ICAgICAgIHN0eWxlQ29kZXMgICAgfVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNsYXNzIENvbG9yIHtcblxuICAgIGNvbnN0cnVjdG9yIChiYWNrZ3JvdW5kLCBuYW1lLCBicmlnaHRuZXNzKSB7XG5cbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kID0gYmFja2dyb3VuZFxuICAgICAgICB0aGlzLm5hbWUgICAgICAgPSBuYW1lXG4gICAgICAgIHRoaXMuYnJpZ2h0bmVzcyA9IGJyaWdodG5lc3NcbiAgICB9XG5cbiAgICBnZXQgaW52ZXJzZSAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29sb3IgKCF0aGlzLmJhY2tncm91bmQsIHRoaXMubmFtZSB8fCAodGhpcy5iYWNrZ3JvdW5kID8gJ2JsYWNrJyA6ICd3aGl0ZScpLCB0aGlzLmJyaWdodG5lc3MpXG4gICAgfVxuXG4gICAgZ2V0IGNsZWFuKCkge1xuICAgICAgY29uc3QgbmFtZSA9IHRoaXMubmFtZSA9PT0gXCJkZWZhdWx0XCIgPyBcIlwiIDogdGhpcy5uYW1lO1xuICAgICAgY29uc3QgYnJpZ2h0ID0gdGhpcy5icmlnaHRuZXNzID09PSBDb2RlLmJyaWdodDtcbiAgICAgIGNvbnN0IGRpbSA9IHRoaXMuYnJpZ2h0bmVzcyA9PT0gQ29kZS5kaW07XG5cbiAgICAgIGlmICghbmFtZSAmJiAhYnJpZ2h0ICYmICFkaW0pIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgYnJpZ2h0LFxuICAgICAgICBkaW0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGRlZmF1bHRCcmlnaHRuZXNzICh2YWx1ZSkge1xuXG4gICAgICAgIHJldHVybiBuZXcgQ29sb3IgKHRoaXMuYmFja2dyb3VuZCwgdGhpcy5uYW1lLCB0aGlzLmJyaWdodG5lc3MgfHwgdmFsdWUpXG4gICAgfVxuXG4gICAgY3NzIChpbnZlcnRlZCkge1xuXG4gICAgICAgIGNvbnN0IGNvbG9yID0gaW52ZXJ0ZWQgPyB0aGlzLmludmVyc2UgOiB0aGlzXG5cbiAgICAgICAgY29uc3QgcmdiTmFtZSA9ICgoY29sb3IuYnJpZ2h0bmVzcyA9PT0gQ29kZS5icmlnaHQpICYmIGFzQnJpZ2h0W2NvbG9yLm5hbWVdKSB8fCBjb2xvci5uYW1lXG5cbiAgICAgICAgY29uc3QgcHJvcCA9IChjb2xvci5iYWNrZ3JvdW5kID8gJ2JhY2tncm91bmQ6JyA6ICdjb2xvcjonKVxuICAgICAgICAgICAgLCByZ2IgID0gQ29sb3JzLnJnYltyZ2JOYW1lXVxuICAgICAgICAgICAgLCBhbHBoYSA9ICh0aGlzLmJyaWdodG5lc3MgPT09IENvZGUuZGltKSA/IDAuNSA6IDFcblxuICAgICAgICByZXR1cm4gcmdiXG4gICAgICAgICAgICAgICAgPyAocHJvcCArICdyZ2JhKCcgKyBbLi4ucmdiLCBhbHBoYV0uam9pbiAoJywnKSArICcpOycpXG4gICAgICAgICAgICAgICAgOiAoKCFjb2xvci5iYWNrZ3JvdW5kICYmIChhbHBoYSA8IDEpKSA/ICdjb2xvcjpyZ2JhKDAsMCwwLDAuNSk7JyA6ICcnKSAvLyBDaHJvbWUgZG9lcyBub3Qgc3VwcG9ydCAnb3BhY2l0eScgcHJvcGVydHkuLi5cbiAgICB9XG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY2xhc3MgQ29kZSB7XG5cbiAgY29uc3RydWN0b3Iobikge1xuICAgIGxldCB2YWx1ZSA9IHVuZGVmaW5lZDtcbiAgICBsZXQgdHlwZSA9IHVuZGVmaW5lZDtcbiAgICBsZXQgc3VidHlwZSA9IHVuZGVmaW5lZDtcbiAgICBsZXQgc3RyID0gXCJcIjtcbiAgICBsZXQgaXNCcmlnaHRuZXNzID0gZmFsc2U7XG5cbiAgICBpZiAobiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB2YWx1ZSA9IE51bWJlcihuKTtcbiAgICAgIHR5cGUgPSB0eXBlc1tNYXRoLmZsb29yKHZhbHVlIC8gMTApXTtcbiAgICAgIHN1YnR5cGUgPSBzdWJ0eXBlc1t0eXBlXVt2YWx1ZSAlIDEwXTtcbiAgICAgIHN0ciA9IFwiXFx1MDAxYltcIiArIHZhbHVlICsgXCJtXCI7XG4gICAgICBpc0JyaWdodG5lc3MgPVxuICAgICAgICB2YWx1ZSA9PT0gQ29kZS5ub0JyaWdodG5lc3MgfHxcbiAgICAgICAgdmFsdWUgPT09IENvZGUuYnJpZ2h0IHx8XG4gICAgICAgIHZhbHVlID09PSBDb2RlLmRpbTtcbiAgICB9XG5cbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLnN1YnR5cGUgPSBzdWJ0eXBlO1xuICAgIHRoaXMuc3RyID0gc3RyO1xuICAgIHRoaXMuaXNCcmlnaHRuZXNzID0gaXNCcmlnaHRuZXNzO1xuICB9XG5cbiAgc3RhdGljIHN0cih4KSB7XG4gICAgaWYoeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gXCJcIjtcbiAgICByZXR1cm4gXCJcXHUwMDFiW1wiICsgTnVtYmVyKHgpICsgXCJtXCI7XG4gIH1cbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5PLmFzc2lnbiAoQ29kZSwge1xuXG4gICAgcmVzZXQ6ICAgICAgICAwLFxuICAgIGJyaWdodDogICAgICAgMSxcbiAgICBkaW06ICAgICAgICAgIDIsXG4gICAgaW52ZXJzZTogICAgICA3LFxuICAgIG5vQnJpZ2h0bmVzczogMjIsXG4gICAgbm9JdGFsaWM6ICAgICAyMyxcbiAgICBub1VuZGVybGluZTogIDI0LFxuICAgIG5vSW52ZXJzZTogICAgMjcsXG4gICAgbm9Db2xvcjogICAgICAzOSxcbiAgICBub0JnQ29sb3I6ICAgIDQ5XG59KVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IHJlcGxhY2VBbGwgPSAoc3RyLCBhLCBiKSA9PiBzdHIuc3BsaXQgKGEpLmpvaW4gKGIpXG5cbi8qICBBTlNJIGJyaWdodG5lc3MgY29kZXMgZG8gbm90IG92ZXJsYXAsIGUuZy4gXCJ7YnJpZ2h0fXtkaW19Zm9vXCIgd2lsbCBiZSByZW5kZXJlZCBicmlnaHQgKG5vdCBkaW0pLlxuICAgIFNvIHdlIGZpeCBpdCBieSBhZGRpbmcgYnJpZ2h0bmVzcyBjYW5jZWxpbmcgYmVmb3JlIGVhY2ggYnJpZ2h0bmVzcyBjb2RlLCBzbyB0aGUgZm9ybWVyIGV4YW1wbGUgZ2V0c1xuICAgIGNvbnZlcnRlZCB0byBcIntub0JyaWdodG5lc3N9e2JyaWdodH17bm9CcmlnaHRuZXNzfXtkaW19Zm9vXCIg4oCTIHRoaXMgd2F5IGl0IGdldHMgcmVuZGVyZWQgYXMgZXhwZWN0ZWQuXG4gKi9cblxuY29uc3QgZGVub3JtYWxpemVCcmlnaHRuZXNzID0gcyA9PiBzLnJlcGxhY2UgKC8oXFx1MDAxYlxcWygxfDIpbSkvZywgJ1xcdTAwMWJbMjJtJDEnKVxuY29uc3Qgbm9ybWFsaXplQnJpZ2h0bmVzcyA9IHMgPT4gcy5yZXBsYWNlICgvXFx1MDAxYlxcWzIybShcXHUwMDFiXFxbKDF8MiltKS9nLCAnJDEnKVxuXG5jb25zdCB3cmFwID0gKHgsIG9wZW5Db2RlLCBjbG9zZUNvZGUpID0+IHtcblxuICAgIGNvbnN0IG9wZW4gID0gQ29kZS5zdHIgKG9wZW5Db2RlKSxcbiAgICAgICAgICBjbG9zZSA9IENvZGUuc3RyIChjbG9zZUNvZGUpXG5cbiAgICByZXR1cm4gU3RyaW5nICh4KVxuICAgICAgICAgICAgICAgIC5zcGxpdCAoJ1xcbicpXG4gICAgICAgICAgICAgICAgLm1hcCAobGluZSA9PiBkZW5vcm1hbGl6ZUJyaWdodG5lc3MgKG9wZW4gKyByZXBsYWNlQWxsIChub3JtYWxpemVCcmlnaHRuZXNzIChsaW5lKSwgY2xvc2UsIG9wZW4pICsgY2xvc2UpKVxuICAgICAgICAgICAgICAgIC5qb2luICgnXFxuJylcbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBjYW1lbCA9IChhLCBiKSA9PiBhICsgYi5jaGFyQXQgKDApLnRvVXBwZXJDYXNlICgpICsgYi5zbGljZSAoMSlcblxuXG5jb25zdCBzdHJpbmdXcmFwcGluZ01ldGhvZHMgPSAoKCkgPT4gW1xuXG4gICAgICAgIC4uLmNvbG9yQ29kZXMubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFsgLy8gY29sb3IgbWV0aG9kc1xuXG4gICAgICAgICAgICBbaywgICAgICAgICAgICAgICAzMCArIGksIENvZGUubm9Db2xvcl0sXG4gICAgICAgICAgICBbY2FtZWwgKCdiZycsIGspLCA0MCArIGksIENvZGUubm9CZ0NvbG9yXSxcbiAgICAgICAgXSksXG5cbiAgICAgICAgLi4uY29sb3JDb2Rlc0xpZ2h0Lm1hcCAoKGssIGkpID0+ICFrID8gW10gOiBbIC8vIGxpZ2h0IGNvbG9yIG1ldGhvZHNcblxuICAgICAgICAgICAgW2ssICAgICAgICAgICAgICAgIDkwICsgaSwgQ29kZS5ub0NvbG9yXSxcbiAgICAgICAgICAgIFtjYW1lbCAoJ2JnJywgayksIDEwMCArIGksIENvZGUubm9CZ0NvbG9yXSxcbiAgICAgICAgXSksXG5cbiAgICAgICAgLyogVEhJUyBPTkUgSVMgRk9SIEJBQ0tXQVJEUyBDT01QQVRJQklMSVRZIFdJVEggUFJFVklPVVMgVkVSU0lPTlMgKGhhZCAnYnJpZ2h0JyBpbnN0ZWFkIG9mICdsaWdodCcgZm9yIGJhY2tncm91bmRzKVxuICAgICAgICAgKi9cbiAgICAgICAgLi4uWycnLCAnQnJpZ2h0UmVkJywgJ0JyaWdodEdyZWVuJywgJ0JyaWdodFllbGxvdycsICdCcmlnaHRCbHVlJywgJ0JyaWdodE1hZ2VudGEnLCAnQnJpZ2h0Q3lhbiddLm1hcCAoKGssIGkpID0+ICFrID8gW10gOiBbXG5cbiAgICAgICAgICAgIFsnYmcnICsgaywgMTAwICsgaSwgQ29kZS5ub0JnQ29sb3JdLFxuICAgICAgICBdKSxcblxuICAgICAgICAuLi5zdHlsZUNvZGVzLm1hcCAoKGssIGkpID0+ICFrID8gW10gOiBbIC8vIHN0eWxlIG1ldGhvZHNcblxuICAgICAgICAgICAgW2ssIGksICgoayA9PT0gJ2JyaWdodCcpIHx8IChrID09PSAnZGltJykpID8gQ29kZS5ub0JyaWdodG5lc3MgOiAoMjAgKyBpKV1cbiAgICAgICAgXSlcbiAgICBdXG4gICAgLnJlZHVjZSAoKGEsIGIpID0+IGEuY29uY2F0IChiKSlcblxuKSAoKTtcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBhc3NpZ25TdHJpbmdXcmFwcGluZ0FQSSA9ICh0YXJnZXQsIHdyYXBCZWZvcmUgPSB0YXJnZXQpID0+XG5cbiAgICBzdHJpbmdXcmFwcGluZ01ldGhvZHMucmVkdWNlICgobWVtbywgW2ssIG9wZW4sIGNsb3NlXSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPLmRlZmluZVByb3BlcnR5IChtZW1vLCBrLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldDogKCkgPT4gYXNzaWduU3RyaW5nV3JhcHBpbmdBUEkgKHN0ciA9PiB3cmFwQmVmb3JlICh3cmFwIChzdHIsIG9wZW4sIGNsb3NlKSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQpXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgVEVYVCAgICA9IDAsXG4gICAgICBCUkFDS0VUID0gMSxcbiAgICAgIENPREUgICAgPSAyXG5cbmNsYXNzIFNwYW4ge1xuICBjb25zdHJ1Y3Rvcihjb2RlLCB0ZXh0KSB7XG4gICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICB0aGlzLnRleHQgPSB0ZXh0O1xuXG4gICAgLy8gVGhvc2UgYXJlIGFkZGVkIGluIHRoZSBhY3R1YWwgcGFyc2UsIHRoaXMgaXMgZG9uZSBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyB0byBoYXZlIHRoZSBzYW1lIGhpZGRlbiBjbGFzc1xuICAgIHRoaXMuY3NzID0gXCJcIjtcbiAgICB0aGlzLmNvbG9yID0gXCJcIjtcbiAgICB0aGlzLmJnQ29sb3IgPSBcIlwiO1xuICAgIHRoaXMuYm9sZCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmludmVyc2UgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5pdGFsaWMgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy51bmRlcmxpbmUgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5icmlnaHQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5kaW0gPSB1bmRlZmluZWQ7XG4gIH1cbn1cblxuLy8gZ2V0U3RyaW5nIGFzIGZ1bmN0aW9uIGluc3RlYWQgb2Ygc3RyaW5nIHRvIGFsbG93IGdhcmJhZ2UgY29sbGVjdGlvblxuZnVuY3Rpb24qIHJhd1BhcnNlKGdldFN0cmluZykge1xuICBjb25zdCBzdGF0ZU9iamVjdCA9IHtcbiAgICBzdGF0ZTogVEVYVCxcbiAgICBidWZmZXI6IFwiXCIsXG4gICAgdGV4dDogXCJcIixcbiAgICBjb2RlOiBcIlwiLFxuICAgIGNvZGVzOiBbXSxcbiAgfTtcblxuICBjb25zdCBPTkVfTUIgPSAxMDQ4NTc2O1xuXG4gIC8vIEluc3RlYWQgb2YgaG9sZGluZyB0aGUgcmVmZXJlbmNlIHRvIHRoZSBzdHJpbmcgd2Ugc3BsaXQgaW50byBjaHVua3Mgb2YgMU1CXG4gIC8vIGFuZCBhZnRlciBwcm9jZXNzaW5nIGlzIGZpbmlzaGVkIHdlIGNhbiByZW1vdmUgdGhlIHJlZmVyZW5jZSBzbyBpdCBjYW4gYmUgR0NlZFxuICBjb25zdCBjaHVua3MgPSBzcGxpdFN0cmluZ1RvQ2h1bmtzT2ZTaXplKGdldFN0cmluZygpLCBPTkVfTUIpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2h1bmtzLmxlbmd0aDsgaSsrKXtcbiAgICAgIGNvbnN0IGNodW5rID0gY2h1bmtzW2ldO1xuICAgICAgLy8gRnJlZSBtZW1vcnkgZm9yIHRoZSBwcmV2aW91cyBjaHVua1xuICAgICAgY2h1bmtzW2ldID0gdW5kZWZpbmVkO1xuICAgICAgeWllbGQqIHByb2Nlc3NDaHVuayhjaHVuaywgc3RhdGVPYmplY3QpO1xuICB9XG5cbiAgaWYgKHN0YXRlT2JqZWN0LnN0YXRlICE9PSBURVhUKSBzdGF0ZU9iamVjdC50ZXh0ICs9IHN0YXRlT2JqZWN0LmJ1ZmZlcjtcblxuICBpZiAoc3RhdGVPYmplY3QudGV4dCkge1xuICAgIHlpZWxkIG5ldyBTcGFuKG5ldyBDb2RlKCksIHN0YXRlT2JqZWN0LnRleHQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNwbGl0U3RyaW5nVG9DaHVua3NPZlNpemUoc3RyLCBjaHVua1NpemUpIHtcbiAgY29uc3QgY2h1bmtzID0gW107XG4gIGNvbnN0IGNodW5rc0xlbmd0aCA9IE1hdGguY2VpbChzdHIubGVuZ3RoIC8gY2h1bmtTaXplKTtcblxuICBmb3IgKGxldCBpID0gMCwgbyA9IDA7IGkgPCBjaHVua3NMZW5ndGg7ICsraSwgbyArPSBjaHVua1NpemUpIHtcbiAgICBjaHVua3MucHVzaChzdHIuc3Vic3RyaW5nKG8sIG8gKyBjaHVua1NpemUpKTtcbiAgfVxuXG4gIHJldHVybiBjaHVua3M7XG59XG5cbmZ1bmN0aW9uKiBwcm9jZXNzQ2h1bmsoY2h1bmssIHN0YXRlT2JqZWN0KSB7XG4gIGNvbnN0IGNoYXJzID0gY2h1bms7XG4gIGNvbnN0IGNoYXJzTGVuZ3RoID0gY2h1bmsubGVuZ3RoO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhcnNMZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGMgPSBjaGFyc1tpXTtcblxuICAgIHN0YXRlT2JqZWN0LmJ1ZmZlciArPSBjO1xuXG4gICAgc3dpdGNoIChzdGF0ZU9iamVjdC5zdGF0ZSkge1xuICAgICAgY2FzZSBURVhUOlxuICAgICAgICBpZiAoYyA9PT0gXCJcXHUwMDFiXCIpIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5zdGF0ZSA9IEJSQUNLRVQ7XG4gICAgICAgICAgc3RhdGVPYmplY3QuYnVmZmVyID0gYztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC50ZXh0ICs9IGM7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgQlJBQ0tFVDpcbiAgICAgICAgaWYgKGMgPT09IFwiW1wiKSB7XG4gICAgICAgICAgc3RhdGVPYmplY3Quc3RhdGUgPSBDT0RFO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LmNvZGUgPSBcIlwiO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LmNvZGVzID0gW107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhdGVPYmplY3Quc3RhdGUgPSBURVhUO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnRleHQgKz0gc3RhdGVPYmplY3QuYnVmZmVyO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIENPREU6XG4gICAgICAgIGlmIChjID49IFwiMFwiICYmIGMgPD0gXCI5XCIpIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5jb2RlICs9IGM7XG4gICAgICAgIH0gZWxzZSBpZiAoYyA9PT0gXCI7XCIpIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5jb2Rlcy5wdXNoKG5ldyBDb2RlKHN0YXRlT2JqZWN0LmNvZGUpKTtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5jb2RlID0gXCJcIjtcbiAgICAgICAgfSBlbHNlIGlmIChjID09PSBcIm1cIikge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LmNvZGUgPSBzdGF0ZU9iamVjdC5jb2RlIHx8IFwiMFwiO1xuICAgICAgICAgIGZvciAoY29uc3QgY29kZSBvZiBzdGF0ZU9iamVjdC5jb2Rlcykge1xuICAgICAgICAgICAgeWllbGQgbmV3IFNwYW4oY29kZSwgc3RhdGVPYmplY3QudGV4dCk7XG4gICAgICAgICAgICBzdGF0ZU9iamVjdC50ZXh0ID0gXCJcIjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB5aWVsZCBuZXcgU3BhbihuZXcgQ29kZShzdGF0ZU9iamVjdC5jb2RlKSwgc3RhdGVPYmplY3QudGV4dCk7XG4gICAgICAgICAgc3RhdGVPYmplY3QudGV4dCA9IFwiXCI7XG4gICAgICAgICAgc3RhdGVPYmplY3Quc3RhdGUgPSBURVhUO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnN0YXRlID0gVEVYVDtcbiAgICAgICAgICBzdGF0ZU9iamVjdC50ZXh0ICs9IHN0YXRlT2JqZWN0LmJ1ZmZlcjtcbiAgICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogUGFyc2UgYW5zaSB0ZXh0XG4gKiBAcGFyYW0ge0dlbmVyYXRvcjxTcGFuLCB2b2lkLCAqPn0gcmF3U3BhbnNJdGVyYXRvciByYXcgc3BhbnMgaXRlcmF0b3JcbiAqIEByZXR1cm4ge0dlbmVyYXRvcjxTcGFuLCB2b2lkLCAqPn1cbiAqL1xuZnVuY3Rpb24qIHBhcnNlQW5zaShyYXdTcGFuc0l0ZXJhdG9yKSB7XG4gICAgbGV0IGNvbG9yID0gbmV3IENvbG9yKCk7XG4gICAgbGV0IGJnQ29sb3IgPSBuZXcgQ29sb3IodHJ1ZSAvKiBiYWNrZ3JvdW5kICovKTtcbiAgICBsZXQgYnJpZ2h0bmVzcyA9IHVuZGVmaW5lZDtcbiAgICBsZXQgc3R5bGVzID0gbmV3IFNldCgpO1xuXG4gICAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgIGNvbG9yID0gbmV3IENvbG9yKCk7XG4gICAgICAgIGJnQ29sb3IgPSBuZXcgQ29sb3IodHJ1ZSAvKiBiYWNrZ3JvdW5kICovKTtcbiAgICAgICAgYnJpZ2h0bmVzcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgc3R5bGVzLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgcmVzZXQoKTtcblxuICAgIGZvciAoY29uc3Qgc3BhbiBvZiByYXdTcGFuc0l0ZXJhdG9yKSB7XG4gICAgICAgIGNvbnN0IGMgPSBzcGFuLmNvZGU7XG5cbiAgICAgICAgY29uc3QgaW52ZXJ0ZWQgPSBzdHlsZXMuaGFzKFwiaW52ZXJzZVwiKTtcbiAgICAgICAgY29uc3QgdW5kZXJsaW5lID0gc3R5bGVzLmhhcyhcInVuZGVybGluZVwiKVxuICAgICAgICAgICAgPyBcInRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1wiXG4gICAgICAgICAgICA6IFwiXCI7XG4gICAgICAgIGNvbnN0IGl0YWxpYyA9IHN0eWxlcy5oYXMoXCJpdGFsaWNcIikgPyBcImZvbnQtc3R5bGU6IGl0YWxpYztcIiA6IFwiXCI7XG4gICAgICAgIGNvbnN0IGJvbGQgPSBicmlnaHRuZXNzID09PSBDb2RlLmJyaWdodCA/IFwiZm9udC13ZWlnaHQ6IGJvbGQ7XCIgOiBcIlwiO1xuXG4gICAgICAgIGNvbnN0IGZvcmVDb2xvciA9IGNvbG9yLmRlZmF1bHRCcmlnaHRuZXNzKGJyaWdodG5lc3MpO1xuXG4gICAgICAgIHNwYW4uY3NzID0gYm9sZCArIGl0YWxpYyArIHVuZGVybGluZSArIGZvcmVDb2xvci5jc3MoaW52ZXJ0ZWQpICsgYmdDb2xvci5jc3MoaW52ZXJ0ZWQpO1xuICAgICAgICBzcGFuLmJvbGQgPSAhIWJvbGQ7XG4gICAgICAgIHNwYW4uY29sb3IgPSBmb3JlQ29sb3IuY2xlYW47XG4gICAgICAgIHNwYW4uYmdDb2xvciA9IGJnQ29sb3IuY2xlYW47XG4gICAgICAgIHNwYW4uaW52ZXJzZSA9IGludmVydGVkO1xuICAgICAgICBzcGFuLml0YWxpYyA9ICEhaXRhbGljO1xuICAgICAgICBzcGFuLnVuZGVybGluZSA9ICEhdW5kZXJsaW5lO1xuICAgICAgICBzcGFuLmJyaWdodCA9IHN0eWxlcy5oYXMoXCJicmlnaHRcIik7XG4gICAgICAgIHNwYW4uZGltID0gc3R5bGVzLmhhcyhcImRpbVwiKTtcblxuICAgICAgICB5aWVsZCBzcGFuO1xuXG4gICAgICAgIGlmIChjLmlzQnJpZ2h0bmVzcykge1xuICAgICAgICAgICAgYnJpZ2h0bmVzcyA9IGMudmFsdWU7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzcGFuLmNvZGUudmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3Bhbi5jb2RlLnZhbHVlID09PSBDb2RlLnJlc2V0KSB7XG4gICAgICAgICAgICByZXNldCgpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHNwYW4uY29kZS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiY29sb3JcIjpcbiAgICAgICAgICAgIGNhc2UgXCJjb2xvckxpZ2h0XCI6XG4gICAgICAgICAgICAgICAgY29sb3IgPSBuZXcgQ29sb3IoZmFsc2UsIGMuc3VidHlwZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgXCJiZ0NvbG9yXCI6XG4gICAgICAgICAgICBjYXNlIFwiYmdDb2xvckxpZ2h0XCI6XG4gICAgICAgICAgICAgICAgYmdDb2xvciA9IG5ldyBDb2xvcih0cnVlLCBjLnN1YnR5cGUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIFwic3R5bGVcIjpcbiAgICAgICAgICAgICAgICBzdHlsZXMuYWRkKGMuc3VidHlwZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidW5zdHlsZVwiOlxuICAgICAgICAgICAgICAgIHN0eWxlcy5kZWxldGUoYy5zdWJ0eXBlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBBTlNJLWVzY2FwZWQgc3RyaW5nLlxuICovXG5jbGFzcyBDb2xvcnMge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlcy5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAocykge1xuICAgICAgICB0aGlzLnNwYW5zID0gcyA/IEFycmF5LmZyb20ocmF3UGFyc2UodHlwZW9mIHMgPT09ICdzdHJpbmcnID8gKCkgPT4gcyA6IHMpKSA6IFtdXG4gICAgfVxuXG4gICAgZ2V0IHN0ciAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNwYW5zLnJlZHVjZSAoKHN0ciwgcCkgPT4gc3RyICsgcC50ZXh0ICsgcC5jb2RlLnN0ciwgJycpXG4gICAgfVxuXG4gICAgZ2V0IHBhcnNlZCAoKSB7XG4gICAgICAgIGNvbnN0IG5ld0NvbG9ycyA9IG5ldyBDb2xvcnMoKTtcblxuICAgICAgICBuZXdDb2xvcnMuc3BhbnMgPSBBcnJheS5mcm9tKHBhcnNlQW5zaSh0aGlzLnNwYW5zKSk7XG5cbiAgICAgICAgcmV0dXJuIG5ld0NvbG9ycztcbiAgICB9XG5cbi8qICBPdXRwdXRzIHdpdGggQ2hyb21lIERldlRvb2xzLWNvbXBhdGlibGUgZm9ybWF0ICAgICAqL1xuXG4gICAgZ2V0IGFzQ2hyb21lQ29uc29sZUxvZ0FyZ3VtZW50cyAoKSB7XG5cbiAgICAgICAgY29uc3Qgc3BhbnMgPSB0aGlzLnBhcnNlZC5zcGFuc1xuXG4gICAgICAgIHJldHVybiBbc3BhbnMubWFwIChzID0+ICgnJWMnICsgcy50ZXh0KSkuam9pbiAoJycpLFxuICAgICAgICAgICAgIC4uLnNwYW5zLm1hcCAocyA9PiBzLmNzcyldXG4gICAgfVxuXG4gICAgZ2V0IGJyb3dzZXJDb25zb2xlQXJndW1lbnRzICgpIC8qIExFR0FDWSwgREVQUkVDQVRFRCAqLyB7IHJldHVybiB0aGlzLmFzQ2hyb21lQ29uc29sZUxvZ0FyZ3VtZW50cyB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBpbnN0YWxscyBTdHJpbmcgcHJvdG90eXBlIGV4dGVuc2lvbnNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlcXVpcmUgKCdhbnNpY29sb3InKS5uaWNlXG4gICAgICogY29uc29sZS5sb2cgKCdmb28nLmJyaWdodC5yZWQpXG4gICAgICovXG4gICAgc3RhdGljIGdldCBuaWNlICgpIHtcblxuICAgICAgICBDb2xvcnMubmFtZXMuZm9yRWFjaCAoayA9PiB7XG4gICAgICAgICAgICBpZiAoIShrIGluIFN0cmluZy5wcm90b3R5cGUpKSB7XG4gICAgICAgICAgICAgICAgTy5kZWZpbmVQcm9wZXJ0eSAoU3RyaW5nLnByb3RvdHlwZSwgaywgeyBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIENvbG9yc1trXSAodGhpcykgfSB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiBDb2xvcnNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBwYXJzZXMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlc1xuICAgICAqIEByZXR1cm4ge0NvbG9yc30gcGFyc2VkIHJlcHJlc2VudGF0aW9uLlxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZSAocykge1xuICAgICAgICByZXR1cm4gbmV3IENvbG9ycyAocykucGFyc2VkXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZyB8ICgpID0+IHN0cmluZ30gcyBzdHJpbmcgb3IgYSBmdW5jdGlvbiByZXR1cm5pbmcgYSBzdHJpbmcgKGZvciBsYXJnZSBzdHJpbmdzIHlvdSBtYXkgd2FudCB0byB1c2UgYSBmdW5jdGlvbiB0byBhdm9pZCBtZW1vcnkgaXNzdWVzKVxuICAgICAqIEByZXR1cm5zIHtHZW5lcmF0b3I8U3Bhbiwgdm9pZCwgKj59IFNwYW5zIGl0ZXJhdG9yXG4gICAgICovXG4gICAgc3RhdGljIHBhcnNlSXRlcmF0b3Iocykge1xuICAgICAgICByZXR1cm4gcGFyc2VBbnNpKHJhd1BhcnNlKHR5cGVvZiBzID09PSBcInN0cmluZ1wiID8gKCkgPT4gcyA6IHMpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBzdHJpcHMgQU5TSSBjb2RlcyBmcm9tIGEgc3RyaW5nXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlcy5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IGNsZWFuIHN0cmluZy5cbiAgICAgKi9cbiAgICBzdGF0aWMgc3RyaXAgKHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSAoL1tcXHUwMDFiXFx1MDA5Yl1bWygpIzs/XSooPzpbMC05XXsxLDR9KD86O1swLTldezAsNH0pKik/WzAtOUEtUFJaY2YtbnFyeT0+PF0vZywgJycpIC8vIGhvcGUgVjggY2FjaGVzIHRoZSByZWdleHBcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBjaGVja3MgaWYgYSB2YWx1ZSBjb250YWlucyBBTlNJIGVzY2FwZSBjb2Rlc1xuICAgICAqIEBwYXJhbSB7YW55fSBzIHZhbHVlIHRvIGNoZWNrXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gaGFzIGNvZGVzXG4gICAgICovXG4gICAgIHN0YXRpYyBpc0VzY2FwZWQgKHMpIHtcbiAgICAgICAgcyA9IFN0cmluZyhzKVxuICAgICAgICByZXR1cm4gQ29sb3JzLnN0cmlwIChzKSAhPT0gcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNwYW5zID0gWy4uLmFuc2kucGFyc2UgKCdcXHUwMDFiWzdtXFx1MDAxYls3bWZvb1xcdTAwMWJbN21iYXJcXHUwMDFiWzI3bScpXVxuICAgICAqL1xuICAgIFtTeW1ib2wuaXRlcmF0b3JdICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3BhbnNbU3ltYm9sLml0ZXJhdG9yXSAoKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIFRoaXMgYWxsb3dzIGFuIGFsdGVybmF0aXZlIGltcG9ydCBzdHlsZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS94cGwvYW5zaWNvbG9yL2lzc3Vlcy83I2lzc3VlY29tbWVudC01Nzg5MjM1NzhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGltcG9ydCB7IGFuc2ljb2xvciwgUGFyc2VkU3BhbiB9IGZyb20gJ2Fuc2ljb2xvcidcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IGFuc2ljb2xvciAoKSB7XG4gICAgICAgIHJldHVybiBDb2xvcnNcbiAgICB9XG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuYXNzaWduU3RyaW5nV3JhcHBpbmdBUEkgKENvbG9ycywgc3RyID0+IHN0cilcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5Db2xvcnMubmFtZXMgPSBzdHJpbmdXcmFwcGluZ01ldGhvZHMubWFwICgoW2tdKSA9PiBrKVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbkNvbG9ycy5yZ2IgPSB7XG5cbiAgICBibGFjazogICAgICAgIFswLCAgICAgMCwgICAwXSxcbiAgICBkYXJrR3JheTogICAgIFsxMDAsIDEwMCwgMTAwXSxcbiAgICBsaWdodEdyYXk6ICAgIFsyMDAsIDIwMCwgMjAwXSxcbiAgICB3aGl0ZTogICAgICAgIFsyNTUsIDI1NSwgMjU1XSxcblxuICAgIHJlZDogICAgICAgICAgWzIwNCwgICAwLCAgIDBdLFxuICAgIGxpZ2h0UmVkOiAgICAgWzI1NSwgIDUxLCAgIDBdLFxuXG4gICAgZ3JlZW46ICAgICAgICBbMCwgICAyMDQsICAgMF0sXG4gICAgbGlnaHRHcmVlbjogICBbNTEsICAyMDQsICA1MV0sXG5cbiAgICB5ZWxsb3c6ICAgICAgIFsyMDQsIDEwMiwgICAwXSxcbiAgICBsaWdodFllbGxvdzogIFsyNTUsIDE1MywgIDUxXSxcblxuICAgIGJsdWU6ICAgICAgICAgWzAsICAgICAwLCAyNTVdLFxuICAgIGxpZ2h0Qmx1ZTogICAgWzI2LCAgMTQwLCAyNTVdLFxuXG4gICAgbWFnZW50YTogICAgICBbMjA0LCAgIDAsIDIwNF0sXG4gICAgbGlnaHRNYWdlbnRhOiBbMjU1LCAgIDAsIDI1NV0sXG5cbiAgICBjeWFuOiAgICAgICAgIFswLCAgIDE1MywgMjU1XSxcbiAgICBsaWdodEN5YW46ICAgIFswLCAgIDIwNCwgMjU1XSxcbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbG9yc1xuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbiJdfQ==