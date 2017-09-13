const {
  render,
  win, pbcopy
} = require('./_common')
const fs = require('fs');
const path = require('path');
const parser = require('../parser');
const ListNode = require('./components/list')
render(`
style.
  #list {
    position: absolute;
    background-color: grey;
    left: 0;
    top: 0;
    bottom: 0;
    width: 500px;
    overflow: scroll;
  }
  #detail {
    position: absolute;
    left: 500px;
    top: 0;
    bottom: 0;
    width: calc(100% - 500px);
    overflow: scroll;
  }
#list
#detail
`)

let origin = path.join('..', 'origin')

let wzlist = fs.readdirSync(origin).filter(e => /\.wz$/.test(e))
let $e, saveLocal = (e) => ($e = e)
let typeAdd = function() {
  let el = this.bindDOM(document.getElementById('list'))
  el.oncontextmenu = () => {
    el.remove()
    this.clearDOM()
  }
}
let Preview = function(node) {
  console.log(node.ref)
  let detail = document.getElementById('detail')
  if (node.ref.type === 'image') {
    let el = node.ref.value.value.value
    switch (node.ref.value.value.value.type) {
      case 'sound':
        ;(async () => {
          let sound = await el.extractSound()
          let blob = new Blob([sound.buffer], {type: 'audio/mp3'})
          let url = window.URL.createObjectURL(blob);
          detail.innerHTML = `
          <a href="${url}" download="${node.ref.name}.mp3">${node.ref.name}</a><br>
          <audio controls loop src="${url}"></audio>`
        })();
        break;
      case 'picture':
        ;(async () => {
          let rgba = await el.extractRGBA()
          let canvas = document.createElement('canvas')
          ;[canvas.width, canvas.height] = [el.width, el.height]
          let ctx = canvas.getContext('2d')
          ctx.putImageData(new ImageData(rgba, el.width, el.height), 0, 0)
          detail.innerHTML = ''
          detail.appendChild(canvas)
        })();
        break;
      case 'vector':
      case 'uol':
        detail.innerText = el.toString();
        break;
      default:
        console.log(node.ref.value.value.value.type)
        break;
    }
  }
  else {
    detail.innerText = node.ref.value
  }
}
let ImageParser = async function() {
  if (!this.ref) {
    this.ref = new parser.wz_image(this.dirref)
    this.ref.parse()
    try {
      await this.ref.value.extractImg()
    } catch (error) {
      console.error(error)
      this.state = 'error'
      this._type = 'error image node'
      return undefined
    }
  }
  if (!this.ref.value.value.children) return;
  return await Promise.all(this.ref.value.value.children.map(async (el) => {
    if (el.type === 'image') {
      try {
        await el.value.extractImg()
        if (!el.value.value)
          throw 'no extract image'
      } catch (error) {
        console.error(error)
        this.state = 'error'
        this._type = 'error image node'
        return new ListNode({
          name: el.name,
          ref: el,
          onClick: (e) => {saveLocal(e)},
          type: 'error image'
        })
      }
      return new ListNode({
        name: el.name,
        ref: el,
        onClick: (e) => {saveLocal(e)},
        value: function() {return this.ref.value.value.value},
        type: function() {return this.ref.value.value.class},
        children: el.value.value.children && ImageParser,
        onTypeClick: typeAdd,
        onValueClick: Preview,
      })
    }
    else {
      return new ListNode({
        name: el.name,
        ref: el,
        onClick: (e) => {saveLocal(e)},
        value: function() {return this.ref.value},
        type: function() {return this.ref.type},
        onTypeClick: typeAdd,
        onValueClick: Preview,
      })
    }
  }))
}
let fileParser = async function() {
  if (!this.dirref) {
    let file = this.ref
    file.log = (a,b,c) => {this._type = (`${b} wz`)}
    try {
      await file.parse()
    } catch (error) {
      console.error(error)
      this.state = 'error'
      this._type = 'error wz file'
      return undefined
    }
    if (!this.dirref) {
      console.error('error')
      this.state = 'error'
      this._type = 'error wz file'
      return undefined
    }
  }
  return this.dirref.dir.map((n) => new ListNode({
    name: n.name,
    dirref: n,
    type: n.dirs ? `${n.dir.length} dir` : 'Image',
    children: n.dirs ? fileParser : ImageParser,
    onClick: saveLocal,
    onTypeClick: typeAdd,
  }))
}
let fileProducer = function() {
  return wzlist.map(name => {
    let filename = path.join(origin, name)
    let file = new parser.wz_file(filename)
    return new ListNode({
      name: file.name,
      ref: file,
      dirref: function() {return this.ref.value},
      type: 'wz',
      children: fileParser,
      onClick: saveLocal,
      onTypeClick: typeAdd,
    })
  })
}
let root = new ListNode({name: 'root', children: fileProducer, onClick: saveLocal})

window.addEventListener('load', () => {
  root.bindDOM(document.getElementById('list'))
})


