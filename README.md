# Firefox Extension to Download Doujinshin's
Downloads Doujinshin's from "https://nhentai.net/g/*"
#
Installation:
- get the extension (.xpi file) from [release page](https://github.com/weebo3/nHentai_Downloader/releases)
- write `about:addons` in the url bar
- click on the gear at the top right
- choose `Install Add-on From File...`
- select the .xpi file

#
The extension will add a button to download the doujinshin, when you visit any page at (https://nhentai.net/g/*)

![image](https://github.com/weebo3/nHentai_Downloader/assets/143971871/e11432dc-dc45-4017-86cc-31e3f797c8b8)

When you click the button, it will start downloading individual pages into "../Downloads/nHentai/data/{mangaID}" folder,
for example: "https://nhentai.net/g/177013/" will download to "../Downloads/nHentai/data/177013/" folder.

![image](https://github.com/weebo3/nHentai_Downloader/assets/143971871/f16138f5-9699-4d8f-a4d8-77a4c28d93de)

Sometimes when the nth.jpg fails to download, it will try again with nth.png as seen in the screenshot above with the 7nth page,
if both .jpg and .png fails it will skip the page and go on to the next page.

You can queue up doujinshin's to download, you can view the queue in the extension popup.

![image](https://github.com/weebo3/nHentai_Downloader/assets/143971871/10555a9f-0184-40fe-9c63-a572b7cc974f)

- Pause Download: will pause the download, the currently downloading image will complete and will not continue to download any images unless you resume.
- Download JSON: whenever a doujinshin gets succesfully downloaded, it will save internally the information of the doujinshin [mangaID, name, tags, artists, languages, categories, groups, pages] in JSON format,
the button also displays how many doujinshin's are currently internally stored, and by clicking the button you can download an "index.json" file that contains all the information about the downloaded doujinshin's.
- Clear Storage: will clear the internal storage.
- Download Queue: shows the queue, it will only download 1 doujinshin at a time (the top one), and 1 page at a time, you can see the current progress in the progressbar.

I can't put the extension on the store because of the nature of the extension.
