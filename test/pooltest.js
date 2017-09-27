const poolutil = require('../pool/util')
const FileTable = require('../pool/FileTable').default
let list = poolutil.makeFileTable('../origin')
let root = new FileTable(list)
console.log(root)
