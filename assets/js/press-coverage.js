(function () {
    'use strict';

    var list = document.querySelector('.press-list');
    var toggle = document.querySelector('.press-coverage-toggle');

    if (!list || !toggle) {
        return;
    }

    Array.from(list.querySelectorAll('li[data-featured-order]'))
        .sort(function (a, b) {
            return Number(a.dataset.featuredOrder) - Number(b.dataset.featuredOrder);
        })
        .forEach(function (item) {
            list.appendChild(item);
        });

    Array.from(list.querySelectorAll('li[data-featured-order]')).reverse().forEach(function (item) {
        list.insertBefore(item, list.firstChild);
    });

    toggle.addEventListener('click', function () {
        var expanded = list.classList.toggle('is-expanded');
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.innerHTML = expanded
            ? 'Show featured coverage only <span aria-hidden="true">↑</span>'
            : 'View all institutional and international coverage (35+) <span aria-hidden="true">↓</span>';
    });
}());
