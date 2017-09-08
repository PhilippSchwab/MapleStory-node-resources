const fs = require('fs');
const path = require('path');
const parser = require('../parser');
/* devtool */

// const memwatch = require('memwatch-next');
// memwatch.on('leak', (info) => { log('Memory leak detected:\n', JSON.stringify(info)); });
// memwatch.on('stats', (info) => {global.info.base = info.current_base;global.info.max_mem = info.max;global.info.min_mem = info.min})

let origin = path.join('..', 'origin')

let wzlist = fs.readdirSync(origin).filter(e => /\.wz$/.test(e))

let rimage = async function(imagenode) {
  await imagenode.value.extractImg()
  for (let i in imagenode.value.value.children) {
    let c = imagenode.value.value.children[i]
    rimage(c)
  }
}

let start = (async function() {
  let _log = (p, c, n) => {
    nowlog(n,c,p.join('/'))
  }
  // try {
    let filename = path.join(origin, 'String.wz')
    let file = new parser.wz_file(filename)
    await file.parse()
    let im = new parser.wz_image(file.value.dir[0])
    im.log.path = true
    im.log.element = (path, type, value) => {
      console.log(`${path.join('/')} - ${type} - ${value.toString()}`)
    }
    im.parse()
    await rimage(im)
    console.log('done')
  // } catch (error) {
    // console.error(error)
  // }
  stop()
});
