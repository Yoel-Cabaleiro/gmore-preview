// Runs in <head> before first paint: picks the identity so the right tokens apply
// immediately. Priority: ?theme= in the URL, then the last choice, then "1".
// The id list mirrors brand/identities.json; js/app.js validates against the file.
(function () {
  var IDS = ['1', '2', '3', '3b', '3c', '4', '5', '6'];
  var fromUrl = new URLSearchParams(location.search).get('theme');
  var stored = null;
  try { stored = localStorage.getItem('gmore-theme'); } catch (e) {}
  var theme = IDS.indexOf(fromUrl) > -1 ? fromUrl : IDS.indexOf(stored) > -1 ? stored : '1';
  document.documentElement.setAttribute('data-theme', theme);
  // Shown inside the switcher's mobile-view frame (see css/switcher.css).
  if (window.self !== window.top) document.documentElement.classList.add('is-framed');
})();
