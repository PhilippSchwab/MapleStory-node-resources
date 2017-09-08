fs = require 'fs'
iconv = require 'iconv-lite'
fsread = if (util = require('util'); util.promisify)
  util.promisify(fs.read)
else
  (fd, data, pos, length, offset) -> new Promise((callback, reject) => fs.read(fd, data, pos, length, offset, (err, bytesRead, buffer) => if err then reject(err) else callback({err, bytesRead})))

###*
# FileClass defined basic operation for wzFile archive
###
class FileClass

  ###*
  # @param {string} filename path to wz File
  ###
  constructor: (@filename) ->
    # file descriptor store as a reference
    @descriptor = { fd: undefined }
    # set the file offset in constructor
    @offset = 0

  # module class properties
  toString: () -> "FileClass #{@filename}"

  # File System Operaions
  ###* open a file descriptor ###
  open: (filename) ->
    @filename = filename if filename
    @descriptor.fd = await new Promise (callback, reject) =>
      fs.open(@filename, 'r', (err, fd) => if err then reject(err) else callback(fd))
    this
  ###* close this file ###
  close: () ->
    await new Promise (callback, reject) => fs.close(@descriptor.fd, callback)
    @descriptor.fd = undefined

  # offset operation
  ###*
  # change now offset
  # @param {number} position change now offset to the position
  ###
  seek: (position) -> @offset = position
  ###*
  # shift offset and return shift value
  # @param {number} position position add to now offset
  # @return {number} added offset
  ###
  shift: (position) -> @offset += position; position
  ###*
  # return now offset
  # @return {number} now offset
  ###
  pos: () -> @offset

  # value read operations

  ###*
  # async read buffer
  #
  # read at offset position with para's length
  # @param {number} length buffer length you will read
  # @return {Promise<Buffer>}
  ###
  read: (length) ->
    data = new Buffer(length)
    get = await fsread(@descriptor.fd,data,0,length,@offset)
    @offset += get.bytesRead
    throw get.err if get.err
    if get.bytesRead is length
      data
    else
      throw 'EOF'

  ###*
  # async read a byte
  # @return {number}
  ###
  readbyte: () -> (await this.read(1))[0]

  # wz private methods

  ###*
  # async read a int
  #
  # offset `i` bytes
  # @param {number} i bytes of an integer within {1,2,4,8}, default is 4 bytes number
  # @return {number} returned integer
  ###
  read_int: (i=4) ->
    data = await this.read(i)
    switch i
      when 1 then data.readInt8()
      when 2 then data.readInt16LE()
      when 4 then data.readInt32LE()
      when 8 then data.readUInt32LE() + data.readUInt32LE(4) * 0x10000
      else

  ###*
  # async read double number
  # @return {number} returned double number
  ###
  read_double: () -> (await this.read(8)).readDoubleLE()

  ###*
  # async read **WZformat** float number
  #
  # offset 1 or 5 bytes
  #
  # first one bytes as extending bytes,
  # if first bytes is not 0x80 than return the value of **first bytes**,
  # read an **additional 4 bytes as a float value** when first bytes is 0x80
  #
  # @return {number} returned float number
  ###
  wz_single: () -> if (s = await this.readbyte()) is 0x80 then (await this.read(4)).readFloatLE() else if s >= 128 then s - 256 else s

  ###*
  # async read **WZformat** int number
  #
  # offset 1 or 1+`i` bytes
  #
  # first one bytes as extending bytes,
  # if first bytes is not 0x80 than return the value of **first bytes**,
  # read an **additional `i` bytes as a integer value** when first bytes is 0x80
  #
  # @param {number} i bytes of an integer within {1,2,4,8}, default is 4 bytes number
  # @return {number} returned integer number
  ###
  wz_int: (i=4) -> if (s = await this.readbyte()) is 0x80 then await this.read_int(i) else if s >= 128 then s - 256 else s

  ###*
  # async read **WZformat** string value
  #
  # offset 1 and more bytes
  #
  # first one bytes as extending bytes:
  # - ≥ 0x80 read an ascii string
  # - < 0x80 read an UTF16LE string
  # - = 0 return empty string
  #
  # %% `FB` means first bytes
  #
  # **% read an ascii string**
  #
  # the string length is `(FB == 0x80 ? read_int(4 bytes) : 0x100 - FB)`
  #
  # string buffer need to decrypt if needed
  #
  # string buffer need remap using a dynamic mask
  #
  # **% read an UTF16LE string**
  #
  # the string length is `(FB == 0x7F ? read_int(4 bytes)*2 : FB*2)`
  #
  # string buffer need to decrypt if needed
  #
  # string buffer need remap using a dynamic mask
  #
  # decode string buffer to UTF16LE
  #
  # **% decrypt**
  #
  # some version of wzfile use an AES encrypt,
  # more information for [wzCrypto](./Wz_Crypto.html#DecryptFunction)
  #
  # @return {string} returned string
  ###
  wz_string: () ->
    size = await this.readbyte()
    result = switch
      when size >= 128
        mask = 0xAA
        size = if (size == 128) then await this.read_int() else 256 - size
        buffer = await this.read(size)
        buffer = @decrypt buffer if @decrypt
        t = buffer.map((o) -> (ch = o ^ mask; mask = (mask + 1) % 0x100; ch))
        String.fromCharCode(t...)
      when size == 0
        ""
      when size < 128
        mask = 0xAAAA
        size = if size is 127 then await this.read_int() else size
        buffer = await this.read(size*2)
        buffer = @decrypt buffer if @decrypt
        (if size then [0..size-1] else []).map (i) ->
          o = buffer.readUInt16LE(i*2)
          ch = o ^ mask
          mask = (mask + 1) % 0x10000
          buffer.writeUInt16LE(ch, i*2)
        iconv.decode(buffer, 'UTF16LE')
    result

  ###*
  # async read wz_string using a flag
  # @param {number?} offset mod offset
  # @return {string}
  ###
  wz_string_mod: (o=-1) ->
    flag = await this.readbyte()
    switch flag
      when 0x00, 0x73
        await this.wz_string()
      when 0x01, 0x1b
        o = @offset - 1 if o == -1
        offset = await this.read_int()
        await this.wz_string_at(o + offset)
      when 0x04
        await this.read(8)
        ""
      else
        console.error "string error: flag #{flag} @ #{@offset}"
        throw "string error: #{@offset}"

  ###*
  # async read wz_string at offset
  # @param {number} offset offset position of string
  # @return {string}
  ###
  wz_string_at: (offset) ->
    oldoffset = @offset
    this.seek offset
    str = await this.wz_string()
    this.seek oldoffset
    str

FileClass.prototype.isFile = true
###*
# clone a FileClass with same file
# @param {FileClass} ref reference object
# @return {FileClass} cloned FileClass object
###
FileClass.clone = (ref) ->
  return if not ref instanceof FileClass
  clone = new FileClass
  clone.descriptor = ref.descriptor
  clone.offset = ref.offset
  clone.filename = ref.filename
  clone.decrypt = ref.decrypt if ref.decrypt
  clone.DetectEncryptionType = ref.DetectEncryptionType if ref.DetectEncryptionType
  clone
FileClass.copy = FileClass.clone

module.exports = FileClass
