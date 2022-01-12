export declare interface ParsedColor {
    name?:   string;
    bright?: boolean;
    dim?:    boolean;
}

export declare interface ParsedSpan {

    text: string;
    css: string;
    italic?: boolean;
    bold?: boolean;
    color?: ParsedColor;
    bgColor?: ParsedColor;
}

export declare interface AnsiColored extends Iterator<ParsedSpan> {
    
    readonly spans: ParsedSpan[];
    readonly str: string;
    readonly asChromeConsoleLogArguments: string[];
}

export declare interface RGBValues {

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

export declare interface AnsicolorMethods {

    (text: string|number|null|undefined): string; // applies the style to the string

    default: AnsicolorMethods;
    white: AnsicolorMethods;
    black: AnsicolorMethods;
    red: AnsicolorMethods;
    green: AnsicolorMethods;
    yellow: AnsicolorMethods;
    blue: AnsicolorMethods;
    magenta: AnsicolorMethods;
    cyan: AnsicolorMethods;

    darkGray: AnsicolorMethods;
    lightGray: AnsicolorMethods;
    lightRed: AnsicolorMethods;
    lightGreen: AnsicolorMethods;
    lightYellow: AnsicolorMethods;
    lightBlue: AnsicolorMethods;
    lightMagenta: AnsicolorMethods;
    lightCyan: AnsicolorMethods;

    bright: AnsicolorMethods;
    dim: AnsicolorMethods;
    italic: AnsicolorMethods;
    underline: AnsicolorMethods;
    inverse: AnsicolorMethods;

    bgDefault: AnsicolorMethods;
    bgWhite: AnsicolorMethods;
    bgBlack: AnsicolorMethods;
    bgRed: AnsicolorMethods;
    bgGreen: AnsicolorMethods;
    bgYellow: AnsicolorMethods;
    bgBlue: AnsicolorMethods;
    bgMagenta: AnsicolorMethods;
    bgCyan: AnsicolorMethods;

    bgDarkGray: AnsicolorMethods;
    bgLightGray: AnsicolorMethods;
    bgLightRed: AnsicolorMethods;
    bgLightGreen: AnsicolorMethods;
    bgLightYellow: AnsicolorMethods;
    bgLightBlue: AnsicolorMethods;
    bgLightMagenta: AnsicolorMethods;
    bgLightCyan: AnsicolorMethods;
}

export declare class ansicolor {

    static get nice (): ansicolor; // installs unsafe String extensions when accessed

    static get rgb (): RGBValues;
    static set rgb (newSchema: RGBValues);

    static parse (text: string): AnsiColored;
    static strip (text: string): string;
    static isEscaped (x?: any): boolean;

    static get default (): AnsicolorMethods;
    static get white (): AnsicolorMethods;
    static get black (): AnsicolorMethods;
    static get red (): AnsicolorMethods;
    static get green (): AnsicolorMethods;
    static get yellow (): AnsicolorMethods;
    static get blue (): AnsicolorMethods;
    static get magenta (): AnsicolorMethods;
    static get cyan (): AnsicolorMethods;

    static get darkGray (): AnsicolorMethods;
    static get lightGray (): AnsicolorMethods;
    static get lightRed (): AnsicolorMethods;
    static get lightGreen (): AnsicolorMethods;
    static get lightYellow (): AnsicolorMethods;
    static get lightBlue (): AnsicolorMethods;
    static get lightMagenta (): AnsicolorMethods;
    static get lightCyan (): AnsicolorMethods;

    static get bright (): AnsicolorMethods;
    static get dim (): AnsicolorMethods;
    static get italic (): AnsicolorMethods;
    static get underline (): AnsicolorMethods;
    static get inverse (): AnsicolorMethods;

    static get bgDefault (): AnsicolorMethods;
    static get bgWhite (): AnsicolorMethods;
    static get bgBlack (): AnsicolorMethods;
    static get bgRed (): AnsicolorMethods;
    static get bgGreen (): AnsicolorMethods;
    static get bgYellow (): AnsicolorMethods;
    static get bgBlue (): AnsicolorMethods;
    static get bgMagenta (): AnsicolorMethods;
    static get bgCyan (): AnsicolorMethods;

    static get bgDarkGray (): AnsicolorMethods;
    static get bgLightGray (): AnsicolorMethods;
    static get bgLightRed (): AnsicolorMethods;
    static get bgLightGreen (): AnsicolorMethods;
    static get bgLightYellow (): AnsicolorMethods;
    static get bgLightBlue (): AnsicolorMethods;
    static get bgLightMagenta (): AnsicolorMethods;
    static get bgLightCyan (): AnsicolorMethods;
}

export function parse (text: string): AnsiColored;
export function strip (text: string): string;
export function isEscaped (x?: any): boolean;

export const white: AnsicolorMethods;
export const black: AnsicolorMethods;
export const red: AnsicolorMethods;
export const green: AnsicolorMethods;
export const yellow: AnsicolorMethods;
export const blue: AnsicolorMethods;
export const magenta: AnsicolorMethods;
export const cyan: AnsicolorMethods;

export const darkGray: AnsicolorMethods;
export const lightGray: AnsicolorMethods;
export const lightRed: AnsicolorMethods;
export const lightGreen: AnsicolorMethods;
export const lightYellow: AnsicolorMethods;
export const lightBlue: AnsicolorMethods;
export const lightMagenta: AnsicolorMethods;
export const lightCyan: AnsicolorMethods;

export const bright: AnsicolorMethods;
export const dim: AnsicolorMethods;
export const italic: AnsicolorMethods;
export const underline: AnsicolorMethods;
export const inverse: AnsicolorMethods;

export const bgDefault: AnsicolorMethods;
export const bgWhite: AnsicolorMethods;
export const bgBlack: AnsicolorMethods;
export const bgRed: AnsicolorMethods;
export const bgGreen: AnsicolorMethods;
export const bgYellow: AnsicolorMethods;
export const bgBlue: AnsicolorMethods;
export const bgMagenta: AnsicolorMethods;
export const bgCyan: AnsicolorMethods;

export const bgDarkGray: AnsicolorMethods;
export const bgLightGray: AnsicolorMethods;
export const bgLightRed: AnsicolorMethods;
export const bgLightGreen: AnsicolorMethods;
export const bgLightYellow: AnsicolorMethods;
export const bgLightBlue: AnsicolorMethods;
export const bgLightMagenta: AnsicolorMethods;
export const bgLightCyan: AnsicolorMethods;

export default ansicolor;
