/*
 ps-webrtc-peerjs.js
 Author: Lisa Larson-Kelley (http://learnfromlisa.com)
 WebRTC Fundamentals - Pluralsight.com
 Version 1.0.0
 -
 The simplest WebRTC 2-person chat, with manual signalling
 Adapted from peerjs documentation
*/

navigator.getWebcam = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);

// PeerJS object ** FOR PRODUCTION, GET YOUR OWN KEY at http://peerjs.com/peerserver **
var peer = new Peer({key: 'd7wrip0vku5qxgvi',
                        debug:3,
                        config: {'iceServers':[
                                    {url:'stun.l.google.com:19302'}
                                    ]}});
//Para abrir, configurar los ids
peer.on('open',function () {
    $('#my_id').text(peer.id);
});

peer.on('call',function (call) {
    call.answer(window.localStream);
    step3(call);
});

//Click handlers
$(function () {
    $('#make-call').click(function(){
        //Iniciar llamada
        var call=peer.call($('#callto-id').val(),window.localStream);
        step3(call);
    });
    $('#end-call').click($(function () {
        window.existingCall.close();
        step2();
    }));
    $('#step1-retry').click(function(){
        $('#step1-error').hide();
        step();
    });

    step1();
});


function step1(){
    //Obtener audio-video
    navigator.getWebcam({audio:false, video:true}
    ,function (stream) {
        $('#my-video').prop('src',URL.createObjectURL(stream));
        windows.localStream=stream;
        step2();}
    , function () {
            $('#step-error').show();}
    );
}

function step2() {
//Ajustar la UI
    $('#step1','#step3').hide();
    $('#step2').show();
}

function step3(call) {
    if (window.existingCall){
        window.existingCall.close();
    }
    call.on('stream', function (stream) {
        $('#their-video'.prop('scr',URL.createObjectURL(stream)));
        });
    $('#step1','#step2').hide();
    $('#step3').show();
}


// On open, set the peer id


// Click handlers setup


// Get things started


// Step 1: Get stream, display local


// Step 2: Adjust the UI


// Step 3: Manage the call, setup peer video




