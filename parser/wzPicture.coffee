fs = require 'fs'
inflate = undefined
dxt     = undefined
PNG     = undefined
module.exports = class Wz_Picture # assign to origin Wz_Png class
  constructor: (@file, @offset, @length) ->
    @file.seek @offset
    @width = @file.wz_int()
    @height = @file.wz_int()
    @form = @file.wz_int() + @file.readbyte()
    @file.read 4
    @bufsize = @file.read_int() - 1
    @start = @file.pos() + 1
    @datalength = @length - (@start - @offset)

  type: "picture"
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

  rawdata: () ->
    @file.seek @start
    stream = if (@file.read_int(2) & 0xffff) is 0x9c78
      buffer = @file.read(@datalength-2)
      inflate = require('deflate-js').inflate unless inflate
      inflate buffer
    else
      console.log "rawPicture excpetion at offset: #{@start}"
      []

    switch @form
      when 1, 513 then new Uint8Array(@width * @height * 2).map (_,i) -> (stream[i] || 0)
      when 2 then new Uint8Array(@width * @height * 4).map (_,i) -> (stream[i] || 0)
      when 3 then new Uint8Array(Math.ceil(@width / 4) * 4 * Math.ceil(@height / 4) * 4 / 8).map (_,i) -> (stream[i] || 0)
      when 517 then new Uint8Array Math.floor(@width * @height / 128).map (_,i) -> (stream[i] || 0)
      when 1026, 2050 then new Uint8Array(@width * @height).map (_,i) -> (stream[i] || 0)
      else

  extractRGBA: () ->
    # return @RGBAdata if @RGBAdata
    raw = this.rawdata()
    # @RGBAdata =
    switch @form
      when 1
        rgba = new Uint8Array(@width * @height * 4)
        (if @width * @height then [0..@width * @height - 1] else []).map (i) =>
          rgba[i*4 + 0] = (p = raw[i*2+1] & 0x0F; p |= (p << 4))
          rgba[i*4 + 1] = (p = raw[i*2] & 0xF0; p |= (p >> 4))
          rgba[i*4 + 2] = (p = raw[i*2] & 0x0F; p |= (p << 4))
          rgba[i*4 + 3] = (p = raw[i*2+1] & 0xF0; p |= (p >> 4))
        rgba
      when 2
        rgba = new Uint8Array(@width * @height * 4)
        console.warn('unsure about mode 2')
        (if @width * @height then [0..@width * @height - 1] else []).map (i) =>
          rgba[i*4 + 0] = raw[i*4 + 2]
          rgba[i*4 + 1] = raw[i*4 + 1]
          rgba[i*4 + 2] = raw[i*4 + 0]
          rgba[i*4 + 3] = raw[i*4 + 3]
        rgba
      when 1026, 2050
        console.log 'dxt flag: ', switch @form
          when 1026 then 'DXT3'
          when 2050 then 'DXT5'
        dxt = require('./dxt') unless dxt
        dxt.decompress raw, @width, @height, switch @form
          when 1026 then dxt.flags.DXT3
          when 2050 then dxt.flags.DXT5
      else
        console.error "other picture format: " + @form
        new Uint8Array(@width * @height * 4)

  extractPNG: () ->
    PNG = require('pngjs').PNG unless PNG
    png = new PNG
      width: @width
      height: @height
    png.data = new Buffer(this.extractRGBA())
    png

  toString: () -> "Pic{#{@form}}[W#{@width} H#{@height}] - #{@datalength}"
