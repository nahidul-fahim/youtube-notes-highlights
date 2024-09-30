chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "getCurrentTime") {
      let video = document.querySelector('video');
      if (video) {
        sendResponse({currentTime: video.currentTime});
      }
    } else if (request.action === "getVideoInfo") {
      let titleElement = document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer');
      if (titleElement) {
        sendResponse({title: titleElement.textContent.trim()});
      }
    }
    return true;
  });