const CURRENT_YEAR = "2026";
const CANONICAL_LESSON_URL = "http://www.shinseung.or.kr/File/Download";

const CANONICAL_BOOKS = [
    { code: "창", name: "창세기" },
    { code: "출", name: "출애굽기" },
    { code: "레", name: "레위기" },
    { code: "민", name: "민수기" },
    { code: "신", name: "신명기" },
    { code: "수", name: "여호수아" },
    { code: "삿", name: "사사기" },
    { code: "룻", name: "룻기" },
    { code: "삼상", name: "사무엘상" },
    { code: "삼하", name: "사무엘하" },
    { code: "왕상", name: "열왕기상" },
    { code: "왕하", name: "열왕기하" },
    { code: "대상", name: "역대상" },
    { code: "대하", name: "역대하" },
    { code: "스", name: "에스라" },
    { code: "느", name: "느헤미야" },
    { code: "에", name: "에스더" },
    { code: "욥", name: "욥기" },
    { code: "시", name: "시편" },
    { code: "잠", name: "잠언" },
    { code: "전", name: "전도서" },
    { code: "아", name: "아가" },
    { code: "사", name: "이사야" },
    { code: "렘", name: "예레미야" },
    { code: "애", name: "예레미야애가" },
    { code: "겔", name: "에스겔" },
    { code: "단", name: "다니엘" },
    { code: "호", name: "호세아" },
    { code: "욜", name: "요엘" },
    { code: "암", name: "아모스" },
    { code: "옵", name: "오바댜" },
    { code: "욘", name: "요나" },
    { code: "미", name: "미가" },
    { code: "나", name: "나훔" },
    { code: "합", name: "하박국" },
    { code: "습", name: "스바냐" },
    { code: "학", name: "학개" },
    { code: "슥", name: "스가랴" },
    { code: "말", name: "말라기" },
    { code: "마", name: "마태복음" },
    { code: "막", name: "마가복음" },
    { code: "눅", name: "누가복음" },
    { code: "요", name: "요한복음" },
    { code: "행", name: "사도행전" },
    { code: "롬", name: "로마서" },
    { code: "고전", name: "고린도전서" },
    { code: "고후", name: "고린도후서" },
    { code: "갈", name: "갈라디아서" },
    { code: "엡", name: "에베소서" },
    { code: "빌", name: "빌립보서" },
    { code: "골", name: "골로새서" },
    { code: "살전", name: "데살로니가전서" },
    { code: "살후", name: "데살로니가후서" },
    { code: "딤전", name: "디모데전서" },
    { code: "딤후", name: "디모데후서" },
    { code: "딛", name: "디도서" },
    { code: "몬", name: "빌레몬서" },
    { code: "히", name: "히브리서" },
    { code: "약", name: "야고보서" },
    { code: "벧전", name: "베드로전서" },
    { code: "벧후", name: "베드로후서" },
    { code: "요일", name: "요한일서" },
    { code: "요이", name: "요한이서" },
    { code: "요삼", name: "요한삼서" },
    { code: "유", name: "유다서" },
    { code: "계", name: "요한계시록" }
];

const elements = {
    mp3Input: document.getElementById("mp3"),
    lessonInput: document.getElementById("lesson"),
    lessonNotice: document.getElementById("lessonNotice"),
    bibleInput: document.getElementById("bible"),
    output: document.getElementById("output"),
    preview: document.getElementById("preview"),
    copyMsg: document.getElementById("copyMsg"),
    generateBtn: document.getElementById("generateBtn"),
    copyBtn: document.getElementById("copyBtn"),
    addPassageBtn: document.getElementById("addPassageBtn"),
    clearPassageBtn: document.getElementById("clearPassageBtn"),
    bibleStatus: document.getElementById("bibleStatus"),
    bookSelect: document.getElementById("bookSelect"),
    chapterSelect: document.getElementById("chapterSelect"),
    verseStartSelect: document.getElementById("verseStartSelect"),
    verseEndSelect: document.getElementById("verseEndSelect"),
    tooltipWrap: document.getElementById("tooltipWrap"),
    helpBox: document.getElementById("helpBox"),
    infoBtn: document.getElementById("infoBtn")
};

