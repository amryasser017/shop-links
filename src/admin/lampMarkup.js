// Static markup for the lamp login (injected once, then driven by LampLogin.jsx).
export const lampMarkup = `
<canvas id="dust"></canvas>
<main class="stage" id="stage">
  <div class="roomGlow" id="roomGlow"></div>
  <div class="bokeh" style="width:150px;height:150px;right:6%;top:6%;--o:.55;--d:11s"></div>
  <div class="bokeh" style="width:70px;height:70px;right:22%;top:18%;--o:.4;--d:8s"></div>
  <div class="bokeh" style="width:210px;height:210px;right:-4%;bottom:12%;--o:.4;--d:13s"></div>
  <div class="bokeh" style="width:90px;height:90px;left:44%;bottom:6%;--o:.35;--d:10s"></div>

  <div class="lampWrap" id="lampWrap">
    <svg id="lamp" viewBox="0 0 300 560" aria-label="Floor lamp with a pull chain">
      <defs>
        <linearGradient id="shadeOff" x1="0" x2="1"><stop offset="0" stop-color="#17171b"/><stop offset=".4" stop-color="#2a2a30"/><stop offset=".6" stop-color="#26262c"/><stop offset="1" stop-color="#141417"/></linearGradient>
        <linearGradient id="shadeOn" x1="0" x2="1"><stop offset="0" stop-color="#a9793c"/><stop offset=".3" stop-color="#f6d08e"/><stop offset=".5" stop-color="#fff0cc"/><stop offset=".7" stop-color="#f6d08e"/><stop offset="1" stop-color="#a9793c"/></linearGradient>
        <linearGradient id="shadeFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1604" stop-opacity=".55"/><stop offset=".6" stop-color="#2a1604" stop-opacity="0"/></linearGradient>
        <linearGradient id="poleOff" x1="0" x2="1"><stop offset="0" stop-color="#2d2616"/><stop offset=".5" stop-color="#6b5731"/><stop offset="1" stop-color="#2a2314"/></linearGradient>
        <linearGradient id="poleOn" x1="0" x2="1"><stop offset="0" stop-color="#8a6a30"/><stop offset=".5" stop-color="#f1cf8a"/><stop offset="1" stop-color="#85652c"/></linearGradient>
        <linearGradient id="legOff" x1="0" x2="1"><stop offset="0" stop-color="#1f1812"/><stop offset="1" stop-color="#2b2118"/></linearGradient>
        <linearGradient id="legOn" x1="0" x2="1"><stop offset="0" stop-color="#6a4326"/><stop offset="1" stop-color="#9a6a3c"/></linearGradient>
        <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd08a" stop-opacity=".62"/><stop offset=".55" stop-color="#e79a45" stop-opacity=".2"/><stop offset="1" stop-color="#c97a2a" stop-opacity=".02"/></linearGradient>
        <radialGradient id="halo"><stop offset="0" stop-color="#ffe2a8" stop-opacity=".95"/><stop offset=".25" stop-color="#ffc16a" stop-opacity=".4"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient>
        <radialGradient id="floorGlow"><stop offset="0" stop-color="#ffbd6a" stop-opacity=".45"/><stop offset="1" stop-color="#ffbd6a" stop-opacity="0"/></radialGradient>
        <radialGradient id="shadow"><stop offset="0" stop-color="#000" stop-opacity=".75"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
        <radialGradient id="under" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6dc"/><stop offset=".7" stop-color="#ffd58f"/><stop offset="1" stop-color="#d79a4c"/></radialGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
        <path id="shadeShape" d="M96 40 L204 40 L250 150 L50 150 Z"/>
        <path id="legsShape" d="M147 396 L153 396 L97 548 L88 548 Z M147 396 L153 396 L212 548 L203 548 Z M148.5 396 L151.5 396 L156 524 L150 524 Z"/>
      </defs>
      <ellipse cx="150" cy="548" rx="120" ry="14" fill="url(#shadow)"/>
      <ellipse class="lit" cx="150" cy="552" rx="260" ry="34" fill="url(#floorGlow)" style="mix-blend-mode:screen"/>
      <path d="M150 530 C 120 556 70 556 40 548" stroke="#101012" stroke-width="2" fill="none" stroke-linecap="round"/>
      <g class="lit" style="mix-blend-mode:screen" filter="url(#soft)">
        <polygon points="52,152 248,152 440,560 -140,560" fill="url(#cone)"/>
      </g>
      <use href="#legsShape" fill="url(#legOff)"/>
      <use class="lit" href="#legsShape" fill="url(#legOn)"/>
      <circle cx="92" cy="548" r="3.2" fill="#8a6c34"/><circle cx="208" cy="548" r="3.2" fill="#8a6c34"/><circle cx="153" cy="524" r="2.4" fill="#8a6c34"/>
      <rect x="147" y="150" width="6" height="250" fill="url(#poleOff)"/>
      <rect class="lit" x="147" y="150" width="6" height="250" fill="url(#poleOn)"/>
      <rect x="140" y="388" width="20" height="14" rx="2" fill="url(#poleOff)"/>
      <rect class="lit" x="140" y="388" width="20" height="14" rx="2" fill="url(#poleOn)"/>
      <circle cx="161" cy="394" r="3" fill="#b99447"/>
      <rect x="143" y="146" width="14" height="14" rx="2" fill="#7a6232"/>
      <ellipse class="lit" cx="150" cy="150" rx="86" ry="9" fill="url(#under)"/>
      <circle class="lit" cx="150" cy="156" r="150" fill="url(#halo)" style="mix-blend-mode:screen"/>
      <circle class="lit" cx="150" cy="156" r="8" fill="#fff6d8"/>
      <use href="#shadeShape" fill="url(#shadeOff)"/>
      <g class="lit"><use href="#shadeShape" fill="url(#shadeOn)"/><use href="#shadeShape" fill="url(#shadeFade)"/></g>
      <g id="pleats"></g>
      <ellipse cx="150" cy="40" rx="54" ry="5" fill="#0d0d10" stroke="#6b5731" stroke-width="1.5"/>
      <ellipse cx="150" cy="150" rx="100" ry="10" fill="none" stroke="#7d6535" stroke-width="2"/>
      <ellipse class="lit" cx="150" cy="150" rx="100" ry="10" fill="none" stroke="#ffe3a8" stroke-width="2"/>
      <path d="M150 40 L150 18" stroke="#8a6c34" stroke-width="2"/><circle cx="150" cy="15" r="4" fill="#a98a44"/>
      <path id="chain" fill="none" stroke="#caa65e" stroke-width="2.3" stroke-linecap="round" stroke-dasharray="0.1 4.4"/>
      <path id="chainThin" fill="none" stroke="rgba(202,166,94,.35)" stroke-width=".8"/>
      <g id="handle">
        <line x1="0" y1="0" x2="0" y2="6" stroke="#caa65e" stroke-width="1.4"/>
        <ellipse cx="0" cy="12" rx="4.2" ry="7" fill="#d7b46a"/>
        <ellipse cx="-1.3" cy="10" rx="1.2" ry="3" fill="rgba(255,255,255,.55)"/>
      </g>
      <circle id="hitArea" cx="162" cy="262" r="26" fill="transparent" role="button" tabindex="0" aria-label="Pull the lamp chain"/>
      <g id="hintG" style="pointer-events:none">
        <line id="hintLine" x1="178" y1="270" x2="192" y2="270"/>
        <text id="hint" x="198" y="273.5">PULL THE CHAIN</text>
      </g>
    </svg>
  </div>

  <div class="cardWrap" id="cardWrap">
    <form class="card" id="card" novalidate>
      <div class="brand rv" style="--i:0">
        <div class="logo"><svg class="i" viewBox="0 0 24 24" style="color:#ffd7a0"><path d="M8 3h8l3 8H5z"/><path d="M12 11v8"/><path d="M8 21h8"/></svg></div>
        <b>SHOP LINKS ADMIN</b>
        <span class="badge"><i></i><span>LIT</span></span>
      </div>
      <h1 class="rv" style="--i:1">Welcome back.<em>The light’s on for you.</em></h1>

      <label class="l rv" style="--i:2" for="email">EMAIL</label>
      <div class="field rv" style="--i:2" id="fEmail">
        <svg class="i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>
        <input id="email" type="email" placeholder="you@email.com" autocomplete="username" inputmode="email">
      </div>

      <label class="l rv" style="--i:3" for="pw">PASSWORD</label>
      <div class="field rv" style="--i:3" id="fPw">
        <svg class="i" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
        <input id="pw" type="password" placeholder="••••••••" autocomplete="current-password">
        <button type="button" class="eye" id="eye" aria-label="Show password">
          <svg class="i" id="eyeIcon" viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>

      <div class="row rv" style="--i:4">
        <label class="sw"><input type="checkbox" id="keep" checked><span class="t"></span>Keep me signed in</label>
      </div>

      <button class="primary rv" style="--i:5" id="go" type="submit"><span id="goTxt">Sign in</span>
        <svg class="i arrow" id="goIcon" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      <div class="msg rv" style="--i:5" id="msg" aria-live="polite"></div>
      <p class="foot rv" style="--i:6">Pull the chain again to turn the light off.</p>
    </form>
  </div>
</main>`
