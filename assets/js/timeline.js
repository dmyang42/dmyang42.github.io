// Keep the full news archive readable when JavaScript is unavailable.
(function () {
    'use strict';

    function initializeTimeline() {
        const timeline = document.getElementById('news-timeline');
        const toggle = document.getElementById('timeline-toggle');
        const status = document.getElementById('timeline-status');

        if (!timeline || !toggle || !status || timeline.dataset.initialized) return;
        timeline.dataset.initialized = 'true';

        const today = new Date();
        // Entries are displayed by month, so include the boundary month in full.
        const cutoffMonth = (today.getFullYear() - 2) * 12 + today.getMonth();
        const olderItems = Array.from(timeline.children).filter(function (item) {
            const date = item.querySelector('time[datetime]')?.dateTime;
            const match = date?.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
            if (!match) return false;

            const month = Number(match[2]);
            if (month < 1 || month > 12) return false;
            return Number(match[1]) * 12 + month - 1 < cutoffMonth;
        });

        if (!olderItems.length) return;

        const label = toggle.querySelector('.timeline-toggle-label');

        function setExpanded(expanded) {
            olderItems.forEach(function (item) {
                item.hidden = !expanded;
            });
            toggle.setAttribute('aria-expanded', String(expanded));
            label.textContent = expanded ? 'Show recent updates only' : 'Show older updates';
            status.textContent = expanded
                ? 'Showing all updates.'
                : 'Showing updates from the last two years.';
        }

        setExpanded(false);
        status.hidden = false;
        toggle.hidden = false;
        toggle.addEventListener('click', function () {
            setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
        });
    }

    initializeTimeline();
    document.addEventListener('site:pagechange', initializeTimeline);
})();
