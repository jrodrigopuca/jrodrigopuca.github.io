const video = document.getElementById('video');
const pipButton = document.getElementById('pipButton');
pipButton.hidden = !document.pictureInPictureEnabled || video.disablePictureInPicture;

pipButton.addEventListener('click', () => {
    if (document.pictureInPictureElement) {
        document
            .exitPictureInPicture()
            .catch(error => {
                // Error handling
            })
    } else {
        video
            .requestPictureInPicture()
            .catch(error => {
                // Error handling
            });
    }
});

/*
video.addEventListener('enterpictureinpicture', () => {
    pipButton.textContent = 'Salir de mini-player';
});

video.addEventListener('leavepictureinpicture', () => {
    pipButton.textContent = 'Mini-player';
});
*/