let hoverTimer;
let bibleReady = false;
let normalizedBibleData = {};
let availableBooks = [];

function decodeMojibake(text) {
    if (typeof text !== "string") return text;

    try {
        const decoded = decodeURIComponent(escape(text));
        return decoded || text;
    } catch {
        return text;
    }
}

function normalizeBibleData(rawData) {
    const normalized = {};

    Object.entries(rawData || {}).forEach(([rawBookCode, chapters]) => {
        const bookCode = decodeMojibake(rawBookCode);
        normalized[bookCode] = {};

        Object.entries(chapters || {}).forEach(([chapter, verses]) => {
            normalized[bookCode][chapter] = {};

            Object.entries(verses || {}).forEach(([verse, text]) => {
                normalized[bookCode][chapter][verse] = decodeMojibake(text);
            });
        });
    });

    return normalized;
}

function setupTooltip() {
    elements.tooltipWrap.addEventListener("mouseenter", () => {
        hoverTimer = setTimeout(() => {
            elements.tooltipWrap.classList.add("hover-active");
        }, 300);
    });

    elements.tooltipWrap.addEventListener("mouseleave", () => {
        clearTimeout(hoverTimer);
        elements.tooltipWrap.classList.remove("hover-active");
    });

    elements.infoBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        elements.tooltipWrap.classList.remove("hover-active");
        elements.helpBox.classList.toggle("active");
    });

    document.addEventListener("click", () => {
        elements.helpBox.classList.remove("active");
    });
}

function setBibleStatus(message) {
    elements.bibleStatus.innerText = message;
}

function fillSelectOptions(selectElement, values) {
    selectElement.innerHTML = values
        .map((value) => `<option value="${value}">${value}</option>`)
        .join("");
}

function getSortedNumericKeys(object) {
    return Object.keys(object)
        .map((key) => Number(key))
        .sort((a, b) => a - b);
}

function initializeBiblePicker() {
    normalizedBibleData = normalizeBibleData(window.BIBLE_DATA || {});
    availableBooks = CANONICAL_BOOKS.filter((book) => normalizedBibleData[book.code]);

    if (availableBooks.length === 0) {
        bibleReady = false;
        setBibleStatus("성경 데이터를 찾지 못했습니다.");
        return;
    }

    elements.bookSelect.innerHTML = availableBooks
        .map((book) => `<option value="${book.code}">${book.name}</option>`)
        .join("");

    bibleReady = true;
    updateChapterOptions();
    setBibleStatus("성경 선택창이 준비되었습니다.");
}

function updateChapterOptions() {
    const bookCode = elements.bookSelect.value;
    const chapters = getSortedNumericKeys(normalizedBibleData[bookCode] || {});

    fillSelectOptions(elements.chapterSelect, chapters);
    updateVerseOptions();
}

function updateVerseOptions() {
    const bookCode = elements.bookSelect.value;
    const chapter = Number(elements.chapterSelect.value);
    const verses = getSortedNumericKeys((normalizedBibleData[bookCode] || {})[chapter] || {});

    fillSelectOptions(elements.verseStartSelect, verses);
    updateVerseEndOptions();
}

function updateVerseEndOptions() {
    const bookCode = elements.bookSelect.value;
    const chapter = Number(elements.chapterSelect.value);
    const startVerse = Number(elements.verseStartSelect.value);
    const verses = getSortedNumericKeys((normalizedBibleData[bookCode] || {})[chapter] || {})
        .filter((verse) => verse >= startVerse);

    fillSelectOptions(elements.verseEndSelect, verses);
}

function sanitizeVerseText(text) {
    if (!text) return "";
    return text.replace(/^<[^>]+>\s*/, "").trim();
}

