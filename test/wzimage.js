const fs = require('fs');
const path = require('path');
const parser = require('../parser');
const {log,stop,nowlog} = require('./test_module');

try {
  const memwatch = require('memwatch-next');
  // memwatch.on('leak', (info) => { log('Memory leak detected:\n', JSON.stringify(info)); });
  memwatch.on('stats', (info) => {global.info.base = info.current_base;global.info.max_mem = info.max;global.info.min_mem = info.min})
} catch (error) {}

let i = 0;
let origin = path.join('..', 'origin')

let wzlist = fs.readdirSync(origin).filter(e => /\.wz$/.test(e))
let info = {}

let rimage = async function(imagenode) {
  if (imagenode.type !== 'image') return;
  try {
    await imagenode.value.extractImg()
  } catch (error) {
    console.log("\x1b[1;31mERROR\x1b[0m  ", error, String(imagenode).substring(0,30))
    console.log(info.e,info.img.name, info.path && info.path.join('/'),info.type,String(info.value).substring(0,30))
  }
  if (!(imagenode.value && imagenode.value.value && imagenode.value.value.children)) return;
  // await Promise.all(imagenode.value.value.children.map(rimage))
  for (let i in imagenode.value.value.children) {
    let c = imagenode.value.value.children[i]
    await rimage(c)
  }
}

!(async function() {
  let _log = (p, c, n) => {
    nowlog(n,c,p.join('/'))
  }
  for (let el in wzlist) {
    if (el < 5) {continue}
    let e = wzlist[el]
    info.e = e
    try {
      let filename = path.join(origin, e)
      let file = new parser.wz_file(filename)
      await file.parse()
      let logelement = (path, type, value) => {
        i++
        info.path = path
        info.type = type
        info.value = value
        nowlog(`[${e}] [${i}] ${parseInt(i/((new Date) - global.timestart))}/ms ${info.img.name} ${path.join('/')} - ${type} - ${value && value.toString().substring(0,15).replace(/\s/g,'')}`)
      }
      let rimg = async e => {
        let im = new parser.wz_image(e)
        info.img = im
        info.path = ''
        info.type = ''
        info.value = ''
        im.log.path = true
        im.log.element = logelement
        im.parse()
        await rimage(im)
      }
      let r = async (c) => {
        if (c.dirs) {
          for (let i in c.dir) {
            let qw = c.dir[i]
            await r(qw)
          }
        }
        else {
          // list.push(rimg(c))
          await rimg(c)
        }
      }
      await r(file.value)
      // console.log(list.length)
      // await Promise.all(list)
      // await im.value.extractImg()
      console.log(`\ndone[${el}] ${e}\n`)
      file.release()
    } catch (error) {
      console.log("\x1b[1;31mERROR\x1b[0m  ",error)
      console.log(e,info.path && info.path.join('/'),info.type,String(info.value).substring(0,30))
    }
  }
  stop()
  console.log(`wzfile recursion done, use ${(new Date) - global.timestart}ms, final memory base ${global.info.base} ${global.info.min_mem}-${global.info.max_mem}`)
})();
