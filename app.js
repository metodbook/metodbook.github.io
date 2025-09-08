const GRADE_ORDER = [
  "Anaokulu 3 Yaş", "Anaokulu 4 Yaş", "Anaokulu 5 Yaş",
  "İlköğretim 1","İlköğretim 2","İlköğretim 3","İlköğretim 4","İlköğretim 5","İlköğretim 6","İlköğretim 7","İlköğretim 8",
  "Lise Hazırlık", "Lise 1","Lise 2","Lise 3","Lise 4"
];

const $ = id => document.getElementById(id); //fonksiyon

const sortSelect = $("sortSelect");
const actionArea = $("actionArea");
const orderBtn = $("orderBtn");
const titleSearch = $("titleSearch");
const subjectFilter = $("subjectFilter");
const gradeFilter = $("gradeFilter");
const startDate = $("startDate");
const endDate = $("endDate");
const listArea = $("listArea");
const countSpan = $("count");
const drawer = $("drawer");
const drawerContent = $("drawerContent");
const closeDrawer = $("closeDrawer") || document.querySelector(".close-btn");
const centerWrap = $("centerWrap");
const downloadProgress = $('downloadProgress');

let flipbooks = []; // yüklenecek veri
let ascendingOrder = false;

function showControlFor(mode){
    orderBtn.style.display = "none";
    titleSearch.classList.add("hidden");
    subjectFilter.classList.add("hidden");
    gradeFilter.classList.add("hidden");
    startDate.classList.add("hidden");
    endDate.classList.add("hidden");


    switch(mode) {
        case "title":
            orderBtn.style.display = "inline-block";
            titleSearch.classList.remove("hidden");
            break;
        case "subject":
            orderBtn.style.display = "inline-block";
            subjectFilter.classList.remove("hidden");
            break;
        case "grade":
            orderBtn.style.display = "inline-block";
            gradeFilter.classList.remove("hidden");
            break;
        case "date":
            orderBtn.style.display = "inline-block";
            startDate.classList.remove("hidden");
            endDate.classList.remove("hidden");
            break;
        default:
            break;
    }
}

sortSelect.addEventListener("change", () => {
    const v = sortSelect.value;
    showControlFor(v);
    applyAndRender();
});

orderBtn.addEventListener("click", () => {
    ascendingOrder = !ascendingOrder;
    orderBtn.textContent = ascendingOrder ? "^" : "v";
    applyAndRender();
});

titleSearch.addEventListener("input", () => applyAndRender());
subjectFilter.addEventListener("change", () => applyAndRender());
gradeFilter.addEventListener("change", () => applyAndRender());
startDate.addEventListener("change", () => applyAndRender());
endDate.addEventListener("change", () => applyAndRender());

function closeDrawerFunc() {
    if (!downloadProgress.innerHTML) {
        actionArea.classList.add("hidden");
    }
    drawer.classList.add("hidden");
    drawer.setAttribute("aria-hidden", "true"); // Erişilebilirlik için
    centerWrap.classList.remove("split");
}

if (closeDrawer) closeDrawer.addEventListener("click", () => closeDrawerFunc());

function toTime(t) {
    if (!t) return null;
    const d = new Date(t);
    return isNaN(d) ? null : d.getTime();
}

function applyAndRender() {
    let data = flipbooks.slice();
    const mode = sortSelect.value;

    if (mode == "title" && titleSearch.value.trim()) {
        const searchFor = titleSearch.value.trim().toLowerCase();
        data = data.filter(x => (x.title || "").toLowerCase().includes(searchFor));
    } else if (mode == "subject" && subjectFilter.value && subjectFilter.value != "__all") {
        data = data.filter(x => x.subject_name == subjectFilter.value);
    } else if (mode == "grade" && gradeFilter.value && gradeFilter.value !== "__all") {
        data = data.filter(x => x.grade_name == gradeFilter.value);
    } else if (mode == "date") {
        const start = toTime(startDate.value + "T00:00:00") || -8640000000000000;
        const end = toTime(endDate.value + "T23:59:59") || 8640000000000000;
        data = data.filter(x => {
            const t = toTime(x.created_at);
            return t && t >= start && t <= end;
        });
    }

    switch (mode) {
        case "title":
            data.sort((a, b) => {
                const at = (a.title || "").toLowerCase();
                const bt = (b.title || "").toLowerCase();
                return ascendingOrder ? bt.localeCompare(at, "tr") : at.localeCompare(bt, "tr");
            });
            break;
        case "subject":
            data.sort((a, b) => {
                const at = (a.subject_name || "").toLowerCase();
                const bt = (b.subject_name || "").toLowerCase();
                return ascendingOrder ? bt.localeCompare(at, "tr") : at.localeCompare(bt, "tr");
            });
            break;
        case "grade":
            data.sort((a, b) => {
                let ia = GRADE_ORDER.indexOf(a.grade_name);
                let ib = GRADE_ORDER.indexOf(b.grade_name);
                ia = ia === -1 ? 999 : ia;
                ib = ib === -1 ? 999 : ib;
                return ascendingOrder ? ia - ib : ib - ia;
            });
            break;
        case "date":
            data.sort((a, b) => {
                const ta = toTime(a.created_at);
                const tb = toTime(b.created_at);
                return ascendingOrder ? ta - tb : tb - ta;
            });
            break;
        default:
            break;
    }

    renderList(data);
}

