const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')

if (/^_/.test(path.basename(process.argv[process.argv.length - 1], '.js'))) {
  console.error('can\'t load electron load script');
  process.exit(1);
}
let scriptPath = path.join('./browser', path.basename(process.argv[process.argv.length - 1], '.js') + '.js')
if (!fs.existsSync(scriptPath)) {
  console.error(scriptPath + ' don\'t exist')
  process.exit(1);
}

let script = fs.readFileSync(scriptPath).toString()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, '_index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.webContents.executeJavaScript(`document.write("<script src='${path.basename(scriptPath)}'></script>")`);

  // Open the DevTools if signed
  if (/\/\*\s*devtool\s*\*\//i.test(script)) win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin' || 1) {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
