(function () {
    'use strict';

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var TRANSIT_MS = reduced ? 0 : 150;
    var MIN_LOAD_MS = reduced ? 0 : 900;
    var SLOW_MS = 300;

    var isFirstLoad = true;
    try {
        isFirstLoad = !sessionStorage.getItem('rst_first_load');
        sessionStorage.setItem('rst_first_load', '1');
    } catch (e) { /* ignore */ }

    function createEl(tag, id, html) {
        var el = document.createElement(tag);
        el.id = id;
        if (html != null) el.innerHTML = html;
        return el;
    }

    var transbar = document.getElementById('transbar') || createEl('div', 'transbar');
    if (transbar.parentNode !== document.body) document.body.appendChild(transbar);

    var loader = document.getElementById('loader') || createEl('div', 'loader',
        '<div class="loader-box">' +
        '<div class="loader-corner corner-tl"></div>' +
        '<div class="loader-corner corner-tr"></div>' +
        '<div class="loader-corner corner-bl"></div>' +
        '<div class="loader-corner corner-br"></div>' +
        '<div class="loader-progress"><span></span></div>' +
        '<div class="loader-text"><span>LOADING<span class="loader-cursor">_</span></span><span class="loader-state"></span><b>0%</b></div>' +
        '</div>');
    if (loader.parentNode !== document.body) document.body.appendChild(loader);

    var pct = loader.querySelector('.loader-text b');
    var bar = loader.querySelector('.loader-progress span');
    var state = loader.querySelector('.loader-state');

    function setPct(p) {
        var n = Math.round(p);
        pct.textContent = n + '%';
        bar.style.width = n + '%';
    }

    function mediaAllDone() {
        var imgs = document.getElementsByTagName('img');
        for (var i = 0; i < imgs.length; i++) {
            if (!imgs[i].complete) return false;
        }
        var med = document.querySelectorAll('video, audio');
        for (var j = 0; j < med.length; j++) {
            if (med[j].readyState < 2) return false;
        }
        return true;
    }

    if (isFirstLoad) {
        var items = document.querySelectorAll('.nav, .hero, .poster-band, .show, .intro, .cta, .page-head, .tl-section, .rule-section, .flow-hero, .gallery-band, .footer');
        for (var i = 0; i < items.length; i++) {
            items[i].style.animationDelay = (i * 90) + 'ms';
        }
    } else {
        loader.classList.add('idle');
    }

    transbar.classList.add('cover');

    var started = performance.now();
    var finished = false;
    var slowed = false;
    var fake = setInterval(function () {
        setPct(Math.min(((performance.now() - started) / 1000) * 80, 88));
        if (!finished && !slowed && (performance.now() - started) >= SLOW_MS && mediaAllDone()) {
            slowed = true;
            state.textContent = 'DATA';
            loader.classList.remove('idle');
        }
    }, 150);

    function loadComplete(instant) {
        clearInterval(fake);
        loader.classList.add('done');
        setTimeout(function () {
            if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, instant ? 0 : 300);
        if (isFirstLoad) document.body.classList.add('entered');
        setTimeout(function () {
            transbar.classList.remove('cover');
            transbar.classList.add('out');
        }, instant ? 0 : 120);
        setTimeout(function () {
            if (transbar.parentNode) transbar.parentNode.removeChild(transbar);
        }, instant ? 300 : TRANSIT_MS + 900);
    }

    function finish() {
        if (finished) return;
        finished = true;
        clearInterval(fake);
        setPct(100);
        if (reduced) return loadComplete(true);
        var wait = Math.max(0, MIN_LOAD_MS - (performance.now() - started));
        setTimeout(function () { loadComplete(false); }, wait);
    }

    window.addEventListener('load', finish);
    setTimeout(finish, 6000);

    window.addEventListener('pageshow', function (e) {
        if (e.persisted) {
            finished = true;
            clearInterval(fake);
            if (isFirstLoad) document.body.classList.add('entered');
            if (loader.parentNode) loader.parentNode.removeChild(loader);
            if (transbar.parentNode) transbar.parentNode.removeChild(transbar);
        }
    });

    var navigating = false;
    document.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a || navigating || reduced) return;
        var href = a.getAttribute('href');
        if (!href) return;
        if (href.charAt(0) === '#') return;
        if (/^(https?:)?\/\//i.test(href)) return;
        if (/^(javascript|mailto|tel):/i.test(href)) return;
        if (!/^[a-zA-Z0-9_\-\/\.%]+$/.test(href)) return;

        e.preventDefault();
        navigating = true;
        document.body.classList.remove('entered');
        transbar.classList.remove('cover', 'out');
        transbar.classList.add('in');
        setTimeout(function () { window.location.href = a.href; }, TRANSIT_MS + 60);
    });

    /* 移动端汉堡菜单 */
    var burger = document.querySelector('.nav-burger');
    var navHead = document.querySelector('.nav');
    if (burger && navHead) {
        burger.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = navHead.classList.toggle('open');
            burger.setAttribute('aria-expanded', open ? 'true' : 'false');
            burger.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
        });
        navHead.addEventListener('click', function (e) {
            if (e.target.closest('.nav-link')) navHead.classList.remove('open');
        });
    }
})();