function renderList(list) {
    listArea.innerHTML = "";
    countSpan.textContent = list.length;
    
    if (list.length === 0) {
        listArea.innerHTML = "Flipbooklar yüklenemedi. İnternet bağlantınızı kontrol edin.";
        return;
    }
    list.forEach(item => {
        const div = document.createElement("div");
        div.className = "row";
        div.tabIndex = 0; // Klavye erişilebilirliği için
       
        const c1 = document.createElement("div"); // cell 1 (title + description)
        c1.className = "cell firstCell";

        if ((item.description || "").trim() != "" && (item.description.trim() != item.title.trim())) {
            const t = document.createElement("div");
            t.className = "titleTop";
            t.textContent = item.title || "";
            const d = document.createElement("div");
            d.className = "titleBottom";
            d.textContent = item.description || "";
            c1.appendChild(t);
            c1.appendChild(d);
        } else {
            c1.style.display = "block";
            c1.style.padding = "0";
            c1.textContent = item.title || "";
        }

        const c2 = document.createElement("div"); // cell 2 (date)
        c2.className = "cell";
        c2.textContent = item.created_at ? item.created_at.split("T")[0] : "";

        const c3 = document.createElement("div"); // cell 3 (subject)
        c3.className = "cell";
        c3.textContent = item.subject_name || "";

        const c4 = document.createElement("div"); // cell 4 (grade)
        c4.className = "cell";
        c4.textContent = item.grade_name || "";

        div.appendChild(c1);
        div.appendChild(c2);
        div.appendChild(c3);
        div.appendChild(c4);

        div.addEventListener("click", () => {
            openDrawer(item);
        })
        div.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                openDrawer(item);
            }
        }); // Klavye erişilebilirliği için

        listArea.appendChild(div);
    });
}

let displayingPageCount = 0;
async function displayPageCount() {
    //actionArea.classList.add("hidden");

    const currentDisplaying = displayingPageCount + 1;
    displayingPageCount = currentDisplaying;

    const pcRow = document.createElement("div");
    pcRow.className = "detailRow";
    const pcLabel = document.createElement("div");
    pcLabel.className = "label";
    pcLabel.textContent = "Sayfa Sayısı";
    const pcValue = document.createElement("div");
    pcValue.className = "value";
    pcValue.textContent = "...";
    pcRow.appendChild(pcLabel);
    pcRow.appendChild(pcValue);
    drawerContent.appendChild(pcRow);

    const pageCount = await fetchPageCount();
    if (currentDisplaying !== displayingPageCount) return; // Daha yeni istek var, bunu atla

    if (pageCount) {
        actionArea.classList.remove("hidden");
        pcValue.textContent = pageCount || "Hata";
        pcValue.id = "pageCountValue";
    }
}

