const fs = require('fs');
const path = require('path');
const parser = require('../parser');
const {log,stop,nowlog} = require('./test_module');

// const memwatch = require('memwatch-next');
// memwatch.on('leak', (info) => { log('Memory leak detected:\n', JSON.stringify(info)); });
// memwatch.on('stats', (info) => {global.info.base = info.current_base;global.info.max_mem = info.max;global.info.min_mem = info.min})

let origin = path.join('..', 'origin')

let wzlist = fs.readdirSync(origin).filter(e => /\.wz$/.test(e))

!(async function() {
  let _log = (p, c, n) => {
    nowlog(n,c,p.join('/'))
  }
  try {
    let filename = path.join(origin, 'Base.wz')
    let file = new parser.wz_file(filename)
    await file.parse()
    let im = new parser.wz_image(file.value.dir[4])
    im.parse()
    let c = await im.value.extractImg()
    log(c)
    console.log('done')
  } catch (error) {
    console.error(error)
  }
  stop()
})();
