const poolutil = require('../pool/util')
const FileTable = require('../pool/FileTable').default
let list = poolutil.makeFileTable('../origin')
let root = new FileTable(list)
;(async function() {
  console.log('start')
  let f = await root.node('Map2/Back/../../String')
  let list = await f.list()
  console.log(list)
})();
console.log(root)
