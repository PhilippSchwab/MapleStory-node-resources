import * as fs from 'fs';
import * as path from 'path';
export function makeFileTable(p: string) {
  let wzlist = fs.readdirSync(p).filter(e => /\.wz$/.test(e))
  let list = wzlist.map(function(e): [string, string] {
    return [path.basename(e, '.wz'), path.join(p,e)]
  })
  return list
}