async function openDrawer(item) {
    drawerContent.innerHTML = "";

    // Create a flex container for thumbnail and title
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "16px"; // space between thumb and title

    if (item.thumb) {
        const img = document.createElement("img");
        img.src = item.thumb;
        img.className = "thumb";
        header.appendChild(img);
    }
    const title = document.createElement("h2");
    title.textContent = item.title || "[Başlıksız]";
    header.appendChild(title);
    title.id = "bookTitle";

    drawerContent.appendChild(header);

    const keys = Object.keys(item);
    keys.forEach(k => {
        // Skip unwanted keys
        if (k === "title" || k === "thumb") return;
        if (k === "description" && (item.description || "").trim() === (item.title || "").trim()) return;
        if (k === "cookie") return;

        // Create row elements
        const row = document.createElement("div");
        row.className = "detailRow";

        const label = document.createElement("div");
        label.className = "label";
        label.textContent = k;

        const value = document.createElement("div");
        value.className = "value";

        // Format value
        let v;
        if (item[k] === null) {
            v = "null";
        } else if (typeof item[k] === "object") {
            v = JSON.stringify(item[k], null, 2);
        } else {
            v = String(item[k]);
        }

        if (k === "url") {
            const a = document.createElement("a");
            a.href = item[k];
            a.target = "_blank";
            a.textContent = "Flipbook'ı aç";
            a.id = "openFlipbookLink";
            value.appendChild(a);
        } else {
            const pre = document.createElement("pre");
            pre.style.margin = 0;
            pre.style.whiteSpace = "pre-wrap";
            pre.textContent = v;
            value.appendChild(pre);
        }

        row.appendChild(label);
        row.appendChild(value);
        drawerContent.appendChild(row);
    });
    await displayPageCount(); // sayfa sayısını asenkron getir

    drawer.classList.remove("hidden");
    drawer.setAttribute("aria-hidden", "false");
    centerWrap.classList.add("split");
    drawer.scrollTop = 0;

}

function populateSelect(selectElement, options, allValue = '__all', allText = 'Hepsi') {
    selectElement.innerHTML = '';
    const optAll = document.createElement('option');
    optAll.value = allValue;
    optAll.textContent = allText;
    selectElement.appendChild(optAll);

    options.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        selectElement.appendChild(option);
    });
}

function getBookDataUrl() {
    if (!$("openFlipbookLink")) {
        alert("Lütfen bir flipbook açın");
        return null;
    }
    const rawUrl = $("openFlipbookLink").href.trim();
    try {
        const url = new URL(rawUrl);
        if (url.pathname.endsWith("index.html")) {
            const base = rawUrl.split("index.html")[0];
            return base + "javascript/config.js";
        }

        const parts = url.pathname.split("/").filter(Boolean);
        parts.pop();
        const prefix = rawUrl.split(url.pathname)[0] + "/" + parts.join("/");
        return prefix.replace(/\/+$\/$/, "") + "/javascript/config.js";
        
    } catch (err) {
        return rawUrl + "/javascript/config.js";
    }
}

async function fetchPageCount() {
  const url = getBookDataUrl();
  if (!url) return null;

  console.log("Fetching book config from:", url);
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error("HTTP error " + response.status);
  const scriptText = await response.text();

  // Önce güvenli çıkartma dene:
  const config = parseConfigFromScript(scriptText, ["bookConfig", "htmlConfig", "HtmlConfig"]);
  if (config) {
    const pages = extractPageCount(config);
    console.log("Sayfa sayısı:", pages);
    return pages;
  }

  // Eğer güvenli parse başarısız olduysa (ör. anahtarlar unquoted vs.)
  // ve kaynağa EMİN isen son çare olarak script'i çalıştır:
  try {
    const fn = new Function(scriptText + '; return (typeof bookConfig !== "undefined") ? bookConfig : (typeof htmlConfig !== "undefined" ? htmlConfig : null);');
    const cfg = fn();
    const pages = extractPageCount(cfg);
    console.log("Sayfa sayısı:", pages);
    return pages;
  } catch (err) {
    console.error("Failed to eval script for config:", err);
    throw err;
  }
}

/* --- Yardımcı fonksiyonlar --- */

function extractPageCount(obj) {
  if (!obj) return null;
  if (typeof obj.totalPageCount !== "undefined") return obj.totalPageCount;
  if (typeof obj.pageCount !== "undefined") return obj.pageCount;
  if (obj.meta && typeof obj.meta.pageCount !== "undefined") return obj.meta.pageCount;
  // bazen htmlConfig içinde bookConfig string olarak tutuluyor -> ama meta.pageCount varsa onu kullan
  if (obj.bookConfig && typeof obj.bookConfig === "object" && typeof obj.bookConfig.totalPageCount !== "undefined") {
    return obj.bookConfig.totalPageCount;
  }
  return null;
}

// scriptText içinde var <name> = { ... } şeklindeki nesneleri bulup JSON.parse ile döndürmeye çalışır.
// Sürekli kabullenmek yerine doğru brace eşlemesini (string kaçışlarını dikkate alarak) yapar.
function parseConfigFromScript(scriptText, candidateNames = []) {
  for (const name of candidateNames) {
    const maybe = extractObjectLiteral(scriptText, name);
    if (maybe) return maybe;
  }
  return null;
}

