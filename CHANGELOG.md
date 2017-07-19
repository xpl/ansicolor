# Recent Updates / Changelog

- Each input line now gets wrapped separately, i.e. `'foo\nbar'.red === 'foo'.red + '\n' + 'bar'.red`
- You can now do `ansi.green.inverse.underline.italic ('hello')` (chainable API)
- You can now change the default RGB values for CSS output
- `.parse ()` now returns full span style data (ex. `{ italic: true, bgColor: { name: 'red', dim: true }, ...`)
- `.strip ()` for removing ANSI codes
- `.names` for run-time reflection
