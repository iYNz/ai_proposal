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
    showcase: '결과물 · GOLDEN HOUR CHICKEN',
    decision: '결정 안건 · 실 비용', agenda: '오늘 정할 것',
    pivot: '이 기안의 특이사항 · 결론 전환',
    summary: '요약 · 배경',
    utilization: '지출 효율 · 좌석 사용률',
    toolstack: '작업 환경 · 도구 스택', why: '도구 선택 근거',
    limits: '기획력 증빙 ① 제약 → 우회 설계',
    prompting: '기획력 증빙 ② 프롬프트 디버깅',
    timeline: '테스트 경위 · 동일 조건',
    log1: '요청·프롬프트 기록 ① 1차 라운드',
    log2: '요청·프롬프트 기록 ② 동일 조건 이식',
    log3: '요청·프롬프트 기록 ③ 확장 라운드 전문',
    'dis-claude1': '해부 · claude1 (T4-2)', 'dis-claude2': '해부 · claude2 (새 컨셉)',
    'dis-claude3': '해부 · claude3', 'dis-claude4': '해부 · claude4 (GPT 기획 차용)',
    'dis-gpt1': '해부 · gpt1', 'dis-gpt2': '해부 · gpt2 (미니어처 도시)',
    'dis-gpt3': '해부 · gpt3 (원안)', 'dis-gpt4': '해부 · gpt4 (GOLDEN FREQUENCY)',
    'dis-gemini1': '해부 · gemini1', 'dis-gemini2': '해부 · gemini2',
    origin: '직접 대비 · 원안 vs 차용안',
    proof: '실증 근거 · GOLDEN HOUR CHICKEN',
    options: '선택지 2안', verdict: '실무자 판단',
    fairness: '공정성 한계 명시',
    density: '비용 구조 · 재작업 횟수',
    pricing: '요금 구조 · 증설 부담분', quota: '한도 구조 · 운영 규칙',
    compare: '개별 구독 대비',
    effect: '결정 요청 및 후속 절차', appendix: '부록 · 근거 출처', outro: '마무리',
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
    var lsc = active.querySelector('.logscroll');
    if (lsc) lsc.scrollTop = 0;
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

  /* ================= 라이트박스 (확대 재생 · 좌우 이동 · 카운터) =================
     리포트 덱(gemini-omni-test)의 동작을 그대로 가져왔다.
     확대 재생은 항상 사운드 포함 — 슬라이드 위 미리보기는 muted, 열었을 때만 소리가 난다. */
  var GALLERY = window.GALLERY || {};
  var lb = document.getElementById('lightbox');
  var lbMedia = document.getElementById('lb-media');
  var lbPrev = document.getElementById('lb-prev');
  var lbNext = document.getElementById('lb-next');
  var lbCount = document.getElementById('lb-count');
  var lbFill = document.getElementById('lb-fill');
  var lbCap1 = document.getElementById('lb-cap-1');
  var lbCap2 = document.getElementById('lb-cap-2');
  var lbBack = document.getElementById('lb-back');
  var lbItems = null, lbIdx = 0, lbFit = 'cover';

  function renderLB() {
    if (!lbItems || !lbMedia) return;
    var it = lbItems[lbIdx], total = lbItems.length;
    var contain = lbFit === 'contain'; // 세로 영상: contain + 양옆 여백은 같은 영상 블러
    var mainCls = contain ? 'lb-con-v' : 'lb-cov-v';
    if (it.k === 'v') {
      lbMedia.innerHTML =
        (contain ? '<video class="lb-blur-v" src="' + it.s + '" autoplay loop muted playsinline aria-hidden="true"></video>' : '')
        + '<video class="' + mainCls + '" src="' + it.s + '" autoplay loop controls playsinline></video>';
      var v = lbMedia.querySelector('.' + mainCls);
      if (v) { v.muted = false; v.volume = 1; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    } else {
      lbMedia.innerHTML = (contain ? '<div class="lb-blur"></div>' : '')
        + '<img class="' + (contain ? 'lb-con-i' : 'lb-cov-i') + '" src="' + it.s + '" alt="" />';
      var bg = lbMedia.querySelector('.lb-blur');
      if (bg) bg.style.backgroundImage = "url('" + it.s + "')";
    }
    if (lbCount) lbCount.textContent = (lbIdx + 1) + ' / ' + total;
    if (lbFill) lbFill.style.width = ((lbIdx + 1) / total * 100) + '%';
    if (lbCap1) lbCap1.textContent = it.t || '';
    if (lbCap2) lbCap2.textContent = [it.m, it.spec].filter(Boolean).join(' · ');
    if (lbPrev) lbPrev.classList.toggle('is-off', lbIdx === 0);
    if (lbNext) lbNext.classList.toggle('is-off', lbIdx === total - 1);
  }
  function openLightbox(key, idx) {
    var g = GALLERY[key]; if (!g || !lb) return;
    lbItems = g.items; lbFit = g.fit || 'cover';
    lbIdx = Math.max(0, Math.min(lbItems.length - 1, idx));
    lb.classList.add('is-open');
    renderLB();
  }
  function lbStep(dir) {
    if (!lbItems) return;
    lbIdx = Math.max(0, Math.min(lbItems.length - 1, lbIdx + dir));
    renderLB();
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('is-open');
    if (lbMedia) lbMedia.innerHTML = ''; // 소리가 계속 나지 않도록 즉시 비운다
    lbItems = null;
  }
  if (lbBack) lbBack.addEventListener('click', function (e) { e.stopPropagation(); closeLightbox(); });
  if (lbPrev) lbPrev.addEventListener('click', function (e) { e.stopPropagation(); lbStep(-1); });
  if (lbNext) lbNext.addEventListener('click', function (e) { e.stopPropagation(); lbStep(1); });
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var z = e.target.closest('[data-gallery]');
    if (z) { e.stopPropagation(); openLightbox(z.getAttribute('data-gallery'), parseInt(z.getAttribute('data-index'), 10) || 0); }
  });

  /* ---- 키보드 ---- */
  window.addEventListener('keydown', function (e) {
    if (!booted) return;
    if (lb && lb.classList.contains('is-open')) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') { e.preventDefault(); lbStep(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); lbStep(1); }
      return;
    }
    if (document.activeElement === hudInput) return;
    switch (e.key) {
      case 'ArrowRight': case ' ': case 'PageDown': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); prev(); break;
      /* 기록 슬라이드(.logscroll)는 세로 스크롤이 본문이므로 ↓↑를 슬라이드 이동이 아닌 스크롤에 쓴다 */
      case 'ArrowDown': case 'ArrowUp': {
        var sc = slides[current].querySelector('.logscroll');
        if (!sc) return;
        e.preventDefault();
        sc.scrollBy({ top: (e.key === 'ArrowDown' ? 1 : -1) * Math.round(sc.clientHeight * 0.8), behavior: 'smooth' });
        break;
      }
      case 'Home': e.preventDefault(); goTo(0); break;
      case 'End': e.preventDefault(); goTo(slides.length - 1); break;
      default: break;
    }
  });

  navPrev.addEventListener('click', function (e) { e.stopPropagation(); prev(); });
  navNext.addEventListener('click', function (e) { e.stopPropagation(); next(); });
  /* HUD 좌측 버튼은 '목차로 이동' — 표지가 아니라 02p 목차로 보낸다 */
  if (hudHome) hudHome.addEventListener('click', function (e) { e.stopPropagation(); goTo(1); });

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
