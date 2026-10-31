// 株主優待のページ共通のスクリプト。index.html と picks.html が読む。
// items.json を一度読んで、そのページにある描き込み先だけを埋める。
// items.json を読んで、お気に入り・ジャンル別・届く月に並べる。
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const yen = n => "¥" + Number(n).toLocaleString("ja-JP");
// 社名は優待情報サイトの銘柄ページへ送る。対応ページが無いものは文字のまま。
const nameLink = it => it.url
  ? `<a class="kb" href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.name)}</a>`
  : esc(it.name);

// 優待カテゴリごとのアイコン。知らないカテゴリが来たら星にしておく。
const ICONS = {
  "食事券・サービス券":"ticket", "自社製品":"box", "地場産品":"leaf",
  "カタログギフト":"book", "QUOカード・ギフト券":"card", "その他":"star",
};
const icon = (cat, cls) => `<svg class="ic ${cls}" aria-hidden="true"><use href="#ic-${ICONS[cat] || "star"}"/></svg>`;

// 今月から数えて、その月が次に来るまでの近さ。0 は今月。月の無いものは最後へ。
const soon = ms => {
  const cur = new Date().getMonth() + 1;
  const ns = ms.map(m => (parseInt(m, 10) - cur + 12) % 12);
  return ns.length ? Math.min(...ns) : 99;
};

// 細目はトップのジャンル別へ送る。二つのページを行き来できるようにしておく。
const subTag = (it, home) => it.sub
  ? `<a class="gl" href="${home}#genre">${esc(it.sub)}</a>` : "";

function pickCard(it){
  const meta = subTag(it, "./") + [
    it.fix.length ? "権利確定 " + it.fix.join("・") : "",
    it.arrive.length ? "到着 " + it.arrive.join("・") : "",
    it.value ? yen(it.value) + "相当" : "",
  ].filter(Boolean).map(t => `<span>${esc(t)}</span>`).join("");
  return `<div class="pick">
    <div class="hd">
      <span class="badge">${icon(it.cat, "")}</span>
      <span class="ttl"><b>${nameLink(it)}</b><span class="code">${esc(it.code)}</span>
        ${it.note && !(it.memo || "").includes(it.note) ? `<span class="what">${esc(it.note)}</span>` : ""}
      </span>
    </div>
    <p class="memo">${esc(it.memo)}</p>
    <div class="meta">${meta}</div>
  </div>`;
}

// 暮らしの領域ごとのアイコン。
const USE_ICONS = {
  "外食と出前":"shop", "食卓":"meal", "家のなか":"home", "着るもの":"shirt",
  "買い物":"bag", "通信とサブスク":"wifi", "おふろと旅":"bath", "遊び":"wheel",
};

function useCard(u, list, wanted){
  const rows = (u.subs || []).map(name => {
    const got = list.filter(it => it.sub === name);
    if (!got.length) return "";
    const names = got.map(it => `<span class="un">${nameLink(it)}</span>`).join("");
    return `<div class="sub"><dt>${esc(name)}</dt><dd>${names}</dd></div>`;
  }).join("");
  return `<div class="use">
    <div class="uh">
      <span class="badge"><svg class="ic" aria-hidden="true"><use href="#ic-${USE_ICONS[u.name] || "shop"}"/></svg></span>
      <span class="ut"><b>${esc(u.name)}</b><span class="uen">${esc(u.en)}</span></span>
      <span class="n">${list.length}件${wanted ? `<span class="wn">欲しい${wanted}</span>` : ""}</span>
    </div>
    <dl class="subs">${rows}</dl>
  </div>`;
}

// 欲しい優待のカード。まだ持っていないので、到着ではなく贈呈の月を書く。
function wantCard(w){
  const meta = subTag(w, "./") + [
    w.fix.length ? "権利確定 " + w.fix.join("・") : "",
    w.arrive.length ? "贈呈 " + w.arrive.join("・") : "",
    w.value ? yen(w.value) + "相当" : "",
  ].filter(Boolean).map(t => `<span>${esc(t)}</span>`).join("");
  return `<div class="pick">
    <div class="hd">
      <span class="badge">${icon(w.cat, "")}</span>
      <span class="ttl"><b>${nameLink(w)}</b><span class="code">${esc(w.code)}</span>
        <span class="what">${esc(w.note)}</span></span>
    </div>
    ${w.memo ? `<p class="memo">${esc(w.memo)}</p>` : ""}
    <div class="meta">${meta}</div>
  </div>`;
}

