# Cryptography for wzparser
fs = require 'fs'
aesjs = require 'aes-js'
fsread = if (util = require('util'); util.promisify)
  util.promisify(fs.read)
else
  (fd, data, pos, length, offset) -> new Promise((callback, reject) => fs.read(fd, data, pos, length, offset, (err, bytesRead, buffer) => if err then reject(err) else callback({bytesRead})))

aesecb = new aesjs.ModeOfOperation.ecb(
  [
    0x13, 0x00, 0x00, 0x00,
    0x08, 0x00, 0x00, 0x00,
    0x06, 0x00, 0x00, 0x00,
    0xB4, 0x00, 0x00, 0x00,
    0x1B, 0x00, 0x00, 0x00,
    0x0F, 0x00, 0x00, 0x00,
    0x33, 0x00, 0x00, 0x00,
    0x52, 0x00, 0x00, 0x00
  ]
)

EncryptionType =
  BMS: [ 0x00, 0x00, 0x00, 0x00 ]
  KMS: [ 0xb9, 0x7d, 0x63, 0xe9 ]
  GMS: [ 0x4d, 0x23, 0xc7, 0x2b ]

DecryptFunction = (type) ->
  switch type
    when null
      (cipherbuffer) -> cipherbuffer
    when "BMS", "KMS", "GMS"
      iv = EncryptionType[type]
      keys = aesecb.encrypt(iv.concat(iv,iv,iv))
      (cipherbuffer) ->
        nowkey = keys
        cipherbuffer.map (e,i) ->
          nowkey = aesecb.encrypt(nowkey) if i >= 16 && i % 16 == 0
          (e ^ nowkey[i % 16])

DetectEncryption = (file) ->
  pos = file.offset
  buffer = new Buffer(4)
  if (await fsread(file.descriptor.fd, buffer, 0, 1, pos)).bytesRead is 1
    length = if buffer[0] is 0x80
      await fsread(file.descriptor.fd, buffer, 0, 4, pos+1)
      pos += 4
      buffer.readUInt32LE()
    else buffer[0]
    await fsread(file.descriptor.fd, buffer, 0, 1, pos+2)
    length = 256 - buffer[0]
    buffer = new Buffer(length)
    await fsread(file.descriptor.fd, buffer, 0, length, pos+3)
    trans = buffer.map((o,i) => o ^ (0xAA + i))
    result = [ null, "BMS", "KMS", "GMS" ].map (type) -> String.fromCharCode DecryptFunction(type)(trans)...
    for str, i in result
      if /\.img$/.test(str) || /^[\w\.]+$/.test(str)
        type = [ null, "BMS", "KMS", "GMS" ][i]
        file.DetectEncryptionType = (type || null)
        file.decrypt = DecryptFunction(type)
        break
  else
    throw 'File cannot read, DetectEncryption failed'

module.exports = { DetectEncryption, DecryptFunction }
