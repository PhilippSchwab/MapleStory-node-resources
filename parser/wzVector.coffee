class Wz_Vector
  constructor: (@x,@y) ->

  toString: () -> "<x:#{@x} y:#{@y}>"

module.exports = Wz_Vector
module.exports.prototype.element = true
module.exports.prototype.type = "vector"
