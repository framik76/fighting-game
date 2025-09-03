const { app, BrowserWindow, globalShortcut } = require("electron");
const path = require("path");

let mainWindow;

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
        },
        show: false
    });
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.fullScreen = true;

    mainWindow.loadFile(path.join(__dirname, "index.html")); // Point to your game's HTML file

    // Gestione chiusura in fullscreen
    mainWindow.on('close', (e) => {
        if (mainWindow.isFullScreen()) {
            // Esci dal fullscreen prima di chiudere
            mainWindow.setFullScreen(false);
            // Previeni la chiusura, verrà richiamata una volta fuori dal fullscreen
            e.preventDefault();
            // Aspetta che sia uscito dal fullscreen e chiudi davvero la finestra
            mainWindow.once('leave-full-screen', () => {
                mainWindow.close();
            });
        }
    });

    globalShortcut.register('Escape', () => {
        // Get the currently focused window
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (focusedWindow && focusedWindow.isFullScreen()) {
            focusedWindow.setFullScreen(false);
        }
    });

    globalShortcut.register('Space', () => {
        // Get the currently focused window
        const focusedWindow = BrowserWindow.getFocusedWindow();
        focusedWindow.close();
    });

});
