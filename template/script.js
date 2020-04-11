
const video = document.getElementById('video');
let pipButton = document.getElementById('pipButton');
let float = document.getElementsByClassName('float-block')[0];
let modal = document.getElementById('modal');
let modalContent = document.getElementById('modalContent');

const hidden = !document.pictureInPictureEnabled || video.disablePictureInPicture;
if (hidden) float.style.visibility = "hidden";
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

const afterClick=()=>{
    modal.style.display="block";
}

let buttons = document.getElementsByClassName('btn-green');
Object.entries(buttons).map((btn)=>{
    btn[1].addEventListener("mouseup",afterClick, false)
})


window.onclick = function(event){
    if (event.target == modal){
        modal.style.display = "none";
    }
}

modalContent.onclick = function(event){
    modal.style.display="none";
}




/*
video.addEventListener('enterpictureinpicture', () => {
    pipButton.textContent = 'Salir de mini-player';
});

video.addEventListener('leavepictureinpicture', () => {
    pipButton.textContent = 'Mini-player';
});
*/