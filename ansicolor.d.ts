declare interface ParsedColor {
    name?:   string;
    bright?: boolean;
    dim?:    boolean;
}

declare interface ParsedSpan {

    text: string;
    css: string;
    italic?: boolean;
    bold?: boolean;
    color?: ParsedColor;
    bgColor?: ParsedColor;
}

declare interface AnsiColored extends Iterator<ParsedSpan> {
    
    readonly spans: ParsedSpan[];
    readonly str: string;
    readonly asChromeConsoleLogArguments: string[];
}

declare interface RGBValues {

    black:        [number, number, number];
    darkGray:     [number, number, number];
    lightGray:    [number, number, number];
    white:        [number, number, number];

    red:          [number, number, number];
    lightRed:     [number, number, number];
    
    green:        [number, number, number];
    lightGreen:   [number, number, number];
    
    yellow:       [number, number, number];
    lightYellow:  [number, number, number];
    
    blue:         [number, number, number];
    lightBlue:    [number, number, number];
    
    magenta:      [number, number, number];
    lightMagenta: [number, number, number];
    
    cyan:         [number, number, number];
    lightCyan:    [number, number, number];
}

declare interface ansicolor {

    (text: string): string; // applies the style to the string

    nice: ansicolor; // installs unsafe String extensions when accessed
    rgb: RGBValues;  // RGB color schema

    parse (text: string): AnsiColored;
    strip (text: string): string;

    default: ansicolor;
    white: ansicolor;
    black: ansicolor;
    red: ansicolor;
    green: ansicolor;
    yellow: ansicolor;
    blue: ansicolor;
    magenta: ansicolor;
    cyan: ansicolor;

    darkGray: ansicolor;
    lightGray: ansicolor;
    lightRed: ansicolor;
    lightGreen: ansicolor;
    lightYellow: ansicolor;
    lightBlue: ansicolor;
    lightMagenta: ansicolor;
    lightCyan: ansicolor;

    bright: ansicolor;
    dim: ansicolor;
    italic: ansicolor;
    underline: ansicolor;
    inverse: ansicolor;

    bgDefault: ansicolor;
    bgWhite: ansicolor;
    bgBlack: ansicolor;
    bgRed: ansicolor;
    bgGreen: ansicolor;
    bgYellow: ansicolor;
    bgBlue: ansicolor;
    bgMagenta: ansicolor;
    bgCyan: ansicolor;

    bgDarkGray: ansicolor;
    bgLightGray: ansicolor;
    bgLightRed: ansicolor;
    bgLightGreen: ansicolor;
    bgLightYellow: ansicolor;
    bgLightBlue: ansicolor;
    bgLightMagenta: ansicolor;
    bgLightCyan: ansicolor;
}

declare const ansicolor: ansicolor

export = ansicolor;
