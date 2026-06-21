(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $("thumbCanvas");
  var ctx = canvas.getContext("2d");
  var statusTimer = null;

  var COLOR_INK = "#392a15";
  var COLOR_SEP = "#978d84";
  var REF_BAR = { w: 12, h: 46, y: 17, color: "#7f6848" };
  var REF_TEXT = { x: 34, y: 10, font: "SUIT", weight: 600, size: 48, spacing: 0, color: COLOR_INK };
  var META = { font: "SUIT", weight: 700, size: 62, spacing: -1.24, yLineOffset: 0 };

  var services = {
    sunday: {
      service: "주일대예배",
      bg: "assets/thumbnail/bg-sunday-main.jpg",
      serviceColor: "#efc095",
      oneLimit: 10,
      variants: {
        one: {
          meta: { dateX: 81, y: 34, sepGap: 36, serviceGap: 57 },
          title: { x: 249, y: 329, w: 766, align: "left", font: "Paperlogy", weight: 700, size: 100, lineHeight: 118, spacing: 2, color: COLOR_INK },
          ref: { x: 249, y: 477 }
        },
        two: {
          meta: { dateX: 67, y: 34, sepGap: 36, serviceGap: 57 },
          title: { x: 254, y: 295, w: 812, align: "left", font: "Paperlogy", weight: 700, size: 88, lineHeight: 109, spacing: 1.76, color: COLOR_INK },
          ref: { x: 254, y: 534 }
        }
      }
    },
    evening: {
      service: "주일저녁예배",
      bg: "assets/thumbnail/bg-wine-main.jpg",
      serviceColor: "#e0c1c5",
      oneLimit: 10,
      variants: {
        one: {
          meta: { dateX: 209, y: 33, sepGap: 28, serviceGap: 49 },
          title: { x: 137, y: 304, w: 1006, align: "center", font: "Paperlogy", weight: 700, size: 100, lineHeight: 118, spacing: 2, color: "#482215" },
          ref: { x: 407, y: 442 }
        },
        two: {
          meta: { dateX: 215.5, y: 33, sepGap: 28, serviceGap: 49 },
          title: { x: 78, y: 255, w: 1124, align: "center", font: "Paperlogy", weight: 700, size: 100, lineHeight: 118, spacing: 2, color: "#482215" },
          ref: { x: 414.5, y: 521 }
        }
      }
    },
    samil: {
      service: "삼일예배",
      bg: "assets/thumbnail/bg-gold-main.jpg",
      serviceColor: "#efd99f",
      oneLimit: 10,
      variants: {
        one: {
          meta: { dateX: 257.5, y: 31, sepGap: 28, serviceGap: 49 },
          title: { x: 314, y: 310, w: 652, align: "center", font: "Paperlogy", weight: 700, size: 100, lineHeight: 118, spacing: 2, color: "#6f4c1b" },
          ref: { x: 406, y: 448 }
        },
        two: {
          meta: { dateX: 257, y: 31, sepGap: 28, serviceGap: 49 },
          title: { x: 234, y: 254, w: 812, align: "center", font: "Paperlogy", weight: 700, size: 88, lineHeight: 109, spacing: 1.76, color: "#6f4c1b" },
          ref: { x: 390.5, y: 502 }
        }
      }
    }
  };

  var images = {};

  function setStatus(message, kind) {
    var el = $("status");
    el.textContent = message || "";
    el.className = "status" + (kind ? " " + kind : "");
    clearTimeout(statusTimer);
    if (message) {
      statusTimer = setTimeout(function () {
        el.textContent = "";
        el.className = "status";
      }, 2600);
    }
  }

  function font(style) {
    return style.weight + " " + style.size + "px '" + style.font + "', 'Malgun Gothic', sans-serif";
  }

  function textParts(text) {
    return Array.from(String(text || ""));
  }

  function measureText(text, style) {
    var parts = textParts(text);
    ctx.font = font(style);
    return parts.reduce(function (sum, part) {
      return sum + ctx.measureText(part).width;
    }, 0) + Math.max(0, parts.length - 1) * (style.spacing || 0);
  }

  function drawText(text, x, y, style, align) {
    var parts = textParts(text);
    var width = measureText(text, style);
    var cursor = x;
    if (align === "center") cursor -= width / 2;
    if (align === "right") cursor -= width;

    ctx.font = font(style);
    ctx.fillStyle = style.color;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    parts.forEach(function (part) {
      ctx.fillText(part, cursor, y);
      cursor += ctx.measureText(part).width + (style.spacing || 0);
    });
    return width;
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatDate(value) {
    var parts = String(value || "").split("-");
    if (parts.length !== 3) return value || "";
    return parts[0] + "년 " + pad(parts[1]) + "월 " + pad(parts[2]) + "일";
  }

  function normalizedTitle() {
    return $("titleInput").value.replace(/\r/g, "").trim();
  }

  function splitNearMiddle(text) {
    var clean = text.replace(/\s+/g, " ").trim();
    if (!clean) return [""];

    var mid = Math.round(clean.length / 2);
    var spaces = [];
    for (var i = 0; i < clean.length; i++) {
      if (clean[i] === " ") spaces.push(i);
    }
    if (spaces.length) {
      spaces.sort(function (a, b) { return Math.abs(a - mid) - Math.abs(b - mid); });
      var cut = spaces[0];
      return [clean.slice(0, cut).trim(), clean.slice(cut + 1).trim()].filter(Boolean);
    }

    return [clean.slice(0, mid).trim(), clean.slice(mid).trim()].filter(Boolean);
  }

  function getTitleLines(service) {
    var raw = normalizedTitle();
    if (!raw) return { variant: "one", lines: [""] };

    var explicit = raw.split(/\n+/).map(function (line) { return line.trim(); }).filter(Boolean);
    if (explicit.length >= 2) return { variant: "two", lines: explicit.slice(0, 2) };

    var single = explicit.join(" ");
    var nonSpaceLength = single.replace(/\s+/g, "").length;
    if (nonSpaceLength > service.oneLimit) {
      return { variant: "two", lines: splitNearMiddle(single).slice(0, 2) };
    }
    return { variant: "one", lines: [single] };
  }

  function drawMeta(service, variant) {
    var dateText = formatDate($("dateInput").value);
    var serviceText = $("serviceName").value.trim() || service.service;
    var metaText = {
      font: META.font,
      weight: META.weight,
      size: META.size,
      spacing: META.spacing,
      color: "#ffffff"
    };
    var serviceStyle = {
      font: META.font,
      weight: META.weight,
      size: META.size,
      spacing: META.spacing,
      color: service.serviceColor
    };
    var sepStyle = {
      font: META.font,
      weight: META.weight,
      size: META.size,
      spacing: META.spacing,
      color: COLOR_SEP
    };

    var dateWidth = drawText(dateText, variant.meta.dateX, variant.meta.y, metaText, "left");
    var sepX = variant.meta.dateX + dateWidth + variant.meta.sepGap;
    drawText("|", sepX, variant.meta.y, sepStyle, "left");
    drawText(serviceText, sepX + variant.meta.serviceGap, variant.meta.y, serviceStyle, "left");
  }

  function drawTitle(lines, title) {
    var alignX = title.align === "center" ? title.x + title.w / 2 : title.x;
    lines.forEach(function (line, index) {
      drawText(line, alignX, title.y + index * title.lineHeight, title, title.align);
    });
  }

  function drawReference(text, ref) {
    if (!text) return;
    ctx.fillStyle = REF_BAR.color;
    ctx.fillRect(ref.x, ref.y + REF_BAR.y, REF_BAR.w, REF_BAR.h);
    drawText(text, ref.x + REF_TEXT.x, ref.y + REF_TEXT.y, REF_TEXT, "left");
  }

  function render() {
    var service = services[$("servicePreset").value] || services.sunday;
    var image = images[$("servicePreset").value];
    if (!image) return;

    var title = getTitleLines(service);
    var variant = service.variants[title.variant];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    drawMeta(service, variant);
    drawTitle(title.lines, variant.title);
    drawReference($("referenceInput").value.trim(), variant.ref);
  }

  function loadImages() {
    return Promise.all(Object.keys(services).map(function (key) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () {
          images[key] = img;
          resolve();
        };
        img.onerror = reject;
        img.src = services[key].bg;
      });
    }));
  }

  function updateFileName() {
    var service = $("serviceName").value.trim() || "예배";
    var date = $("dateInput").value.replace(/-/g, "");
    $("fileNameInput").value = "신승교회_" + date + "_" + service + "_썸네일.png";
  }

  function downloadPng() {
    render();
    var link = document.createElement("a");
    link.download = $("fileNameInput").value.trim() || "shinseung-thumbnail.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    setStatus("PNG 파일을 만들었습니다.", "ok");
  }

  function copyPng() {
    render();
    if (!navigator.clipboard || !window.ClipboardItem) {
      setStatus("이 브라우저에서는 이미지 복사를 지원하지 않습니다.", "warn");
      return;
    }
    canvas.toBlob(function (blob) {
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(function () {
        setStatus("이미지를 클립보드에 복사했습니다.", "ok");
      }, function () {
        setStatus("클립보드 복사 권한을 확인해 주세요.", "warn");
      });
    }, "image/png");
  }

  function bind() {
    ["serviceName", "dateInput", "referenceInput", "titleInput"].forEach(function (id) {
      $(id).addEventListener("input", function () {
        if (id === "serviceName" || id === "dateInput") updateFileName();
        render();
      });
    });

    $("servicePreset").addEventListener("change", function () {
      var service = services[$("servicePreset").value] || services.sunday;
      $("serviceName").value = service.service;
      updateFileName();
      render();
    });

    $("downloadBtn").addEventListener("click", downloadPng);
    $("copyBtn").addEventListener("click", copyPng);
  }

  bind();
  updateFileName();
  var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(loadImages).then(render, function () {
    setStatus("배경 이미지를 불러오지 못했습니다.", "warn");
  });
})();
