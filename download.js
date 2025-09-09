import { PDFDocument, rgb, degrees, StandardFonts} from "https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.esm.min.js";

const $ = id => document.getElementById(id); //fonksiyon

const downloadButton = $('downloadButton');
const saveButton = $('saveButton');
const downloadProgress = $('downloadProgress');
const resetButton = $('resetButton');
const cancelButton = $('cancelButton');
const drawer = $("drawer");
const adModal = $("ad-modal");
const skipAd = $("skip-ad");
const waitAd = $("wait-ad");

let stopDownload = false;

function logDownloadStatus(text){
    console.log(text);
    downloadProgress.innerHTML = text;
}

function setStatus(t){
    //$('status').textContent = t;
}

function derivePattern(input) {
    if(input.includes('{page}')) return input;
    try {
        const url = new URL(input);
        if (url.pathname.endsWith("index.html")) {
            const base = input.split("index.html")[0];
            return base + "files/large/{page}.jpg";
        }

        const parts = url.pathname.split("/").filter(Boolean);
        parts.pop();
        const prefix = input.split(url.pathname)[0] + "/" + parts.join("/");
        return prefix.replace(/\/+$\/$/, "") + "/files/large/{page}.jpg";
        
    } catch (err) {
        return input + "/{page}.jpg";
    }
}

async function fetchImageBuffer(url) {
    const response = await fetch(url, {mode: "cors"});
    if (!response.ok) throw new Error("HTTP error " + response.status);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image")) throw new Error("Hata, resim değil: " + contentType);
    return await response.arrayBuffer();
}

async function start() {
    console.log("İndirme kesinlikle başlatılıyor...");
    stopDownload = false;

    if (!$("openFlipbookLink")) {
        alert("Lütfen bir flipbook açın");
        return;
    }
    const rawUrl = $("openFlipbookLink").href.trim();

    const startPage = 1;
    if (!$("pageCountValue")) {
        alert("Lütfen bir flipbook açılana kadar bekleyin");
        return;
    }
    const maxPage = $("pageCountValue").innerHTML.trim();
    if (maxPage === "Hata") {
        alert("Lütfen sayfayı yenileyin ve sayfa sayısının doğru yüklendiğinden emin olun");
        return;
    }
    if (!$("bookTitle")) {
        alert("Lütfen bir flipbook açılana kadar bekleyin");
        return;
    }
    const title = $("bookTitle").innerHTML.trim();

    const pattern = derivePattern(rawUrl);
    logDownloadStatus('Kullanılan şablon: ' + pattern);

    const images = [];
    let page = startPage;
    for(; page <= maxPage; page++) {
        if(stopDownload) {
            setStatus('Durduruldu');
            break;
        }

        const url = pattern.replaceAll('{page}', page);

        try {
            logDownloadStatus(`${title}: Sayfa ${page}/${maxPage} indiriliyor...`);
            const imgBuffer = await fetchImageBuffer(url);
            images.push(imgBuffer);

            await new Promise(r => setTimeout(r, 200)); // küçük gecikme
        } catch (err) {
            logDownloadStatus('İndirilemedi (veya bitti): ' + page + ' — ' + err.message, 'danger');
            break;
        }
    }

    if (images.length === 0) {
        alert(`${title}: Bu kitap şu anda PDF'e dönüştürülemiyor. Başka bir kitap deneyiniz veya "Flipbook'u aç" düğmesine tıklayınız.`);
        logDownloadStatus('Hiçbir sayfa indirilemedi', 'danger');
        return;
    }

    

    try {
        const pdfDocument = await PDFDocument.create();

        let currentIndex = 0;
        for (const imageBuffer of images) {
            currentIndex++;
            logDownloadStatus(`${title}: Sayfalar gömülüyor... (${currentIndex}/${images.length})`);
            let image;
            try {
                image = await pdfDocument.embedJpg(imageBuffer);
            } catch (err) {
                try {
                    image = await pdfDocument.embedPng(imageBuffer);
                } catch (err2) {
                    alert('Bir resim gömülemedi, "incele" menüsünden hataya bakın.');
                    throw new Error('Resim gömme başarısız oldu: ' + err2.message);
                }
            }

            const w = image.width;
            const h = image.height;
            const page = pdfDocument.addPage([w, h]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: w,
                height: h
            });

            try {
                // 🌟 Sadece ilk sayfaya watermark ekle
                if ("currentIndex === 1") {
                    page.drawText("metodbook.github.io", {
                        x: 60,      // soldaki çizgiyle hizalamak için
                        y: 60,          // h - 50 = üstten 50px aşağı
                        size: 36,            // font boyutu
                        color: rgb(1, 0, 0), // kırmızı
                        //rotate: degrees(-45), // çapraz yazmak istersen
                        opacity: 0.5,         // şeffaflık
                    });
                    page.drawText("ile METODBOX™ kitaplarini hemen indir.", {
                        x: 75,      // soldaki çizgiyle hizalamak için
                        y: 15,          // h - 50 = üstten 50px aşağı
                        size: 24,            // font boyutu
                        color: rgb(1, 0, 0), // kırmızı
                        //rotate: degrees(-45), // çapraz yazmak istersen
                        opacity: 0.5,         // şeffaflık
                    });
                }
            } catch (err) {
                console.warn('Watermark eklenemedi:', err);
            }

            await new Promise(r => setTimeout(r, 100)); // küçük gecikme
        }

        const pdfBytes = await pdfDocument.save();

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const saveurl = URL.createObjectURL(blob);
        saveButton.href = saveurl
        saveButton.download = "metodbook.pdf";

        logDownloadStatus(`${title}: PDF Oluşturuldu. Kaydedebilirsiniz.`);
        alert('✅ PDF oluşturuldu');
    } catch (err) {
        logDownloadStatus('PDF oluşturulamadı: ' + err.message, 'danger');
        return;
    }
}

