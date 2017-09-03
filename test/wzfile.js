const fs = require('fs');
const path = require('path');
const parser = require('../parser');
// const memwatch = require('memwatch-next');
// memwatch.on('leak', (info) => {
//   console.error('Memory leak detected:\n', info);
// });
// memwatch.on('stats', (info) => {console.error(info)})
let i = 0
let a = setInterval(() => console.error(i++), 100)

let origin = path.join('..', 'origin')

let wzlist = fs.readdirSync(origin).filter(e => /\.wz$/.test(e))

/**
 * Print Wz_File Directory
 *
 * @param {Wz_File} wzfile
 */
function printDir(wzfile) {
  let space = len => new Array(len*2 + 1).join(' ')
  console.log(`${wzfile.name}:${wzfile.value ? `[${wzfile.value.dir.length}]` : ''}`)
  if (!wzfile.value) {
    console.log('unparsed wzfile')
    return
  }
  let level = 0
  let r = (node) => {
    level += 1
    node.map((n) => {
      let info = (`${space(level)}${n.name}${n.dirs ? `:[${n.dir.length}]` : ''}`)
      console.log(info)
      n.dirs && r(n.dir)
    })
    level -= 1
  }
  r(wzfile.value.dir)
}

!(async function() {
  for (el in wzlist) {
    let e = wzlist[el]
    try {
      let filename = path.join(origin, e)
      let file = new parser.wz_file(filename)
      file.name.match(/base/i) && (file.base = true);
      await file.parse()
      if (file.name.match(/character/i)) printDir(file)
      file = null
    } catch (error) {
      console.error(e)
      console.error(error)
    }
  }
})();

clearInterval(a)