function getSelectedPassageText() {
    const bookCode = elements.bookSelect.value;
    const chapter = Number(elements.chapterSelect.value);
    const startVerse = Number(elements.verseStartSelect.value);
    const endVerse = Number(elements.verseEndSelect.value);
    const chapterData = (normalizedBibleData[bookCode] || {})[chapter] || {};
    const verses = [];

    for (let verse = startVerse; verse <= endVerse; verse += 1) {
        const verseText = sanitizeVerseText(chapterData[verse]);
        if (verseText) verses.push(`${verse}. ${verseText}`);
    }

    return verses.join("\n");
}

function getSelectedPassageRef() {
    const bookCode = elements.bookSelect.value;
    const book = CANONICAL_BOOKS.find((item) => item.code === bookCode);
    const bookName = book ? book.name : bookCode;
    const chapter = Number(elements.chapterSelect.value);
    const startVerse = Number(elements.verseStartSelect.value);
    const endVerse = Number(elements.verseEndSelect.value);
    const range = endVerse && endVerse !== startVerse
        ? `${startVerse}-${endVerse}`
        : `${startVerse}`;

    return `${bookName} ${chapter}:${range}`;
}

function appendSelectedPassage() {
    if (!bibleReady) {
        setBibleStatus("성경 데이터가 아직 준비되지 않았습니다.");
        return;
    }

    const passageText = getSelectedPassageText();

    if (!passageText) {
        setBibleStatus("선택한 본문을 찾지 못했습니다.");
        return;
    }

    const ref = getSelectedPassageRef();
    const block = `[${ref}]\n${passageText}`;
    const existing = elements.bibleInput.value.trim();
    elements.bibleInput.value = existing ? `${existing}\n\n${block}` : block;
    elements.bibleInput.scrollTop = elements.bibleInput.scrollHeight;
    setBibleStatus(`${ref} 본문을 추가했습니다.`);
}

function clearBibleInput() {
    elements.bibleInput.value = "";
    setBibleStatus("입력창을 비웠습니다.");
}

function setLessonNotice(message, type = "") {
    if (!elements.lessonNotice) return;

    elements.lessonNotice.innerText = message;
    elements.lessonNotice.className = "field-notice";

    if (!message) return;

    elements.lessonNotice.classList.add("is-visible");

    if (type) {
        elements.lessonNotice.classList.add(`field-notice-${type}`);
    }
}

