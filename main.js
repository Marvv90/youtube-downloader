const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { spawn, execSync } = require('child_process');
const path = require("path");
const os = require('os');
const { dir } = require("console");

let win;

async function createWindow() {

  win = new BrowserWindow({
    width: 500,
    height: 635,
    resizable: false,
    webPreferences: {
      nodeIntegration: false, 
      contextIsolation: true, 
      enableRemoteModule: false, 
      preload: path.join(__dirname, 'js', 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
  // win.webContents.openDevTools();

}

app.on("ready", createWindow);

ipcMain.handle('getInfo', async (event, url) => {
  return new Promise((resolve, reject) => {
    const ytDlp = spawn(path.join(process.resourcesPath, '/binary/yt-dlp'), ['--skip-download', '--print-json', url]);
    // const ytDlp = spawn(path.join(__dirname, '/binary/yt-dlp'), ['--skip-download', '--print-json', url]);
    
    let data = '';
    let error = '';

    ytDlp.stdout.on('data', (chunk) => {
      data += chunk;
    });

    ytDlp.stderr.on('data', (chunk) => {
      error += chunk;
    });

    ytDlp.on('close', (code) => {
      if(code === 0) {
        try {
          const videoInfo = JSON.parse(data);
          resolve({
            title: videoInfo.title,
            uploader: videoInfo.uploader,
            thumbnail: videoInfo.thumbnail,
            duration: videoInfo.duration
          });
        } catch(error) {
          reject(`Fehler beim Parsen der JSON-Daten: ${error.message}`);
        }
      } else {
        reject(`yt-dlp Fehler: ${error}`);
      }
    });
  });
});

ipcMain.handle('download', async (event, format, url) => {
  return new Promise((resolve,reject) => {
    const tmp = path.join(path.join(os.homedir(), 'Downloads'), '%(title)s.%(ext)s');
    const dirPath = process.resourcesPath;
    // const dirPath = __dirname;

    const options = [
      ...['--ffmpeg-location', path.join(dirPath, 'binary/ffmpeg')],
      '-o', tmp
    ];

    if(format === 'audio') {
      options.push('-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3');
    } else if(format === 'video') {
      options.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4');
    }

    options.push(url);

    const ytDlp = spawn(path.join(dirPath, '/binary/yt-dlp'), options);

    ytDlp.stdout.on('data', (data) => {
      console.log(`stdout; ${data}`);
      const match = data.toString().match(/\[download\]\s+(\d+\.\d+)%/);
      if(match) console.log(`Fortschritt: ${match[1]}%`);
    });
    ytDlp.stderr.on('data', (data) => {
      console.log(data.toString());
      const match = data.toString().match(/\[download\]\s+(\d+\.\d+)%/);
      if(match) console.log(`Fortschritt: ${match[1]}%`);
    });

    ytDlp.on('close', (code) => {
      if(code === 0) resolve('Download abgeschlossen');
      else reject(`Fehler: yt-dlp-Prozess endete mit Code: ${code}`);
    });
  });
});

ipcMain.handle('open-url', (event, url) => {
  shell.openExternal(url).then(() => {
      console.log(`Opened URL: ${url}`);
  }).catch(err => {
      console.error(`Error opening URL: ${err.message}`);
  });
});