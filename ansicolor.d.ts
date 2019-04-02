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

declare class AnsiColored extends Iterator<ParsedSpan> {

    get spans (): ParsedSpan[];
    get str (): string;
    get asChromeConsoleLogArguments (): string[];
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

    nice: ansicolor; // installs unsafe String extensions when accessed
    rgb: RGBValues;  // RGB color schema

    parse (text: string): AnsiColored;
    strip (text: string): string;

    default (text: string): string;
    white (text: string): string;
    black (text: string): string;
    red (text: string): string;
    green (text: string): string;
    yellow (text: string): string;
    blue (text: string): string;
    magenta (text: string): string;
    cyan (text: string): string;

    darkGray (text: string): string;
    lightGray (text: string): string;
    lightRed (text: string): string;
    lightGreen (text: string): string;
    lightYellow (text: string): string;
    lightBlue (text: string): string;
    lightMagenta (text: string): string;
    lightCyan (text: string): string;

    bright (text: string): string;
    dim (text: string): string;
    italic (text: string): string;
    underline (text: string): string;
    inverse (text: string): string;

    bgDefault (text: string): string;
    bgWhite (text: string): string;
    bgBlack (text: string): string;
    bgRed (text: string): string;
    bgGreen (text: string): string;
    bgYellow (text: string): string;
    bgBlue (text: string): string;
    bgMagenta (text: string): string;
    bgCyan (text: string): string;

    bgDarkGray (text: string): string;
    bgLightGray (text: string): string;
    bgLightRed (text: string): string;
    bgLightGreen (text: string): string;
    bgLightYellow (text: string): string;
    bgLightBlue (text: string): string;
    bgLightMagenta (text: string): string;
    bgLightCyan (text: string): string;
}

declare const ansicolor: ansicolor

export = ansicolor;
