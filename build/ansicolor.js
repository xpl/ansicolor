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
                } else if (c === 'm' && code.length) {
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2Fuc2ljb2xvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTs7Ozs7Ozs7OztBQUVBLElBQU0sSUFBSSxNQUFWOztBQUVBOzs7QUFHQSxJQUFNLGFBQWtCLENBQUksT0FBSixFQUFrQixLQUFsQixFQUE4QixPQUE5QixFQUE0QyxRQUE1QyxFQUEyRCxNQUEzRCxFQUF3RSxTQUF4RSxFQUF3RixNQUF4RixFQUFnRyxXQUFoRyxFQUE2RyxFQUE3RyxFQUFpSCxTQUFqSCxDQUF4QjtBQUFBLElBQ00sa0JBQWtCLENBQUMsVUFBRCxFQUFhLFVBQWIsRUFBeUIsWUFBekIsRUFBdUMsYUFBdkMsRUFBc0QsV0FBdEQsRUFBbUUsY0FBbkUsRUFBbUYsV0FBbkYsRUFBZ0csT0FBaEcsRUFBeUcsRUFBekcsQ0FEeEI7QUFBQSxJQUdNLGFBQWEsQ0FBQyxFQUFELEVBQUssUUFBTCxFQUFlLEtBQWYsRUFBc0IsUUFBdEIsRUFBZ0MsV0FBaEMsRUFBNkMsRUFBN0MsRUFBaUQsRUFBakQsRUFBcUQsU0FBckQsQ0FIbkI7QUFBQSxJQUtNLFdBQVcsRUFBRSxPQUFhLFVBQWY7QUFDRSxhQUFhLFlBRGY7QUFFRSxjQUFhLGFBRmY7QUFHRSxZQUFhLFdBSGY7QUFJRSxlQUFhLGNBSmY7QUFLRSxZQUFhLFdBTGY7QUFNRSxhQUFhLFVBTmY7QUFPRSxpQkFBYSxPQVBmLEVBTGpCO0FBQUEsSUFjTSxRQUFRLEVBQUUsR0FBSSxPQUFOO0FBQ0UsT0FBSSxTQUROO0FBRUUsT0FBSSxPQUZOO0FBR0UsT0FBSSxZQUhOO0FBSUUsT0FBSSxTQUpOO0FBS0UsUUFBSSxjQUxOLEVBZGQ7QUFBQSxJQXFCTSxXQUFXLEVBQUcsT0FBZSxVQUFsQjtBQUNHLGdCQUFlLGVBRGxCO0FBRUcsYUFBZSxVQUZsQjtBQUdHLGtCQUFlLGVBSGxCO0FBSUcsV0FBZSxVQUpsQjtBQUtHLGFBQWU7O0FBRW5DOztBQVBpQixDQXJCakIsQ0E4QkEsSUFBTSxRQUFRLFNBQVIsS0FBUSxNQUFPO0FBQ0wsU0FBSyxJQUFNLENBQVgsSUFBZ0IsR0FBaEIsRUFBcUI7QUFBRSxZQUFJLENBQUMsSUFBSSxDQUFKLENBQUwsRUFBYTtBQUFFLG1CQUFPLElBQUksQ0FBSixDQUFQO0FBQWU7QUFBRTtBQUN2RCxXQUFRLEVBQUUsSUFBRixDQUFRLEdBQVIsRUFBYSxNQUFiLEtBQXdCLENBQXpCLEdBQThCLFNBQTlCLEdBQTBDLEdBQWpEO0FBQ0gsQ0FIYjs7QUFLQTs7SUFFTSxLO0FBRUYsbUJBQWEsVUFBYixFQUF5QixJQUF6QixFQUErQixVQUEvQixFQUEyQztBQUFBOztBQUV2QyxhQUFLLFVBQUwsR0FBa0IsVUFBbEI7QUFDQSxhQUFLLElBQUwsR0FBa0IsSUFBbEI7QUFDQSxhQUFLLFVBQUwsR0FBa0IsVUFBbEI7QUFDSDs7OzswQ0FZa0IsSyxFQUFPOztBQUV0QixtQkFBTyxJQUFJLEtBQUosQ0FBVyxLQUFLLFVBQWhCLEVBQTRCLEtBQUssSUFBakMsRUFBdUMsS0FBSyxVQUFMLElBQW1CLEtBQTFELENBQVA7QUFDSDs7OzRCQUVJLFEsRUFBVTs7QUFFWCxnQkFBTSxRQUFRLFdBQVcsS0FBSyxPQUFoQixHQUEwQixJQUF4Qzs7QUFFQSxnQkFBTSxVQUFZLE1BQU0sVUFBTixLQUFxQixLQUFLLE1BQTNCLElBQXNDLFNBQVMsTUFBTSxJQUFmLENBQXZDLElBQWdFLE1BQU0sSUFBdEY7O0FBRUEsZ0JBQU0sT0FBUSxNQUFNLFVBQU4sR0FBbUIsYUFBbkIsR0FBbUMsUUFBakQ7QUFBQSxnQkFDTSxNQUFPLE9BQU8sR0FBUCxDQUFXLE9BQVgsQ0FEYjtBQUFBLGdCQUVNLFFBQVMsS0FBSyxVQUFMLEtBQW9CLEtBQUssR0FBMUIsR0FBaUMsR0FBakMsR0FBdUMsQ0FGckQ7O0FBSUEsbUJBQU8sTUFDSSxPQUFPLE9BQVAsR0FBaUIsNkJBQUksR0FBSixJQUFTLEtBQVQsR0FBZ0IsSUFBaEIsQ0FBc0IsR0FBdEIsQ0FBakIsR0FBOEMsSUFEbEQsR0FFSyxDQUFDLE1BQU0sVUFBUCxJQUFzQixRQUFRLENBQS9CLEdBQXFDLHdCQUFyQyxHQUFnRSxFQUYzRSxDQVZXLENBWW9FO0FBQ2xGOzs7NEJBNUJjO0FBQ1gsbUJBQU8sSUFBSSxLQUFKLENBQVcsQ0FBQyxLQUFLLFVBQWpCLEVBQTZCLEtBQUssSUFBTCxLQUFjLEtBQUssVUFBTCxHQUFrQixPQUFsQixHQUE0QixPQUExQyxDQUE3QixFQUFpRixLQUFLLFVBQXRGLENBQVA7QUFDSDs7OzRCQUVZO0FBQ1QsbUJBQU8sTUFBTyxFQUFFLE1BQVEsS0FBSyxJQUFMLEtBQWMsU0FBZCxHQUEwQixFQUExQixHQUErQixLQUFLLElBQTlDO0FBQ0Usd0JBQVEsS0FBSyxVQUFMLEtBQW9CLEtBQUssTUFEbkM7QUFFRSxxQkFBUSxLQUFLLFVBQUwsS0FBb0IsS0FBSyxHQUZuQyxFQUFQLENBQVA7QUFHSDs7Ozs7O0FBdUJMOztJQUVNLEk7QUFFRixrQkFBYSxDQUFiLEVBQWdCO0FBQUE7O0FBQ1osWUFBSSxNQUFNLFNBQVYsRUFBcUI7QUFBRSxpQkFBSyxLQUFMLEdBQWEsT0FBUSxDQUFSLENBQWI7QUFBeUI7QUFBRTs7Ozs0QkFFMUM7QUFDVCxtQkFBTyxNQUFNLEtBQUssS0FBTCxDQUFZLEtBQUssS0FBTCxHQUFhLEVBQXpCLENBQU4sQ0FBUDtBQUE0Qzs7OzRCQUVoQztBQUNYLG1CQUFPLFNBQVMsS0FBSyxJQUFkLEVBQW9CLEtBQUssS0FBTCxHQUFhLEVBQWpDLENBQVA7QUFBNkM7Ozs0QkFFdEM7QUFDUCxtQkFBUSxLQUFLLEtBQUwsR0FBYyxVQUFhLEtBQUssS0FBbEIsR0FBMEIsR0FBeEMsR0FBK0MsRUFBdkQ7QUFBNEQ7Ozs0QkFLNUM7QUFDaEIsbUJBQVEsS0FBSyxLQUFMLEtBQWUsS0FBSyxZQUFyQixJQUF1QyxLQUFLLEtBQUwsS0FBZSxLQUFLLE1BQTNELElBQXVFLEtBQUssS0FBTCxLQUFlLEtBQUssR0FBbEc7QUFBd0c7Ozs0QkFKaEcsQyxFQUFHO0FBQ1gsbUJBQU8sSUFBSSxJQUFKLENBQVUsQ0FBVixFQUFhLEdBQXBCO0FBQXlCOzs7Ozs7QUFNakM7O0FBRUEsRUFBRSxNQUFGLENBQVUsSUFBVixFQUFnQjs7QUFFWixXQUFjLENBRkY7QUFHWixZQUFjLENBSEY7QUFJWixTQUFjLENBSkY7QUFLWixhQUFjLENBTEY7QUFNWixrQkFBYyxFQU5GO0FBT1osY0FBYyxFQVBGO0FBUVosaUJBQWMsRUFSRjtBQVNaLGVBQWMsRUFURjtBQVVaLGFBQWMsRUFWRjtBQVdaLGVBQWM7QUFYRixDQUFoQjs7QUFjQTs7QUFFQSxJQUFNLGFBQWEsU0FBYixVQUFhLENBQUMsR0FBRCxFQUFNLENBQU4sRUFBUyxDQUFUO0FBQUEsV0FBZSxJQUFJLEtBQUosQ0FBVyxDQUFYLEVBQWMsSUFBZCxDQUFvQixDQUFwQixDQUFmO0FBQUEsQ0FBbkI7O0FBRUE7Ozs7O0FBS0EsSUFBTSx3QkFBd0IsU0FBeEIscUJBQXdCO0FBQUEsV0FBSyxFQUFFLE9BQUYsQ0FBVyxtQkFBWCxFQUFnQyxZQUFoQyxDQUFMO0FBQUEsQ0FBOUI7QUFDQSxJQUFNLHNCQUFzQixTQUF0QixtQkFBc0I7QUFBQSxXQUFLLEVBQUUsT0FBRixDQUFXLDhCQUFYLEVBQTJDLElBQTNDLENBQUw7QUFBQSxDQUE1Qjs7QUFFQSxJQUFNLE9BQU8sU0FBUCxJQUFPLENBQUMsQ0FBRCxFQUFJLFFBQUosRUFBYyxTQUFkLEVBQTRCOztBQUVyQyxRQUFNLE9BQVEsS0FBSyxHQUFMLENBQVUsUUFBVixDQUFkO0FBQUEsUUFDTSxRQUFRLEtBQUssR0FBTCxDQUFVLFNBQVYsQ0FEZDs7QUFHQSxXQUFPLE9BQVEsQ0FBUixFQUNNLEtBRE4sQ0FDYSxJQURiLEVBRU0sR0FGTixDQUVXO0FBQUEsZUFBUSxzQkFBdUIsT0FBTyxXQUFZLG9CQUFxQixJQUFyQixDQUFaLEVBQXdDLEtBQXhDLEVBQStDLElBQS9DLENBQVAsR0FBOEQsS0FBckYsQ0FBUjtBQUFBLEtBRlgsRUFHTSxJQUhOLENBR1ksSUFIWixDQUFQO0FBSUgsQ0FURDs7QUFXQTs7QUFFQSxJQUFNLFFBQVEsU0FBUixLQUFRLENBQUMsQ0FBRCxFQUFJLENBQUo7QUFBQSxXQUFVLElBQUksRUFBRSxNQUFGLENBQVUsQ0FBVixFQUFhLFdBQWIsRUFBSixHQUFrQyxFQUFFLEtBQUYsQ0FBUyxDQUFULENBQTVDO0FBQUEsQ0FBZDs7QUFHQSxJQUFNLHdCQUF5QjtBQUFBLFdBQU0sNkJBRTFCLFdBQVcsR0FBWCxDQUFnQixVQUFDLENBQUQsRUFBSSxDQUFKO0FBQUEsZUFBVSxDQUFDLENBQUQsR0FBSyxFQUFMLEdBQVUsQ0FBRTs7QUFFckMsU0FBQyxDQUFELEVBQWtCLEtBQUssQ0FBdkIsRUFBMEIsS0FBSyxPQUEvQixDQUZtQyxFQUduQyxDQUFDLE1BQU8sSUFBUCxFQUFhLENBQWIsQ0FBRCxFQUFrQixLQUFLLENBQXZCLEVBQTBCLEtBQUssU0FBL0IsQ0FIbUMsQ0FBcEI7QUFBQSxLQUFoQixDQUYwQixzQkFRMUIsZ0JBQWdCLEdBQWhCLENBQXFCLFVBQUMsQ0FBRCxFQUFJLENBQUo7QUFBQSxlQUFVLENBQUMsQ0FBRCxHQUFLLEVBQUwsR0FBVSxDQUFFOztBQUUxQyxTQUFDLENBQUQsRUFBbUIsS0FBSyxDQUF4QixFQUEyQixLQUFLLE9BQWhDLENBRndDLEVBR3hDLENBQUMsTUFBTyxJQUFQLEVBQWEsQ0FBYixDQUFELEVBQWtCLE1BQU0sQ0FBeEIsRUFBMkIsS0FBSyxTQUFoQyxDQUh3QyxDQUFwQjtBQUFBLEtBQXJCLENBUjBCLHNCQWdCMUIsQ0FBQyxFQUFELEVBQUssV0FBTCxFQUFrQixhQUFsQixFQUFpQyxjQUFqQyxFQUFpRCxZQUFqRCxFQUErRCxlQUEvRCxFQUFnRixZQUFoRixFQUE4RixHQUE5RixDQUFtRyxVQUFDLENBQUQsRUFBSSxDQUFKO0FBQUEsZUFBVSxDQUFDLENBQUQsR0FBSyxFQUFMLEdBQVUsQ0FFdEgsQ0FBQyxPQUFPLENBQVIsRUFBVyxNQUFNLENBQWpCLEVBQW9CLEtBQUssU0FBekIsQ0FGc0gsQ0FBcEI7QUFBQSxLQUFuRyxDQWhCMEIsc0JBcUIxQixXQUFXLEdBQVgsQ0FBZ0IsVUFBQyxDQUFELEVBQUksQ0FBSjtBQUFBLGVBQVUsQ0FBQyxDQUFELEdBQUssRUFBTCxHQUFVLENBQUU7O0FBRXJDLFNBQUMsQ0FBRCxFQUFJLENBQUosRUFBUyxNQUFNLFFBQVAsSUFBcUIsTUFBTSxLQUE1QixHQUFzQyxLQUFLLFlBQTNDLEdBQTJELEtBQUssQ0FBdkUsQ0FGbUMsQ0FBcEI7QUFBQSxLQUFoQixDQXJCMEIsR0EwQmhDLE1BMUJnQyxDQTBCeEIsVUFBQyxDQUFELEVBQUksQ0FBSjtBQUFBLGVBQVUsRUFBRSxNQUFGLENBQVUsQ0FBVixDQUFWO0FBQUEsS0ExQndCLENBQU47QUFBQSxDQUFELEVBQTlCOztBQThCQTs7QUFFQSxJQUFNLDBCQUEwQixTQUExQix1QkFBMEIsQ0FBQyxNQUFEO0FBQUEsUUFBUyxVQUFULHVFQUFzQixNQUF0QjtBQUFBLFdBRTVCLHNCQUFzQixNQUF0QixDQUE4QixVQUFDLElBQUQ7QUFBQTtBQUFBLFlBQVEsQ0FBUjtBQUFBLFlBQVcsSUFBWDtBQUFBLFlBQWlCLEtBQWpCOztBQUFBLGVBQ00sRUFBRSxjQUFGLENBQWtCLElBQWxCLEVBQXdCLENBQXhCLEVBQTJCO0FBQ3ZCLGlCQUFLO0FBQUEsdUJBQU0sd0JBQXlCO0FBQUEsMkJBQU8sV0FBWSxLQUFNLEdBQU4sRUFBVyxJQUFYLEVBQWlCLEtBQWpCLENBQVosQ0FBUDtBQUFBLGlCQUF6QixDQUFOO0FBQUE7QUFEa0IsU0FBM0IsQ0FETjtBQUFBLEtBQTlCLEVBSzhCLE1BTDlCLENBRjRCO0FBQUEsQ0FBaEM7O0FBU0E7O0FBRUEsSUFBTSxPQUFVLENBQWhCO0FBQUEsSUFDTSxVQUFVLENBRGhCO0FBQUEsSUFFTSxPQUFVLENBRmhCOztBQUlBLFNBQVMsUUFBVCxDQUFtQixDQUFuQixFQUFzQjs7QUFFbEIsUUFBSSxRQUFRLElBQVo7QUFBQSxRQUFrQixTQUFTLEVBQTNCO0FBQUEsUUFBK0IsT0FBTyxFQUF0QztBQUFBLFFBQTBDLE9BQU8sRUFBakQ7QUFBQSxRQUFxRCxRQUFRLEVBQTdEO0FBQ0EsUUFBSSxRQUFRLEVBQVo7O0FBRUEsU0FBSyxJQUFJLElBQUksQ0FBUixFQUFXLElBQUksRUFBRSxNQUF0QixFQUE4QixJQUFJLENBQWxDLEVBQXFDLEdBQXJDLEVBQTBDOztBQUV0QyxZQUFNLElBQUksRUFBRSxDQUFGLENBQVY7O0FBRUEsa0JBQVUsQ0FBVjs7QUFFQSxnQkFBUSxLQUFSOztBQUVJLGlCQUFLLElBQUw7QUFDSSxvQkFBSSxNQUFNLE1BQVYsRUFBb0I7QUFBRSw0QkFBUSxPQUFSLENBQWlCLFNBQVMsQ0FBVDtBQUFhLGlCQUFwRCxNQUNvQjtBQUFFLDRCQUFRLENBQVI7QUFBVztBQUNqQzs7QUFFSixpQkFBSyxPQUFMO0FBQ0ksb0JBQUksTUFBTSxHQUFWLEVBQWU7QUFBRSw0QkFBUSxJQUFSLENBQWMsT0FBTyxFQUFQLENBQVcsUUFBUSxFQUFSO0FBQVksaUJBQXRELE1BQ2U7QUFBRSw0QkFBUSxJQUFSLENBQWMsUUFBUSxNQUFSO0FBQWdCO0FBQy9DOztBQUVKLGlCQUFLLElBQUw7O0FBRUksb0JBQUssS0FBSyxHQUFOLElBQWUsS0FBSyxHQUF4QixFQUFxQztBQUFFLDRCQUFRLENBQVI7QUFBVyxpQkFBbEQsTUFDSyxJQUFJLE1BQU0sR0FBVixFQUFnQztBQUFFLDBCQUFNLElBQU4sQ0FBWSxJQUFJLElBQUosQ0FBVSxJQUFWLENBQVosRUFBOEIsT0FBTyxFQUFQO0FBQVcsaUJBQTNFLE1BQ0EsSUFBSyxNQUFNLEdBQVAsSUFBZSxLQUFLLE1BQXhCLEVBQWdDO0FBQUUsMEJBQU0sSUFBTixDQUFZLElBQUksSUFBSixDQUFVLElBQVYsQ0FBWjtBQUFGO0FBQUE7QUFBQTs7QUFBQTtBQUNFLDZDQUFtQixLQUFuQiw4SEFBMEI7QUFBQSxnQ0FBZixLQUFlO0FBQUUsa0NBQU0sSUFBTixDQUFZLEVBQUUsVUFBRixFQUFRLFdBQVIsRUFBWixFQUE2QixPQUFPLEVBQVA7QUFBVztBQUR0RTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUVFLDRCQUFRLElBQVI7QUFDRCxpQkFIakMsTUFJZ0M7QUFBRSw0QkFBUSxJQUFSLENBQWMsUUFBUSxNQUFSO0FBQWdCO0FBcEI3RTtBQXNCSDs7QUFFRCxRQUFJLFVBQVUsSUFBZCxFQUFvQixRQUFRLE1BQVI7O0FBRXBCLFFBQUksSUFBSixFQUFVLE1BQU0sSUFBTixDQUFZLEVBQUUsVUFBRixFQUFRLE1BQU0sSUFBSSxJQUFKLEVBQWQsRUFBWjs7QUFFVixXQUFPLEtBQVA7QUFDSDs7QUFFRDs7QUFFQTs7OztJQUdNLE07O0FBRUY7OztBQUdBLG9CQUFhLENBQWIsRUFBZ0I7QUFBQTs7QUFFWixhQUFLLEtBQUwsR0FBYSxJQUFJLFNBQVUsQ0FBVixDQUFKLEdBQW1CLEVBQWhDO0FBQ0g7OzthQXlIQSxPQUFPLFE7OztBQUpSOzs7O2dDQUlxQjtBQUNqQixtQkFBTyxLQUFLLEtBQUwsQ0FBVyxPQUFPLFFBQWxCLEdBQVA7QUFDSDs7OzRCQXpIVTtBQUNQLG1CQUFPLEtBQUssS0FBTCxDQUFXLE1BQVgsQ0FBbUIsVUFBQyxHQUFELEVBQU0sQ0FBTjtBQUFBLHVCQUFZLE1BQU0sRUFBRSxJQUFSLEdBQWUsRUFBRSxJQUFGLENBQU8sR0FBbEM7QUFBQSxhQUFuQixFQUEwRCxFQUExRCxDQUFQO0FBQ0g7Ozs0QkFFYTs7QUFFVixnQkFBSSxjQUFKO0FBQUEsZ0JBQVcsZ0JBQVg7QUFBQSxnQkFBb0IsbUJBQXBCO0FBQUEsZ0JBQWdDLGVBQWhDOztBQUVBLHFCQUFTLEtBQVQsR0FBa0I7O0FBRWQsd0JBQWEsSUFBSSxLQUFKLEVBQWIsRUFDQSxVQUFhLElBQUksS0FBSixDQUFXLElBQVgsQ0FBZ0IsZ0JBQWhCLENBRGIsRUFFQSxhQUFhLFNBRmIsRUFHQSxTQUFhLElBQUksR0FBSixFQUhiO0FBSUg7O0FBRUQ7O0FBRUEsbUJBQU8sRUFBRSxNQUFGLENBQVUsSUFBSSxNQUFKLEVBQVYsRUFBeUI7O0FBRTVCLHVCQUFPLEtBQUssS0FBTCxDQUFXLEdBQVgsQ0FBZ0IsZ0JBQVE7O0FBRTNCLHdCQUFNLElBQUksS0FBSyxJQUFmOztBQUVBLHdCQUFNLFdBQVksT0FBTyxHQUFQLENBQVksU0FBWixDQUFsQjtBQUFBLHdCQUNNLFlBQVksT0FBTyxHQUFQLENBQVksV0FBWixJQUE2Qiw2QkFBN0IsR0FBNkQsRUFEL0U7QUFBQSx3QkFFTSxTQUFZLE9BQU8sR0FBUCxDQUFZLFFBQVosSUFBNkIscUJBQTdCLEdBQXFELEVBRnZFO0FBQUEsd0JBR00sT0FBWSxlQUFlLEtBQUssTUFBcEIsR0FBNkIsb0JBQTdCLEdBQW9ELEVBSHRFOztBQUtBLHdCQUFNLFlBQVksTUFBTSxpQkFBTixDQUF5QixVQUF6QixDQUFsQjs7QUFFQSx3QkFBTSxhQUFhLEVBQUUsTUFBRixDQUNLLEVBQUUsS0FBSyxPQUFPLE1BQVAsR0FBZ0IsU0FBaEIsR0FBNEIsVUFBVSxHQUFWLENBQWUsUUFBZixDQUE1QixHQUF1RCxRQUFRLEdBQVIsQ0FBYSxRQUFiLENBQTlELEVBREwsRUFFSyxNQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsSUFBVixFQUFnQixPQUFPLFVBQVUsS0FBakMsRUFBd0MsU0FBUyxRQUFRLEtBQXpELEVBQVAsQ0FGTCxFQUdLLElBSEwsQ0FBbkI7O0FBWDJCO0FBQUE7QUFBQTs7QUFBQTtBQWdCM0IsOENBQWdCLE1BQWhCLG1JQUF3QjtBQUFBLGdDQUFiLENBQWE7QUFBRSx1Q0FBVyxDQUFYLElBQWdCLElBQWhCO0FBQXNCO0FBaEJyQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQWtCM0Isd0JBQUksRUFBRSxZQUFOLEVBQW9COztBQUVoQixxQ0FBYSxFQUFFLEtBQWY7QUFFSCxxQkFKRCxNQUlPLElBQUksS0FBSyxJQUFMLENBQVUsS0FBVixLQUFvQixTQUF4QixFQUFtQzs7QUFFdEMsNEJBQUksS0FBSyxJQUFMLENBQVUsS0FBVixLQUFvQixLQUFLLEtBQTdCLEVBQW9DO0FBQ2hDO0FBRUgseUJBSEQsTUFHTzs7QUFFSCxvQ0FBUSxLQUFLLElBQUwsQ0FBVSxJQUFsQjs7QUFFSSxxQ0FBSyxPQUFMO0FBQ0EscUNBQUssWUFBTDtBQUFzQiw0Q0FBVSxJQUFJLEtBQUosQ0FBVyxLQUFYLEVBQWtCLEVBQUUsT0FBcEIsQ0FBVixDQUF3Qzs7QUFFOUQscUNBQUssU0FBTDtBQUNBLHFDQUFLLGNBQUw7QUFBc0IsOENBQVUsSUFBSSxLQUFKLENBQVcsSUFBWCxFQUFrQixFQUFFLE9BQXBCLENBQVYsQ0FBd0M7O0FBRTlELHFDQUFLLE9BQUw7QUFBZ0IsMkNBQU8sR0FBUCxDQUFlLEVBQUUsT0FBakIsRUFBMkI7QUFDM0MscUNBQUssU0FBTDtBQUFnQiwyQ0FBTyxNQUFQLENBQWUsRUFBRSxPQUFqQixFQUEyQjtBQVQvQztBQVdIO0FBQ0o7O0FBRUQsMkJBQU8sVUFBUDtBQUVILGlCQTdDTSxFQTZDSixNQTdDSSxDQTZDSTtBQUFBLDJCQUFLLEVBQUUsSUFBRixDQUFPLE1BQVAsR0FBZ0IsQ0FBckI7QUFBQSxpQkE3Q0o7QUFGcUIsYUFBekIsQ0FBUDtBQWlESDs7QUFFTDs7Ozs0QkFFdUM7O0FBRS9CLGdCQUFNLFFBQVEsS0FBSyxNQUFMLENBQVksS0FBMUI7O0FBRUEsb0JBQVEsTUFBTSxHQUFOLENBQVc7QUFBQSx1QkFBTSxPQUFPLEVBQUUsSUFBZjtBQUFBLGFBQVgsRUFBaUMsSUFBakMsQ0FBdUMsRUFBdkMsQ0FBUiw0QkFDUSxNQUFNLEdBQU4sQ0FBVztBQUFBLHVCQUFLLEVBQUUsR0FBUDtBQUFBLGFBQVgsQ0FEUjtBQUVIOzs7NEJBRThCLHdCQUF5QjtBQUFFLG1CQUFPLEtBQUssMkJBQVo7QUFBeUM7O0FBRW5HOzs7Ozs7Ozs7OztBQWlCQTs7Ozs4QkFJYyxDLEVBQUc7QUFDYixtQkFBTyxJQUFJLE1BQUosQ0FBWSxDQUFaLEVBQWUsTUFBdEI7QUFDSDs7QUFFRDs7Ozs7Ozs7OEJBS2MsQyxFQUFHO0FBQ2IsbUJBQU8sRUFBRSxPQUFGLENBQVcsNkVBQVgsRUFBMEYsRUFBMUYsQ0FBUCxDQURhLENBQ3dGO0FBQ3hHOzs7NEJBMUJrQjs7QUFFZixtQkFBTyxLQUFQLENBQWEsT0FBYixDQUFzQixhQUFLO0FBQ3ZCLG9CQUFJLEVBQUUsS0FBSyxPQUFPLFNBQWQsQ0FBSixFQUE4QjtBQUMxQixzQkFBRSxjQUFGLENBQWtCLE9BQU8sU0FBekIsRUFBb0MsQ0FBcEMsRUFBdUMsRUFBRSxLQUFLLGVBQVk7QUFBRSxtQ0FBTyxPQUFPLENBQVAsRUFBVyxJQUFYLENBQVA7QUFBeUIseUJBQTlDLEVBQXZDO0FBQ0g7QUFDSixhQUpEOztBQU1BLG1CQUFPLE1BQVA7QUFDSDs7Ozs7O0FBNEJMOztBQUVBLHdCQUF5QixNQUF6QixFQUFpQztBQUFBLFdBQU8sR0FBUDtBQUFBLENBQWpDOztBQUVBOztBQUVBLE9BQU8sS0FBUCxHQUFlLHNCQUFzQixHQUF0QixDQUEyQjtBQUFBO0FBQUEsUUFBRSxDQUFGOztBQUFBLFdBQVMsQ0FBVDtBQUFBLENBQTNCLENBQWY7O0FBRUE7O0FBRUEsT0FBTyxHQUFQLEdBQWE7O0FBRVQsV0FBYyxDQUFDLENBQUQsRUFBUSxDQUFSLEVBQWEsQ0FBYixDQUZMO0FBR1QsY0FBYyxDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxDQUhMO0FBSVQsZUFBYyxDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxDQUpMO0FBS1QsV0FBYyxDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxDQUxMOztBQU9ULFNBQWMsQ0FBQyxHQUFELEVBQVEsQ0FBUixFQUFhLENBQWIsQ0FQTDtBQVFULGNBQWMsQ0FBQyxHQUFELEVBQU8sRUFBUCxFQUFhLENBQWIsQ0FSTDs7QUFVVCxXQUFjLENBQUMsQ0FBRCxFQUFNLEdBQU4sRUFBYSxDQUFiLENBVkw7QUFXVCxnQkFBYyxDQUFDLEVBQUQsRUFBTSxHQUFOLEVBQVksRUFBWixDQVhMOztBQWFULFlBQWMsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFhLENBQWIsQ0FiTDtBQWNULGlCQUFjLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBWSxFQUFaLENBZEw7O0FBZ0JULFVBQWMsQ0FBQyxDQUFELEVBQVEsQ0FBUixFQUFXLEdBQVgsQ0FoQkw7QUFpQlQsZUFBYyxDQUFDLEVBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxDQWpCTDs7QUFtQlQsYUFBYyxDQUFDLEdBQUQsRUFBUSxDQUFSLEVBQVcsR0FBWCxDQW5CTDtBQW9CVCxrQkFBYyxDQUFDLEdBQUQsRUFBUSxDQUFSLEVBQVcsR0FBWCxDQXBCTDs7QUFzQlQsVUFBYyxDQUFDLENBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxDQXRCTDtBQXVCVCxlQUFjLENBQUMsQ0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYOztBQUdsQjs7QUExQmEsQ0FBYixDQTRCQSxPQUFPLE9BQVAsR0FBaUIsTUFBakI7O0FBRUEiLCJmaWxlIjoiYW5zaWNvbG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgTyA9IE9iamVjdFxuXG4vKiAgU2VlIGh0dHBzOi8vbWlzYy5mbG9naXNvZnQuY29tL2Jhc2gvdGlwX2NvbG9yc19hbmRfZm9ybWF0dGluZ1xuICAgIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBjb2xvckNvZGVzICAgICAgPSBbICAgJ2JsYWNrJywgICAgICAncmVkJywgICAgICAnZ3JlZW4nLCAgICAgICd5ZWxsb3cnLCAgICAgICdibHVlJywgICAgICAnbWFnZW50YScsICAgICAgJ2N5YW4nLCAnbGlnaHRHcmF5JywgJycsICdkZWZhdWx0J11cbiAgICAsIGNvbG9yQ29kZXNMaWdodCA9IFsnZGFya0dyYXknLCAnbGlnaHRSZWQnLCAnbGlnaHRHcmVlbicsICdsaWdodFllbGxvdycsICdsaWdodEJsdWUnLCAnbGlnaHRNYWdlbnRhJywgJ2xpZ2h0Q3lhbicsICd3aGl0ZScsICcnXVxuICAgIFxuICAgICwgc3R5bGVDb2RlcyA9IFsnJywgJ2JyaWdodCcsICdkaW0nLCAnaXRhbGljJywgJ3VuZGVybGluZScsICcnLCAnJywgJ2ludmVyc2UnXVxuXG4gICAgLCBhc0JyaWdodCA9IHsgJ3JlZCc6ICAgICAgICdsaWdodFJlZCcsXG4gICAgICAgICAgICAgICAgICAgJ2dyZWVuJzogICAgICdsaWdodEdyZWVuJyxcbiAgICAgICAgICAgICAgICAgICAneWVsbG93JzogICAgJ2xpZ2h0WWVsbG93JyxcbiAgICAgICAgICAgICAgICAgICAnYmx1ZSc6ICAgICAgJ2xpZ2h0Qmx1ZScsXG4gICAgICAgICAgICAgICAgICAgJ21hZ2VudGEnOiAgICdsaWdodE1hZ2VudGEnLFxuICAgICAgICAgICAgICAgICAgICdjeWFuJzogICAgICAnbGlnaHRDeWFuJyxcbiAgICAgICAgICAgICAgICAgICAnYmxhY2snOiAgICAgJ2RhcmtHcmF5JyxcbiAgICAgICAgICAgICAgICAgICAnbGlnaHRHcmF5JzogJ3doaXRlJyB9XG4gICAgXG4gICAgLCB0eXBlcyA9IHsgMDogICdzdHlsZScsXG4gICAgICAgICAgICAgICAgMjogICd1bnN0eWxlJyxcbiAgICAgICAgICAgICAgICAzOiAgJ2NvbG9yJyxcbiAgICAgICAgICAgICAgICA5OiAgJ2NvbG9yTGlnaHQnLFxuICAgICAgICAgICAgICAgIDQ6ICAnYmdDb2xvcicsXG4gICAgICAgICAgICAgICAgMTA6ICdiZ0NvbG9yTGlnaHQnIH1cblxuICAgICwgc3VidHlwZXMgPSB7ICBjb2xvcjogICAgICAgICBjb2xvckNvZGVzLFxuICAgICAgICAgICAgICAgICAgICBjb2xvckxpZ2h0OiAgICBjb2xvckNvZGVzTGlnaHQsXG4gICAgICAgICAgICAgICAgICAgIGJnQ29sb3I6ICAgICAgIGNvbG9yQ29kZXMsXG4gICAgICAgICAgICAgICAgICAgIGJnQ29sb3JMaWdodDogIGNvbG9yQ29kZXNMaWdodCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6ICAgICAgICAgc3R5bGVDb2RlcyxcbiAgICAgICAgICAgICAgICAgICAgdW5zdHlsZTogICAgICAgc3R5bGVDb2RlcyAgICB9XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgY2xlYW4gPSBvYmogPT4ge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgayBpbiBvYmopIHsgaWYgKCFvYmpba10pIHsgZGVsZXRlIG9ialtrXSB9IH1cbiAgICAgICAgICAgICAgICByZXR1cm4gKE8ua2V5cyAob2JqKS5sZW5ndGggPT09IDApID8gdW5kZWZpbmVkIDogb2JqXG4gICAgICAgICAgICB9XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY2xhc3MgQ29sb3Ige1xuXG4gICAgY29uc3RydWN0b3IgKGJhY2tncm91bmQsIG5hbWUsIGJyaWdodG5lc3MpIHtcblxuICAgICAgICB0aGlzLmJhY2tncm91bmQgPSBiYWNrZ3JvdW5kXG4gICAgICAgIHRoaXMubmFtZSAgICAgICA9IG5hbWVcbiAgICAgICAgdGhpcy5icmlnaHRuZXNzID0gYnJpZ2h0bmVzc1xuICAgIH1cblxuICAgIGdldCBpbnZlcnNlICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2xvciAoIXRoaXMuYmFja2dyb3VuZCwgdGhpcy5uYW1lIHx8ICh0aGlzLmJhY2tncm91bmQgPyAnYmxhY2snIDogJ3doaXRlJyksIHRoaXMuYnJpZ2h0bmVzcylcbiAgICB9XG5cbiAgICBnZXQgY2xlYW4gKCkge1xuICAgICAgICByZXR1cm4gY2xlYW4gKHsgbmFtZTogICB0aGlzLm5hbWUgPT09ICdkZWZhdWx0JyA/ICcnIDogdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJpZ2h0OiB0aGlzLmJyaWdodG5lc3MgPT09IENvZGUuYnJpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGltOiAgICB0aGlzLmJyaWdodG5lc3MgPT09IENvZGUuZGltIH0pXG4gICAgfVxuXG4gICAgZGVmYXVsdEJyaWdodG5lc3MgKHZhbHVlKSB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBDb2xvciAodGhpcy5iYWNrZ3JvdW5kLCB0aGlzLm5hbWUsIHRoaXMuYnJpZ2h0bmVzcyB8fCB2YWx1ZSlcbiAgICB9XG5cbiAgICBjc3MgKGludmVydGVkKSB7XG5cbiAgICAgICAgY29uc3QgY29sb3IgPSBpbnZlcnRlZCA/IHRoaXMuaW52ZXJzZSA6IHRoaXNcblxuICAgICAgICBjb25zdCByZ2JOYW1lID0gKChjb2xvci5icmlnaHRuZXNzID09PSBDb2RlLmJyaWdodCkgJiYgYXNCcmlnaHRbY29sb3IubmFtZV0pIHx8IGNvbG9yLm5hbWVcblxuICAgICAgICBjb25zdCBwcm9wID0gKGNvbG9yLmJhY2tncm91bmQgPyAnYmFja2dyb3VuZDonIDogJ2NvbG9yOicpXG4gICAgICAgICAgICAsIHJnYiAgPSBDb2xvcnMucmdiW3JnYk5hbWVdXG4gICAgICAgICAgICAsIGFscGhhID0gKHRoaXMuYnJpZ2h0bmVzcyA9PT0gQ29kZS5kaW0pID8gMC41IDogMVxuXG4gICAgICAgIHJldHVybiByZ2JcbiAgICAgICAgICAgICAgICA/IChwcm9wICsgJ3JnYmEoJyArIFsuLi5yZ2IsIGFscGhhXS5qb2luICgnLCcpICsgJyk7JylcbiAgICAgICAgICAgICAgICA6ICgoIWNvbG9yLmJhY2tncm91bmQgJiYgKGFscGhhIDwgMSkpID8gJ2NvbG9yOnJnYmEoMCwwLDAsMC41KTsnIDogJycpIC8vIENocm9tZSBkb2VzIG5vdCBzdXBwb3J0ICdvcGFjaXR5JyBwcm9wZXJ0eS4uLlxuICAgIH1cbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jbGFzcyBDb2RlIHtcblxuICAgIGNvbnN0cnVjdG9yIChuKSB7XG4gICAgICAgIGlmIChuICE9PSB1bmRlZmluZWQpIHsgdGhpcy52YWx1ZSA9IE51bWJlciAobikgfSB9XG5cbiAgICBnZXQgdHlwZSAoKSB7XG4gICAgICAgcmV0dXJuIHR5cGVzW01hdGguZmxvb3IgKHRoaXMudmFsdWUgLyAxMCldIH1cblxuICAgIGdldCBzdWJ0eXBlICgpIHtcbiAgICAgICAgcmV0dXJuIHN1YnR5cGVzW3RoaXMudHlwZV1bdGhpcy52YWx1ZSAlIDEwXSB9XG5cbiAgICBnZXQgc3RyICgpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLnZhbHVlID8gKCdcXHUwMDFiXFxbJyArIHRoaXMudmFsdWUgKyAnbScpIDogJycpIH1cblxuICAgIHN0YXRpYyBzdHIgKHgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2RlICh4KS5zdHIgfVxuXG4gICAgZ2V0IGlzQnJpZ2h0bmVzcyAoKSB7XG4gICAgICAgIHJldHVybiAodGhpcy52YWx1ZSA9PT0gQ29kZS5ub0JyaWdodG5lc3MpIHx8ICh0aGlzLnZhbHVlID09PSBDb2RlLmJyaWdodCkgfHwgKHRoaXMudmFsdWUgPT09IENvZGUuZGltKSB9XG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuTy5hc3NpZ24gKENvZGUsIHtcblxuICAgIHJlc2V0OiAgICAgICAgMCxcbiAgICBicmlnaHQ6ICAgICAgIDEsXG4gICAgZGltOiAgICAgICAgICAyLFxuICAgIGludmVyc2U6ICAgICAgNyxcbiAgICBub0JyaWdodG5lc3M6IDIyLFxuICAgIG5vSXRhbGljOiAgICAgMjMsXG4gICAgbm9VbmRlcmxpbmU6ICAyNCxcbiAgICBub0ludmVyc2U6ICAgIDI3LFxuICAgIG5vQ29sb3I6ICAgICAgMzksXG4gICAgbm9CZ0NvbG9yOiAgICA0OVxufSlcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCByZXBsYWNlQWxsID0gKHN0ciwgYSwgYikgPT4gc3RyLnNwbGl0IChhKS5qb2luIChiKVxuXG4vKiAgQU5TSSBicmlnaHRuZXNzIGNvZGVzIGRvIG5vdCBvdmVybGFwLCBlLmcuIFwie2JyaWdodH17ZGltfWZvb1wiIHdpbGwgYmUgcmVuZGVyZWQgYnJpZ2h0IChub3QgZGltKS5cbiAgICBTbyB3ZSBmaXggaXQgYnkgYWRkaW5nIGJyaWdodG5lc3MgY2FuY2VsaW5nIGJlZm9yZSBlYWNoIGJyaWdodG5lc3MgY29kZSwgc28gdGhlIGZvcm1lciBleGFtcGxlIGdldHNcbiAgICBjb252ZXJ0ZWQgdG8gXCJ7bm9CcmlnaHRuZXNzfXticmlnaHR9e25vQnJpZ2h0bmVzc317ZGltfWZvb1wiIOKAkyB0aGlzIHdheSBpdCBnZXRzIHJlbmRlcmVkIGFzIGV4cGVjdGVkLlxuICovXG5cbmNvbnN0IGRlbm9ybWFsaXplQnJpZ2h0bmVzcyA9IHMgPT4gcy5yZXBsYWNlICgvKFxcdTAwMWJcXFsoMXwyKW0pL2csICdcXHUwMDFiWzIybSQxJylcbmNvbnN0IG5vcm1hbGl6ZUJyaWdodG5lc3MgPSBzID0+IHMucmVwbGFjZSAoL1xcdTAwMWJcXFsyMm0oXFx1MDAxYlxcWygxfDIpbSkvZywgJyQxJylcblxuY29uc3Qgd3JhcCA9ICh4LCBvcGVuQ29kZSwgY2xvc2VDb2RlKSA9PiB7XG5cbiAgICBjb25zdCBvcGVuICA9IENvZGUuc3RyIChvcGVuQ29kZSksXG4gICAgICAgICAgY2xvc2UgPSBDb2RlLnN0ciAoY2xvc2VDb2RlKVxuXG4gICAgcmV0dXJuIFN0cmluZyAoeClcbiAgICAgICAgICAgICAgICAuc3BsaXQgKCdcXG4nKVxuICAgICAgICAgICAgICAgIC5tYXAgKGxpbmUgPT4gZGVub3JtYWxpemVCcmlnaHRuZXNzIChvcGVuICsgcmVwbGFjZUFsbCAobm9ybWFsaXplQnJpZ2h0bmVzcyAobGluZSksIGNsb3NlLCBvcGVuKSArIGNsb3NlKSlcbiAgICAgICAgICAgICAgICAuam9pbiAoJ1xcbicpXG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgY2FtZWwgPSAoYSwgYikgPT4gYSArIGIuY2hhckF0ICgwKS50b1VwcGVyQ2FzZSAoKSArIGIuc2xpY2UgKDEpXG5cblxuY29uc3Qgc3RyaW5nV3JhcHBpbmdNZXRob2RzID0gKCgpID0+IFtcblxuICAgICAgICAuLi5jb2xvckNvZGVzLm1hcCAoKGssIGkpID0+ICFrID8gW10gOiBbIC8vIGNvbG9yIG1ldGhvZHNcblxuICAgICAgICAgICAgW2ssICAgICAgICAgICAgICAgMzAgKyBpLCBDb2RlLm5vQ29sb3JdLFxuICAgICAgICAgICAgW2NhbWVsICgnYmcnLCBrKSwgNDAgKyBpLCBDb2RlLm5vQmdDb2xvcl0sXG4gICAgICAgIF0pLFxuXG4gICAgICAgIC4uLmNvbG9yQ29kZXNMaWdodC5tYXAgKChrLCBpKSA9PiAhayA/IFtdIDogWyAvLyBsaWdodCBjb2xvciBtZXRob2RzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFtrLCAgICAgICAgICAgICAgICA5MCArIGksIENvZGUubm9Db2xvcl0sXG4gICAgICAgICAgICBbY2FtZWwgKCdiZycsIGspLCAxMDAgKyBpLCBDb2RlLm5vQmdDb2xvcl0sXG4gICAgICAgIF0pLFxuXG4gICAgICAgIC8qIFRISVMgT05FIElTIEZPUiBCQUNLV0FSRFMgQ09NUEFUSUJJTElUWSBXSVRIIFBSRVZJT1VTIFZFUlNJT05TIChoYWQgJ2JyaWdodCcgaW5zdGVhZCBvZiAnbGlnaHQnIGZvciBiYWNrZ3JvdW5kcylcbiAgICAgICAgICovXG4gICAgICAgIC4uLlsnJywgJ0JyaWdodFJlZCcsICdCcmlnaHRHcmVlbicsICdCcmlnaHRZZWxsb3cnLCAnQnJpZ2h0Qmx1ZScsICdCcmlnaHRNYWdlbnRhJywgJ0JyaWdodEN5YW4nXS5tYXAgKChrLCBpKSA9PiAhayA/IFtdIDogW1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBbJ2JnJyArIGssIDEwMCArIGksIENvZGUubm9CZ0NvbG9yXSxcbiAgICAgICAgXSksXG4gICAgICAgIFxuICAgICAgICAuLi5zdHlsZUNvZGVzLm1hcCAoKGssIGkpID0+ICFrID8gW10gOiBbIC8vIHN0eWxlIG1ldGhvZHNcblxuICAgICAgICAgICAgW2ssIGksICgoayA9PT0gJ2JyaWdodCcpIHx8IChrID09PSAnZGltJykpID8gQ29kZS5ub0JyaWdodG5lc3MgOiAoMjAgKyBpKV1cbiAgICAgICAgXSlcbiAgICBdXG4gICAgLnJlZHVjZSAoKGEsIGIpID0+IGEuY29uY2F0IChiKSlcbiAgICBcbikgKCk7XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgYXNzaWduU3RyaW5nV3JhcHBpbmdBUEkgPSAodGFyZ2V0LCB3cmFwQmVmb3JlID0gdGFyZ2V0KSA9PlxuXG4gICAgc3RyaW5nV3JhcHBpbmdNZXRob2RzLnJlZHVjZSAoKG1lbW8sIFtrLCBvcGVuLCBjbG9zZV0pID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTy5kZWZpbmVQcm9wZXJ0eSAobWVtbywgaywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXQ6ICgpID0+IGFzc2lnblN0cmluZ1dyYXBwaW5nQVBJIChzdHIgPT4gd3JhcEJlZm9yZSAod3JhcCAoc3RyLCBvcGVuLCBjbG9zZSkpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0KVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IFRFWFQgICAgPSAwLFxuICAgICAgQlJBQ0tFVCA9IDEsXG4gICAgICBDT0RFICAgID0gMlxuXG5mdW5jdGlvbiByYXdQYXJzZSAocykge1xuICAgIFxuICAgIGxldCBzdGF0ZSA9IFRFWFQsIGJ1ZmZlciA9ICcnLCB0ZXh0ID0gJycsIGNvZGUgPSAnJywgY29kZXMgPSBbXVxuICAgIGxldCBzcGFucyA9IFtdXG5cbiAgICBmb3IgKGxldCBpID0gMCwgbiA9IHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG5cbiAgICAgICAgY29uc3QgYyA9IHNbaV1cblxuICAgICAgICBidWZmZXIgKz0gY1xuXG4gICAgICAgIHN3aXRjaCAoc3RhdGUpIHtcblxuICAgICAgICAgICAgY2FzZSBURVhUOlxuICAgICAgICAgICAgICAgIGlmIChjID09PSAnXFx1MDAxYicpIHsgc3RhdGUgPSBCUkFDS0VUOyBidWZmZXIgPSBjOyB9XG4gICAgICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICB7IHRleHQgKz0gYyB9XG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgY2FzZSBCUkFDS0VUOlxuICAgICAgICAgICAgICAgIGlmIChjID09PSAnWycpIHsgc3RhdGUgPSBDT0RFOyBjb2RlID0gJyc7IGNvZGVzID0gW10gfVxuICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgIHsgc3RhdGUgPSBURVhUOyB0ZXh0ICs9IGJ1ZmZlciB9XG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgY2FzZSBDT0RFOlxuXG4gICAgICAgICAgICAgICAgaWYgKChjID49ICcwJykgJiYgKGMgPD0gJzknKSkgICAgICAgIHsgY29kZSArPSBjIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChjID09PSAnOycpICAgICAgICAgICAgICAgICAgeyBjb2Rlcy5wdXNoIChuZXcgQ29kZSAoY29kZSkpOyBjb2RlID0gJycgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKChjID09PSAnbScpICYmIGNvZGUubGVuZ3RoKSB7IGNvZGVzLnB1c2ggKG5ldyBDb2RlIChjb2RlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvZGUgb2YgY29kZXMpIHsgc3BhbnMucHVzaCAoeyB0ZXh0LCBjb2RlIH0pOyB0ZXh0ID0gJycgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gVEVYVFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgc3RhdGUgPSBURVhUOyB0ZXh0ICs9IGJ1ZmZlciB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3RhdGUgIT09IFRFWFQpIHRleHQgKz0gYnVmZmVyXG5cbiAgICBpZiAodGV4dCkgc3BhbnMucHVzaCAoeyB0ZXh0LCBjb2RlOiBuZXcgQ29kZSAoKSB9KVxuXG4gICAgcmV0dXJuIHNwYW5zXG59XG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIEFOU0ktZXNjYXBlZCBzdHJpbmcuXG4gKi9cbmNsYXNzIENvbG9ycyB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcyBhIHN0cmluZyBjb250YWluaW5nIEFOU0kgZXNjYXBlIGNvZGVzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yIChzKSB7XG5cbiAgICAgICAgdGhpcy5zcGFucyA9IHMgPyByYXdQYXJzZSAocykgOiBbXVxuICAgIH1cblxuICAgIGdldCBzdHIgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zcGFucy5yZWR1Y2UgKChzdHIsIHApID0+IHN0ciArIHAudGV4dCArIHAuY29kZS5zdHIsICcnKVxuICAgIH1cblxuICAgIGdldCBwYXJzZWQgKCkge1xuXG4gICAgICAgIGxldCBjb2xvciwgYmdDb2xvciwgYnJpZ2h0bmVzcywgc3R5bGVzXG5cbiAgICAgICAgZnVuY3Rpb24gcmVzZXQgKCkge1xuXG4gICAgICAgICAgICBjb2xvciAgICAgID0gbmV3IENvbG9yICgpLFxuICAgICAgICAgICAgYmdDb2xvciAgICA9IG5ldyBDb2xvciAodHJ1ZSAvKiBiYWNrZ3JvdW5kICovKSxcbiAgICAgICAgICAgIGJyaWdodG5lc3MgPSB1bmRlZmluZWQsXG4gICAgICAgICAgICBzdHlsZXMgICAgID0gbmV3IFNldCAoKVxuICAgICAgICB9XG5cbiAgICAgICAgcmVzZXQgKClcblxuICAgICAgICByZXR1cm4gTy5hc3NpZ24gKG5ldyBDb2xvcnMgKCksIHtcblxuICAgICAgICAgICAgc3BhbnM6IHRoaXMuc3BhbnMubWFwIChzcGFuID0+IHtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGMgPSBzcGFuLmNvZGVcblxuICAgICAgICAgICAgICAgIGNvbnN0IGludmVydGVkICA9IHN0eWxlcy5oYXMgKCdpbnZlcnNlJyksXG4gICAgICAgICAgICAgICAgICAgICAgdW5kZXJsaW5lID0gc3R5bGVzLmhhcyAoJ3VuZGVybGluZScpICAgPyAndGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7JyA6ICcnLCAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICBpdGFsaWMgICAgPSBzdHlsZXMuaGFzICgnaXRhbGljJykgICAgICA/ICdmb250LXN0eWxlOiBpdGFsaWM7JyA6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgIGJvbGQgICAgICA9IGJyaWdodG5lc3MgPT09IENvZGUuYnJpZ2h0ID8gJ2ZvbnQtd2VpZ2h0OiBib2xkOycgOiAnJ1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZm9yZUNvbG9yID0gY29sb3IuZGVmYXVsdEJyaWdodG5lc3MgKGJyaWdodG5lc3MpXG5cbiAgICAgICAgICAgICAgICBjb25zdCBzdHlsZWRTcGFuID0gTy5hc3NpZ24gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgY3NzOiBib2xkICsgaXRhbGljICsgdW5kZXJsaW5lICsgZm9yZUNvbG9yLmNzcyAoaW52ZXJ0ZWQpICsgYmdDb2xvci5jc3MgKGludmVydGVkKSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFuICh7IGJvbGQ6ICEhYm9sZCwgY29sb3I6IGZvcmVDb2xvci5jbGVhbiwgYmdDb2xvcjogYmdDb2xvci5jbGVhbiB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGFuKVxuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBrIG9mIHN0eWxlcykgeyBzdHlsZWRTcGFuW2tdID0gdHJ1ZSB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYy5pc0JyaWdodG5lc3MpIHtcblxuICAgICAgICAgICAgICAgICAgICBicmlnaHRuZXNzID0gYy52YWx1ZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3Bhbi5jb2RlLnZhbHVlICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5jb2RlLnZhbHVlID09PSBDb2RlLnJlc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNldCAoKVxuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoc3Bhbi5jb2RlLnR5cGUpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbG9yJyAgICAgICAgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbG9yTGlnaHQnICAgOiBjb2xvciAgID0gbmV3IENvbG9yIChmYWxzZSwgYy5zdWJ0eXBlKTsgYnJlYWtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2JnQ29sb3InICAgICAgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2JnQ29sb3JMaWdodCcgOiBiZ0NvbG9yID0gbmV3IENvbG9yICh0cnVlLCAgYy5zdWJ0eXBlKTsgYnJlYWtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0eWxlJyAgOiBzdHlsZXMuYWRkICAgIChjLnN1YnR5cGUpOyBicmVha1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3Vuc3R5bGUnOiBzdHlsZXMuZGVsZXRlIChjLnN1YnR5cGUpOyBicmVha1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlZFNwYW5cblxuICAgICAgICAgICAgfSkuZmlsdGVyIChzID0+IHMudGV4dC5sZW5ndGggPiAwKVxuICAgICAgICB9KVxuICAgIH1cblxuLyogIE91dHB1dHMgd2l0aCBDaHJvbWUgRGV2VG9vbHMtY29tcGF0aWJsZSBmb3JtYXQgICAgICovXG5cbiAgICBnZXQgYXNDaHJvbWVDb25zb2xlTG9nQXJndW1lbnRzICgpIHtcblxuICAgICAgICBjb25zdCBzcGFucyA9IHRoaXMucGFyc2VkLnNwYW5zXG5cbiAgICAgICAgcmV0dXJuIFtzcGFucy5tYXAgKHMgPT4gKCclYycgKyBzLnRleHQpKS5qb2luICgnJyksXG4gICAgICAgICAgICAgLi4uc3BhbnMubWFwIChzID0+IHMuY3NzKV1cbiAgICB9XG5cbiAgICBnZXQgYnJvd3NlckNvbnNvbGVBcmd1bWVudHMgKCkgLyogTEVHQUNZLCBERVBSRUNBVEVEICovIHsgcmV0dXJuIHRoaXMuYXNDaHJvbWVDb25zb2xlTG9nQXJndW1lbnRzIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIGluc3RhbGxzIFN0cmluZyBwcm90b3R5cGUgZXh0ZW5zaW9uc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVxdWlyZSAoJ2Fuc2ljb2xvcicpLm5pY2VcbiAgICAgKiBjb25zb2xlLmxvZyAoJ2ZvbycuYnJpZ2h0LnJlZClcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IG5pY2UgKCkge1xuXG4gICAgICAgIENvbG9ycy5uYW1lcy5mb3JFYWNoIChrID0+IHtcbiAgICAgICAgICAgIGlmICghKGsgaW4gU3RyaW5nLnByb3RvdHlwZSkpIHtcbiAgICAgICAgICAgICAgICBPLmRlZmluZVByb3BlcnR5IChTdHJpbmcucHJvdG90eXBlLCBrLCB7IGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gQ29sb3JzW2tdICh0aGlzKSB9IH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIENvbG9yc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIHBhcnNlcyBhIHN0cmluZyBjb250YWluaW5nIEFOU0kgZXNjYXBlIGNvZGVzXG4gICAgICogQHJldHVybiB7Q29sb3JzfSBwYXJzZWQgcmVwcmVzZW50YXRpb24uXG4gICAgICovXG4gICAgc3RhdGljIHBhcnNlIChzKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29sb3JzIChzKS5wYXJzZWRcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBzdHJpcHMgQU5TSSBjb2RlcyBmcm9tIGEgc3RyaW5nXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlcy5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IGNsZWFuIHN0cmluZy5cbiAgICAgKi9cbiAgICBzdGF0aWMgc3RyaXAgKHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSAoL1tcXHUwMDFiXFx1MDA5Yl1bWygpIzs/XSooPzpbMC05XXsxLDR9KD86O1swLTldezAsNH0pKik/WzAtOUEtUFJaY2YtbnFyeT0+PF0vZywgJycpIC8vIGhvcGUgVjggY2FjaGVzIHRoZSByZWdleHBcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNwYW5zID0gWy4uLmFuc2kucGFyc2UgKCdcXHUwMDFiWzdtXFx1MDAxYls3bWZvb1xcdTAwMWJbN21iYXJcXHUwMDFiWzI3bScpXVxuICAgICAqL1xuICAgIFtTeW1ib2wuaXRlcmF0b3JdICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3BhbnNbU3ltYm9sLml0ZXJhdG9yXSAoKVxuICAgIH1cbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5hc3NpZ25TdHJpbmdXcmFwcGluZ0FQSSAoQ29sb3JzLCBzdHIgPT4gc3RyKVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbkNvbG9ycy5uYW1lcyA9IHN0cmluZ1dyYXBwaW5nTWV0aG9kcy5tYXAgKChba10pID0+IGspXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuQ29sb3JzLnJnYiA9IHtcblxuICAgIGJsYWNrOiAgICAgICAgWzAsICAgICAwLCAgIDBdLCAgICBcbiAgICBkYXJrR3JheTogICAgIFsxMDAsIDEwMCwgMTAwXSxcbiAgICBsaWdodEdyYXk6ICAgIFsyMDAsIDIwMCwgMjAwXSxcbiAgICB3aGl0ZTogICAgICAgIFsyNTUsIDI1NSwgMjU1XSxcblxuICAgIHJlZDogICAgICAgICAgWzIwNCwgICAwLCAgIDBdLFxuICAgIGxpZ2h0UmVkOiAgICAgWzI1NSwgIDUxLCAgIDBdLFxuICAgIFxuICAgIGdyZWVuOiAgICAgICAgWzAsICAgMjA0LCAgIDBdLFxuICAgIGxpZ2h0R3JlZW46ICAgWzUxLCAgMjA0LCAgNTFdLFxuICAgIFxuICAgIHllbGxvdzogICAgICAgWzIwNCwgMTAyLCAgIDBdLFxuICAgIGxpZ2h0WWVsbG93OiAgWzI1NSwgMTUzLCAgNTFdLFxuICAgIFxuICAgIGJsdWU6ICAgICAgICAgWzAsICAgICAwLCAyNTVdLFxuICAgIGxpZ2h0Qmx1ZTogICAgWzI2LCAgMTQwLCAyNTVdLFxuICAgIFxuICAgIG1hZ2VudGE6ICAgICAgWzIwNCwgICAwLCAyMDRdLFxuICAgIGxpZ2h0TWFnZW50YTogWzI1NSwgICAwLCAyNTVdLFxuICAgIFxuICAgIGN5YW46ICAgICAgICAgWzAsICAgMTUzLCAyNTVdLFxuICAgIGxpZ2h0Q3lhbjogICAgWzAsICAgMjA0LCAyNTVdLFxufVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3JzXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuIl19