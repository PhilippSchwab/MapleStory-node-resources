class Wz_Uol # soft link of node
  constructor: (@string) ->
    @link = @string.split('/')

  toString: () -> @link.join '/'

module.exports = Wz_Uol
module.exports.prototype.element = true
module.exports.prototype.type = "uol"