function safeDecodeURIComponent(value) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function extractParamFileU(value) {
    const candidates = [value.trim()];
    const decodedValue = safeDecodeURIComponent(value.trim());

    if (decodedValue !== candidates[0]) {
        candidates.push(decodedValue);
    }

    for (const candidate of candidates) {
        const normalizedCandidate = candidate.replace(/&amp;/gi, "&");

        try {
            const url = new URL(normalizedCandidate);
            const paramFileU = url.searchParams.get("paramFileU");

            if (paramFileU) {
                return paramFileU.trim();
            }
        } catch {
            // URL 객체로 파싱되지 않으면 아래 정규식으로 다시 확인합니다.
        }

        const match = normalizedCandidate.match(/[?&]paramFileU=([^&#\s]+)/i);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    return "";
}

function normalizeLessonUrl(rawValue) {
    const trimmedValue = rawValue.trim();

    if (!trimmedValue) {
        return {
            value: "",
            valid: true,
            changed: false,
            message: "",
            type: ""
        };
    }

    const paramFileU = extractParamFileU(trimmedValue);

    if (!paramFileU) {
        return {
            value: trimmedValue,
            valid: false,
            changed: false,
            message: "패밀리모임지 링크에서 paramFileU 값을 찾지 못했습니다. 링크를 다시 확인해 주세요.",
            type: "warning"
        };
    }

    const normalizedValue = `${CANONICAL_LESSON_URL}?paramFileU=${encodeURIComponent(paramFileU)}`;
    const changed = trimmedValue !== normalizedValue;

    return {
        value: normalizedValue,
        valid: true,
        changed,
        message: changed ? "패밀리모임지 링크를 정상 주소로 자동 변환했습니다." : "",
        type: changed ? "success" : ""
    };
}

function syncLessonInput() {
    const normalized = normalizeLessonUrl(elements.lessonInput.value);

    if (elements.lessonInput.value !== normalized.value) {
        elements.lessonInput.value = normalized.value;
    }

    setLessonNotice(normalized.message, normalized.type);
    return normalized;
}

function getFormData() {
    const rawMp3 = elements.mp3Input.value.trim();
    const mp3 = rawMp3 && !rawMp3.toLowerCase().endsWith(".mp3")
        ? `${rawMp3}.mp3`
        : rawMp3;
    const normalizedLesson = syncLessonInput();

    return {
        mp3,
        lesson: normalizedLesson.value,
        bibleText: elements.bibleInput.value.trim()
    };
}

function parsePassages(text) {
    const lines = text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);

    const passages = [];
    let current = { ref: "", verses: [] };

    const pushCurrent = () => {
        if (current.ref || current.verses.length > 0) {
            passages.push(current);
        }
    };

    lines.forEach((line) => {
        const headerMatch = line.match(/^\[(.+)\]$/);
        if (headerMatch) {
            pushCurrent();
            current = { ref: headerMatch[1].trim(), verses: [] };
            return;
        }

        const verseMatch = line.match(/^(\d+)[\.\)]?\s*(.*)$/);
        if (verseMatch && verseMatch[2]) {
            current.verses.push({ number: verseMatch[1], verse: verseMatch[2] });
        } else {
            current.verses.push({
                number: String(current.verses.length + 1),
                verse: line
            });
        }
    });

    pushCurrent();
    return passages;
}

function buildActionButtons(mp3, lesson) {
    const buttons = [];

    if (mp3) {
        const fileUrl = `http://vod.shinseung.or.kr/vod/new/${CURRENT_YEAR}/${mp3}`;
        const mp3Url = `http://vod.shinseung.or.kr/download.jsp?file=${fileUrl}`;

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
    return verses.map((item, index) => {
        const isLast = index === verses.length - 1;
        const wrapperStyle = isLast
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
    const verseHtml = buildVerseHtml(passage.verses);
    const marginBottom = index === total - 1 ? "0" : "14px";
    const refHeading = passage.ref
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

function buildResultHtml({ mp3, lesson, bibleText }) {
    const passages = parsePassages(bibleText);
    const actionButtons = buildActionButtons(mp3, lesson);
    const passageHtml = passages
        .map((passage, index) => buildPassageHtml(passage, index, passages.length))
        .join("");

    return `<div style="padding:16px;background:linear-gradient(180deg,#f5f6f8 0%,#eef1f5 100%);border-radius:18px;">
${actionButtons}
<div style="font-size:18px;font-weight:bold;margin-bottom:12px;color:#1f2937;">성경 본문</div>
${passageHtml}
</div>`;
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
    elements.preview.innerHTML = buildPreviewNotice() + html;
}

function generate() {
    const formData = getFormData();
    const html = buildResultHtml(formData);
    elements.output.value = html;
    renderPreview(html);
}

function showCopyMessage(message) {
    elements.copyMsg.innerText = message;
    setTimeout(() => {
        elements.copyMsg.innerText = "";
    }, 2000);
}

function copyHtml() {
    const text = elements.output.value.trim();

    if (!text) {
        alert("먼저 HTML을 생성해 주세요.");
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        showCopyMessage("복사가 완료되었습니다.");
    });
}

function bindEvents() {
    elements.bookSelect.addEventListener("change", updateChapterOptions);
    elements.chapterSelect.addEventListener("change", updateVerseOptions);
    elements.verseStartSelect.addEventListener("change", updateVerseEndOptions);
    elements.lessonInput.addEventListener("blur", syncLessonInput);
    elements.lessonInput.addEventListener("paste", () => {
        window.setTimeout(syncLessonInput, 0);
    });
    elements.lessonInput.addEventListener("input", () => {
        if (!elements.lessonInput.value.trim()) {
            setLessonNotice("");
        }
    });
    elements.addPassageBtn.addEventListener("click", appendSelectedPassage);
    elements.clearPassageBtn.addEventListener("click", clearBibleInput);
    elements.generateBtn.addEventListener("click", generate);
    elements.copyBtn.addEventListener("click", copyHtml);
}

setupTooltip();
bindEvents();
initializeBiblePicker();
