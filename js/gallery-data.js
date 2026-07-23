/* gallery-data.js — 라이트박스(확대 재생) 소스 목록
   models: 3사 비교 테스트 10편. 해부 슬라이드·기록 슬라이드가 같은 갤러리를 공유하므로
   어디서 열어도 좌우 이동으로 10편 전체를 훑을 수 있다. */
window.GALLERY = {
  models: {
    fit: 'contain',
    items: [
      { k: 'v', s: 'source/videos/model_test/claude1.mp4', t: 'claude1 · 무입력 생성 + 오탈자 교정본', m: 'Claude · Opus 4.8 High', spec: '720×1280 · 10.0s · 30크레딧' },
      { k: 'v', s: 'source/videos/model_test/claude2.mp4', t: 'claude2 · "해가 지면, 골든아워"', m: 'Claude · Opus 4.8 High', spec: '720×1280 · 10.0s · 30크레딧' },
      { k: 'v', s: 'source/videos/model_test/claude3.mp4', t: 'claude3 · 표준 구성', m: 'Claude · Opus 4.8 High', spec: '720×1280 · 10.0s · 30크레딧' },
      { k: 'v', s: 'source/videos/model_test/claude4.mp4', t: 'claude4 · gpt3 기획 차용본', m: 'Claude · Opus 4.8 High', spec: '720×1280 · 10.0s · 30크레딧' },
      { k: 'v', s: 'source/videos/model_test/gpt1.mp4', t: 'gpt1 · 네온 펍 푸드 광고', m: 'GPT-5.6 Sol · 높음', spec: '720×1280 · 10.0s · 30크레딧' },
      { k: 'v', s: 'source/videos/model_test/gpt2.mp4', t: 'gpt2 · 미니어처 도시', m: 'GPT-5.6 Sol · 높음', spec: '720×1280 · 10.0s · 30크레딧' },
      { k: 'v', s: 'source/videos/model_test/gpt3.mp4', t: 'gpt3 · 원안 기획', m: 'GPT-5.6 Sol · 높음', spec: '720×1280 · 10.0s · 30크레딧' },
      { k: 'v', s: 'source/videos/model_test/gpt4.mp4', t: 'gpt4 · THE GOLDEN FREQUENCY', m: 'GPT-5.6 Sol · 높음', spec: '720×1280 · 10.0s · 30크레딧' },
      { k: 'v', s: 'source/videos/model_test/gemini1.mp4', t: 'gemini1 · 현행 기준선', m: 'Gemini 3.6 Flash (무료)', spec: '720×1280 · 10.0s · 30크레딧' },
      { k: 'v', s: 'source/videos/model_test/gemini2.mp4', t: 'gemini2 · 힙합·스트리트 리스타일', m: 'Gemini 3.6 Flash (무료)', spec: '720×1280 · 10.0s · 30크레딧' }
    ]
  }
};