function monthBlock(month, list, max){
  const w = list.length ? Math.max(4, Math.round(list.length / max * 100)) : 0;
  const items = list.map(it => `<li><span>${icon(it.cat, "mi")}${nameLink(it)}</span>${
    it.note ? `<span class="w">${esc(it.note)}</span>` : ""}</li>`).join("");
  return `<div class="month${list.length ? "" : " none"}">
    <div class="mh">
      <span class="mn">${esc(month)}</span>
      <span class="track"><span class="bar" style="width:${w}%"></span>
        <span class="mc">${list.length ? list.length + "件" : "なし"}</span></span>
    </div>
    ${list.length ? `<ul>${items}</ul>` : ""}
  </div>`;
}

function render(data){
  const items = data.items || [];
  const byName = (a, b) => a.code.localeCompare(b.code);

  // お気に入り優待
  const picks = items.filter(it => it.memo)
    .sort((a, b) => soon(a.arrive) - soon(b.arrive) || a.code.localeCompare(b.code));
  const pickBox = document.querySelector("[data-picks]");
  if (pickBox) pickBox.innerHTML = picks.length ? picks.map(pickCard).join("")
    : `<p class="empty">まだありません。</p>`;

  // 欲しい優待
  const wants = (data.wants || []).slice()
    .sort((a, b) => soon(a.fix) - soon(b.fix) || a.code.localeCompare(b.code));
  const wantBox = document.querySelector("[data-wants]");
  if (wantBox) wantBox.innerHTML = wants.length ? wants.map(wantCard).join("")
    : `<p class="empty">まだありません。</p>`;

  // ジャンル別
  const uses = data.uses || [];
  const placed = items.filter(it => it.use);
  const useBox = document.querySelector("[data-uses]");
  if (useBox) useBox.innerHTML = uses.length
    ? uses.map(u => useCard(u, placed.filter(it => it.use === u.name).sort(byName),
        wants.filter(w => w.use === u.name).length)).join("")
    : `<p class="empty">まだありません。</p>`;

  // 残りがどこへ行ったのかは、黙って消すより書いておく
  const left = items.length - placed.length;
  const leftBox = document.querySelector("[data-left]");
  if (leftBox) leftBox.textContent = left
    ? `残り${left}件は、QUOカード・デジタルギフト・優待ポイント・総合カタログギフト。`
      + `暮らしのどこに効くとも言えないので、ここには出していません。` : "";

  // 届く月
  const months = data.months || [];
  const perMonth = months.map(m => [m, items.filter(it => it.arrive.includes(m)).sort(byName)]);
  const max = Math.max(1, ...perMonth.map(([, l]) => l.length));
  const calBox = document.querySelector("[data-calendar]");
  if (calBox) calBox.innerHTML = perMonth.map(([m, l]) => monthBlock(m, l, max)).join("");

  document.querySelectorAll("[data-count]").forEach(el => {
    const k = el.dataset.count;
    const n = k === "picks" ? picks.length
      : k === "wants" ? wants.length
      : k === "uses" ? placed.length : items.length;
    el.textContent = n ? n + "件" : "";
  });
}

// 目次から注意書きへ飛んだときは、畳んだままだと何も見えないので開く。
const openCaution = () => {
  if (location.hash === "#caution") document.querySelector("#caution details").open = true;
};
addEventListener("hashchange", openCaution);
openCaution();

// 一度来た人のブラウザには古い items.json が残っている。ページだけ新しくなると
// 形が噛み合わず全部が読み込み失敗になるので、毎回サーバーに確かめさせる。
fetch("items.json", {cache: "no-cache"}).then(r => r.json()).then(render).catch(() => {
  document.querySelectorAll("[data-picks],[data-wants],[data-uses],[data-calendar]").forEach(
    el => el.innerHTML = `<p class="empty">データを読み込めませんでした。</p>`);
});
