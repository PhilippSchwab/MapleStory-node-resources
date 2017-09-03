module.exports = class Wz_Sound
  constructor: (@file, @offset, @length) ->
    @file.seek @offset
    len = @file.wz_int()
    ms = @file.wz_int()
    headerLen = @length - len - (@file.pos() - @offset)
    @header = @file.read headerLen
    @start = @file.pos()
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

  type: "sound"
  element: true

  current: (opt) ->
    @file.seek @offset
    if opt is "buffer"
      @file.read @size
    else if opt is "data"
      @file.seek @start
      @file.read @datalength
    else
      @file

  data: () -> this.current("data")

  extractSound: () ->
    @file.seek @start
    switch @soundtype
      when "mp3"
        @file.read @datalength
      when "wavraw" then
      else

  toString: () -> "Sound{#{@soundtype}} - #{@datalength}"
