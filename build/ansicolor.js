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
    var stateObject, ONE_MB, chunks, chunk;
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
                    chunks = splitStringToChunksOfSize(getString(), ONE_MB);

                case 3:
                    if (!(chunks.length > 0)) {
                        _context.next = 8;
                        break;
                    }

                    chunk = chunks.shift();
                    return _context.delegateYield(processChunk(chunk, stateObject), 't0', 6);

                case 6:
                    _context.next = 3;
                    break;

                case 8:

                    if (stateObject.state !== TEXT) stateObject.text += stateObject.buffer;

                    if (!stateObject.text) {
                        _context.next = 12;
                        break;
                    }

                    _context.next = 12;
                    return new Span(new Code(), stateObject.text);

                case 12:
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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TUFBakI7O0FBRUEiLCJmaWxlIjoiYW5zaWNvbG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgTyA9IE9iamVjdFxuXG4vKiAgU2VlIGh0dHBzOi8vbWlzYy5mbG9naXNvZnQuY29tL2Jhc2gvdGlwX2NvbG9yc19hbmRfZm9ybWF0dGluZ1xuICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBjb2xvckNvZGVzICAgICAgPSBbICAgJ2JsYWNrJywgICAgICAncmVkJywgICAgICAnZ3JlZW4nLCAgICAgICd5ZWxsb3cnLCAgICAgICdibHVlJywgICAgICAnbWFnZW50YScsICAgICAgJ2N5YW4nLCAnbGlnaHRHcmF5JywgJycsICdkZWZhdWx0J11cbiAgICAsIGNvbG9yQ29kZXNMaWdodCA9IFsnZGFya0dyYXknLCAnbGlnaHRSZWQnLCAnbGlnaHRHcmVlbicsICdsaWdodFllbGxvdycsICdsaWdodEJsdWUnLCAnbGlnaHRNYWdlbnRhJywgJ2xpZ2h0Q3lhbicsICd3aGl0ZScsICcnXVxuICAgIFxuICAgICwgc3R5bGVDb2RlcyA9IFsnJywgJ2JyaWdodCcsICdkaW0nLCAnaXRhbGljJywgJ3VuZGVybGluZScsICcnLCAnJywgJ2ludmVyc2UnXVxuXG4gICAgLCBhc0JyaWdodCA9IHsgJ3JlZCc6ICAgICAgICdsaWdodFJlZCcsXG4gICAgICAgICAgICAgICAgICAgJ2dyZWVuJzogICAgICdsaWdodEdyZWVuJyxcbiAgICAgICAgICAgICAgICAgICAneWVsbG93JzogICAgJ2xpZ2h0WWVsbG93JyxcbiAgICAgICAgICAgICAgICAgICAnYmx1ZSc6ICAgICAgJ2xpZ2h0Qmx1ZScsXG4gICAgICAgICAgICAgICAgICAgJ21hZ2VudGEnOiAgICdsaWdodE1hZ2VudGEnLFxuICAgICAgICAgICAgICAgICAgICdjeWFuJzogICAgICAnbGlnaHRDeWFuJyxcbiAgICAgICAgICAgICAgICAgICAnYmxhY2snOiAgICAgJ2RhcmtHcmF5JyxcbiAgICAgICAgICAgICAgICAgICAnbGlnaHRHcmF5JzogJ3doaXRlJyB9XG4gICAgXG4gICAgLCB0eXBlcyA9IHsgMDogICdzdHlsZScsXG4gICAgICAgICAgICAgICAgMjogICd1bnN0eWxlJyxcbiAgICAgICAgICAgICAgICAzOiAgJ2NvbG9yJyxcbiAgICAgICAgICAgICAgICA5OiAgJ2NvbG9yTGlnaHQnLFxuICAgICAgICAgICAgICAgIDQ6ICAnYmdDb2xvcicsXG4gICAgICAgICAgICAgICAgMTA6ICdiZ0NvbG9yTGlnaHQnIH1cblxuICAgICwgc3VidHlwZXMgPSB7ICBjb2xvcjogICAgICAgICBjb2xvckNvZGVzLFxuICAgICAgICAgICAgICAgICAgICBjb2xvckxpZ2h0OiAgICBjb2xvckNvZGVzTGlnaHQsXG4gICAgICAgICAgICAgICAgICAgIGJnQ29sb3I6ICAgICAgIGNvbG9yQ29kZXMsXG4gICAgICAgICAgICAgICAgICAgIGJnQ29sb3JMaWdodDogIGNvbG9yQ29kZXNMaWdodCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6ICAgICAgICAgc3R5bGVDb2RlcyxcbiAgICAgICAgICAgICAgICAgICAgdW5zdHlsZTogICAgICAgc3R5bGVDb2RlcyAgICB9XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY2xhc3MgQ29sb3Ige1xuXG4gICAgY29uc3RydWN0b3IgKGJhY2tncm91bmQsIG5hbWUsIGJyaWdodG5lc3MpIHtcblxuICAgICAgICB0aGlzLmJhY2tncm91bmQgPSBiYWNrZ3JvdW5kXG4gICAgICAgIHRoaXMubmFtZSAgICAgICA9IG5hbWVcbiAgICAgICAgdGhpcy5icmlnaHRuZXNzID0gYnJpZ2h0bmVzc1xuICAgIH1cblxuICAgIGdldCBpbnZlcnNlICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2xvciAoIXRoaXMuYmFja2dyb3VuZCwgdGhpcy5uYW1lIHx8ICh0aGlzLmJhY2tncm91bmQgPyAnYmxhY2snIDogJ3doaXRlJyksIHRoaXMuYnJpZ2h0bmVzcylcbiAgICB9XG5cbiAgICBnZXQgY2xlYW4oKSB7XG4gICAgICBjb25zdCBuYW1lID0gdGhpcy5uYW1lID09PSBcImRlZmF1bHRcIiA/IFwiXCIgOiB0aGlzLm5hbWU7XG4gICAgICBjb25zdCBicmlnaHQgPSB0aGlzLmJyaWdodG5lc3MgPT09IENvZGUuYnJpZ2h0O1xuICAgICAgY29uc3QgZGltID0gdGhpcy5icmlnaHRuZXNzID09PSBDb2RlLmRpbTtcblxuICAgICAgaWYgKCFuYW1lICYmICFicmlnaHQgJiYgIWRpbSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBicmlnaHQsXG4gICAgICAgIGRpbSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZGVmYXVsdEJyaWdodG5lc3MgKHZhbHVlKSB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBDb2xvciAodGhpcy5iYWNrZ3JvdW5kLCB0aGlzLm5hbWUsIHRoaXMuYnJpZ2h0bmVzcyB8fCB2YWx1ZSlcbiAgICB9XG5cbiAgICBjc3MgKGludmVydGVkKSB7XG5cbiAgICAgICAgY29uc3QgY29sb3IgPSBpbnZlcnRlZCA/IHRoaXMuaW52ZXJzZSA6IHRoaXNcblxuICAgICAgICBjb25zdCByZ2JOYW1lID0gKChjb2xvci5icmlnaHRuZXNzID09PSBDb2RlLmJyaWdodCkgJiYgYXNCcmlnaHRbY29sb3IubmFtZV0pIHx8IGNvbG9yLm5hbWVcblxuICAgICAgICBjb25zdCBwcm9wID0gKGNvbG9yLmJhY2tncm91bmQgPyAnYmFja2dyb3VuZDonIDogJ2NvbG9yOicpXG4gICAgICAgICAgICAsIHJnYiAgPSBDb2xvcnMucmdiW3JnYk5hbWVdXG4gICAgICAgICAgICAsIGFscGhhID0gKHRoaXMuYnJpZ2h0bmVzcyA9PT0gQ29kZS5kaW0pID8gMC41IDogMVxuXG4gICAgICAgIHJldHVybiByZ2JcbiAgICAgICAgICAgICAgICA/IChwcm9wICsgJ3JnYmEoJyArIFsuLi5yZ2IsIGFscGhhXS5qb2luICgnLCcpICsgJyk7JylcbiAgICAgICAgICAgICAgICA6ICgoIWNvbG9yLmJhY2tncm91bmQgJiYgKGFscGhhIDwgMSkpID8gJ2NvbG9yOnJnYmEoMCwwLDAsMC41KTsnIDogJycpIC8vIENocm9tZSBkb2VzIG5vdCBzdXBwb3J0ICdvcGFjaXR5JyBwcm9wZXJ0eS4uLlxuICAgIH1cbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jbGFzcyBDb2RlIHtcblxuICBjb25zdHJ1Y3RvcihuKSB7XG4gICAgbGV0IHZhbHVlID0gdW5kZWZpbmVkO1xuICAgIGxldCB0eXBlID0gdW5kZWZpbmVkO1xuICAgIGxldCBzdWJ0eXBlID0gdW5kZWZpbmVkO1xuICAgIGxldCBzdHIgPSBcIlwiO1xuICAgIGxldCBpc0JyaWdodG5lc3MgPSBmYWxzZTtcblxuICAgIGlmIChuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhbHVlID0gTnVtYmVyKG4pO1xuICAgICAgdHlwZSA9IHR5cGVzW01hdGguZmxvb3IodmFsdWUgLyAxMCldO1xuICAgICAgc3VidHlwZSA9IHN1YnR5cGVzW3R5cGVdW3ZhbHVlICUgMTBdO1xuICAgICAgc3RyID0gXCJcXHUwMDFiW1wiICsgdmFsdWUgKyBcIm1cIjtcbiAgICAgIGlzQnJpZ2h0bmVzcyA9XG4gICAgICAgIHZhbHVlID09PSBDb2RlLm5vQnJpZ2h0bmVzcyB8fFxuICAgICAgICB2YWx1ZSA9PT0gQ29kZS5icmlnaHQgfHxcbiAgICAgICAgdmFsdWUgPT09IENvZGUuZGltO1xuICAgIH1cblxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuc3VidHlwZSA9IHN1YnR5cGU7XG4gICAgdGhpcy5zdHIgPSBzdHI7XG4gICAgdGhpcy5pc0JyaWdodG5lc3MgPSBpc0JyaWdodG5lc3M7XG4gIH1cblxuICBzdGF0aWMgc3RyKHgpIHtcbiAgICBpZih4ID09PSB1bmRlZmluZWQpIHJldHVybiBcIlwiO1xuICAgIHJldHVybiBcIlxcdTAwMWJbXCIgKyBOdW1iZXIoeCkgKyBcIm1cIjtcbiAgfVxufVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbk8uYXNzaWduIChDb2RlLCB7XG5cbiAgICByZXNldDogICAgICAgIDAsXG4gICAgYnJpZ2h0OiAgICAgICAxLFxuICAgIGRpbTogICAgICAgICAgMixcbiAgICBpbnZlcnNlOiAgICAgIDcsXG4gICAgbm9CcmlnaHRuZXNzOiAyMixcbiAgICBub0l0YWxpYzogICAgIDIzLFxuICAgIG5vVW5kZXJsaW5lOiAgMjQsXG4gICAgbm9JbnZlcnNlOiAgICAyNyxcbiAgICBub0NvbG9yOiAgICAgIDM5LFxuICAgIG5vQmdDb2xvcjogICAgNDlcbn0pXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgcmVwbGFjZUFsbCA9IChzdHIsIGEsIGIpID0+IHN0ci5zcGxpdCAoYSkuam9pbiAoYilcblxuLyogIEFOU0kgYnJpZ2h0bmVzcyBjb2RlcyBkbyBub3Qgb3ZlcmxhcCwgZS5nLiBcInticmlnaHR9e2RpbX1mb29cIiB3aWxsIGJlIHJlbmRlcmVkIGJyaWdodCAobm90IGRpbSkuXG4gICAgU28gd2UgZml4IGl0IGJ5IGFkZGluZyBicmlnaHRuZXNzIGNhbmNlbGluZyBiZWZvcmUgZWFjaCBicmlnaHRuZXNzIGNvZGUsIHNvIHRoZSBmb3JtZXIgZXhhbXBsZSBnZXRzXG4gICAgY29udmVydGVkIHRvIFwie25vQnJpZ2h0bmVzc317YnJpZ2h0fXtub0JyaWdodG5lc3N9e2RpbX1mb29cIiDigJMgdGhpcyB3YXkgaXQgZ2V0cyByZW5kZXJlZCBhcyBleHBlY3RlZC5cbiAqL1xuXG5jb25zdCBkZW5vcm1hbGl6ZUJyaWdodG5lc3MgPSBzID0+IHMucmVwbGFjZSAoLyhcXHUwMDFiXFxbKDF8MiltKS9nLCAnXFx1MDAxYlsyMm0kMScpXG5jb25zdCBub3JtYWxpemVCcmlnaHRuZXNzID0gcyA9PiBzLnJlcGxhY2UgKC9cXHUwMDFiXFxbMjJtKFxcdTAwMWJcXFsoMXwyKW0pL2csICckMScpXG5cbmNvbnN0IHdyYXAgPSAoeCwgb3BlbkNvZGUsIGNsb3NlQ29kZSkgPT4ge1xuXG4gICAgY29uc3Qgb3BlbiAgPSBDb2RlLnN0ciAob3BlbkNvZGUpLFxuICAgICAgICAgIGNsb3NlID0gQ29kZS5zdHIgKGNsb3NlQ29kZSlcblxuICAgIHJldHVybiBTdHJpbmcgKHgpXG4gICAgICAgICAgICAgICAgLnNwbGl0ICgnXFxuJylcbiAgICAgICAgICAgICAgICAubWFwIChsaW5lID0+IGRlbm9ybWFsaXplQnJpZ2h0bmVzcyAob3BlbiArIHJlcGxhY2VBbGwgKG5vcm1hbGl6ZUJyaWdodG5lc3MgKGxpbmUpLCBjbG9zZSwgb3BlbikgKyBjbG9zZSkpXG4gICAgICAgICAgICAgICAgLmpvaW4gKCdcXG4nKVxufVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IGNhbWVsID0gKGEsIGIpID0+IGEgKyBiLmNoYXJBdCAoMCkudG9VcHBlckNhc2UgKCkgKyBiLnNsaWNlICgxKVxuXG5cbmNvbnN0IHN0cmluZ1dyYXBwaW5nTWV0aG9kcyA9ICgoKSA9PiBbXG5cbiAgICAgICAgLi4uY29sb3JDb2Rlcy5tYXAgKChrLCBpKSA9PiAhayA/IFtdIDogWyAvLyBjb2xvciBtZXRob2RzXG5cbiAgICAgICAgICAgIFtrLCAgICAgICAgICAgICAgIDMwICsgaSwgQ29kZS5ub0NvbG9yXSxcbiAgICAgICAgICAgIFtjYW1lbCAoJ2JnJywgayksIDQwICsgaSwgQ29kZS5ub0JnQ29sb3JdLFxuICAgICAgICBdKSxcblxuICAgICAgICAuLi5jb2xvckNvZGVzTGlnaHQubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFsgLy8gbGlnaHQgY29sb3IgbWV0aG9kc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBbaywgICAgICAgICAgICAgICAgOTAgKyBpLCBDb2RlLm5vQ29sb3JdLFxuICAgICAgICAgICAgW2NhbWVsICgnYmcnLCBrKSwgMTAwICsgaSwgQ29kZS5ub0JnQ29sb3JdLFxuICAgICAgICBdKSxcblxuICAgICAgICAvKiBUSElTIE9ORSBJUyBGT1IgQkFDS1dBUkRTIENPTVBBVElCSUxJVFkgV0lUSCBQUkVWSU9VUyBWRVJTSU9OUyAoaGFkICdicmlnaHQnIGluc3RlYWQgb2YgJ2xpZ2h0JyBmb3IgYmFja2dyb3VuZHMpXG4gICAgICAgICAqL1xuICAgICAgICAuLi5bJycsICdCcmlnaHRSZWQnLCAnQnJpZ2h0R3JlZW4nLCAnQnJpZ2h0WWVsbG93JywgJ0JyaWdodEJsdWUnLCAnQnJpZ2h0TWFnZW50YScsICdCcmlnaHRDeWFuJ10ubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgWydiZycgKyBrLCAxMDAgKyBpLCBDb2RlLm5vQmdDb2xvcl0sXG4gICAgICAgIF0pLFxuICAgICAgICBcbiAgICAgICAgLi4uc3R5bGVDb2Rlcy5tYXAgKChrLCBpKSA9PiAhayA/IFtdIDogWyAvLyBzdHlsZSBtZXRob2RzXG5cbiAgICAgICAgICAgIFtrLCBpLCAoKGsgPT09ICdicmlnaHQnKSB8fCAoayA9PT0gJ2RpbScpKSA/IENvZGUubm9CcmlnaHRuZXNzIDogKDIwICsgaSldXG4gICAgICAgIF0pXG4gICAgXVxuICAgIC5yZWR1Y2UgKChhLCBiKSA9PiBhLmNvbmNhdCAoYikpXG4gICAgXG4pICgpO1xuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IGFzc2lnblN0cmluZ1dyYXBwaW5nQVBJID0gKHRhcmdldCwgd3JhcEJlZm9yZSA9IHRhcmdldCkgPT5cblxuICAgIHN0cmluZ1dyYXBwaW5nTWV0aG9kcy5yZWR1Y2UgKChtZW1vLCBbaywgb3BlbiwgY2xvc2VdKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8uZGVmaW5lUHJvcGVydHkgKG1lbW8sIGssIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0OiAoKSA9PiBhc3NpZ25TdHJpbmdXcmFwcGluZ0FQSSAoc3RyID0+IHdyYXBCZWZvcmUgKHdyYXAgKHN0ciwgb3BlbiwgY2xvc2UpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldClcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBURVhUICAgID0gMCxcbiAgICAgIEJSQUNLRVQgPSAxLFxuICAgICAgQ09ERSAgICA9IDJcblxuY2xhc3MgU3BhbiB7XG4gIGNvbnN0cnVjdG9yKGNvZGUsIHRleHQpIHtcbiAgICB0aGlzLmNvZGUgPSBjb2RlO1xuICAgIHRoaXMudGV4dCA9IHRleHQ7XG5cbiAgICAvLyBUaG9zZSBhcmUgYWRkZWQgaW4gdGhlIGFjdHVhbCBwYXJzZSwgdGhpcyBpcyBkb25lIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIHRvIGhhdmUgdGhlIHNhbWUgaGlkZGVuIGNsYXNzXG4gICAgdGhpcy5jc3MgPSBcIlwiO1xuICAgIHRoaXMuY29sb3IgPSBcIlwiO1xuICAgIHRoaXMuYmdDb2xvciA9IFwiXCI7XG4gICAgdGhpcy5ib2xkID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuaW52ZXJzZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLml0YWxpYyA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnVuZGVybGluZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmJyaWdodCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmRpbSA9IHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vLyBnZXRTdHJpbmcgYXMgZnVuY3Rpb24gaW5zdGVhZCBvZiBzdHJpbmcgdG8gYWxsb3cgZ2FyYmFnZSBjb2xsZWN0aW9uXG5mdW5jdGlvbiogcmF3UGFyc2UoZ2V0U3RyaW5nKSB7XG4gIGNvbnN0IHN0YXRlT2JqZWN0ID0ge1xuICAgIHN0YXRlOiBURVhULFxuICAgIGJ1ZmZlcjogXCJcIixcbiAgICB0ZXh0OiBcIlwiLFxuICAgIGNvZGU6IFwiXCIsXG4gICAgY29kZXM6IFtdLFxuICB9O1xuXG4gIGNvbnN0IE9ORV9NQiA9IDEwNDg1NzY7XG5cbiAgY29uc3QgY2h1bmtzID0gc3BsaXRTdHJpbmdUb0NodW5rc09mU2l6ZShnZXRTdHJpbmcoKSwgT05FX01CKTtcblxuICB3aGlsZSAoY2h1bmtzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBjaHVuayA9IGNodW5rcy5zaGlmdCgpO1xuICAgIHlpZWxkKiBwcm9jZXNzQ2h1bmsoY2h1bmssIHN0YXRlT2JqZWN0KTtcbiAgfVxuXG4gIGlmIChzdGF0ZU9iamVjdC5zdGF0ZSAhPT0gVEVYVCkgc3RhdGVPYmplY3QudGV4dCArPSBzdGF0ZU9iamVjdC5idWZmZXI7XG5cbiAgaWYgKHN0YXRlT2JqZWN0LnRleHQpIHtcbiAgICB5aWVsZCBuZXcgU3BhbihuZXcgQ29kZSgpLCBzdGF0ZU9iamVjdC50ZXh0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzcGxpdFN0cmluZ1RvQ2h1bmtzT2ZTaXplKHN0ciwgY2h1bmtTaXplKSB7XG4gIGNvbnN0IGNodW5rcyA9IFtdO1xuICBjb25zdCBjaHVua3NMZW5ndGggPSBNYXRoLmNlaWwoc3RyLmxlbmd0aCAvIGNodW5rU2l6ZSk7XG5cbiAgZm9yIChsZXQgaSA9IDAsIG8gPSAwOyBpIDwgY2h1bmtzTGVuZ3RoOyArK2ksIG8gKz0gY2h1bmtTaXplKSB7XG4gICAgY2h1bmtzLnB1c2goc3RyLnN1YnN0cmluZyhvLCBvICsgY2h1bmtTaXplKSk7XG4gIH1cblxuICByZXR1cm4gY2h1bmtzO1xufVxuXG5mdW5jdGlvbiogcHJvY2Vzc0NodW5rKGNodW5rLCBzdGF0ZU9iamVjdCkge1xuICBjb25zdCBjaGFycyA9IGNodW5rO1xuICBjb25zdCBjaGFyc0xlbmd0aCA9IGNodW5rLmxlbmd0aDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoYXJzTGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjID0gY2hhcnNbaV07XG5cbiAgICBzdGF0ZU9iamVjdC5idWZmZXIgKz0gYztcblxuICAgIHN3aXRjaCAoc3RhdGVPYmplY3Quc3RhdGUpIHtcbiAgICAgIGNhc2UgVEVYVDpcbiAgICAgICAgaWYgKGMgPT09IFwiXFx1MDAxYlwiKSB7XG4gICAgICAgICAgc3RhdGVPYmplY3Quc3RhdGUgPSBCUkFDS0VUO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LmJ1ZmZlciA9IGM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhdGVPYmplY3QudGV4dCArPSBjO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIEJSQUNLRVQ6XG4gICAgICAgIGlmIChjID09PSBcIltcIikge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnN0YXRlID0gQ09ERTtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5jb2RlID0gXCJcIjtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5jb2RlcyA9IFtdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnN0YXRlID0gVEVYVDtcbiAgICAgICAgICBzdGF0ZU9iamVjdC50ZXh0ICs9IHN0YXRlT2JqZWN0LmJ1ZmZlcjtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBDT0RFOlxuICAgICAgICBpZiAoYyA+PSBcIjBcIiAmJiBjIDw9IFwiOVwiKSB7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZSArPSBjO1xuICAgICAgICB9IGVsc2UgaWYgKGMgPT09IFwiO1wiKSB7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZXMucHVzaChuZXcgQ29kZShzdGF0ZU9iamVjdC5jb2RlKSk7XG4gICAgICAgICAgc3RhdGVPYmplY3QuY29kZSA9IFwiXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoYyA9PT0gXCJtXCIpIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5jb2RlID0gc3RhdGVPYmplY3QuY29kZSB8fCBcIjBcIjtcbiAgICAgICAgICBmb3IgKGNvbnN0IGNvZGUgb2Ygc3RhdGVPYmplY3QuY29kZXMpIHtcbiAgICAgICAgICAgIHlpZWxkIG5ldyBTcGFuKGNvZGUsIHN0YXRlT2JqZWN0LnRleHQpO1xuICAgICAgICAgICAgc3RhdGVPYmplY3QudGV4dCA9IFwiXCI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgeWllbGQgbmV3IFNwYW4obmV3IENvZGUoc3RhdGVPYmplY3QuY29kZSksIHN0YXRlT2JqZWN0LnRleHQpO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnRleHQgPSBcIlwiO1xuICAgICAgICAgIHN0YXRlT2JqZWN0LnN0YXRlID0gVEVYVDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGF0ZU9iamVjdC5zdGF0ZSA9IFRFWFQ7XG4gICAgICAgICAgc3RhdGVPYmplY3QudGV4dCArPSBzdGF0ZU9iamVjdC5idWZmZXI7XG4gICAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIFBhcnNlIGFuc2kgdGV4dFxuICogQHBhcmFtIHtHZW5lcmF0b3I8U3Bhbiwgdm9pZCwgKj59IHJhd1NwYW5zSXRlcmF0b3IgcmF3IHNwYW5zIGl0ZXJhdG9yXG4gKiBAcmV0dXJuIHtHZW5lcmF0b3I8U3Bhbiwgdm9pZCwgKj59XG4gKi9cbmZ1bmN0aW9uKiBwYXJzZUFuc2kocmF3U3BhbnNJdGVyYXRvcikge1xuICAgIGxldCBjb2xvciA9IG5ldyBDb2xvcigpO1xuICAgIGxldCBiZ0NvbG9yID0gbmV3IENvbG9yKHRydWUgLyogYmFja2dyb3VuZCAqLyk7XG4gICAgbGV0IGJyaWdodG5lc3MgPSB1bmRlZmluZWQ7XG4gICAgbGV0IHN0eWxlcyA9IG5ldyBTZXQoKTtcblxuICAgIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgICBjb2xvciA9IG5ldyBDb2xvcigpO1xuICAgICAgICBiZ0NvbG9yID0gbmV3IENvbG9yKHRydWUgLyogYmFja2dyb3VuZCAqLyk7XG4gICAgICAgIGJyaWdodG5lc3MgPSB1bmRlZmluZWQ7XG4gICAgICAgIHN0eWxlcy5jbGVhcigpO1xuICAgIH1cblxuICAgIHJlc2V0KCk7XG5cbiAgICBmb3IgKGNvbnN0IHNwYW4gb2YgcmF3U3BhbnNJdGVyYXRvcikge1xuICAgICAgICBjb25zdCBjID0gc3Bhbi5jb2RlO1xuXG4gICAgICAgIGNvbnN0IGludmVydGVkID0gc3R5bGVzLmhhcyhcImludmVyc2VcIik7XG4gICAgICAgIGNvbnN0IHVuZGVybGluZSA9IHN0eWxlcy5oYXMoXCJ1bmRlcmxpbmVcIilcbiAgICAgICAgICAgID8gXCJ0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcIlxuICAgICAgICAgICAgOiBcIlwiO1xuICAgICAgICBjb25zdCBpdGFsaWMgPSBzdHlsZXMuaGFzKFwiaXRhbGljXCIpID8gXCJmb250LXN0eWxlOiBpdGFsaWM7XCIgOiBcIlwiO1xuICAgICAgICBjb25zdCBib2xkID0gYnJpZ2h0bmVzcyA9PT0gQ29kZS5icmlnaHQgPyBcImZvbnQtd2VpZ2h0OiBib2xkO1wiIDogXCJcIjtcblxuICAgICAgICBjb25zdCBmb3JlQ29sb3IgPSBjb2xvci5kZWZhdWx0QnJpZ2h0bmVzcyhicmlnaHRuZXNzKTtcblxuICAgICAgICBzcGFuLmNzcyA9IGJvbGQgKyBpdGFsaWMgKyB1bmRlcmxpbmUgKyBmb3JlQ29sb3IuY3NzKGludmVydGVkKSArIGJnQ29sb3IuY3NzKGludmVydGVkKTtcbiAgICAgICAgc3Bhbi5ib2xkID0gISFib2xkO1xuICAgICAgICBzcGFuLmNvbG9yID0gZm9yZUNvbG9yLmNsZWFuO1xuICAgICAgICBzcGFuLmJnQ29sb3IgPSBiZ0NvbG9yLmNsZWFuO1xuICAgICAgICBzcGFuLmludmVyc2UgPSBpbnZlcnRlZDtcbiAgICAgICAgc3Bhbi5pdGFsaWMgPSAhIWl0YWxpYztcbiAgICAgICAgc3Bhbi51bmRlcmxpbmUgPSAhIXVuZGVybGluZTtcbiAgICAgICAgc3Bhbi5icmlnaHQgPSBzdHlsZXMuaGFzKFwiYnJpZ2h0XCIpO1xuICAgICAgICBzcGFuLmRpbSA9IHN0eWxlcy5oYXMoXCJkaW1cIik7XG5cbiAgICAgICAgeWllbGQgc3BhbjtcblxuICAgICAgICBpZiAoYy5pc0JyaWdodG5lc3MpIHtcbiAgICAgICAgICAgIGJyaWdodG5lc3MgPSBjLnZhbHVlO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3Bhbi5jb2RlLnZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNwYW4uY29kZS52YWx1ZSA9PT0gQ29kZS5yZXNldCkge1xuICAgICAgICAgICAgcmVzZXQoKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChzcGFuLmNvZGUudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcImNvbG9yXCI6XG4gICAgICAgICAgICBjYXNlIFwiY29sb3JMaWdodFwiOlxuICAgICAgICAgICAgICAgIGNvbG9yID0gbmV3IENvbG9yKGZhbHNlLCBjLnN1YnR5cGUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIFwiYmdDb2xvclwiOlxuICAgICAgICAgICAgY2FzZSBcImJnQ29sb3JMaWdodFwiOlxuICAgICAgICAgICAgICAgIGJnQ29sb3IgPSBuZXcgQ29sb3IodHJ1ZSwgYy5zdWJ0eXBlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBcInN0eWxlXCI6XG4gICAgICAgICAgICAgICAgc3R5bGVzLmFkZChjLnN1YnR5cGUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInVuc3R5bGVcIjpcbiAgICAgICAgICAgICAgICBzdHlsZXMuZGVsZXRlKGMuc3VidHlwZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gQU5TSS1lc2NhcGVkIHN0cmluZy5cbiAqL1xuY2xhc3MgQ29sb3JzIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzIGEgc3RyaW5nIGNvbnRhaW5pbmcgQU5TSSBlc2NhcGUgY29kZXMuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKHMpIHtcbiAgICAgICAgdGhpcy5zcGFucyA9IHMgPyBBcnJheS5mcm9tKHJhd1BhcnNlKHR5cGVvZiBzID09PSAnc3RyaW5nJyA/ICgpID0+IHMgOiBzKSkgOiBbXVxuICAgIH1cblxuICAgIGdldCBzdHIgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zcGFucy5yZWR1Y2UgKChzdHIsIHApID0+IHN0ciArIHAudGV4dCArIHAuY29kZS5zdHIsICcnKVxuICAgIH1cblxuICAgIGdldCBwYXJzZWQgKCkge1xuICAgICAgICBjb25zdCBuZXdDb2xvcnMgPSBuZXcgQ29sb3JzKCk7XG5cbiAgICAgICAgbmV3Q29sb3JzLnNwYW5zID0gQXJyYXkuZnJvbShwYXJzZUFuc2kodGhpcy5zcGFucykpO1xuXG4gICAgICAgIHJldHVybiBuZXdDb2xvcnM7XG4gICAgfVxuXG4vKiAgT3V0cHV0cyB3aXRoIENocm9tZSBEZXZUb29scy1jb21wYXRpYmxlIGZvcm1hdCAgICAgKi9cblxuICAgIGdldCBhc0Nocm9tZUNvbnNvbGVMb2dBcmd1bWVudHMgKCkge1xuXG4gICAgICAgIGNvbnN0IHNwYW5zID0gdGhpcy5wYXJzZWQuc3BhbnNcblxuICAgICAgICByZXR1cm4gW3NwYW5zLm1hcCAocyA9PiAoJyVjJyArIHMudGV4dCkpLmpvaW4gKCcnKSxcbiAgICAgICAgICAgICAuLi5zcGFucy5tYXAgKHMgPT4gcy5jc3MpXVxuICAgIH1cblxuICAgIGdldCBicm93c2VyQ29uc29sZUFyZ3VtZW50cyAoKSAvKiBMRUdBQ1ksIERFUFJFQ0FURUQgKi8geyByZXR1cm4gdGhpcy5hc0Nocm9tZUNvbnNvbGVMb2dBcmd1bWVudHMgfVxuXG4gICAgLyoqXG4gICAgICogQGRlc2MgaW5zdGFsbHMgU3RyaW5nIHByb3RvdHlwZSBleHRlbnNpb25zXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZXF1aXJlICgnYW5zaWNvbG9yJykubmljZVxuICAgICAqIGNvbnNvbGUubG9nICgnZm9vJy5icmlnaHQucmVkKVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXQgbmljZSAoKSB7XG5cbiAgICAgICAgQ29sb3JzLm5hbWVzLmZvckVhY2ggKGsgPT4ge1xuICAgICAgICAgICAgaWYgKCEoayBpbiBTdHJpbmcucHJvdG90eXBlKSkge1xuICAgICAgICAgICAgICAgIE8uZGVmaW5lUHJvcGVydHkgKFN0cmluZy5wcm90b3R5cGUsIGssIHsgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBDb2xvcnNba10gKHRoaXMpIH0gfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gQ29sb3JzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGRlc2MgcGFyc2VzIGEgc3RyaW5nIGNvbnRhaW5pbmcgQU5TSSBlc2NhcGUgY29kZXNcbiAgICAgKiBAcmV0dXJuIHtDb2xvcnN9IHBhcnNlZCByZXByZXNlbnRhdGlvbi5cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFyc2UgKHMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2xvcnMgKHMpLnBhcnNlZFxuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmcgfCAoKSA9PiBzdHJpbmd9IHMgc3RyaW5nIG9yIGEgZnVuY3Rpb24gcmV0dXJuaW5nIGEgc3RyaW5nIChmb3IgbGFyZ2Ugc3RyaW5ncyB5b3UgbWF5IHdhbnQgdG8gdXNlIGEgZnVuY3Rpb24gdG8gYXZvaWQgbWVtb3J5IGlzc3VlcylcbiAgICAgKiBAcmV0dXJucyB7R2VuZXJhdG9yPFNwYW4sIHZvaWQsICo+fSBTcGFucyBpdGVyYXRvclxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZUl0ZXJhdG9yKHMpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlQW5zaShyYXdQYXJzZSh0eXBlb2YgcyA9PT0gXCJzdHJpbmdcIiA/ICgpID0+IHMgOiBzKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGRlc2Mgc3RyaXBzIEFOU0kgY29kZXMgZnJvbSBhIHN0cmluZ1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzIGEgc3RyaW5nIGNvbnRhaW5pbmcgQU5TSSBlc2NhcGUgY29kZXMuXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBjbGVhbiBzdHJpbmcuXG4gICAgICovXG4gICAgc3RhdGljIHN0cmlwIChzKSB7XG4gICAgICAgIHJldHVybiBzLnJlcGxhY2UgKC9bXFx1MDAxYlxcdTAwOWJdW1soKSM7P10qKD86WzAtOV17MSw0fSg/OjtbMC05XXswLDR9KSopP1swLTlBLVBSWmNmLW5xcnk9PjxdL2csICcnKSAvLyBob3BlIFY4IGNhY2hlcyB0aGUgcmVnZXhwXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGRlc2MgY2hlY2tzIGlmIGEgdmFsdWUgY29udGFpbnMgQU5TSSBlc2NhcGUgY29kZXNcbiAgICAgKiBAcGFyYW0ge2FueX0gcyB2YWx1ZSB0byBjaGVja1xuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IGhhcyBjb2Rlc1xuICAgICAqL1xuICAgICBzdGF0aWMgaXNFc2NhcGVkIChzKSB7XG4gICAgICAgIHMgPSBTdHJpbmcocylcbiAgICAgICAgcmV0dXJuIENvbG9ycy5zdHJpcCAocykgIT09IHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBzcGFucyA9IFsuLi5hbnNpLnBhcnNlICgnXFx1MDAxYls3bVxcdTAwMWJbN21mb29cXHUwMDFiWzdtYmFyXFx1MDAxYlsyN20nKV1cbiAgICAgKi9cbiAgICBbU3ltYm9sLml0ZXJhdG9yXSAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNwYW5zW1N5bWJvbC5pdGVyYXRvcl0gKClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBUaGlzIGFsbG93cyBhbiBhbHRlcm5hdGl2ZSBpbXBvcnQgc3R5bGUsIHNlZSBodHRwczovL2dpdGh1Yi5jb20veHBsL2Fuc2ljb2xvci9pc3N1ZXMvNyNpc3N1ZWNvbW1lbnQtNTc4OTIzNTc4XG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBpbXBvcnQgeyBhbnNpY29sb3IsIFBhcnNlZFNwYW4gfSBmcm9tICdhbnNpY29sb3InXG4gICAgICovXG4gICAgc3RhdGljIGdldCBhbnNpY29sb3IgKCkge1xuICAgICAgICByZXR1cm4gQ29sb3JzXG4gICAgfVxufVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmFzc2lnblN0cmluZ1dyYXBwaW5nQVBJIChDb2xvcnMsIHN0ciA9PiBzdHIpXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuQ29sb3JzLm5hbWVzID0gc3RyaW5nV3JhcHBpbmdNZXRob2RzLm1hcCAoKFtrXSkgPT4gaylcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5Db2xvcnMucmdiID0ge1xuXG4gICAgYmxhY2s6ICAgICAgICBbMCwgICAgIDAsICAgMF0sICAgIFxuICAgIGRhcmtHcmF5OiAgICAgWzEwMCwgMTAwLCAxMDBdLFxuICAgIGxpZ2h0R3JheTogICAgWzIwMCwgMjAwLCAyMDBdLFxuICAgIHdoaXRlOiAgICAgICAgWzI1NSwgMjU1LCAyNTVdLFxuXG4gICAgcmVkOiAgICAgICAgICBbMjA0LCAgIDAsICAgMF0sXG4gICAgbGlnaHRSZWQ6ICAgICBbMjU1LCAgNTEsICAgMF0sXG4gICAgXG4gICAgZ3JlZW46ICAgICAgICBbMCwgICAyMDQsICAgMF0sXG4gICAgbGlnaHRHcmVlbjogICBbNTEsICAyMDQsICA1MV0sXG4gICAgXG4gICAgeWVsbG93OiAgICAgICBbMjA0LCAxMDIsICAgMF0sXG4gICAgbGlnaHRZZWxsb3c6ICBbMjU1LCAxNTMsICA1MV0sXG4gICAgXG4gICAgYmx1ZTogICAgICAgICBbMCwgICAgIDAsIDI1NV0sXG4gICAgbGlnaHRCbHVlOiAgICBbMjYsICAxNDAsIDI1NV0sXG4gICAgXG4gICAgbWFnZW50YTogICAgICBbMjA0LCAgIDAsIDIwNF0sXG4gICAgbGlnaHRNYWdlbnRhOiBbMjU1LCAgIDAsIDI1NV0sXG4gICAgXG4gICAgY3lhbjogICAgICAgICBbMCwgICAxNTMsIDI1NV0sXG4gICAgbGlnaHRDeWFuOiAgICBbMCwgICAyMDQsIDI1NV0sXG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBDb2xvcnNcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG4iXX0=