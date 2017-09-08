FileClass = require './FileClass'
Crypto = require './wzCrypto'
path = require 'path'
###*
# wz File Directory class
#
# **%** Construction
#
# Wz File is consist by a directory index and many image elements,
# this class foucs on extracting file index and get their offset and size,
#
###
class Wz_File
  constructor: (file) ->
    if file.isFile
      @file = file
      @name = path.basename file.filename, '.wz'
    else if typeof(file) is 'string'
      filename = file.match(/^(.*?)(\.wz)?$/)[1]
      @file = new FileClass filename + '.wz'
      @name = path.basename filename, '.wz'

  ###* parse the wz file with directory of images ###
  parse: () ->
    await @file.open() unless @file.descriptor.fd
    return this if @value
    @file.seek 0

    # .wz file head info
    sign = (await @file.read(4)).toString();return if sign != 'PKG1'    # magic number must be "PKG1"
    datasize = await @file.read_int 8                                   # file size after header
    headersize = await @file.read_int()                                 # size of wz File head before directories
    copyright = (await @file.read(headersize - @file.pos())).toString() # copyright info
    encver = await @file.read_int 2                                     # wz File game version
    info = { sign, datasize, headersize, copyright, encver }

    # Log record
    now_path = ['/']
    rec_count = 0

    await Crypto.DetectEncryption @file

    directory = () =>
      count = await @file.wz_int()
      return [] if count is 0
      dir = []
      for i in [1..count]
        result = {file: @file}
        rec_count += 1
        opt = await @file.readbyte()
        result.name = switch opt
          when 0x02 then await @file.wz_string_at(info.headersize + 1 + await @file.read_int())
          when 0x03, 0x04 then await @file.wz_string()
        @log(now_path, rec_count, @name) if @log
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

      for node in dir
        if node.dirs
          now_path.push node.name
          node.dir = await directory()
          now_path.pop()

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

  ###* release the parsed value ###
  release: () ->
    delete @value

module.exports = Wz_File
