module.exports = class Wz_Uol # soft link of node
  constructor: (@string) ->
    @link = @string.split('/')

  type: "uol"
  element: true

  toString: () -> @link.join '/'
