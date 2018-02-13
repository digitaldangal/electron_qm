//mostly taken from Electron Quick Start Guide
const electron = require("electron");
const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
let win;

function createWindow (width, height, file) {
    win = new BrowserWindow({width: width, height: height, frame: false});

    win.loadURL(url.format({
        pathname: path.join(__dirname, file),
        protocol: 'file:',
        slashes: true
    }));

    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', ()=>{
    let {width,height} = electron.screen.getPrimaryDisplay().workAreaSize;
    createWindow(width,height,"index.html");
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});

