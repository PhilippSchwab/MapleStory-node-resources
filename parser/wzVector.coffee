module.exports = class Wz_Vector
  constructor: (@x,@y) ->

  type: "vector"
  element: true

  toString: () -> "<x:#{@x} y:#{@y}>"
