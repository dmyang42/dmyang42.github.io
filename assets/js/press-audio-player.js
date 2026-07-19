(function () {
    'use strict';

    var links = document.querySelectorAll('.press-audio-link');
    var dialog = document.querySelector('.press-audio-dialog');
    var closeButton = document.querySelector('.press-audio-close');
    var audio = dialog && dialog.querySelector('audio');
    var source = audio && audio.querySelector('source');
    var dialogTitle = dialog && dialog.querySelector('h2');
    var dialogDescription = dialog && dialog.querySelector('p');

    if (!links.length || !dialog || !closeButton || !audio || !source || typeof dialog.showModal !== 'function') {
        return;
    }

    links.forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            dialogTitle.textContent = link.dataset.audioSource;
            dialogDescription.textContent = link.dataset.audioTitle;
            source.src = link.href;
            audio.load();
            dialog.showModal();
        });
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
