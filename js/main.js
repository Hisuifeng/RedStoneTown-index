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

    var transbar = document.getElementById('transbar');
    var loader = document.getElementById('loader');

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
        return true;
    }

    if (isFirstLoad) {
        var items = document.querySelectorAll('.nav, .hero, .poster-band, .intro, .cta, .page-head, .tl-section, .rule-section, .footer');
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
        if (!finished && !slowed && isFirstLoad && (performance.now() - started) >= SLOW_MS && mediaAllDone()) {
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

    /* ========== 社区组织 · Coverflow 卡片切换（index.html「03 社区组织」） ========== */
    (function () {
        var stage = document.querySelector('.dept-stage');
        if (!stage) return;

        /* 部门数据（顺序即底部标签的 01~04 顺序） */
        var ITEMS = [
            {
                no: '01', name: '研究部', en: 'R &amp; D',
                img: 'img/department/研究部-白.png', alt: '研究部',
                desc: '红石镇技术研发团队，让红石镇的技术始终走在服务器最前列。',
                quote: '“把幻想变为可能，把可能变为现实。”'
            },
            {
                no: '02', name: '建筑部', en: 'Builder',
                img: 'img/department/建筑部-白.png', alt: '建筑部',
                desc: '红石镇建筑、规划团队。',
                quote: '“作为创世神，手握真理（WE 和 AX），世界的缔造者，让世间万物重构成最美妙的样子。”'
            },
            {
                no: '03', name: '废物部', en: 'Fun',
                img: 'img/department/废物部-白.png', alt: '废物部',
                desc: '红石镇的乐子潜力团队，聊天吹水，当潜水炸弹。',
                quote: '“我直接耍起嘛。”'
            },
            {
                no: '04', name: '管理部', en: 'Admin',
                img: 'img/department/管理部-白.png', alt: '管理部',
                desc: '红石镇管理部门。',
                quote: '“万物秩序的终点。”'
            }
        ];

        var n = ITEMS.length;
        var cur = 0;
        var tabs = document.querySelectorAll('.dept-tab');
        var cards = [];

        function cardHTML(d) {
            return '<div class="dept-card-img"><img src="' + d.img + '" alt="' + d.alt + '"></div>' +
                '<figcaption>' +
                '<span class="dept-card-no">' + d.no + '</span>' +
                '<h3>' + d.name + '</h3>' +
                '<em class="dept-card-en">' + d.en + '</em>' +
                '<p class="dept-card-desc">' + d.desc + '</p>' +
                '<p class="dept-card-quote">' + d.quote + '</p>' +
                '</figcaption>';
        }

        /* 每个部门一张卡片，全部叠放在舞台中央 */
        for (var i = 0; i < n; i++) {
            (function (idx) {
                var fig = document.createElement('figure');
                fig.className = 'dept-card';
                fig.setAttribute('role', 'button');
                fig.setAttribute('tabindex', '0');
                fig.setAttribute('aria-label', ITEMS[idx].name);
                fig.innerHTML = cardHTML(ITEMS[idx]);

                fig.addEventListener('click', function () { go(idx); });
                fig.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        go(idx);
                    }
                });

                stage.appendChild(fig);
                cards.push(fig);
            })(i);
        }

        /* 与当前卡的环形偏移，归一到 -1 / 0 / 1 / 其余（背面） */
        function offsetOf(i) {
            var d = (i - cur + n) % n;
            return d > n / 2 ? d - n : d;
        }

        function update() {
            for (var i = 0; i < n; i++) {
                var off = offsetOf(i);
                var pos = off === 0 ? 'pos-0' : off === 1 ? 'pos-1' : off === -1 ? 'pos--1' : 'pos-hidden';
                cards[i].className = 'dept-card ' + pos;
                cards[i].setAttribute('aria-hidden', off === -1 || off === 0 || off === 1 ? 'false' : 'true');
                cards[i].setAttribute('tabindex', pos === 'pos-hidden' ? '-1' : '0');
            }
            for (var t = 0; t < tabs.length; t++) {
                tabs[t].classList.toggle('active', t === cur);
            }
            stage.setAttribute('data-no', ITEMS[cur].no);
        }

        function go(i) {
            cur = (i + n) % n;
            update();
        }

        for (var j = 0; j < tabs.length; j++) {
            (function (idx) {
                tabs[idx].addEventListener('click', function () { go(idx); });
            })(j);
        }

        update();
    })();
})();