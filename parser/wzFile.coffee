FileClass = require './FileClass'
Crypto = require './wzCrypto'
path = require 'path'
module.exports = class Wz_File
  constructor: (file) ->
    if file.isFile
      @file = file
      @name = path.basename file.filename, '.wz'
    else if typeof(file) is 'string'
      filename = file.match(/^(.*?)(\.wz)?$/)[1]
      @file = new FileClass filename + '.wz'
      @name = path.basename filename, '.wz'

  parse: () ->
    return this if @value
    @file.seek 0

    # .wz file head info
    sign = (await @file.read(4)).toString();return if sign != 'PKG1'    # magic number must be "PKG1"
    datasize = await @file.read_int 8                                   #
    headersize = await @file.read_int()                                 #
    copyright = (await @file.read(headersize - @file.pos())).toString() #
    encver = await @file.read_int 2                                     #
    info = { sign, datasize, headersize, copyright, encver }

    await Crypto.DetectEncryption @file

    directory = () =>
      count = await @file.wz_int()
      dir = []
      for i in [1..count]
        result = {file: @file}
        opt = await @file.readbyte()
        result.name = switch opt
          when 0x02 then await @file.wz_string_at(info.headersize + 1 + await @file.read_int())
          when 0x03, 0x04 then await @file.wz_string()
        result.size = await @file.wz_int()
        result.checksum = await @file.wz_int()
        switch opt
          when 0x02, 0x04
            result.pos = @file.pos()
            result.hashOffset = await @file.read_int()
          when 0x03
            await @file.read 4
            result.dirs = true
        dir.push result

      for result in dir
        unless @base
          result.dir = await directory() if result.dirs
        else
          result.dir = [] if result.dirs

      dir

    dirOffset = (dir) =>
      pos = @file.pos()
      calc = (node) =>
        node.map (result) =>
          unless result.dirs
            result.offset = pos
            pos += result.size
          else
            calc(result.dir)
      calc(dir)

    @value =
      info: info
      dir:  await directory()
      dirs: true
    dirOffset(@value.dir)

    this
