[FileClass, Wz_Sound, Wz_Vector, Wz_Picture, Wz_Picture] = [
  require './FileClass'
  require './wzSound'
  require './wzVector'
  require './wzPicture'
  require './wzUol'
]
class ImageNode
  constructor: (@offset, @length) ->
    @file = FileClass.clone @ref.file
    @file.offset = @offset

  extractImg: () ->
    entries = 0
    tag = await @file.wz_string_mod @offset
    node = {}

    extractValue = () =>
      value = {}
      value.name = await @file.wz_string_mod @offset
      [value.value, value.type] = switch flag = await @file.readbyte()
        when 0x00 then [null, null]
        when 0x02, 0x0b then [await @file.read_int(2), 'integer']
        when 0x03, 0x13 then [await @file.wz_int(), 'integer']
        when 0x14 then [await @file.wz_int(8), 'integer']
        when 0x04 then [await @file.wz_single(), 'float']
        when 0x05 then [await @file.read_double(), 'float']
        when 0x08 then [await @file.wz_string_mod(@offset), 'string']
        when 0x09 then [new @ref._node_type(@file.offset, (@file.offset += (length = await @file.read_int()); length)), 'image']
        else
          throw "extractValue 0x#{flag.toString(16)} error at offset: #{@file.pos()}"
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
      when "Shape2D#Convex2D"
        # entries = @file.wz_int()
        # node.children = []
        # seems problem here
        # TODO: check implementation
        # console.warn "Shape2D#Convex2D unsure implementation"
        node.value = new Wz_Vector await @file.wz_int(), await @file.wz_int()
        # (if entries then [1..entries] else []).map (i) =>
        #   node.children.push this.extractImg(0)
      when "Sound_DX8"
        @file.offset += 1
        sub_offset = @file.pos()
        sub_length = @length - (sub_offset - @offset)
        node.value = await new Wz_Sound(@file,sub_offset,sub_length).parse()
      when "UOL"
        @file.offset += 1
        node.value = new Wz_Uol(await @file.wz_string_mod(@offset))
      else
        throw "unknown wz tag: #{tag}"
    @value = node
module.exports = class Wz_Image
  constructor: (@info) ->
    @name = @info.name
    @file = @info.file
    self = this
    @_node_type = class Node extends ImageNode
      ref: self

  type: "image"
  element: true


  # Parse WZ Image
  parse: () ->
    @value = new @_node_type(@info.offset, @info.size)
    this


