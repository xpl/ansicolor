"use strict";

/*  ------------------------------------------------------------------------ */

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

};var clean = function clean(obj) {
    for (var k in obj) {
        if (!obj[k]) {
            delete obj[k];
        }
    }
    return O.keys(obj).length === 0 ? undefined : obj;
};

/*  ------------------------------------------------------------------------ */

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
            return clean({ name: this.name === 'default' ? '' : this.name,
                bright: this.brightness === Code.bright,
                dim: this.brightness === Code.dim });
        }
    }]);

    return Color;
}();

/*  ------------------------------------------------------------------------ */

var Code = function () {
    function Code(n) {
        _classCallCheck(this, Code);

        if (n !== undefined) {
            this.value = Number(n);
        }
    }

    _createClass(Code, [{
        key: 'type',
        get: function get() {
            return types[Math.floor(this.value / 10)];
        }
    }, {
        key: 'subtype',
        get: function get() {
            return subtypes[this.type][this.value % 10];
        }
    }, {
        key: 'str',
        get: function get() {
            return this.value ? '\x1B[' + this.value + 'm' : '';
        }
    }, {
        key: 'isBrightness',
        get: function get() {
            return this.value === Code.noBrightness || this.value === Code.bright || this.value === Code.dim;
        }
    }], [{
        key: 'str',
        value: function str(x) {
            return new Code(x).str;
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

function rawParse(s) {

    var state = TEXT,
        buffer = '',
        text = '',
        code = '',
        codes = [];
    var spans = [];

    for (var i = 0, n = s.length; i < n; i++) {

        var c = s[i];

        buffer += c;

        switch (state) {

            case TEXT:
                if (c === '\x1B') {
                    state = BRACKET;buffer = c;
                } else {
                    text += c;
                }
                break;

            case BRACKET:
                if (c === '[') {
                    state = CODE;code = '';codes = [];
                } else {
                    state = TEXT;text += buffer;
                }
                break;

            case CODE:

                if (c >= '0' && c <= '9') {
                    code += c;
                } else if (c === ';') {
                    codes.push(new Code(code));code = '';
                } else if (c === 'm') {
                    code = code || '0';
                    codes.push(new Code(code));
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = codes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var _code = _step.value;
                            spans.push({ text: text, code: _code });text = '';
                        }
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion && _iterator.return) {
                                _iterator.return();
                            }
                        } finally {
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }

                    state = TEXT;
                } else {
                    state = TEXT;text += buffer;
                }
        }
    }

    if (state !== TEXT) text += buffer;

    if (text) spans.push({ text: text, code: new Code() });

    return spans;
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

        this.spans = s ? rawParse(s) : [];
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

            var color = void 0,
                bgColor = void 0,
                brightness = void 0,
                styles = void 0;

            function reset() {

                color = new Color(), bgColor = new Color(true /* background */), brightness = undefined, styles = new Set();
            }

            reset();

            return O.assign(new Colors(), {

                spans: this.spans.map(function (span) {

                    var c = span.code;

                    var inverted = styles.has('inverse'),
                        underline = styles.has('underline') ? 'text-decoration: underline;' : '',
                        italic = styles.has('italic') ? 'font-style: italic;' : '',
                        bold = brightness === Code.bright ? 'font-weight: bold;' : '';

                    var foreColor = color.defaultBrightness(brightness);

                    var styledSpan = O.assign({ css: bold + italic + underline + foreColor.css(inverted) + bgColor.css(inverted) }, clean({ bold: !!bold, color: foreColor.clean, bgColor: bgColor.clean }), span);

                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = styles[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var k = _step2.value;
                            styledSpan[k] = true;
                        }
                    } catch (err) {
                        _didIteratorError2 = true;
                        _iteratorError2 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                _iterator2.return();
                            }
                        } finally {
                            if (_didIteratorError2) {
                                throw _iteratorError2;
                            }
                        }
                    }

                    if (c.isBrightness) {

                        brightness = c.value;
                    } else if (span.code.value !== undefined) {

                        if (span.code.value === Code.reset) {
                            reset();
                        } else {

                            switch (span.code.type) {

                                case 'color':
                                case 'colorLight':
                                    color = new Color(false, c.subtype);break;

                                case 'bgColor':
                                case 'bgColorLight':
                                    bgColor = new Color(true, c.subtype);break;

                                case 'style':
                                    styles.add(c.subtype);break;
                                case 'unstyle':
                                    styles.delete(c.subtype);break;
                            }
                        }
                    }

                    return styledSpan;
                }).filter(function (s) {
                    return s.text.length > 0;
                })
            });
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RUFBWSxFQUFaLENBWEw7O0FBYVQsWUFBYyxDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQWEsQ0FBYixDQWJMO0FBY1QsaUJBQWMsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFZLEVBQVosQ0FkTDs7QUFnQlQsVUFBYyxDQUFDLENBQUQsRUFBUSxDQUFSLEVBQVcsR0FBWCxDQWhCTDtBQWlCVCxlQUFjLENBQUMsRUFBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBakJMOztBQW1CVCxhQUFjLENBQUMsR0FBRCxFQUFRLENBQVIsRUFBVyxHQUFYLENBbkJMO0FBb0JULGtCQUFjLENBQUMsR0FBRCxFQUFRLENBQVIsRUFBVyxHQUFYLENBcEJMOztBQXNCVCxVQUFjLENBQUMsQ0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBdEJMO0FBdUJULGVBQWMsQ0FBQyxDQUFELEVBQU0sR0FBTixFQUFXLEdBQVg7O0FBR2xCOztBQTFCYSxDQUFiLENBNEJBLE9BQU8sT0FBUCxHQUFpQixNQUFqQjs7QUFFQSIsImZpbGUiOiJhbnNpY29sb3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBPID0gT2JqZWN0XG5cbi8qICBTZWUgaHR0cHM6Ly9taXNjLmZsb2dpc29mdC5jb20vYmFzaC90aXBfY29sb3JzX2FuZF9mb3JtYXR0aW5nXG4gICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IGNvbG9yQ29kZXMgICAgICA9IFsgICAnYmxhY2snLCAgICAgICdyZWQnLCAgICAgICdncmVlbicsICAgICAgJ3llbGxvdycsICAgICAgJ2JsdWUnLCAgICAgICdtYWdlbnRhJywgICAgICAnY3lhbicsICdsaWdodEdyYXknLCAnJywgJ2RlZmF1bHQnXVxuICAgICwgY29sb3JDb2Rlc0xpZ2h0ID0gWydkYXJrR3JheScsICdsaWdodFJlZCcsICdsaWdodEdyZWVuJywgJ2xpZ2h0WWVsbG93JywgJ2xpZ2h0Qmx1ZScsICdsaWdodE1hZ2VudGEnLCAnbGlnaHRDeWFuJywgJ3doaXRlJywgJyddXG4gICAgXG4gICAgLCBzdHlsZUNvZGVzID0gWycnLCAnYnJpZ2h0JywgJ2RpbScsICdpdGFsaWMnLCAndW5kZXJsaW5lJywgJycsICcnLCAnaW52ZXJzZSddXG5cbiAgICAsIGFzQnJpZ2h0ID0geyAncmVkJzogICAgICAgJ2xpZ2h0UmVkJyxcbiAgICAgICAgICAgICAgICAgICAnZ3JlZW4nOiAgICAgJ2xpZ2h0R3JlZW4nLFxuICAgICAgICAgICAgICAgICAgICd5ZWxsb3cnOiAgICAnbGlnaHRZZWxsb3cnLFxuICAgICAgICAgICAgICAgICAgICdibHVlJzogICAgICAnbGlnaHRCbHVlJyxcbiAgICAgICAgICAgICAgICAgICAnbWFnZW50YSc6ICAgJ2xpZ2h0TWFnZW50YScsXG4gICAgICAgICAgICAgICAgICAgJ2N5YW4nOiAgICAgICdsaWdodEN5YW4nLFxuICAgICAgICAgICAgICAgICAgICdibGFjayc6ICAgICAnZGFya0dyYXknLFxuICAgICAgICAgICAgICAgICAgICdsaWdodEdyYXknOiAnd2hpdGUnIH1cbiAgICBcbiAgICAsIHR5cGVzID0geyAwOiAgJ3N0eWxlJyxcbiAgICAgICAgICAgICAgICAyOiAgJ3Vuc3R5bGUnLFxuICAgICAgICAgICAgICAgIDM6ICAnY29sb3InLFxuICAgICAgICAgICAgICAgIDk6ICAnY29sb3JMaWdodCcsXG4gICAgICAgICAgICAgICAgNDogICdiZ0NvbG9yJyxcbiAgICAgICAgICAgICAgICAxMDogJ2JnQ29sb3JMaWdodCcgfVxuXG4gICAgLCBzdWJ0eXBlcyA9IHsgIGNvbG9yOiAgICAgICAgIGNvbG9yQ29kZXMsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yTGlnaHQ6ICAgIGNvbG9yQ29kZXNMaWdodCxcbiAgICAgICAgICAgICAgICAgICAgYmdDb2xvcjogICAgICAgY29sb3JDb2RlcyxcbiAgICAgICAgICAgICAgICAgICAgYmdDb2xvckxpZ2h0OiAgY29sb3JDb2Rlc0xpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBzdHlsZTogICAgICAgICBzdHlsZUNvZGVzLFxuICAgICAgICAgICAgICAgICAgICB1bnN0eWxlOiAgICAgICBzdHlsZUNvZGVzICAgIH1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBjbGVhbiA9IG9iaiA9PiB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBrIGluIG9iaikgeyBpZiAoIW9ialtrXSkgeyBkZWxldGUgb2JqW2tdIH0gfVxuICAgICAgICAgICAgICAgIHJldHVybiAoTy5rZXlzIChvYmopLmxlbmd0aCA9PT0gMCkgPyB1bmRlZmluZWQgOiBvYmpcbiAgICAgICAgICAgIH1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jbGFzcyBDb2xvciB7XG5cbiAgICBjb25zdHJ1Y3RvciAoYmFja2dyb3VuZCwgbmFtZSwgYnJpZ2h0bmVzcykge1xuXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZCA9IGJhY2tncm91bmRcbiAgICAgICAgdGhpcy5uYW1lICAgICAgID0gbmFtZVxuICAgICAgICB0aGlzLmJyaWdodG5lc3MgPSBicmlnaHRuZXNzXG4gICAgfVxuXG4gICAgZ2V0IGludmVyc2UgKCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbG9yICghdGhpcy5iYWNrZ3JvdW5kLCB0aGlzLm5hbWUgfHwgKHRoaXMuYmFja2dyb3VuZCA/ICdibGFjaycgOiAnd2hpdGUnKSwgdGhpcy5icmlnaHRuZXNzKVxuICAgIH1cblxuICAgIGdldCBjbGVhbiAoKSB7XG4gICAgICAgIHJldHVybiBjbGVhbiAoeyBuYW1lOiAgIHRoaXMubmFtZSA9PT0gJ2RlZmF1bHQnID8gJycgOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBicmlnaHQ6IHRoaXMuYnJpZ2h0bmVzcyA9PT0gQ29kZS5icmlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBkaW06ICAgIHRoaXMuYnJpZ2h0bmVzcyA9PT0gQ29kZS5kaW0gfSlcbiAgICB9XG5cbiAgICBkZWZhdWx0QnJpZ2h0bmVzcyAodmFsdWUpIHtcblxuICAgICAgICByZXR1cm4gbmV3IENvbG9yICh0aGlzLmJhY2tncm91bmQsIHRoaXMubmFtZSwgdGhpcy5icmlnaHRuZXNzIHx8IHZhbHVlKVxuICAgIH1cblxuICAgIGNzcyAoaW52ZXJ0ZWQpIHtcblxuICAgICAgICBjb25zdCBjb2xvciA9IGludmVydGVkID8gdGhpcy5pbnZlcnNlIDogdGhpc1xuXG4gICAgICAgIGNvbnN0IHJnYk5hbWUgPSAoKGNvbG9yLmJyaWdodG5lc3MgPT09IENvZGUuYnJpZ2h0KSAmJiBhc0JyaWdodFtjb2xvci5uYW1lXSkgfHwgY29sb3IubmFtZVxuXG4gICAgICAgIGNvbnN0IHByb3AgPSAoY29sb3IuYmFja2dyb3VuZCA/ICdiYWNrZ3JvdW5kOicgOiAnY29sb3I6JylcbiAgICAgICAgICAgICwgcmdiICA9IENvbG9ycy5yZ2JbcmdiTmFtZV1cbiAgICAgICAgICAgICwgYWxwaGEgPSAodGhpcy5icmlnaHRuZXNzID09PSBDb2RlLmRpbSkgPyAwLjUgOiAxXG5cbiAgICAgICAgcmV0dXJuIHJnYlxuICAgICAgICAgICAgICAgID8gKHByb3AgKyAncmdiYSgnICsgWy4uLnJnYiwgYWxwaGFdLmpvaW4gKCcsJykgKyAnKTsnKVxuICAgICAgICAgICAgICAgIDogKCghY29sb3IuYmFja2dyb3VuZCAmJiAoYWxwaGEgPCAxKSkgPyAnY29sb3I6cmdiYSgwLDAsMCwwLjUpOycgOiAnJykgLy8gQ2hyb21lIGRvZXMgbm90IHN1cHBvcnQgJ29wYWNpdHknIHByb3BlcnR5Li4uXG4gICAgfVxufVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNsYXNzIENvZGUge1xuXG4gICAgY29uc3RydWN0b3IgKG4pIHtcbiAgICAgICAgaWYgKG4gIT09IHVuZGVmaW5lZCkgeyB0aGlzLnZhbHVlID0gTnVtYmVyIChuKSB9IH1cblxuICAgIGdldCB0eXBlICgpIHtcbiAgICAgICByZXR1cm4gdHlwZXNbTWF0aC5mbG9vciAodGhpcy52YWx1ZSAvIDEwKV0gfVxuXG4gICAgZ2V0IHN1YnR5cGUgKCkge1xuICAgICAgICByZXR1cm4gc3VidHlwZXNbdGhpcy50eXBlXVt0aGlzLnZhbHVlICUgMTBdIH1cblxuICAgIGdldCBzdHIgKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMudmFsdWUgPyAoJ1xcdTAwMWJcXFsnICsgdGhpcy52YWx1ZSArICdtJykgOiAnJykgfVxuXG4gICAgc3RhdGljIHN0ciAoeCkge1xuICAgICAgICByZXR1cm4gbmV3IENvZGUgKHgpLnN0ciB9XG5cbiAgICBnZXQgaXNCcmlnaHRuZXNzICgpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLnZhbHVlID09PSBDb2RlLm5vQnJpZ2h0bmVzcykgfHwgKHRoaXMudmFsdWUgPT09IENvZGUuYnJpZ2h0KSB8fCAodGhpcy52YWx1ZSA9PT0gQ29kZS5kaW0pIH1cbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5PLmFzc2lnbiAoQ29kZSwge1xuXG4gICAgcmVzZXQ6ICAgICAgICAwLFxuICAgIGJyaWdodDogICAgICAgMSxcbiAgICBkaW06ICAgICAgICAgIDIsXG4gICAgaW52ZXJzZTogICAgICA3LFxuICAgIG5vQnJpZ2h0bmVzczogMjIsXG4gICAgbm9JdGFsaWM6ICAgICAyMyxcbiAgICBub1VuZGVybGluZTogIDI0LFxuICAgIG5vSW52ZXJzZTogICAgMjcsXG4gICAgbm9Db2xvcjogICAgICAzOSxcbiAgICBub0JnQ29sb3I6ICAgIDQ5XG59KVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IHJlcGxhY2VBbGwgPSAoc3RyLCBhLCBiKSA9PiBzdHIuc3BsaXQgKGEpLmpvaW4gKGIpXG5cbi8qICBBTlNJIGJyaWdodG5lc3MgY29kZXMgZG8gbm90IG92ZXJsYXAsIGUuZy4gXCJ7YnJpZ2h0fXtkaW19Zm9vXCIgd2lsbCBiZSByZW5kZXJlZCBicmlnaHQgKG5vdCBkaW0pLlxuICAgIFNvIHdlIGZpeCBpdCBieSBhZGRpbmcgYnJpZ2h0bmVzcyBjYW5jZWxpbmcgYmVmb3JlIGVhY2ggYnJpZ2h0bmVzcyBjb2RlLCBzbyB0aGUgZm9ybWVyIGV4YW1wbGUgZ2V0c1xuICAgIGNvbnZlcnRlZCB0byBcIntub0JyaWdodG5lc3N9e2JyaWdodH17bm9CcmlnaHRuZXNzfXtkaW19Zm9vXCIg4oCTIHRoaXMgd2F5IGl0IGdldHMgcmVuZGVyZWQgYXMgZXhwZWN0ZWQuXG4gKi9cblxuY29uc3QgZGVub3JtYWxpemVCcmlnaHRuZXNzID0gcyA9PiBzLnJlcGxhY2UgKC8oXFx1MDAxYlxcWygxfDIpbSkvZywgJ1xcdTAwMWJbMjJtJDEnKVxuY29uc3Qgbm9ybWFsaXplQnJpZ2h0bmVzcyA9IHMgPT4gcy5yZXBsYWNlICgvXFx1MDAxYlxcWzIybShcXHUwMDFiXFxbKDF8MiltKS9nLCAnJDEnKVxuXG5jb25zdCB3cmFwID0gKHgsIG9wZW5Db2RlLCBjbG9zZUNvZGUpID0+IHtcblxuICAgIGNvbnN0IG9wZW4gID0gQ29kZS5zdHIgKG9wZW5Db2RlKSxcbiAgICAgICAgICBjbG9zZSA9IENvZGUuc3RyIChjbG9zZUNvZGUpXG5cbiAgICByZXR1cm4gU3RyaW5nICh4KVxuICAgICAgICAgICAgICAgIC5zcGxpdCAoJ1xcbicpXG4gICAgICAgICAgICAgICAgLm1hcCAobGluZSA9PiBkZW5vcm1hbGl6ZUJyaWdodG5lc3MgKG9wZW4gKyByZXBsYWNlQWxsIChub3JtYWxpemVCcmlnaHRuZXNzIChsaW5lKSwgY2xvc2UsIG9wZW4pICsgY2xvc2UpKVxuICAgICAgICAgICAgICAgIC5qb2luICgnXFxuJylcbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBjYW1lbCA9IChhLCBiKSA9PiBhICsgYi5jaGFyQXQgKDApLnRvVXBwZXJDYXNlICgpICsgYi5zbGljZSAoMSlcblxuXG5jb25zdCBzdHJpbmdXcmFwcGluZ01ldGhvZHMgPSAoKCkgPT4gW1xuXG4gICAgICAgIC4uLmNvbG9yQ29kZXMubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFsgLy8gY29sb3IgbWV0aG9kc1xuXG4gICAgICAgICAgICBbaywgICAgICAgICAgICAgICAzMCArIGksIENvZGUubm9Db2xvcl0sXG4gICAgICAgICAgICBbY2FtZWwgKCdiZycsIGspLCA0MCArIGksIENvZGUubm9CZ0NvbG9yXSxcbiAgICAgICAgXSksXG5cbiAgICAgICAgLi4uY29sb3JDb2Rlc0xpZ2h0Lm1hcCAoKGssIGkpID0+ICFrID8gW10gOiBbIC8vIGxpZ2h0IGNvbG9yIG1ldGhvZHNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgW2ssICAgICAgICAgICAgICAgIDkwICsgaSwgQ29kZS5ub0NvbG9yXSxcbiAgICAgICAgICAgIFtjYW1lbCAoJ2JnJywgayksIDEwMCArIGksIENvZGUubm9CZ0NvbG9yXSxcbiAgICAgICAgXSksXG5cbiAgICAgICAgLyogVEhJUyBPTkUgSVMgRk9SIEJBQ0tXQVJEUyBDT01QQVRJQklMSVRZIFdJVEggUFJFVklPVVMgVkVSU0lPTlMgKGhhZCAnYnJpZ2h0JyBpbnN0ZWFkIG9mICdsaWdodCcgZm9yIGJhY2tncm91bmRzKVxuICAgICAgICAgKi9cbiAgICAgICAgLi4uWycnLCAnQnJpZ2h0UmVkJywgJ0JyaWdodEdyZWVuJywgJ0JyaWdodFllbGxvdycsICdCcmlnaHRCbHVlJywgJ0JyaWdodE1hZ2VudGEnLCAnQnJpZ2h0Q3lhbiddLm1hcCAoKGssIGkpID0+ICFrID8gW10gOiBbXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFsnYmcnICsgaywgMTAwICsgaSwgQ29kZS5ub0JnQ29sb3JdLFxuICAgICAgICBdKSxcbiAgICAgICAgXG4gICAgICAgIC4uLnN0eWxlQ29kZXMubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFsgLy8gc3R5bGUgbWV0aG9kc1xuXG4gICAgICAgICAgICBbaywgaSwgKChrID09PSAnYnJpZ2h0JykgfHwgKGsgPT09ICdkaW0nKSkgPyBDb2RlLm5vQnJpZ2h0bmVzcyA6ICgyMCArIGkpXVxuICAgICAgICBdKVxuICAgIF1cbiAgICAucmVkdWNlICgoYSwgYikgPT4gYS5jb25jYXQgKGIpKVxuICAgIFxuKSAoKTtcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBhc3NpZ25TdHJpbmdXcmFwcGluZ0FQSSA9ICh0YXJnZXQsIHdyYXBCZWZvcmUgPSB0YXJnZXQpID0+XG5cbiAgICBzdHJpbmdXcmFwcGluZ01ldGhvZHMucmVkdWNlICgobWVtbywgW2ssIG9wZW4sIGNsb3NlXSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPLmRlZmluZVByb3BlcnR5IChtZW1vLCBrLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldDogKCkgPT4gYXNzaWduU3RyaW5nV3JhcHBpbmdBUEkgKHN0ciA9PiB3cmFwQmVmb3JlICh3cmFwIChzdHIsIG9wZW4sIGNsb3NlKSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQpXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgVEVYVCAgICA9IDAsXG4gICAgICBCUkFDS0VUID0gMSxcbiAgICAgIENPREUgICAgPSAyXG5cbmZ1bmN0aW9uIHJhd1BhcnNlIChzKSB7XG4gICAgXG4gICAgbGV0IHN0YXRlID0gVEVYVCwgYnVmZmVyID0gJycsIHRleHQgPSAnJywgY29kZSA9ICcnLCBjb2RlcyA9IFtdXG4gICAgbGV0IHNwYW5zID0gW11cblxuICAgIGZvciAobGV0IGkgPSAwLCBuID0gcy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcblxuICAgICAgICBjb25zdCBjID0gc1tpXVxuXG4gICAgICAgIGJ1ZmZlciArPSBjXG5cbiAgICAgICAgc3dpdGNoIChzdGF0ZSkge1xuXG4gICAgICAgICAgICBjYXNlIFRFWFQ6XG4gICAgICAgICAgICAgICAgaWYgKGMgPT09ICdcXHUwMDFiJykgeyBzdGF0ZSA9IEJSQUNLRVQ7IGJ1ZmZlciA9IGM7IH1cbiAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgIHsgdGV4dCArPSBjIH1cbiAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICBjYXNlIEJSQUNLRVQ6XG4gICAgICAgICAgICAgICAgaWYgKGMgPT09ICdbJykgeyBzdGF0ZSA9IENPREU7IGNvZGUgPSAnJzsgY29kZXMgPSBbXSB9XG4gICAgICAgICAgICAgICAgZWxzZSAgICAgICAgICAgeyBzdGF0ZSA9IFRFWFQ7IHRleHQgKz0gYnVmZmVyIH1cbiAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICBjYXNlIENPREU6XG5cbiAgICAgICAgICAgICAgICBpZiAoKGMgPj0gJzAnKSAmJiAoYyA8PSAnOScpKSB7IGNvZGUgKz0gYyB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYyA9PT0gJzsnKSAgICAgICAgICAgeyBjb2Rlcy5wdXNoIChuZXcgQ29kZSAoY29kZSkpOyBjb2RlID0gJycgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKChjID09PSAnbScpKSAgICAgICAgIHsgY29kZSA9IGNvZGUgfHwgJzAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2Rlcy5wdXNoIChuZXcgQ29kZSAoY29kZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvZGUgb2YgY29kZXMpIHsgc3BhbnMucHVzaCAoeyB0ZXh0LCBjb2RlIH0pOyB0ZXh0ID0gJycgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBURVhUXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgIHsgc3RhdGUgPSBURVhUOyB0ZXh0ICs9IGJ1ZmZlciB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3RhdGUgIT09IFRFWFQpIHRleHQgKz0gYnVmZmVyXG5cbiAgICBpZiAodGV4dCkgc3BhbnMucHVzaCAoeyB0ZXh0LCBjb2RlOiBuZXcgQ29kZSAoKSB9KVxuXG4gICAgcmV0dXJuIHNwYW5zXG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIEFOU0ktZXNjYXBlZCBzdHJpbmcuXG4gKi9cbmNsYXNzIENvbG9ycyB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcyBhIHN0cmluZyBjb250YWluaW5nIEFOU0kgZXNjYXBlIGNvZGVzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChzKSB7XG5cbiAgICAgICAgdGhpcy5zcGFucyA9IHMgPyByYXdQYXJzZSAocykgOiBbXVxuICAgIH1cblxuICAgIGdldCBzdHIgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zcGFucy5yZWR1Y2UgKChzdHIsIHApID0+IHN0ciArIHAudGV4dCArIHAuY29kZS5zdHIsICcnKVxuICAgIH1cblxuICAgIGdldCBwYXJzZWQgKCkge1xuXG4gICAgICAgIGxldCBjb2xvciwgYmdDb2xvciwgYnJpZ2h0bmVzcywgc3R5bGVzXG5cbiAgICAgICAgZnVuY3Rpb24gcmVzZXQgKCkge1xuXG4gICAgICAgICAgICBjb2xvciAgICAgID0gbmV3IENvbG9yICgpLFxuICAgICAgICAgICAgYmdDb2xvciAgICA9IG5ldyBDb2xvciAodHJ1ZSAvKiBiYWNrZ3JvdW5kICovKSxcbiAgICAgICAgICAgIGJyaWdodG5lc3MgPSB1bmRlZmluZWQsXG4gICAgICAgICAgICBzdHlsZXMgICAgID0gbmV3IFNldCAoKVxuICAgICAgICB9XG5cbiAgICAgICAgcmVzZXQgKClcblxuICAgICAgICByZXR1cm4gTy5hc3NpZ24gKG5ldyBDb2xvcnMgKCksIHtcblxuICAgICAgICAgICAgc3BhbnM6IHRoaXMuc3BhbnMubWFwIChzcGFuID0+IHtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGMgPSBzcGFuLmNvZGVcblxuICAgICAgICAgICAgICAgIGNvbnN0IGludmVydGVkICA9IHN0eWxlcy5oYXMgKCdpbnZlcnNlJyksXG4gICAgICAgICAgICAgICAgICAgICAgdW5kZXJsaW5lID0gc3R5bGVzLmhhcyAoJ3VuZGVybGluZScpICAgPyAndGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7JyA6ICcnLCAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICBpdGFsaWMgICAgPSBzdHlsZXMuaGFzICgnaXRhbGljJykgICAgICA/ICdmb250LXN0eWxlOiBpdGFsaWM7JyA6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvbGQgICAgICA9IGJyaWdodG5lc3MgPT09IENvZGUuYnJpZ2h0ID8gJ2ZvbnQtd2VpZ2h0OiBib2xkOycgOiAnJ1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZm9yZUNvbG9yID0gY29sb3IuZGVmYXVsdEJyaWdodG5lc3MgKGJyaWdodG5lc3MpXG5cbiAgICAgICAgICAgICAgICBjb25zdCBzdHlsZWRTcGFuID0gTy5hc3NpZ24gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgY3NzOiBib2xkICsgaXRhbGljICsgdW5kZXJsaW5lICsgZm9yZUNvbG9yLmNzcyAoaW52ZXJ0ZWQpICsgYmdDb2xvci5jc3MgKGludmVydGVkKSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFuICh7IGJvbGQ6ICEhYm9sZCwgY29sb3I6IGZvcmVDb2xvci5jbGVhbiwgYmdDb2xvcjogYmdDb2xvci5jbGVhbiB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGFuKVxuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBrIG9mIHN0eWxlcykgeyBzdHlsZWRTcGFuW2tdID0gdHJ1ZSB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYy5pc0JyaWdodG5lc3MpIHtcblxuICAgICAgICAgICAgICAgICAgICBicmlnaHRuZXNzID0gYy52YWx1ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3Bhbi5jb2RlLnZhbHVlICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5jb2RlLnZhbHVlID09PSBDb2RlLnJlc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNldCAoKVxuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoc3Bhbi5jb2RlLnR5cGUpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbG9yJyAgICAgICAgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbG9yTGlnaHQnICAgOiBjb2xvciAgID0gbmV3IENvbG9yIChmYWxzZSwgYy5zdWJ0eXBlKTsgYnJlYWtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2JnQ29sb3InICAgICAgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2JnQ29sb3JMaWdodCcgOiBiZ0NvbG9yID0gbmV3IENvbG9yICh0cnVlLCAgYy5zdWJ0eXBlKTsgYnJlYWtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0eWxlJyAgOiBzdHlsZXMuYWRkICAgIChjLnN1YnR5cGUpOyBicmVha1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3Vuc3R5bGUnOiBzdHlsZXMuZGVsZXRlIChjLnN1YnR5cGUpOyBicmVha1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlZFNwYW5cblxuICAgICAgICAgICAgfSkuZmlsdGVyIChzID0+IHMudGV4dC5sZW5ndGggPiAwKVxuICAgICAgICB9KVxuICAgIH1cblxuLyogIE91dHB1dHMgd2l0aCBDaHJvbWUgRGV2VG9vbHMtY29tcGF0aWJsZSBmb3JtYXQgICAgICovXG5cbiAgICBnZXQgYXNDaHJvbWVDb25zb2xlTG9nQXJndW1lbnRzICgpIHtcblxuICAgICAgICBjb25zdCBzcGFucyA9IHRoaXMucGFyc2VkLnNwYW5zXG5cbiAgICAgICAgcmV0dXJuIFtzcGFucy5tYXAgKHMgPT4gKCclYycgKyBzLnRleHQpKS5qb2luICgnJyksXG4gICAgICAgICAgICAgLi4uc3BhbnMubWFwIChzID0+IHMuY3NzKV1cbiAgICB9XG5cbiAgICBnZXQgYnJvd3NlckNvbnNvbGVBcmd1bWVudHMgKCkgLyogTEVHQUNZLCBERVBSRUNBVEVEICovIHsgcmV0dXJuIHRoaXMuYXNDaHJvbWVDb25zb2xlTG9nQXJndW1lbnRzIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIGluc3RhbGxzIFN0cmluZyBwcm90b3R5cGUgZXh0ZW5zaW9uc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVxdWlyZSAoJ2Fuc2ljb2xvcicpLm5pY2VcbiAgICAgKiBjb25zb2xlLmxvZyAoJ2ZvbycuYnJpZ2h0LnJlZClcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IG5pY2UgKCkge1xuXG4gICAgICAgIENvbG9ycy5uYW1lcy5mb3JFYWNoIChrID0+IHtcbiAgICAgICAgICAgIGlmICghKGsgaW4gU3RyaW5nLnByb3RvdHlwZSkpIHtcbiAgICAgICAgICAgICAgICBPLmRlZmluZVByb3BlcnR5IChTdHJpbmcucHJvdG90eXBlLCBrLCB7IGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gQ29sb3JzW2tdICh0aGlzKSB9IH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIENvbG9yc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIHBhcnNlcyBhIHN0cmluZyBjb250YWluaW5nIEFOU0kgZXNjYXBlIGNvZGVzXG4gICAgICogQHJldHVybiB7Q29sb3JzfSBwYXJzZWQgcmVwcmVzZW50YXRpb24uXG4gICAgICovXG4gICAgc3RhdGljIHBhcnNlIChzKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29sb3JzIChzKS5wYXJzZWRcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBzdHJpcHMgQU5TSSBjb2RlcyBmcm9tIGEgc3RyaW5nXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlcy5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IGNsZWFuIHN0cmluZy5cbiAgICAgKi9cbiAgICBzdGF0aWMgc3RyaXAgKHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSAoL1tcXHUwMDFiXFx1MDA5Yl1bWygpIzs/XSooPzpbMC05XXsxLDR9KD86O1swLTldezAsNH0pKik/WzAtOUEtUFJaY2YtbnFyeT0+PF0vZywgJycpIC8vIGhvcGUgVjggY2FjaGVzIHRoZSByZWdleHBcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBjaGVja3MgaWYgYSB2YWx1ZSBjb250YWlucyBBTlNJIGVzY2FwZSBjb2Rlc1xuICAgICAqIEBwYXJhbSB7YW55fSBzIHZhbHVlIHRvIGNoZWNrXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gaGFzIGNvZGVzXG4gICAgICovXG4gICAgIHN0YXRpYyBpc0VzY2FwZWQgKHMpIHtcbiAgICAgICAgcyA9IFN0cmluZyhzKVxuICAgICAgICByZXR1cm4gQ29sb3JzLnN0cmlwIChzKSAhPT0gcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNwYW5zID0gWy4uLmFuc2kucGFyc2UgKCdcXHUwMDFiWzdtXFx1MDAxYls3bWZvb1xcdTAwMWJbN21iYXJcXHUwMDFiWzI3bScpXVxuICAgICAqL1xuICAgIFtTeW1ib2wuaXRlcmF0b3JdICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3BhbnNbU3ltYm9sLml0ZXJhdG9yXSAoKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIFRoaXMgYWxsb3dzIGFuIGFsdGVybmF0aXZlIGltcG9ydCBzdHlsZSwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS94cGwvYW5zaWNvbG9yL2lzc3Vlcy83I2lzc3VlY29tbWVudC01Nzg5MjM1NzhcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGltcG9ydCB7IGFuc2ljb2xvciwgUGFyc2VkU3BhbiB9IGZyb20gJ2Fuc2ljb2xvcidcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IGFuc2ljb2xvciAoKSB7XG4gICAgICAgIHJldHVybiBDb2xvcnNcbiAgICB9XG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuYXNzaWduU3RyaW5nV3JhcHBpbmdBUEkgKENvbG9ycywgc3RyID0+IHN0cilcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5Db2xvcnMubmFtZXMgPSBzdHJpbmdXcmFwcGluZ01ldGhvZHMubWFwICgoW2tdKSA9PiBrKVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbkNvbG9ycy5yZ2IgPSB7XG5cbiAgICBibGFjazogICAgICAgIFswLCAgICAgMCwgICAwXSwgICAgXG4gICAgZGFya0dyYXk6ICAgICBbMTAwLCAxMDAsIDEwMF0sXG4gICAgbGlnaHRHcmF5OiAgICBbMjAwLCAyMDAsIDIwMF0sXG4gICAgd2hpdGU6ICAgICAgICBbMjU1LCAyNTUsIDI1NV0sXG5cbiAgICByZWQ6ICAgICAgICAgIFsyMDQsICAgMCwgICAwXSxcbiAgICBsaWdodFJlZDogICAgIFsyNTUsICA1MSwgICAwXSxcbiAgICBcbiAgICBncmVlbjogICAgICAgIFswLCAgIDIwNCwgICAwXSxcbiAgICBsaWdodEdyZWVuOiAgIFs1MSwgIDIwNCwgIDUxXSxcbiAgICBcbiAgICB5ZWxsb3c6ICAgICAgIFsyMDQsIDEwMiwgICAwXSxcbiAgICBsaWdodFllbGxvdzogIFsyNTUsIDE1MywgIDUxXSxcbiAgICBcbiAgICBibHVlOiAgICAgICAgIFswLCAgICAgMCwgMjU1XSxcbiAgICBsaWdodEJsdWU6ICAgIFsyNiwgIDE0MCwgMjU1XSxcbiAgICBcbiAgICBtYWdlbnRhOiAgICAgIFsyMDQsICAgMCwgMjA0XSxcbiAgICBsaWdodE1hZ2VudGE6IFsyNTUsICAgMCwgMjU1XSxcbiAgICBcbiAgICBjeWFuOiAgICAgICAgIFswLCAgIDE1MywgMjU1XSxcbiAgICBsaWdodEN5YW46ICAgIFswLCAgIDIwNCwgMjU1XSxcbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbG9yc1xuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbiJdfQ==