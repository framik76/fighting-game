const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true,
        },
    });
    mainWindow.maximize();
    mainWindow.fullScreen = true;

    mainWindow.loadFile(path.join(__dirname, "index.html")); // Point to your game's HTML file
});