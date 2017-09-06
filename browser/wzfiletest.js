/* devtool */
const fs = require('fs');
const path = require('path');
const parser = require('../parser');
const com = require('./_common');

com.render(`
#a
pre#b
`)
let nowlog = (...str) => document.getElementById('a').innerText = str.join(', ')
let printlog = (str) => document.getElementById('b').innerText += '\n' + str
// const memwatch = require('memwatch-next');
// memwatch.on('leak', (info) => { log('Memory leak detected:\n', JSON.stringify(info)); });
// memwatch.on('stats', (info) => {global.info.base = info.current_base;global.info.max_mem = info.max;global.info.min_mem = info.min})

let origin = path.join('..', 'origin')

let wzlist = fs.readdirSync(origin).filter(e => /\.wz$/.test(e))
let list

/**
 * Print Wz_File Directory
 *
 * @param {Wz_File} wzfile
 */
function printDir(wzfile) {
  let info = ''
  let space = len => new Array(len*2 + 1).join(' ')
  info += (`${wzfile.name}:${wzfile.value ? `[${wzfile.value.dir.length}]` : ''}\n`)
  if (!wzfile.value) {
    info += ('unparsed wzfile\n')
    return
  }
  let level = 0
  let r = (node) => {
    level += 1
    node.map((n) => {
      let inf = (`${space(level)}${n.name}${n.dirs ? `:[${n.dir.length}]` : ''}\n`)
      info += (inf)
      n.dirs && r(n.dir)
    })
    level -= 1
  }
  r(wzfile.value.dir)
  return info
}

let syncTest = (async function() {
  let timestart = new Date()
  let _log = (p, c, n) => {
    nowlog(n,c,p.join('/'))
  }
  for (let el in wzlist) {
    let e = wzlist[el]
    try {
      let filename = path.join(origin, e)
      let file = new parser.wz_file(filename)
      file.log = _log
      await file.parse()
      printlog(printDir(file))
      file.release()
    } catch (error) {
      console.error(e)
      console.error(error)
    }
  }
  stop()
  console.log(`wzfile recursion done, use ${(new Date) - timestart}ms`)
});

let asyncTest = (async function() {
  let timestart = new Date()
  let _log = (p, c, n) => {
    nowlog(n,c,p.join('/'))
  }
  list = await Promise.all(wzlist.map(async e => {
    try {
      let filename = path.join(origin, e)
      let file = new parser.wz_file(filename)
      file.log = _log
      // if (file.name.match(/character/i))
        await file.parse()
      printlog(printDir(file))
      file.release()
      return file
    } catch (error) {
      console.error(e)
      console.error(error)
    }
  }))
  console.error(list.map(e => `File ${e.name} =${e.file.offset}`).join("\n"))
  stop()
  console.error(`wzfile recursion done, use ${(new Date) - timestart}ms`)
});

