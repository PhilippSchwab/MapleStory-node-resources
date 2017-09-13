fs = require 'fs'
FileClass = require './FileClass'
inflate = undefined
dxt     = undefined
PNG     = undefined
class Wz_Picture # assign to origin Wz_Png class
  constructor: (file, @offset, @length) ->
    @file = FileClass.clone file
    @file.seek @offset

  parse: () ->
    @width = await @file.wz_int()
    @height = await @file.wz_int()
    @form = await @file.wz_int() + await @file.readbyte()
    @file.offset += 4
    @bufsize = await @file.read_int() - 1
    @start = @file.offset + 1
    @datalength = @length - (@start - @offset)
    this

  rawdata: () ->
    @file.seek @start
    stream = if (await @file.read_int(2) & 0xffff) is 0x9c78
      buffer = await @file.read(@datalength-2)
      inflate = require('deflate-js').inflate unless inflate
      inflate buffer
    else
      throw "rawPicture excpetion at offset: #{@start}"
      []

    switch @form
      when 1, 513 then new Uint8Array(@width * @height * 2).map (_,i) -> (stream[i] || 0)
      when 2 then new Uint8Array(@width * @height * 4).map (_,i) -> (stream[i] || 0)
      when 3 then new Uint8Array(Math.ceil(@width / 4) * 4 * Math.ceil(@height / 4) * 4 / 8).map (_,i) -> (stream[i] || 0)
      when 517 then new Uint8Array Math.floor(@width * @height / 128).map (_,i) -> (stream[i] || 0)
      when 1026, 2050 then new Uint8Array(@width * @height).map (_,i) -> (stream[i] || 0)
      else

  extractRGBA: () ->
    raw = await this.rawdata()
    switch @form
      when 1
        rgba = new Uint8ClampedArray(@width * @height * 4)
        (if @width * @height then [0..@width * @height - 1] else []).map (i) =>
          rgba[i*4 + 0] = (p = raw[i*2+1] & 0x0F; p |= (p << 4))
          rgba[i*4 + 1] = (p = raw[i*2] & 0xF0; p |= (p >> 4))
          rgba[i*4 + 2] = (p = raw[i*2] & 0x0F; p |= (p << 4))
          rgba[i*4 + 3] = (p = raw[i*2+1] & 0xF0; p |= (p >> 4))
        rgba
      when 2
        rgba = new Uint8ClampedArray(@width * @height * 4)
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
        new Uint8ClampedArray(@width * @height * 4)

  extractPNG: () ->
    PNG = require('pngjs').PNG unless PNG
    png = new PNG
      width: @width
      height: @height
    png.data = new Buffer(await this.extractRGBA())
    # async not ready
    png

  toString: () -> "Pic{#{@form}}[W#{@width} H#{@height}] - #{@datalength}"

module.exports = Wz_Picture
module.exports.prototype.element = true
module.exports.prototype.type = "picture"
