FileClass = require './FileClass'
module.exports = class Wz_Sound
  constructor: (file, @offset, @length) ->
    @file = FileClass.clone file
    @file.seek @offset

  type: "sound"
  element: true

  parse: () ->
    len = await @file.wz_int()
    ms = await @file.wz_int()
    headerLen = @length - len - (await @file.pos() - @offset)
    @header = await @file.read headerLen
    @start = await @file.pos()
    @datalength = @length - (@start - @offset)
    @soundtype = switch @header.length
      when 0, 0x52 then "mp3"
      when 0x46
        if @length is (if @header.length < 0x3c then 0 else @header[0x38..0x3c].readInt32LE()) and ms is 1000
          "binary"
        else
          "wavraw"
      else "mp3"
    TryDecryptHeader = switch
      when @header.length is 0 then
      when @header.length > 51
        waveFormation = @header[51]
    this

  extractSound: () ->
    @file.seek @start
    switch @soundtype
      when "mp3"
        await @file.read @datalength
      when "wavraw" then
      else

  toString: () -> "Sound{#{@soundtype}} - #{@datalength}"
