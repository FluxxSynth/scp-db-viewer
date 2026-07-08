import { BrowserWindow, ipcMain, app } from "electron";
import { join } from "path";

let mainWindow: BrowserWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        height: 700,
        width: 1000,
        minWidth: 700,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    mainWindow.loadFile(join(__dirname, './pages/index.html'));
    mainWindow.on("closed", () => app.quit());
    mainWindow.on("blur", () => mainWindow.webContents.send("unfocused"));
    mainWindow.on("focus", () => mainWindow.webContents.send("focused"));
}

app.on("ready", createWindow);

ipcMain.on("debug", () => {
    mainWindow.webContents.openDevTools();
});

ipcMain.handle("getversion", () => {
    return app.getVersion();
});

ipcMain.on("close", () => app.quit());
ipcMain.on("minimize", () => {
    BrowserWindow.getFocusedWindow()?.minimize();
});
ipcMain.on("maximize", () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.isMaximized() ? win.unmaximize() : win.maximize();
    }
});

app.on("activate", () => {
    if (!mainWindow) createWindow();
});
