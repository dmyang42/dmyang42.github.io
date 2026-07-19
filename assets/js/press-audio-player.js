(function () {
    'use strict';

    var link = document.querySelector('.press-audio-link');
    var dialog = document.querySelector('.press-audio-dialog');
    var closeButton = document.querySelector('.press-audio-close');
    var audio = dialog && dialog.querySelector('audio');

    if (!link || !dialog || !closeButton || typeof dialog.showModal !== 'function') {
        return;
    }

    link.addEventListener('click', function (event) {
        event.preventDefault();
        dialog.showModal();
    });

    closeButton.addEventListener('click', function () {
        dialog.close();
    });

    dialog.addEventListener('click', function (event) {
        if (event.target === dialog) {
            dialog.close();
        }
    });

    dialog.addEventListener('close', function () {
        audio.pause();
    });
}());
