import Colors from './ansicolor.js'

/* Regenerate in Repl:
  const Colors = require('ansicolor')
  const reserved = [...Object.getOwnPropertyNames(Object), 'default']
  const filtered = Object.getOwnPropertyNames(Colors).filter(k => !reserved.includes(k) )
  filtered.forEach(k => console.log(`export const ${k} = Colors.${k}`))
  console.log('export default Colors')

*/

export const nice = Colors.nice
export const parse = Colors.parse
export const strip = Colors.strip
export const ansicolor = Colors.ansicolor
export const black = Colors.black
export const bgBlack = Colors.bgBlack
export const red = Colors.red
export const bgRed = Colors.bgRed
export const green = Colors.green
export const bgGreen = Colors.bgGreen
export const yellow = Colors.yellow
export const bgYellow = Colors.bgYellow
export const blue = Colors.blue
export const bgBlue = Colors.bgBlue
export const magenta = Colors.magenta
export const bgMagenta = Colors.bgMagenta
export const cyan = Colors.cyan
export const bgCyan = Colors.bgCyan
export const lightGray = Colors.lightGray
export const bgLightGray = Colors.bgLightGray
export const bgDefault = Colors.bgDefault
export const darkGray = Colors.darkGray
export const bgDarkGray = Colors.bgDarkGray
export const lightRed = Colors.lightRed
export const bgLightRed = Colors.bgLightRed
export const lightGreen = Colors.lightGreen
export const bgLightGreen = Colors.bgLightGreen
export const lightYellow = Colors.lightYellow
export const bgLightYellow = Colors.bgLightYellow
export const lightBlue = Colors.lightBlue
export const bgLightBlue = Colors.bgLightBlue
export const lightMagenta = Colors.lightMagenta
export const bgLightMagenta = Colors.bgLightMagenta
export const lightCyan = Colors.lightCyan
export const bgLightCyan = Colors.bgLightCyan
export const white = Colors.white
export const bgWhite = Colors.bgWhite
export const bgBrightRed = Colors.bgBrightRed
export const bgBrightGreen = Colors.bgBrightGreen
export const bgBrightYellow = Colors.bgBrightYellow
export const bgBrightBlue = Colors.bgBrightBlue
export const bgBrightMagenta = Colors.bgBrightMagenta
export const bgBrightCyan = Colors.bgBrightCyan
export const bright = Colors.bright
export const dim = Colors.dim
export const italic = Colors.italic
export const underline = Colors.underline
export const inverse = Colors.inverse
export const names = Colors.names
export const rgb = Colors.rgb

export default Colors
