[DXT1, DXT3, DXT5] = [1,3,5]

rgb565 = (val) ->
  [_r,_g,_b] = [
    (val & 0xf800) >> 11
    (val & 0x07e0) >> 5
    (val & 0x001f) >> 0
  ]
  [R,G,B] = [
    (_r << 3) | (_r >> 2)
    (_g << 2) | (_g >> 4)
    (_b << 3) | (_b >> 2)
  ]
  {R,G,B}

decompress = () -> # DXT5 & DXT3
  @pixel = new Uint8ClampedArray(@width * @height * 4)
  @view = new Uint8ClampedArray(@data)
  @rawData = new Uint8ClampedArray(@data)

  @colorTable = []
  @colorIdxTable = new Uint8ClampedArray(16)
  @alphaTable = new Uint8ClampedArray(16)
  @alphaIdxTable = new Uint8ClampedArray(16)

  setPixel = (x,y,color,alpha) =>
    offset = (y * @width + x) * 4
    @pixel[offset + 0] = color.R
    @pixel[offset + 1] = color.G
    @pixel[offset + 2] = color.B
    @pixel[offset + 3] = alpha

  [h_4, w_4] = [((@height - 1) / 4 | 0) + 1, ((@width - 1) / 4 | 0) + 1]
  [0..h_4*w_4-1].map (s) =>
    [x, y] = [s % w_4 * 4, (s / w_4 | 0) * 4]
    offset = x * 4 + y * @width

    switch @flags
      when DXT3

        # ExpandAlphaTableDXT3
        [0..7].map (_) =>
          i = _ * 2
          o = _ + offset
          @alphaTable[i + 0] = @rawData[o] & 0x0f
          @alphaTable[i + 1] = (@rawData[o] & 0xf0) >> 4
        [0..15].map (i) =>
          @alphaTable[i] = (@alphaTable[i] | (@alphaTable[i] << 4)) & 0xff

      when DXT5

        # ExpandAlphaTableDXT5
        a0 = @alphaTable[0] = @rawData[offset + 0]
        a1 = @alphaTable[1] = @rawData[offset + 1]
        if @alphaTable[0] > @alphaTable[1]
          [2..7].map (i) =>
            @alphaTable[i] = ((8-i)*a0 + (i-1)*a1 + 3) / 7 | 0
        else
          [2..5].map (i) =>
            @alphaTable[i] = ((6-i)*a0 + (i-1)*a1 + 2) / 5 | 0
          @alphaTable[6] = 0
          @alphaTable[7] = 255

        # ExpandAlphaIndexTableDXT5
        [0..1].map (_) =>
          i = _ * 8
          o = offset + 2 + 3 * _
          flags = @rawData[o] | (@rawData[o+1] << 8)| (@rawData[o+2] << 16)
          [0..7].map (j) =>
            mask = 0b111 << (3 * j)
            @alphaIdxTable[i + j] = (flags & mask) >> (3*j)

    # ExpandColorTable
    u0 = @view.getUint16(offset + 8,true)
    u1 = @view.getUint16(offset + 10,true)
    c0 = @colorTable[0] = rgb565 u0
    c1 = @colorTable[1] = rgb565 u1
    if u0 > u1
      @colorTable[2] =
        R: (c0.R * 2 + c1.R + 1) / 3 | 0
        G: (c0.G * 2 + c1.G + 1) / 3 | 0
        B: (c0.B * 2 + c1.B + 1) / 3 | 0
      @colorTable[3] =
        R: (c0.R + c1.R * 2 + 1) / 3 | 0
        G: (c0.G + c1.G * 2 + 1) / 3 | 0
        B: (c0.B + c1.B * 2 + 1) / 3 | 0
    else
      @colorTable[2] =
        R: (c0.R + c1.R) / 2 | 0
        G: (c0.G + c1.G) / 2 | 0
        B: (c0.B + c1.B) / 2 | 0
      @colorTable[3] =
        R: 0
        G: 0
        B: 0

    # ExpandColorIndexTable
    [0..3].map (_) =>
      o = offset + 12 + _
      i = _ * 4
      @colorIdxTable[i + 0] = (@rawData[o] & 0x03)
      @colorIdxTable[i + 1] = (@rawData[o] & 0x0c) >> 2
      @colorIdxTable[i + 2] = (@rawData[o] & 0x30) >> 4
      @colorIdxTable[i + 3] = (@rawData[o] & 0xc0) >> 6

    [0..15].map (k) =>
      [i, j] = [k % 4, (k / 4 | 0)]
      setPixel x+i, y+j, @colorTable[@colorIdxTable[j*4+i]], switch @flags
        when DXT3 then @alphaTable[j*4+i]
        when DXT5 then @alphaTable[@alphaIdxTable[j*4+i]]
  @pixel




module.exports =
  flags: {DXT1, DXT3, DXT5}
  decompress: (data, width, height, flags) ->
    decompress.bind({data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), width, height, flags})()
