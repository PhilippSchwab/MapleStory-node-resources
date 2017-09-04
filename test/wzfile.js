const fs = require('fs');
const path = require('path');
const parser = require('../parser');
const {log,stop,nowlog} = require('./test_module');

// const memwatch = require('memwatch-next');
// memwatch.on('leak', (info) => { log('Memory leak detected:\n', JSON.stringify(info)); });
// memwatch.on('stats', (info) => {global.info.base = info.current_base;global.info.max_mem = info.max;global.info.min_mem = info.min})

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

let syncTest = (async function() {
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
      printDir(file)
      file.release()
    } catch (error) {
      console.error(e)
      console.error(error)
    }
  }
  stop()
  console.error(`wzfile recursion done, use ${(new Date) - global.timestart}ms, final memory base ${global.info.base} ${global.info.min_mem}-${global.info.max_mem}`)
});

let asyncTest = (async function() {
  let _log = (p, c, n) => {
    nowlog(n,c,p.join('/'))
  }
  let a = await Promise.all(wzlist.map(async e => {
    try {
      let filename = path.join(origin, e)
      let file = new parser.wz_file(filename)
      file.log = _log
      // if (file.name.match(/character/i))
        await file.parse()
      printDir(file)
      file.release()
      return file
    } catch (error) {
      console.error(e)
      console.error(error)
    }
  }))
  console.error(a.map(e => `File ${e.name} =${e.file.offset}`).join("\n"))
  stop()
  console.error(`wzfile recursion done, use ${(new Date) - global.timestart}ms, final memory base ${global.info.base} ${global.info.min_mem}-${global.info.max_mem}`)
});

0 ? asyncTest() : syncTest()
