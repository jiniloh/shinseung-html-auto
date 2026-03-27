const CURRENT_YEAR = "2026";

const BOOKS = [
    { name: "창세기", code: "창" },
    { name: "출애굽기", code: "출" },
    { name: "레위기", code: "레" },
    { name: "민수기", code: "민" },
    { name: "신명기", code: "신" },
    { name: "여호수아", code: "수" },
    { name: "사사기", code: "삿" },
    { name: "룻기", code: "룻" },
    { name: "사무엘상", code: "삼상" },
    { name: "사무엘하", code: "삼하" },
    { name: "열왕기상", code: "왕상" },
    { name: "열왕기하", code: "왕하" },
    { name: "역대상", code: "대상" },
    { name: "역대하", code: "대하" },
    { name: "에스라", code: "스" },
    { name: "느헤미야", code: "느" },
    { name: "에스더", code: "에" },
    { name: "욥기", code: "욥" },
    { name: "시편", code: "시" },
    { name: "잠언", code: "잠" },
    { name: "전도서", code: "전" },
    { name: "아가", code: "아" },
    { name: "이사야", code: "사" },
    { name: "예레미야", code: "렘" },
    { name: "예레미야애가", code: "애" },
    { name: "에스겔", code: "겔" },
    { name: "다니엘", code: "단" },
    { name: "호세아", code: "호" },
    { name: "요엘", code: "욜" },
    { name: "아모스", code: "암" },
    { name: "오바댜", code: "옵" },
    { name: "요나", code: "욘" },
    { name: "미가", code: "미" },
    { name: "나훔", code: "나" },
    { name: "하박국", code: "합" },
    { name: "스바냐", code: "습" },
    { name: "학개", code: "학" },
    { name: "스가랴", code: "슥" },
    { name: "말라기", code: "말" },
    { name: "마태복음", code: "마" },
    { name: "마가복음", code: "막" },
    { name: "누가복음", code: "눅" },
    { name: "요한복음", code: "요" },
    { name: "사도행전", code: "행" },
    { name: "로마서", code: "롬" },
    { name: "고린도전서", code: "고전" },
    { name: "고린도후서", code: "고후" },
    { name: "갈라디아서", code: "갈" },
    { name: "에베소서", code: "엡" },
    { name: "빌립보서", code: "빌" },
    { name: "골로새서", code: "골" },
    { name: "데살로니가전서", code: "살전" },
    { name: "데살로니가후서", code: "살후" },
    { name: "디모데전서", code: "딤전" },
    { name: "디모데후서", code: "딤후" },
    { name: "디도서", code: "딛" },
    { name: "빌레몬서", code: "몬" },
    { name: "히브리서", code: "히" },
    { name: "야고보서", code: "약" },
    { name: "베드로전서", code: "벧전" },
    { name: "베드로후서", code: "벧후" },
    { name: "요한일서", code: "요일" },
    { name: "요한이서", code: "요이" },
    { name: "요한삼서", code: "요삼" },
    { name: "유다서", code: "유" },
    { name: "요한계시록", code: "계" }
];

const elements = {
    mp3Input: document.getElementById("mp3"),
    lessonInput: document.getElementById("lesson"),
    bibleInput: document.getElementById("bible"),
    output: document.getElementById("output"),
    preview: document.getElementById("preview"),
    copyMsg: document.getElementById("copyMsg"),
    generateBtn: document.getElementById("generateBtn"),
    copyBtn: document.getElementById("copyBtn"),
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
let bibleDatabase = window.BIBLE_DATA || {};
let bibleReady = false;

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
    const availableBooks = BOOKS.filter((book) => bibleDatabase[book.code]);

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
    const chapters = getSortedNumericKeys(bibleDatabase[bookCode] || {});

    fillSelectOptions(elements.chapterSelect, chapters);
    updateVerseOptions();
    loadSelectedPassage();
}

function updateVerseOptions() {
    const bookCode = elements.bookSelect.value;
    const chapter = Number(elements.chapterSelect.value);
    const verses = getSortedNumericKeys((bibleDatabase[bookCode] || {})[chapter] || {});

    fillSelectOptions(elements.verseStartSelect, verses);
    updateVerseEndOptions();
    loadSelectedPassage();
}

