if (!global.timestart) {
  global.timestart = new Date();
}
if (!global.info) global.info = {};
module.exports = {
  log: (...info) => process.stderr.write(`${(new Date()) - global.timestart}:[${JSON.stringify(global.info)}] ${info.map(e => e.toString()).join(', ')}\n`),
  nowlog: (...info) => process.stderr.write(`\x1b[K${(new Date()) - global.timestart}: ${info.map(e => e.toString()).join(', ')}\r`),
  stop: () => {process.stderr.write("\x1b[K");global.interval && clearInterval(global.interval)}
}
