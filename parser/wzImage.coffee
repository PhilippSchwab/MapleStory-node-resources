[FileClass, Wz_Sound, Wz_Vector, Wz_Picture, Wz_Uol] = [
  require './FileClass'
  require './wzSound'
  require './wzVector'
  require './wzPicture'
  require './wzUol'
]
class ImageNode
  constructor: (@offset, @length, father) ->
    @file = FileClass.clone @ref.file
    @file.offset = @offset
    if @ref.log.path
      @father = father
      @path = if father.path then father.path.slice(0) else []

  toString: () -> "ImageNode#{if @path then ":#{@path.join '/'}" else ''}"

  extractImg: () ->
    entries = 0
    tag = await @file.wz_string_mod @ref.info.offset
    node = {}

    extractValue = () =>
      value = {}
      value.name = await @file.wz_string_mod @ref.info.offset
      @path.push value.name if @path
      [value.value, value.type] = switch flag = await @file.readbyte()
        when 0x00 then [null, 'null']
        when 0x02, 0x0b then [await @file.read_int(2), 'integer']
        when 0x03, 0x13 then [await @file.wz_int(), 'integer']
        when 0x14 then [await @file.wz_int(8), 'integer']
        when 0x04 then [await @file.wz_single(), 'float']
        when 0x05 then [await @file.read_double(), 'float']
        when 0x08 then [await @file.wz_string_mod(@ref.info.offset), 'string']
        when 0x09 then [(length = await @file.read_int();new @ref._node_type(@file.offset, @file.shift(length), this)), 'image']
        else
          throw "extractValue 0x#{flag.toString(16)} error at offset: #{@file.pos()}"
      @ref.log.element(@path, value.type, value.value) if @ref.log.element
      @path.pop() if @path
      value

    switch node.class = tag
      when "Property"
        @file.offset += 2
        entries = await @file.wz_int()
        node.children = []
        if entries > 0
          for [1..entries]
            node.children.push await extractValue()
      when "Shape2D#Vector2D"
        node.value = new Wz_Vector await @file.wz_int(), await @file.wz_int()
        @ref.log.element(@path, node.value.type, node.value) if @ref.log.element
      when "Canvas"
        @file.offset += 1
        if await @file.readbyte() is 0x01
          @file.offset += 2
          entries = await @file.wz_int()
          node.children = []
          if entries > 0
            for [1..entries]
              node.children.push await extractValue()
        sub_offset = @file.pos()
        sub_length = @length - (sub_offset - @offset)
        node.value = await new Wz_Picture(@file,sub_offset,sub_length).parse()
        @ref.log.element(@path, node.value.type, node.value) if @ref.log.element
      when "Shape2D#Convex2D"
        # TODO: check implementation
        @ref.log.warn "Shape2D#Convex2D unsure implementation" if @ref.log.warn
        node.value = new Wz_Vector await @file.wz_int(), await @file.wz_int()
        @ref.log.element(@path, node.value.type, node.value) if @ref.log.element
      when "Sound_DX8"
        @file.offset += 1
        sub_offset = @file.pos()
        sub_length = @length - (sub_offset - @offset)
        node.value = await new Wz_Sound(@file,sub_offset,sub_length).parse()
        @ref.log.element(@path, node.value.type, node.value) if @ref.log.element
      when "UOL"
        @file.offset += 1
        node.value = new Wz_Uol(await @file.wz_string_mod(@ref.info.offset))
        @ref.log.element(@path, node.value.type, node.value) if @ref.log.element
      else
        throw "unknown wz tag: #{tag}"
    @value = node
    this

  release: () ->
    delete @value

ImageNode.prototype.type = "ImageNode"

###*
# image element in wzFile
###
class Wz_Image
  constructor: (@info) ->
    @name = @info.name
    @file = @info.file
    @log = # define for debug
      path: false
    self = this
    @_node_type = class Node extends ImageNode
      ref: self

  ###* Parse WZ Image ###
  parse: () ->
    @value = new @_node_type(@info.offset, @info.size, this)
    this

module.exports = Wz_Image
module.exports.prototype.element = true
module.exports.prototype.type = "image"
