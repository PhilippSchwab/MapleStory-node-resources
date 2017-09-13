// List Components with ability of binding to DOM
document.getElementById('listnode-style') || document.write(`
<style id="listnode-style">
  .info-menu {
    width: 100%;
    height: 100%;
    overflow: scroll;
    color: #ccc;
    user-select: none;
  }
  .info-menu-node-children {
    margin-left: 20px;
  }
  .info-menu-node.dir.fold > .info-menu-node-children {
    display:none;
  }
  .info-menu-node.dir.fold > .info-menu-node-name:before {
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23E8E8E8' d='M6 4v8l4-4-4-4zm1 2.414L8.586 8 7 9.586V6.414z'/%3E%3C/svg%3E");
    background-size: 16px;
    background-position: 50% 50%;
    background-repeat: no-repeat;
    margin: 0;
    padding-right: 20px;
    height: 20px;
  }
  .info-menu-node.dir:not(.fold) > .info-menu-node-name:before {
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23E8E8E8' d='M11 10H5.344L11 4.414V10z'/%3E%3C/svg%3E");
    background-size: 16px;
    background-position: 50% 50%;
    background-repeat: no-repeat;
    margin: 0;
    padding-right: 20px;
    height: 20px;
  }
  .info-menu-node.dir.pending:not(.fold) > .info-menu-node-name:before {
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23CCCCCC' d='M11 10H5.344L11 4.414V10z'/%3E%3C/svg%3E");
    background-size: 16px;
    background-position: 50% 50%;
    background-repeat: no-repeat;
    margin: 0;
    padding-right: 20px;
    height: 20px;
  }
  .info-menu-node.dir.pending:not(.fold):after {
    content: 'Loading...';
    margin-left: 20px;
  }
  .info-menu-node-value:hover {
    background-color: #666;
  }
  .info-menu-node-name {
    font-family: monoca, monospace;
    height: 20px;
    line-height: 20px;
  }
  .info-menu-node-name > * {
    height: 20px;
    line-height: 20px;
  }
  .info-menu-node-name:hover {
    background-color: #777;
  }
  .info-menu-node-name:before {
    content: '';
    margin: 10px;
  }
  .info-menu-node-name-type {
    float: right;
    margin-right: 15px;
    color: #aaa;
    font-family: monospace;
    font-size: 10px;
    line-height: 20px;
    display: inline-block;
  }
  .info-menu-node-value {
    margin-left: 30px;
    color: #aaa;
    font-family: monospace;
    user-select: auto;
    word-wrap: break-word;
  }
</style>
`)

class ListNode {
  constructor(def, ref, name) {
    this.name = name
    this.ref = ref
    this.domref = []
    property: for (let p in def) {
      switch (p) {
        case 'state':
        case 'domref':
        case 'childrenProducer':
          continue property;
        default: break;
      }
      if (typeof(def[p]) === 'function') {
        if (p === 'children') {
          // make children method
          let func = def[p]
          Object.defineProperty(this, 'childrenProducer', {
            value: func[Symbol.toStringTag] === 'AsyncFunction' ? func.bind(this) : async () => {return func.bind(this)()}
          })
          continue property;
        }
        if (/^on/i.test(p)) {
          this[p] = def[p].bind(this)
          continue property;
        }
        Object.defineProperty(this, p, {
          get: def[p].bind(this),
          enumerable: true
        })
      }
      else {
        this[p] = def[p]
      }
    }
    let state = this.children ? 'done' : 'none'
    Object.defineProperty(this, 'state', {
      get: () => { return state },
      set: (value) => {
        switch (state) {
          case 'pending':
            if (value === 'done') {
              state = value;
              this.clearDOM()
              this.domref.map((el) => el.classList.remove('pending'))
              break;
            }
            else if (value === 'error') {
              state = 'none';
              this.clearDOM()
              this.domref.map((el) => (el.classList.remove('pending'),el.classList.add('fold')))
              break;
            }
            break;
          case 'none':
            switch (value) {
              case 'done':
                state = value;
                break;
              case 'pending':
                state = value;
                this.clearDOM()
                this.domref.map((el) => el.classList.add('pending'))
                break;
              default: throw (`state value ${value} invalid`)
            }
            break;
        }
      },
      enumerable: true
    })
    Object.defineProperty(this, '_state', {
      set: (value) => {
        switch (value) {
          case 'done':
          case 'pending':
          case 'none':
            state = value;
            break;
          default:
            throw (`state value ${value} invalid`)
        }
      }
    })
    Object.defineProperty(this, '_type', {
      set: (value) => {let node;this.clearDOM();this.domref.map(e => (node = e.querySelector(':scope > .info-menu-node-name > .info-menu-node-name-type'),node && (node.innerText = value)))}
    })
    Object.defineProperty(this, '_value', {
      set: (value) => {this.value = value;let node;this.clearDOM();this.domref.map(e => (node = e.querySelector(':scope > .info-menu-node-value'),node && (node.innerText = value)))}
    })
  }

  bindDOM(obj) {
    let el = document.createElement('div')
    el.node = this
    el.classList.add('info-menu-node')
    let nameElem = document.createElement('div')
    nameElem.classList.add('info-menu-node-name')
    nameElem.innerText = this.name
    el.appendChild(nameElem)
    if (this.dir || this.childrenProducer || this.children) {
      let self = this
      el.classList.add('dir','fold')
      // event about dir folding
      nameElem.onclick = function (e) {
        self.onClick && self.onClick(self, e)
        if (el.classList.contains('fold')) {
          el.classList.remove('fold')
          self.onUnfold && self.onUnfold(self, e)
          if (!el.loaded && (self.children || self.childrenProducer)) {
            self.onLoadChildren && self.onLoadChildren(self, e)
            let load = () => {
              let childrenElem = document.createElement('div')
              childrenElem.classList.add('info-menu-node-children')
              self.children.map(e => e.bindDOM(childrenElem))
              el.appendChild(childrenElem)
            }
            !(async function() {
              self.state = 'pending'
              self.domref.map(e => e.classList.add('pending'))
              self.children || (self.children = await self.childrenProducer())
              self.children && load()
              self.children || (el.loaded = false)
              self.state === 'pending' && (self.state = 'done')
              self.domref.map(e => e.classList.remove('pending'))
            })();
            el.loaded = true
          }
        }
        else {
          el.classList.add('fold')
        }
      }
    }
    else {
      nameElem.onclick = (e) => {
        this.onClick && this.onClick(this, e)
      }
    }
    if (this.type) {
      let typeElem = document.createElement('div')
      typeElem.classList.add('info-menu-node-name-type')
      typeElem.innerText = this.type
      typeElem.onclick = this.onTypeClick && ((e) => {e.stopPropagation();this.onTypeClick(this, e)})
      nameElem.appendChild(typeElem)
    }
    if (this.value) {
      let valueElem = document.createElement('div')
      valueElem.classList.add('info-menu-node-value')
      valueElem.innerText = this.value
      valueElem.onclick = this.onValueClick && ((e) => {this.onValueClick(this, e)})
      el.appendChild(valueElem)
    }
    this.domref.push(el)
    if (obj instanceof Element) {
      obj.appendChild(el)
    }
    return el
  }

  clearDOM() {
    this.domref.map((el,i,arr) => {
      document.body.contains(el) || arr.splice(arr.indexOf(el),1)
    })
  }

}

top.require && (module.exports = ListNode)
