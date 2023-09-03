const mangaQueue = [];

const download_commands = {};

let paused = false;
let shouldAbort = false; //if we decide to stop the download of the current downloading manga then this variable will force to abort the download
let currentManga = null;
let currentProgress = 0;

function onDownloadCreated(item) {
  download_commands[item.id] = { url: item.url, filename: item.filename };
}

function onDownloadChanged(delta) {
  // console.log(download_commands[delta.id]);
  if (delta.error == undefined) {
    if (download_commands[delta.id] != undefined) {
      let page = download_commands[delta.id].url.split("/");
      page = page[page.length - 1];
      page = page.split(".");
      page = parseInt(page[0]);
      currentProgress = page;
      browser.runtime.sendMessage({
        type: "nd_updateProgress",
        data: currentProgress,
      });
    }
    delete download_commands[delta.id];
    return;
  }

  // if the download had an error try to downlaod again with a different imageFormat
  let urlOriginal = download_commands[delta.id].url;
  let filenameOriginal = download_commands[delta.id].filename;

  // extract image format (jpg or png)
  let imageFormat = urlOriginal.split(".");
  imageFormat = imageFormat[imageFormat.length - 1];

  // extract the path from Downloads to the end

  let filename = filenameOriginal.match(/.*(nhentai.*)/)[1];

  // remove the imageFormat (jpg or png) from the url
  let url = urlOriginal.split(".").slice(0, -1).join(".");
  filename = filename.split(".").slice(0, -1).join(".");

  // append the other imageFormat (if its jpg, append png and vice versa)
  filename = filename + ".";
  url = url + ".";
  if (imageFormat == "jpg") {
    url = url + "png";
    filename = filename + "png";
  } else if (imageFormat == "png") {
    url = url + "jpg";
    filename = filename + "jpg";
  }

  // console.log(url, ", ", filename);

  // try to downlod the new file
  let downloadStarted = browser.downloads.download({
    url,
    filename,
    saveAs: false,
    conflictAction: "overwrite",
  });

  delete download_commands[delta.id];
}

async function download(manga) {
  for (let i = 0; i < manga.pages; i++) {
    if (shouldAbort) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return;
    }
    if (!paused) {
      let pageCount = i + 1;
      let url = manga.templatedImageUrl.split("/").slice(0, -1).join("/");
      url = url + "/" + pageCount + "." + manga.coverImageFormat;
      let filename =
        "nhentai/data/" +
        manga.mangaId +
        "/" +
        pageCount +
        "." +
        manga.coverImageFormat;

      while (Object.keys(download_commands).length >= 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      let downloadStarted = await browser.downloads.download({
        url,
        filename,
        saveAs: false,
        conflictAction: "overwrite",
      });
    } else {
      i--;
    }

    await new Promise((resolve) => setTimeout(resolve, 200)); //set back to 200
  }
}

function onMessage(message) {
  switch (message.type) {
    case "nd_addToQueue": {
      let found = true;
      for (let i = 0; i < mangaQueue.length; i++) {
        if (mangaQueue[i].mangaId == message.data.mangaId) {
          found = false;
        }
      }
      if (found) {
        mangaQueue.push(message.data);
      }
      break;
    }
    case "nd_requestInfo": {
      browser.runtime.sendMessage({
        type: "nd_sendInfo",
        data: [currentManga, ...mangaQueue],
        progress: currentProgress,
        paused: paused,
      });
      break;
    }
    case "nd_removeFromQueue": {
      for (let i = 0; i < mangaQueue.length; i++) {
        if (mangaQueue[i].mangaId == message.data) {
          mangaQueue.splice(i, 1);
        }
      }
      if (currentManga != null && currentManga.mangaId == message.data) {
        shouldAbort = true;
      }
      break;
    }
    case "nd_pauseDownload": {
      paused = true;
      break;
    }
    case "nd_resumeDownload": {
      paused = false;
      break;
    }
  }
}

async function loopFunc() {
  //console.log(mangaQueue.length, currentManga);
  if (mangaQueue.length > 0 && currentManga == null) {
    currentManga = mangaQueue.shift();

    await download(currentManga);
    if (shouldAbort) {
      shouldAbort = false;
    } else {
      browser.runtime.sendMessage({ type: "nd_downloadCompleted" });
      // store currentManga in local storage
      const storage = await browser.storage.local.get();

      storage[currentManga.mangaId] = currentManga;

      await browser.storage.local.set(storage);

      browser.runtime.sendMessage({ type: "nd_JSON_updage" });
    }
    currentManga = null;
  }
}

browser.downloads.onChanged.addListener(onDownloadChanged);
browser.downloads.onCreated.addListener(onDownloadCreated);
browser.runtime.onMessage.addListener(onMessage);

setInterval(loopFunc, 1000);
