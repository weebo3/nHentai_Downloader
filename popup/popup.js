/*
<div class="grid-container" id="row1">
	<div class="grid-item">1</div>
	<div class="grid-item">450023</div>
	<div class="grid-item">
		<progress value="118" max="236"></progress>
	</div>
	<div class="grid-item grid-item-button"><button>&times;</button></div>
</div>
*/
let paused = false;
const big_boi = document.querySelector(".big-boi");
let queueCounter = 0;

function addEntry(id, pageCount) {
  queueCounter++;

  const grid_container = document.createElement("div");
  grid_container.classList.add("grid-container");

  const id_item = document.createElement("div");
  id_item.innerHTML = id;
  id_item.classList.add("grid-item");

  const progress_item = document.createElement("div");
  progress_item.classList.add("grid-item");
  const progress = document.createElement("progress");
  progress.value = 0;
  progress.max = pageCount;
  progress_item.appendChild(progress);

  const button_item = document.createElement("div");
  button_item.classList.add("grid-item", "grid-item-button");
  const button = document.createElement("button");
  button.innerHTML = "&times;";
  button_item.appendChild(button);

  button.addEventListener("click", (e) => {
    grid_container.remove();
    browser.runtime.sendMessage({ type: "nd_removeFromQueue", data: id });
    queueCounter--;
  });

  grid_container.append(id_item, progress_item, button_item);
  big_boi.appendChild(grid_container);
}

async function onMessage(message) {
  switch (message.type) {
    case "nd_addToQueue": {
      addEntry(message.data.mangaId, message.data.pages);
      break;
    }
    case "nd_sendInfo": {
      // the background script sends information about download/download queue/progress/if its paused or not
      // parse the download queue
      for (let i = 0; i < message.data.length; i++) {
        if (message.data[i] != null) {
          addEntry(message.data[i].mangaId, message.data[i].pages);
        }
      }
      // handle paused download
      paused = message.paused;
      const btn_pause = document.getElementById("btn_pause");
      if (paused) {
        btn_pause.innerHTML = "Resume Download";
      }
      // set progress
      let progressBars = document.getElementsByTagName("progress");
      if (progressBars[0] != undefined) {
        progressBars[0].value = message.progress;
      }

      // update the download JSON button, to show how many Items are in the storage
      const storage = await browser.storage.local.get();
      const len = Object.keys(storage).length;

      const btn_json = document.getElementById("btn_downloadJSON");
      btn_json.innerHTML = "Download JSON (" + len + ")";
      break;
    }
    case "nd_updateProgress": {
      let progress = message.data;
      let progressBars = document.getElementsByTagName("progress");
      if (progressBars[0] != undefined) {
        progressBars[0].value = progress;
      }
      break;
    }
    case "nd_downloadCompleted": {
      let grid_containers = document.getElementsByClassName("grid-container");
      if (grid_containers.length > 0) {
        grid_containers[0].remove();
      }

      queueCounter--;
    }
    case "nd_JSON_updage": {
      // update the download JSON button, to show how many Items are in the storage
      const storage = await browser.storage.local.get();
      const len = Object.keys(storage).length;

      const btn_json = document.getElementById("btn_downloadJSON");
      btn_json.innerHTML = "Download JSON (" + len + ")";
    }
  }
}

function main() {
  browser.runtime.onMessage.addListener(onMessage); // one time messages
  browser.runtime.sendMessage({ type: "nd_requestInfo" });

  const btn_pause = document.getElementById("btn_pause");
  const btn_json = document.getElementById("btn_downloadJSON");
  const btn_clearjson = document.getElementById("btn_clearJSON");

  btn_pause.addEventListener("click", (e) => {
    // console.log("button Pause pressed");
    paused = !paused;
    if (paused) {
      btn_pause.innerHTML = "Resume Download";
      browser.runtime.sendMessage({ type: "nd_pauseDownload" });
    } else {
      btn_pause.innerHTML = "Pause Download";
      browser.runtime.sendMessage({ type: "nd_resumeDownload" });
    }
  });

  btn_json.addEventListener("click", async (e) => {
    const storage = await browser.storage.local.get();
    let file = new File([JSON.stringify(storage, null, 4)], "index.json");
    let url = URL.createObjectURL(file);

    const aTag = document.createElement("a");
    aTag.href = url;
    aTag.download = "index.json";
    document.body.appendChild(aTag);
    aTag.click();
    URL.revokeObjectURL(url);
    aTag.remove();
  });

  btn_clearjson.addEventListener("click", async (e) => {
    await browser.storage.local.clear();
    const btn_json = document.getElementById("btn_downloadJSON");
    btn_json.innerHTML = "Download JSON (0)";
  });
}

main();
