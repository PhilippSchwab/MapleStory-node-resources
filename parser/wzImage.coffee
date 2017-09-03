Wz_Sound = require './wzSound'
Wz_Vector = require './wzVector'
Wz_Picture = require './wzPicture'
Wz_Uol = require './wzUol'
module.exports = class Wz_Image
  constructor: (@info) ->
    @name = @info.name
    @file = @info.file
    @size = @info.size
    @checksum = @info.checksum
    @hashedOffset = @info.hashOffset
    @hashedOffsetPosition = @info.pos
    @offset = @info.offset

  type: "image"
  element: true

  current: (opt) ->
    @file.seek @offset
    if opt is "buffer"
      @file.read(@size)
    else
      @file
  
  data: () -> this.current("buffer")

  # Parse WZ Image
  parse: () ->
    return this if @dir
    @file.seek @offset
    @path = []
    @dir = this.extractImg()
    delete @path
    @value = @dir
    this

  extractImg: (length) ->
    length = @size unless length
    start = @file.pos()
    entries = 0
    tag = @file.wz_string_mod @offset
    node = {}
    node.path = Array.from @path
    switch node.class = tag
      when "Property"
        @file.read 2
        entries = @file.wz_int()
        node.children = []
        (if entries then [1..entries] else []).map (i) =>
          node.children.push this.extractValue()
      when "Shape2D#Vector2D"
        node.value = new Wz_Vector @file.wz_int(), @file.wz_int()
      when "Canvas"
        @file.readbyte()
        if @file.readbyte() is 0x01
          @file.read 2
          entries = @file.wz_int()
          node.children = []
          (if entries then [1..entries] else []).map (i) =>
            node.children.push this.extractValue()
        sub_offset = @file.pos()
        sub_length = length - (sub_offset - start)
        node.value = new Wz_Picture(@file,sub_offset,sub_length)
      when "Shape2D#Convex2D"
        # entries = @file.wz_int()
        # node.children = []
        # seems problem here
        # TODO: check implementation
        # console.warn "Shape2D#Convex2D unsure implementation"
        node.value = new Wz_Vector @file.wz_int(), @file.wz_int()
        # (if entries then [1..entries] else []).map (i) =>
        #   node.children.push this.extractImg(0)
      when "Sound_DX8"
        @file.readbyte()
        sub_offset = @file.pos()
        sub_length = length - (sub_offset - start)
        node.value = new Wz_Sound(@file,sub_offset,sub_length)
      when "UOL"
        @file.readbyte()
        node.value = new Wz_Uol(@file.wz_string_mod(@offset))
        node.value.path @path
      else
        throw "unknown wz tag: #{tag}"
    @file.seek start + length
    node

  extractValue: () ->
    node = {}
    node.name = @file.wz_string_mod @offset
    node.img = this
    @path.push node.name
    [node.value, node.type] = switch flag = @file.readbyte()
      when 0x00 then [null, null]
      when 0x02, 0x0b then [@file.read_int(2), 'integer']
      when 0x03, 0x13 then [@file.wz_int(), 'integer']
      when 0x14 then [@file.wz_int(8), 'integer']
      when 0x04 then [@file.wz_single(), 'float']
      when 0x05 then [@file.read_double(), 'float']
      when 0x08 then [@file.wz_string_mod(@offset), 'string']
      when 0x09 then [this.extractImg(@file.read_int()), 'image']
      else
        throw "extractValue 0x#{flag.toString(16)} error at offset: #{@file.pos()}"
    if @path.pop() isnt node.name then console.error "conformity error"
    node
