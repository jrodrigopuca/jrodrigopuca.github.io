
const video = document.getElementById('video');
let pipButton = document.getElementById('pipButton');

const hidden = !document.pictureInPictureEnabled || video.disablePictureInPicture;
if (hidden) pipButton.style.visibility = "hidden";
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