/* deck.js — 슬라이드 내비 · 16:9 스케일러 · HUD · 미디어 lazy
   (gemini-omni-test 리포트 덱 엔진 계승 · Claude Team 도입 기안용 경량판) */
(function () {
  'use strict';

  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var booted = false;
  var hudInput = document.getElementById('hud-input');
  var hudTotal = document.getElementById('hud-total');
  var hudSection = document.getElementById('hud-section');
  var hudFill = document.querySelector('#hud .bar > i');
  var navPrev = document.getElementById('navPrev');
  var navNext = document.getElementById('navNext');
  var hudHome = document.getElementById('hud-home');

  var STAGE_W = 1920, STAGE_H = 1080;
  var current = 0;

  /* ---- 섹션 라벨 ---- */
  var SECTION = {
    cover: '표지', toc: '목차',
    decision: '결정 요청 · 실 비용', summary: '요약 · 배경',
    why: '도구 선택 근거', proof: '실증 근거 · GOLDEN HOUR CHICKEN',
    pricing: '요금 구조', compare: '개별 구독 대비',
    effect: '기대효과 · 승인 요청', outro: '마무리',
  };
  function sectionFor(slide) { return SECTION[slide.id] || ''; }

  /* ---- 16:9 스케일러 (레터박스) ---- */
  function fit() {
    var scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    stage.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
  }

  /* ================= 미디어 lazy ================= */
  function loadVideo(v) {
    if (!v.src && v.dataset.src) { v.src = v.dataset.src; }
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  function unloadVideo(v) { if (v.src) { v.pause(); v.removeAttribute('src'); v.load(); } }
  function unloadSlide(slide) { slide.querySelectorAll('video').forEach(unloadVideo); }
  function bufferVideo(v) {
    if (!v.src && v.dataset.src) { v.preload = 'auto'; v.src = v.dataset.src; if (v.load) v.load(); }
  }

  /* ---- 결과물 쇼케이스(세로 미니 캐러셀) ---- */
  var showcaseSyncGlow = null;
  function initMiniCarousels() {
    document.querySelectorAll('.mini[data-carousel]').forEach(function (m) {
      var track = m.querySelector('.sc-track-main') || m.querySelector('.mini__track');
      if (!track) return;
      var scope = m.parentNode || m;
      var prev = scope.querySelector('[data-film-prev]');
      var next = scope.querySelector('[data-film-next]');
      var countEl = scope.querySelector('[data-mini-count]');
      if (prev) prev.addEventListener('click', function (e) { e.stopPropagation(); track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' }); });
      if (next) next.addEventListener('click', function (e) { e.stopPropagation(); track.scrollBy({ left: track.clientWidth, behavior: 'smooth' }); });
      track.addEventListener('scroll', function () {
        if (countEl) countEl.textContent = Math.round(track.scrollLeft / track.clientWidth) + 1;
      });
    });
  }

  function onSlideChange(active) {
    var nextSlide = slides[current + 1] || null;
    slides.forEach(function (s) { if (s !== active && s !== nextSlide) unloadSlide(s); });
    active.querySelectorAll('video[data-autoplay]').forEach(loadVideo);
    if (nextSlide) nextSlide.querySelectorAll('video[data-autoplay]').forEach(bufferVideo);
    var trk = active.querySelector('.final-track');
    if (trk) { trk.style.animation = 'none'; void trk.offsetWidth; trk.style.animation = ''; }
  }

  /* ================= 내비게이션 ================= */
  function goTo(index, dir) {
    var nx = Math.max(0, Math.min(slides.length - 1, index));
    if (nx === current) { syncInput(); return; }
    slides[current].classList.remove('is-active');
    slides[nx].classList.add('is-active');
    current = nx;
    var gt = slides[current].querySelector('.sc-track-main');
    if (gt) { gt.scrollLeft = (dir < 0) ? Math.max(0, gt.scrollWidth - gt.clientWidth) : 0; }
    render();
  }
  function gatedTrack() { return slides[current].querySelector('.sc-track-main'); }
  function next() {
    var t = gatedTrack();
    if (t) {
      var idx = Math.round(t.scrollLeft / t.clientWidth);
      if (idx < t.children.length - 1) { t.scrollBy({ left: t.clientWidth, behavior: 'smooth' }); return; }
    }
    goTo(current + 1, 1);
  }
  function prev() {
    var t = gatedTrack();
    if (t) {
      var idx = Math.round(t.scrollLeft / t.clientWidth);
      if (idx > 0) { t.scrollBy({ left: -t.clientWidth, behavior: 'smooth' }); return; }
    }
    goTo(current - 1, -1);
  }
  function syncInput() { hudInput.value = String(current + 1).padStart(2, '0'); }

  function render() {
    syncInput();
    if (hudSection) hudSection.textContent = sectionFor(slides[current]);
    hudFill.style.width = ((current + 1) / slides.length * 100) + '%';
    navPrev.classList.toggle('is-disabled', current === 0);
    navNext.classList.toggle('is-disabled', current === slides.length - 1);
    onSlideChange(slides[current]);
  }

  /* ---- 키보드 ---- */
  window.addEventListener('keydown', function (e) {
    if (!booted) return;
    if (document.activeElement === hudInput) return;
    switch (e.key) {
      case 'ArrowRight': case ' ': case 'PageDown': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); goTo(0); break;
      case 'End': e.preventDefault(); goTo(slides.length - 1); break;
      default: break;
    }
  });

  navPrev.addEventListener('click', function (e) { e.stopPropagation(); prev(); });
  navNext.addEventListener('click', function (e) { e.stopPropagation(); next(); });
  if (hudHome) hudHome.addEventListener('click', function (e) { e.stopPropagation(); goTo(0); });

  /* ---- 번호 입력 워프 ---- */
  function commitInput() { var n = parseInt(hudInput.value, 10); if (!isNaN(n)) goTo(n - 1); else syncInput(); }
  hudInput.addEventListener('click', function (e) { e.stopPropagation(); hudInput.select(); });
  hudInput.addEventListener('keydown', function (e) {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); commitInput(); hudInput.blur(); }
    else if (e.key === 'Escape') { syncInput(); hudInput.blur(); }
  });
  hudInput.addEventListener('change', commitInput);

  /* ---- 목차 이동 ---- */
  document.querySelectorAll('.toc-link[data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var n = parseInt(btn.getAttribute('data-goto'), 10);
      if (!isNaN(n)) goTo(n - 1);
    });
  });

  /* ---- 종합 마퀴 2배 복제(이음새 없는 -50% 루프) ---- */
  (function buildMarquee() {
    document.querySelectorAll('.final-track').forEach(function (track) {
      track.innerHTML = track.innerHTML + track.innerHTML;
    });
  })();

  /* ---- 표지 전체화면 버튼 ---- */
  var fsBtn = document.getElementById('fsBtn');
  if (fsBtn) fsBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var el = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
    }
  });
  function syncFs() {
    var on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    document.documentElement.classList.toggle('is-fullscreen', on);
  }
  document.addEventListener('fullscreenchange', syncFs);
  document.addEventListener('webkitfullscreenchange', syncFs);

  /* ---- 백그라운드 프리로드 ---- */
  function preloadAll() {
    var boot = document.getElementById('boot');
    function bgPreloadRest() {
      var seen = {}, list = [];
      slides.forEach(function (slide) {
        slide.querySelectorAll('img[src]').forEach(function (im) { var s = im.getAttribute('src'); if (s && !seen[s]) { seen[s] = 1; list.push(s); } });
        slide.querySelectorAll('[data-src]').forEach(function (v) { var s = v.getAttribute('data-src'); if (s && !seen[s]) { seen[s] = 1; list.push(s); } });
      });
      var idx = 0;
      function pump() { if (idx >= list.length) return; var u = list[idx++]; fetch(u).then(function (r) { return r.blob(); }).then(pump, pump); }
      for (var c = 0; c < 4; c++) pump();
    }
    booted = true;
    if (boot) { boot.classList.add('is-done'); setTimeout(function () { boot.classList.add('is-hidden'); }, 700); }
    bgPreloadRest();
  }

  /* ---- 초기화 ---- */
  window.addEventListener('resize', fit);
  initMiniCarousels();
  slides[0].classList.add('is-active');
  if (hudTotal) hudTotal.textContent = String(slides.length).padStart(2, '0');
  fit();
  render();
  preloadAll();
})();