let adPlayer = null; // We'll store the video.js instance here
async function initializeAdPlayer() {

    skipAd.classList.add("hidden");
    waitAd.classList.remove("hidden");
    for (let i = 5; i > 0; i--) {
        waitAd.innerText = `Reklamı ${i}s içinde geçip indirme işlemine devam edebilirsiniz...`;
        await new Promise(r => setTimeout(r, 1000));
    }
    skipAd.classList.remove("hidden");
    waitAd.classList.add("hidden");

    /*
    if (adPlayer) {
    adPlayer.dispose(); // Clean up if an instance already exists
    }

    adPlayer = videojs("ad-video", {
        controls: true,
        autoplay: true,
        muted: false
    });

    // Load the VAST ad tag
    adPlayer.vast({
        url: "https://obese-pin.com/dZmIF/z/d.GhNVvPZtGFUH/geums9xu/Z/U/l_kgPYTPYb0hMMT/YX4gOXA_" // Your VAST URL
    });

    // Listen for the 'vast.adEnd' event
    adPlayer.on("vast.adEnd", () => {
        //skip ad logic
    });

    // Optional: Handle errors gracefully
    adPlayer.on("vast.adError", (e) => {
        console.error("VAST ad error:", e);
        // Fallback: close modal and start download anyway
        adModal.style.display = "none";
        adPlayer.dispose();
        start();
    });*/
}

// Event listener for the download button
downloadButton.addEventListener("click", () => {
    saveButton.classList.add("hidden");
    downloadButton.classList.add("hidden");
    resetButton.classList.add("hidden");
    cancelButton.classList.remove("hidden");
    
    adModal.style.display = "flex";
    
    // Initialize and play the ad
    initializeAdPlayer();
});


saveButton.addEventListener("click", () => {
    // indirme tamamlandıktan sonra
    logDownloadStatus("İndirilenler klasörünüzü kontrol edin.");
});

function init() {
    logDownloadStatus("");

    if (adPlayer) {
        adPlayer.dispose(); // Stop the ad and clean up
    }
    adModal.style.display = "none";

    saveButton.classList.add("hidden");
    downloadButton.classList.remove("hidden");
    resetButton.classList.add("hidden");
    cancelButton.classList.add("hidden");

    if (drawer.classList.contains("hidden")) {
        actionArea.classList.add("hidden");
    }
}

resetButton.addEventListener("click", () => init());

cancelButton.addEventListener("click", () => {
    stopDownload = true;
    init();
});

skipAd.addEventListener("click", () => {
    console.log("Ad finished, starting download...");
    adModal.style.display = "none";
    if (adPlayer) {
        adPlayer.dispose(); // Remove the player instance to free up resources
    }

    // Start the PDF download process
    start().finally(() => {
        downloadButton.classList.add("hidden");
        saveButton.classList.remove("hidden");
        resetButton.classList.remove("hidden");
        cancelButton.classList.add("hidden");
    });
});


init();