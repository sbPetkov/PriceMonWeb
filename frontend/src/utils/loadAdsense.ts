export function loadAdsense() {
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1727109615945418";
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}