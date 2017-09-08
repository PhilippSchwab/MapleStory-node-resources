const fs = require('fs');
const path = require('path');
const parser = require('../parser');
const {log,stop,nowlog} = require('./test_module');

const memwatch = require('memwatch-next');
memwatch.on('leak', (info) => { log('Memory leak detected:\n', JSON.stringify(info)); });
memwatch.on('stats', (info) => {global.info.base = info.current_base;global.info.max_mem = info.max;global.info.min_mem = info.min})

let origin = path.join('..', 'origin')

let wzlist = fs.readdirSync(origin).filter(e => /\.wz$/.test(e))

let rimage = async function(imagenode) {
  if (imagenode.type !== 'image') return;
  try {
    await imagenode.value.extractImg()
  } catch (error) {
    log(error, imagenode)
  }
  if (!imagenode.value.value.children) return;
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
    let e = wzlist[el]
    try {
      let filename = path.join(origin, e)
      let file = new parser.wz_file(filename)
      await file.parse()
      let logelement = (path, type, value) => {
        nowlog(`[${e}] ${path.join('/')} - ${type} - ${value.toString().substring(0,15)}`)
      }
      let rimg = async e => {
        let im = new parser.wz_image(e)
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
      console.log('done')
      file.release()
    } catch (error) {
      console.error(e)
      console.error(error)
    }
  }
  stop()
  console.error(`wzfile recursion done, use ${(new Date) - global.timestart}ms, final memory base ${global.info.base} ${global.info.min_mem}-${global.info.max_mem}`)
})();
