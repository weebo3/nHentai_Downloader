// Extract the metadata of a manga on the details page
const extractMangaData = () => {
  const el_infoContainer = document.querySelector("#info");

  // Title
  const allTitles = el_infoContainer.querySelector(".title");
  const titles = {
    before: allTitles.children[0].textContent,
    pretty: allTitles.children[1].textContent,
    after: allTitles.children[2].textContent,
  };

  // Galleryid / Mangaid
  const mangaId = +el_infoContainer
    .querySelector("#gallery_id")
    .textContent.substring(1);

  // Will be completed below
  const metaData = {
    mangaId,
    titles,
  };

  const el_tagsContainer = el_infoContainer.querySelectorAll(
    "#tags .tag-container"
  );

  for (const el of el_tagsContainer) {
    if (el.classList.contains("hidden")) continue;

    let match = el.innerText.match(/(.*?)\s*:/);
    const attributeName = match.at(1).toLowerCase();
    const els_attributeValues = el.querySelectorAll(".tags > *");
    metaData[attributeName] = [];

    if (!els_attributeValues.length) continue;

    for (const el_attributeValue of els_attributeValues) {
      const el_value = el_attributeValue.querySelector("* > *:nth-child(1)");

      if (!el_value) continue;

      metaData[attributeName].push(el_value.textContent);
    }
  }

  metaData.pages = +metaData.pages.at(0);

  // Add updated date because its a special snowflake
  metaData.uploaded = [...el_tagsContainer]
    .at(8)
    .querySelector("time")
    .getAttribute("datetime");
  metaData.uploaded = new Date(metaData.uploaded);

  // Url meta data
  const el_coverImage = document.querySelector("#cover img");
  const baseUrl = el_coverImage.getAttribute("src");
  const fixedUrl = baseUrl.replace(/(https:\/\/)(\w\d)/, "$1i3");
  metaData.url = fixedUrl;
  metaData.coverImageFormat = baseUrl.match(/cover\.(.*)?/)[1];
  metaData.templatedImageUrl = fixedUrl.replace(
    /(.*)(cover)\.(.+)/,
    "$1PAGE_NUMBER.IMAGE_FORMAT"
  );

  return metaData;
};

const onDownloadImages = async () => {
  // Get and locally store meta data
  const data = extractMangaData();

  //const storage = await browser.storage.local.get();

  //storage[data.mangaId] = data;

  //await browser.storage.local.set(storage);

  browser.runtime.sendMessage({ type: "nd_addToQueue", data: data });
  //console.log("Storage After Download", await chrome.storage.local.get());

  /*chrome.runtime.sendMessage({
    type: "queue_download_manga_images",
    data: {
      mangaId: data.mangaId,
      coverImageFormat: data.coverImageFormat,
      imageCount: data.pages,
      templatedImageUrl: data.templatedImageUrl,
      maxConcurrentDownloads: 1,
      downloadPath: "nHentai/Images",
    },
  });*/
};

const onCopyClipboard = async () => {
  const storageData = await browser.storage.local.get();
  const mapped = {};

  // Map data to a certain scheme
  for (const item of Object.values(storageData)) {
    // Sort language by a certain order with fancy regex
    // otherwise the language is unknown
    const languageOrder = ["english", "japanese", "chinese"];
    const unknownLanguage = "unknown";

    const languageRegex = new RegExp(
      ".*(" + languageOrder.join(").*|.*(") + ").*|(.*)"
    );
    const replacementString = languageOrder
      .map((c, i) => "$" + (i + 1))
      .join("");
    const filteredLanguage =
      item.languages.join(",").replace(languageRegex, replacementString) ||
      unknownLanguage;

    const entry = {
      Name: item.titles.pretty,
      Language: filteredLanguage,
      Tags: item.tags,
      Authors: item.artists,
    };

    mapped[item.mangaId] = entry;
  }

  //console.log("Copied to clipboard", JSON.stringify(meta, undefined, 2));

  navigator.clipboard.writeText(JSON.stringify(mapped, undefined, 2));
};

// prepare UI------------------------------------------------------
const prepareUi = () => {
  const el_infoContainer = document.querySelector("#info");

  const buttonCreationHelper = () => {
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.classList.add("btn", "nd_downloader");

    return button;
  };

  // check if buttons exist already
  const btns = document.getElementsByClassName("nd_downloader");
  if (btns.length > 0) return;

  // Download manga images
  const bel_downloadImages = buttonCreationHelper();
  bel_downloadImages.textContent = "Download Manga";
  bel_downloadImages.style.backgroundColor = "skyblue";
  bel_downloadImages.addEventListener("click", onDownloadImages);

  //-----------------------------------------------------

  // Buttons wrapper
  const el_buttonsWrapper = document.createElement("div");
  el_buttonsWrapper.classList.add("buttons", "nhentai-ext-buttons");
  el_buttonsWrapper.append(bel_downloadImages);

  // Custom hover styles
  const el_buttonStyles = document.createElement("style");
  el_buttonStyles.textContent = `
      #info .nhentai-ext-buttons { margin-top: 0; }
      #info .nhentai-ext-buttons .btn { color: black; }
      #info .nhentai-ext-buttons .btn[disabled="true"] { pointer-events: none; filter: brightness(0.3); }
      #info .nhentai-ext-buttons .btn:hover { filter: hue-rotate(180deg); }
    `;
  el_infoContainer.append(el_buttonStyles);
  el_infoContainer.append(el_buttonsWrapper);
};

prepareUi();