function updateVerseEndOptions() {
    const bookCode = elements.bookSelect.value;
    const chapter = Number(elements.chapterSelect.value);
    const startVerse = Number(elements.verseStartSelect.value);
    const verses = getSortedNumericKeys((bibleDatabase[bookCode] || {})[chapter] || {})
        .filter((verse) => verse >= startVerse);

    fillSelectOptions(elements.verseEndSelect, verses);
    loadSelectedPassage();
}

function getSelectedPassageText() {
    const bookCode = elements.bookSelect.value;
    const chapter = Number(elements.chapterSelect.value);
    const startVerse = Number(elements.verseStartSelect.value);
    const endVerse = Number(elements.verseEndSelect.value);
    const chapterData = (bibleDatabase[bookCode] || {})[chapter] || {};
    const verses = [];

    for (let verse = startVerse; verse <= endVerse; verse += 1) {
        const verseText = sanitizeVerseText(chapterData[verse]);

        if (verseText) {
            verses.push(`${verse}. ${verseText}`);
        }
    }

    return verses.join("\n");
}

function sanitizeVerseText(text) {
    if (!text) {
        return "";
    }

    return text.replace(/^<[^>]+>\s*/, "").trim();
}

function loadSelectedPassage() {
    if (!bibleReady) {
        setBibleStatus("성경 데이터가 아직 준비되지 않았습니다.");
        return;
    }

    const passageText = getSelectedPassageText();

    if (!passageText) {
        setBibleStatus("선택한 본문을 찾지 못했습니다.");
        return;
    }

    elements.bibleInput.value = passageText;
    setBibleStatus("선택한 본문을 입력창에 불러왔습니다.");
}

function getFormData() {
    const rawMp3 = elements.mp3Input.value.trim();
    const mp3 = rawMp3 && !rawMp3.toLowerCase().endsWith(".mp3")
        ? `${rawMp3}.mp3`
        : rawMp3;

    return {
        mp3,
        lesson: elements.lessonInput.value.trim(),
        bibleText: elements.bibleInput.value.trim()
    };
}

function parseVerses(text) {
    return text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
            const match = line.match(/^(\d+)[\.\)]?\s*(.*)$/);

            if (match) {
                return {
                    number: match[1],
                    verse: match[2]
                };
            }

            return {
                number: String(index + 1),
                verse: line
            };
        });
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

    if (buttons.length === 0) {
        return "";
    }

    return `
<div style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;">
${buttons.join("")}
</div>`;
}

function buildVerseHtml(verses) {
    return verses.map((item, index) => {
        const isLast = index === verses.length - 1;
        const wrapperStyle = isLast
            ? "margin-bottom:0;"
            : "margin-bottom:14px;border-bottom:1px solid #eee;padding-bottom:8px;";

        return `
<div style="${wrapperStyle}">
<span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#3f6fb6;color:#fff;border-radius:50%;font-size:13px;margin-right:8px;">
${item.number}
</span>
${item.verse}
</div>`;
    }).join("");
}

function buildResultHtml({ mp3, lesson, bibleText }) {
    const verses = parseVerses(bibleText);
    const actionButtons = buildActionButtons(mp3, lesson);
    const verseHtml = buildVerseHtml(verses);

    return `<div style="padding:12px;background:#f5f6f8;border-radius:16px;">
${actionButtons}
<div style="font-size:18px;font-weight:bold;margin-bottom:10px;">성경 본문</div>
<div style="background:#ffffff;padding:5px 16px;border-radius:10px;box-shadow:0 3px 10px rgba(0,0,0,0.08);font-size:16px;line-height:1.85;">
${verseHtml}
</div>
</div>`;
}

function buildPreviewNotice() {
    if (window.location.protocol !== "https:") {
        return "";
    }

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
    elements.verseEndSelect.addEventListener("change", loadSelectedPassage);
    elements.generateBtn.addEventListener("click", generate);
    elements.copyBtn.addEventListener("click", copyHtml);
}

setupTooltip();
bindEvents();
initializeBiblePicker();
