const thumbnail = document.querySelector('[data-selector="yt-cover"]'),
      dialogError = document.querySelector('[data-selector="dialog-error"]'),
      dialogLoader = document.querySelector('[data-selector="dialog-loader"]'),
      inputUrl = document.querySelector('[data-selector="yt-url"]'),
      format = document.querySelector('[data-selector="yt-format"]'),
      title = document.querySelector('[data-selector="yt-title"]'),
      owner = document.querySelector('[data-selector="yt-owner"]'),
      duration = document.querySelector('[data-selector="yt-duration"]'),
      submitBtn = document.querySelector('[data-selector="submit-btn"]'),
      cover = document.querySelector('[data-selector="yt-cover"]');

if (!navigator.onLine) {
  dialogError.showModal();
}

thumbnail.addEventListener('click', () => {
  if(thumbnail.src === './assets/thumbnail.webp') {
    api.invoke('open-url', inputUrl.value);
  } else {
    api.invoke('open-url', 'https://www.youtube.com');
  }
});

inputUrl.addEventListener('change', async () => {
    try {
        const result = await window.api.invoke('getInfo', inputUrl.value);
        console.log(result);
        title.innerText = result.title ?? 'Unbekannter Titel';
        duration.innerText = formatDuration(result.duration ?? 0);
        cover.src = result.thumbnail ?? './assets/thumbnail.webp';
        owner.innerText = result.uploader ?? 'Unbekannt';
      } catch (error) {
        console.error('Fehler bei IPC:', error);
      }
});

submitBtn.addEventListener('click', async () => {
  const result = window.api.invoke('download', format.value, inputUrl.value);

  dialogLoader.showModal();

  result.then((result) => {
    console.log(result);
    dialogLoader.close();
    alert(result);
  }).catch((error) => {
    console.log(error);
    dialogLoader.close();
    alert(error);
  });
});

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const paddedMinutes = minutes < 10 && hours > 0 ? `0${minutes}` : minutes;
  const paddedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

  return hours > 0 
      ? `${hours}:${paddedMinutes}:${paddedSeconds}` 
      : `${minutes}:${paddedSeconds}`;
}