function extractObjectLiteral(script, varName) {
  // arama için birkaç basit desen: "var varName =", "varName =", "window.varName ="
  const patterns = [
    new RegExp('\\bvar\\s+' + escapeRegExp(varName) + '\\s*='),
    new RegExp('\\b' + escapeRegExp(varName) + '\\s*='),
    new RegExp('\\bwindow\\.' + escapeRegExp(varName) + '\\s*=')
  ];
  for (const pat of patterns) {
    const m = pat.exec(script);
    if (!m) continue;
    // ilk '{' karakterini bul
    const startIdx = script.indexOf('{', m.index);
    if (startIdx === -1) continue;
    // Basit state machine: string içinde olmayı ve escape karakterleri göz önünde tut
    let i = startIdx;
    let depth = 0;
    let inString = null;
    let escape = false;
    for (; i < script.length; i++) {
      const ch = script[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (inString) {
        if (ch === inString) inString = null;
        continue;
      } else {
        if (ch === '"' || ch === "'") { inString = ch; continue; }
        if (ch === '{') { depth++; continue; }
        if (ch === '}') {
          depth--;
          if (depth === 0) {
            const objText = script.slice(startIdx, i + 1);
            try {
              // objText büyük olasılıkla JSON uyumlu (örneklerde öyle). Deniyoruz.
              return JSON.parse(objText);
            } catch (e) {
              // JSON.parse başarısız olursa devam et (ör. unquoted keys). Geri dönme.
              return null;
            }
          }
        }
      }
    }
  }
  return null;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function fetchData() {
    try {
        //throw new Error("atlanıyor"); // TEST: archive.org'u atla
        const metaResp = await fetch('https://archive.org/metadata/MetodboxFlipbookData', { mode: 'cors' });
        if(!metaResp.ok) throw new Error('Archive metadata alınamadı');
        const meta = await metaResp.json();

        console.log("meta:", meta);

        // metadata içinden identifier (güvenli isim) ve .json dosyalarını al
        const identifier = (meta.metadata && meta.metadata.identifier) ? meta.metadata.identifier : 'MetodboxFlipbookData';
        const files = Array.isArray(meta.files) ? meta.files : [];

        // .json dosyalarını seç; mtime'a göre en yenisini al (yoksa ilkini al)
        const jsonFiles = files.filter(f => f.name && f.name.toLowerCase().endsWith('.json'));
        if(jsonFiles.length === 0) throw new Error('Archive içinde .json dosyası bulunamadı');

        const jsonFile = jsonFiles.sort((a,b)=> (b.mtime||0) - (a.mtime||0))[0];
        let remoteUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(jsonFile.name)}`;

        // cache-bust (isteğe bağlı ama genelde faydalı)
        remoteUrl += '?_=' + Date.now();

        // asıl fetch
        const resp = await fetch(remoteUrl, { mode: 'cors' });
        if(!resp.ok) throw new Error('Archive json indirilemedi: ' + resp.status);
        flipbooks = await resp.json();

        console.log('flipbooks: archive.org üzerinden yüklendi ->', jsonFile.name);
    } catch (err) {
        console.warn('Archive.org yüklemesi başarısız:', err);

        // 2) Local fallback: flipbooks2.json (aynı klasörde)
        try {
            const respLocal = await fetch('flipbooks2.json');
        if(!respLocal.ok) throw new Error('local fetch başarısız');
            flipbooks = await respLocal.json();
            console.log('flipbooks: local flipbooks2.json ile yüklendi');
        } catch(e2) {
            console.warn('Local dosya da yüklenemedi, SAMPLE kullanılacak:', e2);
            flipbooks = [];
        }
    }

    // In your fetchData function:
    const subjects = Array.from(new Set(
        flipbooks.map(x => x.subject_name).filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, 'tr'));

    populateSelect(subjectFilter, subjects);

    // Similarly for grades:
    const grades = Array.from(new Set(
        flipbooks.map(x => x.grade_name).filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, 'tr'));

    populateSelect(gradeFilter, grades);

    applyAndRender();
}

(function(){
    listArea.innerHTML = "Flipbook'lar yükleniyor...";
    orderBtn.textContent = ascendingOrder ? "^" : "v";
    showControlFor(sortSelect.value);
    fetchData();
})();