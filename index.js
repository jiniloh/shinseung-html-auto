/* ============================================================
   신승교회 · 주일 성경 본문 생성기 — 동작 (index.js)
   ------------------------------------------------------------
   새 디자인(index.html / index.css)의 UI에 신승교회 실제 운영 로직을
   이식한 구현입니다. element ID/클래스 계약은 index.css 상단 주석 참고.

   - 본문 데이터: window.BIBLE_DATA (bible_data.js · 개역개정 66권 전체)
   - 패밀리모임지 링크: shinseung.or.kr File/Download?paramFileU= 정규화
   - 말씀 MP3: vod.shinseung.or.kr 다운로드 URL 생성 (.mp3 자동 보정)
   - 여러 본문 누적 지원 ([참조] 블록 단위)
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 0. 상수 / 데이터 ---------- */
  var CURRENT_YEAR = "2026";
  var CANONICAL_LESSON_URL = "http://www.shinseung.or.kr/File/Download";

  // 개역개정 66권 (약칭 코드 ↔ 이름). 앞 39권 구약 / 뒤 27권 신약.
  var CANONICAL_BOOKS = [
    { code: "창", name: "창세기" }, { code: "출", name: "출애굽기" }, { code: "레", name: "레위기" },
    { code: "민", name: "민수기" }, { code: "신", name: "신명기" }, { code: "수", name: "여호수아" },
    { code: "삿", name: "사사기" }, { code: "룻", name: "룻기" }, { code: "삼상", name: "사무엘상" },
    { code: "삼하", name: "사무엘하" }, { code: "왕상", name: "열왕기상" }, { code: "왕하", name: "열왕기하" },
    { code: "대상", name: "역대상" }, { code: "대하", name: "역대하" }, { code: "스", name: "에스라" },
    { code: "느", name: "느헤미야" }, { code: "에", name: "에스더" }, { code: "욥", name: "욥기" },
    { code: "시", name: "시편" }, { code: "잠", name: "잠언" }, { code: "전", name: "전도서" },
    { code: "아", name: "아가" }, { code: "사", name: "이사야" }, { code: "렘", name: "예레미야" },
    { code: "애", name: "예레미야애가" }, { code: "겔", name: "에스겔" }, { code: "단", name: "다니엘" },
    { code: "호", name: "호세아" }, { code: "욜", name: "요엘" }, { code: "암", name: "아모스" },
    { code: "옵", name: "오바댜" }, { code: "욘", name: "요나" }, { code: "미", name: "미가" },
    { code: "나", name: "나훔" }, { code: "합", name: "하박국" }, { code: "습", name: "스바냐" },
    { code: "학", name: "학개" }, { code: "슥", name: "스가랴" }, { code: "말", name: "말라기" },
    { code: "마", name: "마태복음" }, { code: "막", name: "마가복음" }, { code: "눅", name: "누가복음" },
    { code: "요", name: "요한복음" }, { code: "행", name: "사도행전" }, { code: "롬", name: "로마서" },
    { code: "고전", name: "고린도전서" }, { code: "고후", name: "고린도후서" }, { code: "갈", name: "갈라디아서" },
    { code: "엡", name: "에베소서" }, { code: "빌", name: "빌립보서" }, { code: "골", name: "골로새서" },
    { code: "살전", name: "데살로니가전서" }, { code: "살후", name: "데살로니가후서" }, { code: "딤전", name: "디모데전서" },
    { code: "딤후", name: "디모데후서" }, { code: "딛", name: "디도서" }, { code: "몬", name: "빌레몬서" },
    { code: "히", name: "히브리서" }, { code: "약", name: "야고보서" }, { code: "벧전", name: "베드로전서" },
    { code: "벧후", name: "베드로후서" }, { code: "요일", name: "요한일서" }, { code: "요이", name: "요한이서" },
    { code: "요삼", name: "요한삼서" }, { code: "유", name: "유다서" }, { code: "계", name: "요한계시록" }
  ];
  var BOOK_LIST = CANONICAL_BOOKS.map(function (b, i) {
    return { code: b.code, name: b.name, testament: i < 39 ? "구약" : "신약" };
  });

  /* ---------- 1. 단축 참조 / 상태 ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var state = { mode: "direct", lessonUrl: "" };
  var MODE_KEY = "ssbg.inputMode";   // 입력 방법(직접 입력/선택창) 마지막 선택을 기억
  function savedMode() {
    try { return window.localStorage.getItem(MODE_KEY); } catch (e) { return null; }
  }

  /* ---------- 2. 본문 데이터 정규화 ---------- */
  function decodeMojibake(text) {
    if (typeof text !== "string") return text;
    try { var decoded = decodeURIComponent(escape(text)); return decoded || text; }
    catch (e) { return text; }
  }
  function normalizeBibleData(rawData) {
    var normalized = {};
    Object.keys(rawData || {}).forEach(function (rawBookCode) {
      var bookCode = decodeMojibake(rawBookCode);
      var chapters = rawData[rawBookCode] || {};
      normalized[bookCode] = {};
      Object.keys(chapters).forEach(function (chapter) {
        var verses = chapters[chapter] || {};
        normalized[bookCode][chapter] = {};
        Object.keys(verses).forEach(function (verse) {
          normalized[bookCode][chapter][verse] = decodeMojibake(verses[verse]);
        });
      });
    });
    return normalized;
  }
  var DATA = normalizeBibleData(window.BIBLE_DATA || {});
  var availableBooks = BOOK_LIST.filter(function (b) { return DATA[b.code]; });
  var dataReady = availableBooks.length > 0;

  function nameToCode(name) {
    name = (name || "").trim();
    if (!name) return "";
    var exact = BOOK_LIST.filter(function (b) { return b.name === name; })[0];
    if (exact) return exact.code;
    var prefix = BOOK_LIST.filter(function (b) { return b.name.indexOf(name) === 0; });
    return prefix.length === 1 ? prefix[0].code : "";
  }
  function codeToName(code) {
    var b = BOOK_LIST.filter(function (x) { return x.code === code; })[0];
    return b ? b.name : code;
  }
  function getSortedNumericKeys(obj) {
    return Object.keys(obj || {}).map(Number).sort(function (a, b) { return a - b; });
  }
  function getContiguousVerseRange(chapterData) {
    var nums = Object.keys(chapterData || {}).map(Number);
    if (!nums.length) return [];
    var max = Math.max.apply(null, nums);
    var out = []; for (var i = 1; i <= max; i++) out.push(i);
    return out;
  }
  function sanitizeVerseText(text) {
    if (!text) return "";
    return String(text).replace(/^<[^>]+>\s*/, "").trim();
  }

  /* ---------- 3. 선택창 채우기 ---------- */
  function fillSelect(sel, values) {
    sel.innerHTML = values.map(function (v) {
      return '<option value="' + v + '">' + v + "</option>";
    }).join("");
  }
  function initSelects() {
    if (!dataReady) { setStatus("성경 데이터를 불러오지 못했습니다 (bible_data.js 확인)", "warn"); return; }
    $("bookSelect").innerHTML = availableBooks.map(function (b) {
      return '<option value="' + b.code + '">' + b.name + "</option>";
    }).join("");
    updateChapterOptions();
  }
  function updateChapterOptions() {
    var code = $("bookSelect").value;
    fillSelect($("chapterSelect"), getSortedNumericKeys(DATA[code] || {}));
    updateVerseOptions();
  }
  function updateVerseOptions() {
    var code = $("bookSelect").value;
    var chapter = $("chapterSelect").value;
    fillSelect($("verseStartSelect"), getContiguousVerseRange((DATA[code] || {})[chapter]));
    updateVerseEndOptions();
  }
  function updateVerseEndOptions() {
    var code = $("bookSelect").value;
    var chapter = $("chapterSelect").value;
    var start = Number($("verseStartSelect").value);
    var verses = getContiguousVerseRange((DATA[code] || {})[chapter]).filter(function (v) { return v >= start; });
    fillSelect($("verseEndSelect"), verses);
  }
  $("bookSelect").addEventListener("change", updateChapterOptions);
  $("chapterSelect").addEventListener("change", updateVerseOptions);
  $("verseStartSelect").addEventListener("change", updateVerseEndOptions);

  /* ---------- 4. 입력 방법 토글 ---------- */
  var seg = $("modeSeg");
  seg.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-mode]");
    if (btn) setMode(btn.getAttribute("data-mode"));
  });
  function setMode(mode, persist) {
    state.mode = mode;
    Array.prototype.forEach.call(seg.querySelectorAll("button"), function (b) {
      var on = b.getAttribute("data-mode") === mode;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    $("directBlock").hidden = mode !== "direct";
    $("selectBlock").hidden = mode !== "select";
    if (persist !== false) {
      try { window.localStorage.setItem(MODE_KEY, mode); } catch (e) { /* 저장 불가 환경은 무시 */ }
    }
  }

  /* ---------- 5. 자동완성 (직접 입력) ---------- */
  var refInput = $("refInput"), acMenu = $("acMenu"), acIndex = -1, acList = [];
  function parseRef(text) {
    var m = (text || "").trim().match(/^([가-힣]+)\s*(\d+)?\s*[:：장]?\s*(\d+)?\s*[-~–]?\s*(\d+)?/);
    if (!m) return null;
    return { book: m[1] || "", chapter: m[2] || "", vs: m[3] || "", ve: m[4] || "" };
  }
  function bookPartOf(text) { var m = (text || "").match(/^[가-힣]+/); return m ? m[0] : ""; }
  function renderAc() {
    var bp = bookPartOf(refInput.value);
    acList = (bp ? BOOK_LIST.filter(function (b) { return b.name.indexOf(bp) !== -1; }) : BOOK_LIST).slice(0, 8);
    acIndex = -1;
    if (!acList.length) { closeAc(); return; }
    var html = '<div class="ac-hint">성경 이름을 입력하면 자동완성됩니다 · 예) 요한복음 3:16-21</div>';
    acList.forEach(function (b, i) {
      var name = bp ? b.name.replace(bp, "<mark>" + bp + "</mark>") : b.name;
      html += '<div class="ac-item" role="option" data-i="' + i + '"><span class="ac-tag">' + b.testament +
              '</span><span class="ac-name">' + name + "</span></div>";
    });
    acMenu.innerHTML = html;
    openAc();
  }
  function openAc() { acMenu.classList.add("is-open"); refInput.setAttribute("aria-expanded", "true"); }
  function closeAc() { acMenu.classList.remove("is-open"); refInput.setAttribute("aria-expanded", "false"); acIndex = -1; }
  function pickBook(name) {
    var rest = refInput.value.slice(bookPartOf(refInput.value).length);
    refInput.value = name + (/[\s\d]/.test(rest) ? rest : " ");
    closeAc(); refInput.focus();
  }
  function highlightAc() {
    Array.prototype.forEach.call(acMenu.querySelectorAll(".ac-item"), function (el, i) {
      el.classList.toggle("is-active", i === acIndex);
    });
  }
  refInput.addEventListener("input", renderAc);
  refInput.addEventListener("focus", function () { if (refInput.value === "" || bookPartOf(refInput.value)) renderAc(); });
  refInput.addEventListener("keydown", function (e) {
    if (!acMenu.classList.contains("is-open")) return;
    if (e.key === "ArrowDown") { e.preventDefault(); acIndex = Math.min(acIndex + 1, acList.length - 1); highlightAc(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); acIndex = Math.max(acIndex - 1, 0); highlightAc(); }
    else if (e.key === "Enter" && acIndex >= 0) { e.preventDefault(); pickBook(acList[acIndex].name); }
    else if (e.key === "Escape") { closeAc(); }
  });
  acMenu.addEventListener("mousedown", function (e) {
    var item = e.target.closest(".ac-item");
    if (item) { e.preventDefault(); pickBook(acList[+item.getAttribute("data-i")].name); }
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".ac")) closeAc(); });

  /* ---------- 6. 예시 칩 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".ex-chip"), function (chip) {
    chip.addEventListener("click", function () { refInput.value = chip.textContent.trim(); refInput.focus(); });
  });

  /* ---------- 7. 툴팁 ---------- */
  var tooltipWrap = $("tooltipWrap"), infoBtn = $("infoBtn"), helpBox = $("helpBox");
  function toggleTip(force) {
    var open = force != null ? force : !helpBox.classList.contains("active");
    helpBox.classList.toggle("active", open);
    tooltipWrap.classList.toggle("hover-active", open);
    infoBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  infoBtn.addEventListener("click", function (e) { e.stopPropagation(); toggleTip(); });
  document.addEventListener("click", function (e) { if (!e.target.closest("#tooltipWrap")) toggleTip(false); });

  /* ---------- 8. 패밀리모임지 링크 정규화 (신승 File/Download) ---------- */
  var lesson = $("lesson"), lessonNotice = $("lessonNotice");
  function setNotice(text, kind) {
    var t = lessonNotice.querySelector(".notice-text");
    if (t) t.textContent = text; else lessonNotice.textContent = text;
    lessonNotice.classList.remove("field-notice-success", "field-notice-warning");
    if (!text) { lessonNotice.classList.remove("is-visible", "field-notice"); return; }
    lessonNotice.classList.add("field-notice", "is-visible");
    if (kind) lessonNotice.classList.add("field-notice-" + kind);
  }
  function safeDecodeURIComponent(value) { try { return decodeURIComponent(value); } catch (e) { return value; } }
  function extractParamFileU(value) {
    var candidates = [value.trim()];
    var decoded = safeDecodeURIComponent(value.trim());
    if (decoded !== candidates[0]) candidates.push(decoded);
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i].replace(/&amp;/gi, "&");
      try {
        var url = new URL(c);
        var p = url.searchParams.get("paramFileU");
        if (p) return p.trim();
      } catch (e) { /* URL 파싱 실패 시 정규식으로 재시도 */ }
      var match = c.match(/[?&]paramFileU=([^&#\s]+)/i);
      if (match && match[1]) return match[1].trim();
    }
    return "";
  }
  function normalizeLessonUrl(raw) {
    var v = (raw || "").trim();
    if (!v) return { value: "", valid: true, message: "", type: "" };
    var paramFileU = extractParamFileU(v);
    if (!paramFileU) {
      return { value: v, valid: false,
        message: "패밀리모임지 링크에서 paramFileU 값을 찾지 못했습니다 · 링크를 다시 확인해 주세요", type: "warning" };
    }
    var normalized = CANONICAL_LESSON_URL + "?paramFileU=" + encodeURIComponent(paramFileU);
    var changed = v !== normalized;
    return { value: normalized, valid: true,
      message: changed ? "패밀리모임지 링크를 정상 주소로 자동 변환했습니다" : "패밀리모임지 링크가 확인되었습니다",
      type: "success" };
  }
  function syncLesson(rewriteField) {
    var n = normalizeLessonUrl(lesson.value);
    state.lessonUrl = n.value;
    if (rewriteField && lesson.value.trim() && lesson.value !== n.value) lesson.value = n.value;
    setNotice(n.message, n.type);
    return n;
  }
  lesson.addEventListener("input", function () { syncLesson(false); });
  lesson.addEventListener("blur", function () { syncLesson(true); });
  lesson.addEventListener("paste", function () { window.setTimeout(function () { syncLesson(true); }, 0); });

  /* ---------- 9. 상태줄 ---------- */
  var bible = $("bible"), bibleStatus = $("bibleStatus");
  function setStatus(text, kind) {
    bibleStatus.textContent = "";
    bibleStatus.classList.remove("is-ok", "is-warn");
    if (!text) return;
    var dot = document.createElement("span"); dot.className = "dot";
    bibleStatus.appendChild(dot);
    bibleStatus.appendChild(document.createTextNode(text));
    if (kind) bibleStatus.classList.add(kind === "ok" ? "is-ok" : "is-warn");
  }

  /* ---------- 10. 본문 불러오기 (여러 본문 누적) ---------- */
  function currentRef() {
    if (state.mode === "select") {
      return { book: codeToName($("bookSelect").value), chapter: $("chapterSelect").value,
               vs: $("verseStartSelect").value, ve: $("verseEndSelect").value };
    }
    return parseRef(refInput.value) || { book: "", chapter: "", vs: "", ve: "" };
  }
  function buildPassageBlock(r) {
    var code = nameToCode(r.book);
    if (!code || !DATA[code]) return { error: (r.book || "성경") + " 을(를) 찾지 못했습니다" };
    var chapter = String(r.chapter || "");
    var chapData = DATA[code][chapter];
    if (!chapData) return { error: codeToName(code) + " " + chapter + "장 데이터가 없습니다" };

    var maxV = Math.max.apply(null, Object.keys(chapData).map(Number));
    var start = parseInt(r.vs || "1", 10); if (!(start >= 1)) start = 1;
    var end = r.ve ? parseInt(r.ve, 10) : start;
    if (!(end >= start)) end = start;
    if (start > maxV) return { error: codeToName(code) + " " + chapter + "장은 " + maxV + "절까지입니다" };
    if (end > maxV) end = maxV;

    var lines = [];
    for (var v = start; v <= end; v++) {
      lines.push(v + ". " + (sanitizeVerseText(chapData[v]) || "내용 없음"));
    }
    var range = end !== start ? (start + "-" + end) : ("" + start);
    var refLabel = codeToName(code) + " " + chapter + ":" + range;
    return { ref: refLabel, block: "[" + refLabel + "]\n" + lines.join("\n") };
  }
  function loadPassage() {
    if (!dataReady) { setStatus("성경 데이터를 불러오지 못했습니다", "warn"); return false; }
    var r = currentRef();
    if (!r.book || !r.chapter) {
      setStatus(state.mode === "direct"
        ? "성경·장·절을 입력해 주세요 (예: 요한복음 3:16-21)"
        : "성경과 장을 선택해 주세요", "warn");
      return false;
    }
    var res = buildPassageBlock(r);
    if (res.error) { setStatus(res.error, "warn"); return false; }
    var existing = bible.value.trim();
    bible.value = existing ? existing + "\n\n" + res.block : res.block;
    bible.scrollTop = bible.scrollHeight;
    updateCounter();
    setStatus(res.ref + " 본문을 추가했습니다", "ok");
    return true;
  }
  $("addPassageBtn").addEventListener("click", loadPassage);
  $("clearPassageBtn").addEventListener("click", function () {
    bible.value = ""; updateCounter(); setStatus("본문을 비웠습니다", null); bible.focus();
  });

  /* ---------- 11. 글자/절 카운터 ---------- */
  function updateCounter() {
    var t = bible.value;
    $("charCount").textContent = t.replace(/\s/g, "").length.toLocaleString();
    var vm = t.match(/^\s*\d+[.)]?\s+\S/gm);
    $("verseCount").textContent = vm ? vm.length : 0;
  }
  bible.addEventListener("input", updateCounter);

  /* ---------- 12. 게시판 결과물 HTML 생성 (기존 운영 출력과 100% 동일) ---------- */
  // ⚠ 이 출력은 교회 게시판에 그대로 붙는 결과물입니다. 기존 버전과 바이트 단위로
  //   동일해야 하므로, 아래 빌더/템플릿은 임의로 수정하지 마세요. (이스케이프 없음 — 원본 동작 유지)
  function parsePassages(text) {
    var lines = text.split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
    var passages = [], current = { ref: "", verses: [] };
    function push() { if (current.ref || current.verses.length) passages.push(current); }
    lines.forEach(function (line) {
      var header = line.match(/^\[(.+)\]$/);
      if (header) { push(); current = { ref: header[1].trim(), verses: [] }; return; }
      var vm = line.match(/^(\d+)[.)]?\s*(.*)$/);
      if (vm && vm[2]) current.verses.push({ number: vm[1], verse: vm[2] });
      else current.verses.push({ number: String(current.verses.length + 1), verse: line });
    });
    push();
    return passages;
  }
  function buildActionButtons(mp3, lesson) {
    var buttons = [];
    if (mp3) {
      var fileUrl = "https://vod.shinseung.or.kr/vod/new/" + CURRENT_YEAR + "/" + mp3;
      var mp3Url = "https://vod.shinseung.or.kr/download.jsp?file=" + fileUrl;
      buttons.push(`
<a href="${mp3Url}" target="_blank"
style="padding:10px 20px;background:#3f6fb6;color:#fff;border-radius:30px;text-decoration:none;">
말씀 MP3 다운로드
</a>`);
    }
    if (lesson) {
      buttons.push(`
<a href="${lesson}" target="_blank"
style="padding:10px 20px;background:#4caf50;color:#fff;border-radius:30px;text-decoration:none;">
패밀리모임지 다운로드
</a>`);
    }
    if (buttons.length === 0) return "";
    return `
<div style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;">
${buttons.join("")}
</div>`;
  }
  function buildVerseHtml(verses) {
    return verses.map(function (item, index) {
      var isLast = index === verses.length - 1;
      var wrapperStyle = isLast
        ? "margin-bottom:0;display:flex;align-items:flex-start;gap:10px;"
        : "margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #eef1f5;display:flex;align-items:flex-start;gap:10px;";
      return `
<div style="${wrapperStyle}">
<span style="flex:0 0 26px;height:26px;line-height:26px;text-align:center;background:linear-gradient(135deg,#5789cf,#3f6fb6);color:#fff;border-radius:50%;font-size:13px;font-weight:bold;box-shadow:0 2px 4px rgba(63,111,182,0.25);">${item.number}</span>
<span style="flex:1;">${item.verse}</span>
</div>`;
    }).join("");
  }
  function buildPassageHtml(passage, index, total) {
    var verseHtml = buildVerseHtml(passage.verses);
    var marginBottom = index === total - 1 ? "0" : "14px";
    var refHeading = passage.ref
      ? `
<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #e6edf7;">
<span style="display:inline-block;width:6px;height:20px;background:linear-gradient(180deg,#5789cf,#3f6fb6);border-radius:3px;"></span>
<span style="font-size:16px;font-weight:bold;color:#315992;letter-spacing:0.2px;">${passage.ref}</span>
</div>`
      : "";
    return `
<div style="background:#ffffff;padding:18px 20px;border-radius:14px;box-shadow:0 4px 14px rgba(15,23,42,0.08);font-size:16px;line-height:1.85;margin-bottom:${marginBottom};">
${refHeading}
${verseHtml}
</div>`;
  }
  function buildResultHtml(mp3, lesson, bibleText) {
    var passages = parsePassages(bibleText);
    var actionButtons = buildActionButtons(mp3, lesson);
    var passageHtml = passages.map(function (passage, index) {
      return buildPassageHtml(passage, index, passages.length);
    }).join("");
    return `<div style="padding:16px;background:linear-gradient(180deg,#f5f6f8 0%,#eef1f5 100%);border-radius:18px;">
${actionButtons}
<div style="font-size:18px;font-weight:bold;margin-bottom:12px;color:#1f2937;">성경 본문</div>
${passageHtml}
</div>`;
  }
  function currentResultHtml() {
    var rawMp3 = $("mp3").value.trim();
    var mp3 = rawMp3 && !/\.mp3$/i.test(rawMp3) ? rawMp3 + ".mp3" : rawMp3;
    return buildResultHtml(mp3, state.lessonUrl, bible.value.trim());
  }
  function buildPreviewNotice() {
    if (window.location.protocol !== "https:") return "";
    return `
<div class="preview-notice">
현재 이 페이지에서는 다운로드 버튼이 바로 동작하지 않을 수 있습니다.<br>
실제 게시 페이지에서 최종 동작을 다시 확인해 주세요. HTTPS 페이지에서는 HTTP 다운로드가 제한될 수 있습니다.
</div>`;
  }
  function renderPreview(html) {
    $("preview").innerHTML = buildPreviewNotice() + html;
  }

  /* ---------- 13. 스텝 전환 ---------- */
  function goStep(n) {
    $("step1").hidden = n !== 1;
    $("step2").hidden = n !== 2;
    $("stepNode1").className = "step-node " + (n === 1 ? "is-on" : "is-done");
    $("stepNode1").querySelector(".step-dot").innerHTML = n === 1 ? "1"
      : '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>';
    $("stepNode2").className = "step-node " + (n === 2 ? "is-on" : "");
    $("stepLine").className = "step-line " + (n === 2 ? "is-done" : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $("generateBtn").addEventListener("click", function () {
    syncLesson(true);
    if (!bible.value.trim()) { loadPassage(); }      // 본문이 비어 있으면 현재 참조로 한 번 시도
    if (!bible.value.trim()) { return; }             // 그래도 없으면 단계 1에 머무름 (상태줄이 안내)
    var html = currentResultHtml();
    $("output").value = html;
    renderPreview(html);
    goStep(2);
  });
  $("backBtn").addEventListener("click", function () { goStep(1); });

  /* ---------- 14. 복사 ---------- */
  var toast = $("toast"), copyMsg = $("copyMsg"), toastTimer;
  function showToast() {
    toast.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-show"); }, 1900);
  }
  function doCopy() {
    var out = $("output");
    if (!out.value) { setStatus("먼저 결과를 생성해 주세요", "warn"); return; }
    var done = function () {
      copyMsg.textContent = "복사되었습니다! 교회 게시판에 붙여넣으세요.";
      copyMsg.classList.add("is-ok");
      showToast();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(out.value).then(done, function () { out.select(); document.execCommand("copy"); done(); });
    } else { out.select(); document.execCommand("copy"); done(); }
  }
  $("copyBtn").addEventListener("click", doCopy);

  /* ---------- 15. 안내 배너 닫기 ---------- */
  $("guideClose").addEventListener("click", function () { $("guideCard").hidden = true; });

  /* ---------- 16. 키보드 단축키 ---------- */
  document.addEventListener("keydown", function (e) {
    var mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === "Enter") {
      e.preventDefault();
      if ($("step1").hidden) doCopy(); else $("generateBtn").click();
    } else if (e.key === "Escape") {
      toggleTip(false); closeAc();
    }
  });

  /* ---------- 17. 초기화 ---------- */
  initSelects();
  // 기본은 '직접 입력'. 단, 지난번에 '선택창'을 골랐다면 그대로 유지.
  setMode(savedMode() === "select" ? "select" : "direct", false);
  updateCounter();
})();
