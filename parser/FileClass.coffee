fs = require 'fs'
iconv = require 'iconv-lite'
fsread = (fd, data, pos, length, offset) -> new Promise((callback) => fs.read(fd, data, pos, length, offset, callback))
module.exports = class FileClass
  constructor: (@filename) ->
    if @filename
      @fd = fs.openSync(@filename, 'r')
      @offset = 0

  isFile: true
  toString: () -> "FileClass #{@filename}"

  seek: (position) ->
    @offset = position

  read: (length) ->
    data = new Buffer(length)
    get = await fsread(@fd,data,0,length,@offset)
    @offset += get
    if get is length
      data
    else
      throw 'EOF'

  readbyte: () -> (await this.read(1))[0]

  pos: () ->
    @offset

  # wz private methods

  read_int: (i=4) ->
    data = await this.read(i)
    switch i
      when 1 then data.readInt8()
      when 2 then data.readInt16LE()
      when 4 then data.readInt32LE()
      when 8 then data.readUInt32LE() + data.readUInt32LE(4) * 0x10000
      else

  read_double: () -> await this.read(8).readDoubleLE()

  wz_single: () -> if (s = await this.readbyte()) is 0x80 then await this.read(4).readFloatLE() else if s >= 128 then s - 256 else s

  wz_int: (i=4) -> if (s = await this.readbyte()) is 0x80 then await this.read_int(i) else if s >= 128 then s - 256 else s

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


  wz_string_mod: (o=-1) ->
    flag = await this.readbyte()
    switch flag
      when 0x00, 0x73
        await this.wz_string()
      when 0x01, 0x1b
        o = this.pos() - 1 if o == -1
        await this.wz_string_at(o + await this.read_int())
      when 0x04
        await this.read(8)
        ""
      else
        console.error "string error: #{this.pos()}"
        throw "string error: #{this.pos()}"

  wz_string_at: (offset) ->
    oldoffset = this.pos()
    this.seek offset
    str = await this.wz_string()
    this.seek oldoffset
    str

FileClass.copy = FileClass.clone = (ref) ->
  return if not ref instanceof FileClass
  clone = new FileClass
  clone.fd = ref.fd
  clone.offset = ref.offset
  clone.filename = ref.filename
  clone
