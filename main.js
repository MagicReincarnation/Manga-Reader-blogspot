/*!
 * Project: Manga Reader
 * Author: Hirutshuji
 * Patner: Roka
 * Website: https://datakodehiru.blogspot.com
 * Github Repo: https://github.com/MagicReincarnation/Manga-Reader-blogspot
 * Description: MangaReader untuk membaca manga dengan berbagai mode, termasuk longstrip, RTL, LTR, dan vertikal. Fitur ini juga mendukung zoom, swipe, dan slider dots untuk navigasi yang lebih mudah.
 * Version: 4.0.0
 * License: MIT
 * 
 * Created: 2025-03-06
 * Last Updated: 2025-04-16
 * 
 * Copyright (c) 2025 Hirutshuji & Roka
 * All rights reserved.
 */
/* Source Code 
 * Regex : https://stackoverflow.com/questions/62802497/how-can-i-simplify-this-regular-expression-to-select-blogger-image-parameters
 * Chapter next prev : Zeistmanga v5.4
 */
class MangaReader {
 constructor(options) {
  this.seriesId = options.seriesId || 'default';
  this.panelManga = options.pages || ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuVwiyGbGX3kdpBlvyMkvXMvBgQKftxpqfKfzOURncKmKwx0h7Qbsy6PM&s=10'];
  this.panelStart_panelEnd = options.panelStart_panelEnd || false;
  this._mode_reading_hr = options.mode || 'rtl';
  this.active_panel_read = options.startIndex || 0;
  this.timer_loader = options.timer_loader || 100;
  this.timer_auto_Hidebox = options.timer_auto_Hidebox === 0 ? 600000 : (options.timer_auto_Hidebox ? options.timer_auto_Hidebox : 6000);
  
  this.click_screen = Object.assign({
      active: false,
      type: "screen",
      reverse: false,
  }, options.click_screen || {});
  
  this.arr = [];
  this.cache_link_gambar = this.cache_link_gambar || {};
  this.configNextprev = Object.assign({
   show_nextPrev: this.show_nextPrev,
   mode: "normal",
   max: 30,
   start: 1,
   labelMain: "Series",
   site: "",
   classSelector: ".mode_manga_reader",
   selector_postbody: ".post-body img",
   modif_title_Chapter: ["([vV]olume|[cC]hapter|[pP]rolog[ue]?|[eE]pisode|[sS]eason|[cC]h|[vV]ol|[eE]p|[sS])\\s*\\d+(?=[\\s\\W]|$)(.*)"], //Regex Filter Title Chapter/Episode/Volume dll.
   replaceList_ch: [
   { target: "Volume", change_to: 'Vol' },
   { target: "Season", change_to: 'S' },
   { target: "Short Story", change_to: 'SS' },
   { target: "Extra Chapter", change_to: 'Etc' },
   { target: "Chapter", change_to: 'Ch' }
    ], // Replace penyingkat judul Chapter/Episode/Volume dll.
   textError: "Error",
  }, options.configNextprev || {});
  
  /*Setting resolusi*/
  this.resolusi = Object.assign({
   s_resolusi: "/s1600",
   resolusi_low: "/s160",
   resolusi_higth: "/s1600",
   compresResolusi: false,
   regex: new RegExp("/[swh]\\d{2,4}(?:-[swh]\\d{2,4})?(?:-c)?(?:-rw)?/", "gi") || new RegExp(/\/s\d+/, "gi"),
   check_regexURL: new RegExp(/\/s\d+/, "gi"),
   consoleOuput_regeximg: false,
   default_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/woAAgMBgAar8sYAAAAASUVORK5CYII=',
  }, options.resolusi || {});
  /*Setting resolusi end*/
  
  this.dbname_setmode = "MangaReaderDB";
  this.storename_setmode = "modes";
  this.swiper_panel_hr = null;
  this.run_dbmode().then(() => {
   this.load_storedMode_read().then(_moderead => {
    if (_moderead) {
     // Gunakan mode yang sudah disimpan dilocal (selain longstrip)
     this._mode_reading_hr = _moderead;
    } else if (this._mode_reading_hr === 'longstrip') {
     // Jika belum ada, pastikan defaultnya adalah longstrip
     this.storedmode_read("longstrip");
    }
    this.update_mode_btn();
    this.run_mode_readnow();
   }).catch((error) => {
    console.error("Gagal memuat mode dari IndexedDB:", error);
    this.run_mode_readnow();
   });
  });
 }
 run_dbmode() {
  return new Promise((resolve, reject) => {
   const request = indexedDB.open(this.dbname_setmode, 1);
   request.onupgradeneeded = (event) => {
    let db = event.target.result;
    if (!db.objectStoreNames.contains(this.storename_setmode)) {
     db.createObjectStore(this.storename_setmode, {
      keyPath: "seriesId"
     });
    }
   };
   request.onsuccess = (event) => {
    this.db = event.target.result;
    resolve();
   };
   request.onerror = (event) => {
    console.error("IndexedDB error", event);
    reject(event);
   };
  });
 }
 /*========================================================
 database local: Save status Mode per series.
 =========================================================*/
 load_storedMode_read() {
  return new Promise((resolve, reject) => {
   const transaction = this.db.transaction([this.storename_setmode], "readonly");
   const store = transaction.objectStore(this.storename_setmode);
   const request = store.get(this.seriesId);
   request.onsuccess = (event) => {
    const result = event.target.result ? event.target.result.mode : null;
    console.log("Mode yang dimuat dari IndexedDB:", result);
    resolve(result);
   };
   request.onerror = (event) => {
    reject(event);
   };
  });
 }
 storedmode_read(mode) {
  const transaction = this.db.transaction([this.storename_setmode], "readwrite");
  const store = transaction.objectStore(this.storename_setmode);
  store.put({
   seriesId: this.seriesId,
   mode: mode
  });
 }
 /*========================================================
 Auto Next Prev Link Chapter
 =========================================================*/
 /*==============================================
   Sorting Data berdasarkan title dengan numeric
 ================================================*/
 sortData(data, sortBy = 'title', ascending = true) {
 return data.sort((a, b) => {
  let result = 0;
  
  if (sortBy === 'title') {
   const numA = parseInt(a.title.match(/\d+/)?.[0]) || 0;
   const numB = parseInt(b.title.match(/\d+/)?.[0]) || 0;
   result = numA - numB;
  } else if (sortBy === 'date') {
   const dateA = new Date(a.date);
   const dateB = new Date(b.date);
   result = dateA - dateB;
  }
  
  return ascending ? result : -result;
 });
}
 /*==============================================
   Compile data chapter: hanya ambil data prev dan next
 ================================================*/
 compile() {
 if (!this.arr.length) {
  console.error("[DEBUG] Data array kosong");
  return;
 }
 
 const sortedData = this.sortData(this.arr, "date", true).reverse();
 
 const active_path = location.pathname;
 
 let index_panel_active = sortedData.findIndex(item => {
  try {
   const itemPath = new URL(item.url).pathname;
   return active_path === itemPath;
  } catch (e) {
   return false;
  }
 });
 
 if (index_panel_active === -1) {
  index_panel_active = 0;
 }
 
 const prevItem = sortedData[index_panel_active + 1] || null;
 const nextItem = sortedData[index_panel_active - 1] || null;
 
 this.html_panelStart_panelEnd(nextItem, prevItem);
 
 const selector_btn_next_prev = ".showmenu_next_prev";
 const redirect_next_prev_chapter = this.configNextprev.mode;
 
 const nextLink = document.querySelector('a[rel="nextCh"]');
 const prevLink = document.querySelector('a[rel="prevCh"]');
 const nextHref = nextLink ? nextLink.getAttribute('href') : (nextItem ? nextItem.url : null);
 const prevHref = prevLink ? prevLink.getAttribute('href') : (prevItem ? prevItem.url : null);
 
 [selector_btn_next_prev].forEach(selector => {
  const target = document.querySelector(selector);
  if (target) {
   document.querySelectorAll('.nextbtn_mangareader, .prevbtn_mangareader').forEach(el => el.remove());
   
   const htmlAtas = document.createElement('div');
   htmlAtas.className = 'nextbtn_mangareader';
   htmlAtas.innerHTML = `
        <a class="nextbtn_link" role="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M3.889 3.7v16.6m16.222-1.676V5.38a1.455 1.455 0 0 0-2.343-1.15L8.6 11.363a1.456 1.456 0 0 0 .087 2.357l9.169 6.113a1.456 1.456 0 0 0 2.255-1.208"/>
          </svg>
        </a>`;
   target.parentNode.insertBefore(htmlAtas, target);
   
   const htmlBawah = document.createElement('div');
   htmlBawah.className = 'prevbtn_mangareader';
   htmlBawah.innerHTML = `
        <a class="prevbtn_link" role="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M20.062 20.25V3.75M3.938 5.416V18.58a1.447 1.447 0 0 0 2.329 1.143l9.113-7.088a1.447 1.447 0 0 0-.087-2.344L6.18 4.216a1.447 1.447 0 0 0-2.242 1.2"/>
          </svg>
        </a>`;
   target.parentNode.insertBefore(htmlBawah, target.nextSibling);
   
   if (nextHref) {
    htmlAtas.querySelector('.nextbtn_link').addEventListener('click', () => {
    if (nextHref && redirect_next_prev_chapter === "spa") {
         this.loadImageLinks(nextHref);
        } else if (nextHref && redirect_next_prev_chapter === "normal") {
         location.href = nextHref;
        }
    });
   }
   if (prevHref) {
    htmlBawah.querySelector('.prevbtn_link').addEventListener('click', () => {
      if (prevHref && redirect_next_prev_chapter === "spa") {
        this.loadImageLinks(prevHref);
       } else if (prevHref && redirect_next_prev_chapter === "normal") {
        location.href = prevHref;
       }
    });
   }
  }
 });
 
 if (this.panelStart_panelEnd) {
  document.querySelectorAll('a[rel="prevCh"], a[rel="nextCh"]').forEach(link => {
   const targetUrl = link.getAttribute('href');
   if (targetUrl) {
    this.loadImageLinks(targetUrl, true);
   }
  });
 } else {
  if (nextItem && nextItem.url) this.loadImageLinks(nextItem.url, true);
  if (prevItem && prevItem.url) this.loadImageLinks(prevItem.url, true);
 }
 
document.querySelectorAll('a[rel="prevCh"], a[rel="nextCh"]').forEach(link => {
  link.addEventListener('click', (e) => {
   e.preventDefault();
   const targetUrl = e.currentTarget.getAttribute('href');
   if(targetUrl && redirect_next_prev_chapter === "spa"){
    this.loadImageLinks(targetUrl);
   }else if (targetUrl && redirect_next_prev_chapter === "normal") {
      location.href = targetUrl;
     }
  });
 });
}
 
 html_panelStart_panelEnd(nextItem, prevItem){
  const sortedData = this.sortData(this.arr, "date", true).reverse();
 
  const active_path = location.pathname;
 
 let index_panel_active = sortedData.findIndex(item => {
  try {
   const itemPath = new URL(item.url).pathname;
   return active_path === itemPath;
  } catch (e) {
   return false;
  }
 });
 
 if (index_panel_active === -1) {
  index_panel_active = 0;
 }

  // Update panel navigasi (startPanel dan endPanel)
  const startPanel = document.querySelector('.startpanel_message');
  const endPanel = document.querySelector('.endpanel_message');
  
  if (startPanel) {
   let html = '';
   if (prevItem && !prevItem.cat.includes(this.configNextprev.labelMain)) {
    html += `
          <span class="boxsc">
            <span class="status">Sebelumnya:</span>
            <a rel="prevCh" href="${prevItem.url}">
              <span class="ch">${this.filterTitle(prevItem.title)}</span>
            </a>
          </span>
          <span class="boxsc">
            <span class="status">Saat ini:</span>
            <span class="ch">${this.filterTitle(sortedData[index_panel_active].title)}</span>
          </span>
          <span class="info">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17m0-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>
            ${this._mode_reading_hr === "rtl" ? "Mode RTL Active (swipe ke kanan)" : (this._mode_reading_hr === "ltr" ? "Mode LTR Active (swipe ke kiri)" : (this._mode_reading_hr === "vertical" ? "Mode Vertical Active (swipe ke keatas)" : "Mode Longstrip Active (Scroll ke atas)"))}
          </span>
        `;
   } else {
    html += `
          <span class="info">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17m0-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg> 
            Tidak ada bab sebelumnya
          </span>
          <span class="boxsc">
            <span class="status">Saat ini:</span>
            <span class="ch">${this.filterTitle(sortedData[index_panel_active].title)}</span>
          </span>
          <span class="info">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17m0-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>
            ${this._mode_reading_hr === "rtl" ? "Mode RTL Active (swipe ke kanan)" : (this._mode_reading_hr === "ltr" ? "Mode LTR Active (swipe ke kiri)" : (this._mode_reading_hr === "vertical" ? "Mode Vertical Active (swipe ke keatas)" : "Mode Longstrip Active (Scroll ke atas)"))}
          </span>
        `;
   }
   startPanel.innerHTML = html;
  }
  
  if (endPanel) {
   let html = '';
   if (nextItem && !nextItem.cat.includes(this.configNextprev.labelMain)) {
    html += `
          <span class="boxsc">
            <span class="status">Selesai:</span>
            <span class="ch">${this.filterTitle(sortedData[index_panel_active].title)}</span>
          </span>
          <span class="boxsc">
            <span class="status">Selanjutnya:</span>
            <a rel="nextCh" href="${nextItem.url}">
              <span class="ch">${this.filterTitle(nextItem.title)}</span>
            </a>
          </span>
        `;
   } else {
    html += `
          <span class="boxsc">
            <span class="status">Selesai:</span>
            <span class="ch">${this.filterTitle(sortedData[index_panel_active].title)}</span>
          </span>
          <span class="info">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17m0-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>
            Tidak ada bab Selanjutnya
          </span>
        `;
   }
   endPanel.innerHTML = html;
  }
 }
 /*==============================================
   Pengambilan data dari feed menggunakan XHR atau JSONP
 ===============================================*/
 xhr(prefetch = false) {
  const { site, cat, start, max, textError } = this.configNextprev;
  const labelUrl = encodeURIComponent(cat);
  const url = `${site}/feeds/posts/summary/-/${labelUrl}?alt=json&start-index=${start}&max-results=${max}`;
  
  if (site && new URL(site).origin !== location.origin) {
   const callbackName = this._create_callback(prefetch);
   const script = document.createElement("script");
   script.src = `${url}&callback=${callbackName}`;
   script.onerror = () => this.showError(textError);
   document.body.appendChild(script);
  } else {
   const request = new XMLHttpRequest();
   request.open("GET", url, true);
   request.onreadystatechange = () => {
    if (request.readyState === 4) {
     if (request.status === 200) {
      const response = JSON.parse(request.responseText);
      this.respon_data(response, prefetch);
     } else {
      this.showError(textError);
     }
    }
   };
   request.send();
  }
 }
 
 _create_callback(prefetch) {
  const callbackName = `callback_${Math.random().toString(36).substr(2, 9)}`;
  window[callbackName] = (response) => {
   this.respon_data(response, prefetch);
   delete window[callbackName];
  };
  return callbackName;
 }
 

respon_data(response, prefetch = false) {
 const { feed } = response;
 if (feed && feed.entry) {
  feed.entry.forEach(entry => {
   const filterlabel = entry.category.map(category => category.term);
   
   if (filterlabel.includes("Series")) return;
   
   const url = entry.link.find(link => link.rel === "alternate").href;
   this.arr.push({
    title: entry.title.$t,
    date: entry.published.$t,
    url: url,
    cat: entry.category.map(category => category.term)
   });
  });
  
   if (feed.entry.length >= this.configNextprev.max) {
    this.configNextprev.start += this.configNextprev.max;
    this.xhr();
   } else {
    this.compile();
   }
 } else if (!prefetch && this.arr.length > 0) {
  this.compile();
 } else if (!prefetch) {
  this.showError(this.configNextprev.textError);
 }
}

run() {
 if (this.configNextprev.show_nextPrev) {
  const cc_box = document.querySelector(this.configNextprev.classSelector);
  if (!cc_box) return console.error("[DEBUG] Elemen tidak ditemukan.");
  
  const label = cc_box.getAttribute("data-label");
  if (!label) return console.error("[DEBUG] Label tidak ditemukan.");
  
  this.configNextprev.cat = label;
  this.xhr();
 }
}

 /*==============================================
  * SETUP Method untuk mengambil hanya link gambar dari chapter target (tanpa melakukan reload penuh)
 ================================================*/
 
   // const regex = new RegExp("<img[^>]+src=[\"']([^\"']+)[\"']", "gi");
   // const matches = [...html.matchAll(regex)];
   // const images = matches.map(m => m[1]).filter(Boolean);
   
   // Menyimpan dokumen hasil fetch agar bisa digunakan kembali tanpa refetch

loadImageLinks(url, prefetch = false) {
 const proxyUrl = "https://api.codetabs.com/v1/proxy/?quest=";
 
 // Jika sudah di-cache dan ini bukan prefetch, langsung gunakan cache
 if (!prefetch && this.cache_link_gambar[url]) {
  this.proses_doc_img(this.cache_link_gambar[url], url);
  return;
 }
 
 fetch(proxyUrl + url)
  .then(response => response.text())
  .then(html => {
   const parser = new DOMParser();
   const doc = parser.parseFromString(html, 'text/html');
   
   this.cache_link_gambar[url] = doc;
   if (prefetch) return;
   this.proses_doc_img(doc, url);
  })
  .catch(err => {
   console.error('Error chapter image:', err);
   this.showError(`Gagal memuat gambar chapter ${err}.`);
  });
}

proses_doc_img(doc, url) {
 let imgEls = doc.querySelectorAll(this.configNextprev.selector_postbody);
 if (!imgEls.length) {
  imgEls = doc.querySelectorAll('img');
 }
 
 if (!imgEls.length) {
  this.showError("Gambar tidak ditemukan pada halaman");
  return;
 }
 
 this.panelManga = Array.from(imgEls)
  .map(img => img.getAttribute('src') || img.src)
  .filter(src => !!src);
 
 try {
  const parsed = new URL(url);
  history.pushState(null, "", parsed.pathname + parsed.search);
 } catch (e) {}
 
 this.history_pushState();
 this.active_panel_read = 0;
 
 const ltrBox = document.getElementById('ltr_rtl_vertical_div_cc');
 const longstripBox = document.getElementById('longstrip_div_cc');
 const preview1 = document.getElementById('mini_preview_ltr_rtl_vertical_div_cc');
 const preview2 = document.getElementById('mini_preview_longstrip_div_cc');
 
 if (preview1) preview1.innerHTML = "";
 if (preview2) preview2.innerHTML = "";
 if (ltrBox) ltrBox.innerHTML = `<div class="swiper_init_divbox"><div class="swiper-wrapper"></div><div class="swiper-button-prev"></div><div class="swiper-button-next"></div></div>`;
 if (longstripBox) longstripBox.innerHTML = `<div class="longstrip_box" id="longstrip_box"></div>`;
 
 if (this._mode_reading_hr === "longstrip") {
  this._scrollToLongstrip(0);
 }
 
 this.run_mode_readnow();
}

history_pushState() { 
 window.addEventListener('popstate', (event) => {
  const active_url = window.location.href;
  // Validasi URL target
  if (active_url.includes('https') || active_url.includes('http')) {
   if (typeof this.loadImageLinks === 'function') {
    this.loadImageLinks(active_url, false);
   } else {
    console.warn("function loadImageLinks tidak ditemukan.");
   }
  }
 });
}

showError(message) {
  const errorElem = document.querySelector('.startpanel_message');
  const errorElem2 = document.querySelector('.endpanel_message');
  if (errorElem)
   errorElem.innerHTML = `<span class="info">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17m0-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>
        Tidak ada bab Sebelumnya (${message})
      </span>`;
  if (errorElem2)
   errorElem2.innerHTML = `<span class="info">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17m0-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>
        Tidak ada bab Selanjutnya (${message})
      </span>`;
 }
 
/*========================================================
  * SETUP Format title next prev
 =========================================================*/
 // format title 
 filterTitle(title) {
  let filteredTitle = title;
  for (const filterText of this.configNextprev.modif_title_Chapter) {
   const pattern = new RegExp(filterText, "i");
   const match = filteredTitle.match(pattern);
   if (match) { filteredTitle = match[0].trim(); break; }
  }
  this.configNextprev.replaceList_ch.forEach(replaceList_ch_array => {
   filteredTitle = filteredTitle.replace(new RegExp(replaceList_ch_array.target, "i"), replaceList_ch_array.change_to);
  });
  return filteredTitle;
 }
/*========================================================
  * SETUP Load Status Active Btn Mode Reader Manga
 =========================================================*/
 update_mode_btn() {
  // Update status tombol agar yang sesuai mode aktif
  document.querySelectorAll(".mode-btn").forEach(btn => {
   if (btn.getAttribute("data-mode") === this._mode_reading_hr) {
    btn.classList.add("active");
   } else {
    btn.classList.remove("active");
   }
  });
 }
 
 run_mode_readnow() {
  // Menampilakan box container sesuai mode
  if (this._mode_reading_hr === 'longstrip') {
   document.getElementById('longstrip_div_cc').style.display = 'block';
   document.getElementById('ltr_rtl_vertical_div_cc').style.display = 'none';
   this.run_longstrip_mode();
  } else {
   document.getElementById('ltr_rtl_vertical_div_cc').style.display = 'block';
   document.getElementById('longstrip_div_cc').style.display = 'none';
   this.run_swiperlibary();
   this.load_chapter_image(this.panelManga, this.active_panel_read);
  }
  this.notif_modeReader(this._mode_reading_hr, "tidak ditampilkan");
  this._run_mini_preview_ltr_rtl_vertical_div_cc();
  this._run_LazyLoad();
  this.run();
 }
 /*========================================================
  * SETUP Hidden box Mode,info,mini preview [vertical/LTR/RTL/Longstip]
  * Update by roka:
  * ✔ Tap center Show/Hide box
  * ✔ Auto Hide (times)
 =========================================================*/
hidebox() {
 const swiper_cc_hr = document.getElementById('ltr_rtl_vertical_div_cc'),
  swiperEl = document.querySelector('.swiper_init_divbox'),
  longstrip_cc_hr = document.getElementById('longstrip_div_cc'),
  cc_e_longstrip = document.getElementById('longstrip_box'),
  nextBtn = document.querySelector('.swiper-button-next'),
  prevBtn = document.querySelector('.swiper-button-prev'),
  boxInfo = document.querySelector('.box_panelinfo'),
  mini_preview_element = document.getElementById('mini_preview_ltr_rtl_vertical_div_cc'),
  mini_preview_Longstrip_hr = document.getElementById('mini_preview_longstrip_div_cc'),
  controls_mode_hr = document.querySelectorAll('.box_controls_mode');
 
 let mode_active = this._mode_reading_hr;

let element_box = [boxInfo];

if (mode_active === "longstrip") {
 element_box.push(mini_preview_Longstrip_hr);
 if (mini_preview_element) mini_preview_element.style.display = "none";
} else {
 element_box.push(mini_preview_element);
 if (mini_preview_Longstrip_hr) mini_preview_Longstrip_hr.style.display = "none";
}
 
 element_box.forEach(el => el?.style && (el.style.display = 'none'));
 
 controls_mode_hr.forEach(el => el.style.display = 'none');
 
 let _is_box_displayed = false;
 let hide_timeout;
 let time_boxshow = this.timer_auto_Hidebox;
 let run_clicker = true;
 
 // config area center klik (bisa diset dari luar pakai config_boxClickArea )
 let config = this.config_boxClickArea || {
  left_ratio: 0.26, // 26% kiri nonaktif
  right_ratio: 0.74, // 26% kanan nonaktif
  top_px: 200, // 200px atas nonaktif
  bottom_px: 200 // 200px bawah nonaktif
 };
 
 function showbox_cc() {
  if (!run_clicker) return;
  element_box.forEach(el => el?.style && (el.style.display = 'flex'));
  controls_mode_hr.forEach(el => el.style.display = 'flex');
  _is_box_displayed = true;
  clearTimeout(hide_timeout);
  hide_timeout = setTimeout(() => hidebox_cc(), time_boxshow);
  run_clicker = false;
  setTimeout(() => run_clicker = true, 300);
 }
 
 function hidebox_cc() {
  if (!run_clicker) return;
  element_box.forEach(el => el?.style && (el.style.display = 'none'));
  controls_mode_hr.forEach(el => el.style.display = 'none');
  _is_box_displayed = false;
 }
 
 function reset_hidebox() {
  clearTimeout(hide_timeout);
  hide_timeout = setTimeout(() => hidebox_cc(), time_boxshow);
 }
 
 function clicker_display(event) {
  if (event.target === nextBtn || event.target === prevBtn) return;
  
  const click_kanan_kiri = event.clientX;
  const click_atas_bawah = event.clientY;
  const window_width = window.innerWidth;
  const window_height = window.innerHeight;
  
  // Hitung area center
  const isCenterX = click_kanan_kiri > (window_width * config.left_ratio) && click_kanan_kiri < (window_width * config.right_ratio);
  const isCenterY = click_atas_bawah > config.top_px && click_atas_bawah < (window_height - config.bottom_px);
  
  if (isCenterX && isCenterY) {
   if (_is_box_displayed) {
    hidebox_cc();
   } else {
    showbox_cc();
   }
  }
 }
 
 [swiperEl, cc_e_longstrip].forEach(el => {
  el?.addEventListener('click', clicker_display);
 });
 
 mini_preview_element?.addEventListener('scroll', reset_hidebox);
 mini_preview_Longstrip_hr?.addEventListener('scroll', reset_hidebox);
}
/*==============================================
  * SETUP Swiper untuk mode panel (LTR/RTL/Vertical)
  * ✔ RTL & LTR & VERTICAL
 ================================================*/
 run_swiperlibary() {
  if (this.swiper_panel_hr) {
   this.swiper_panel_hr.destroy(true, true);
   this.swiper_panel_hr = null;
  }
  const swiperEl = document.querySelector('.swiper_init_divbox');
  const btnNext = document.querySelector('.swiper-button-next');
  const btnPrev = document.querySelector('.swiper-button-prev');
  // Untuk mode RTL, set attribute dir pada container swiperEl
  if (this._mode_reading_hr === 'rtl') {
   swiperEl.setAttribute('dir', 'rtl');
  } else {
   swiperEl.removeAttribute('dir');
  }
  const use_click_screen = this.click_screen.active;
  
  let reverse_use_click_screen = this.click_screen.reverse;
  if (reverse_use_click_screen) {
   if (this._mode_reading_hr === 'ltr' || this._mode_reading_hr === 'vertical') {
    reverse_use_click_screen = true;
   } else if (this._mode_reading_hr === 'rtl') {
    reverse_use_click_screen = false;
   }
  } else {
   if (this._mode_reading_hr === 'ltr' || this._mode_reading_hr === 'vertical') {
    reverse_use_click_screen = false;
   } else if (this._mode_reading_hr === 'rtl') {
    reverse_use_click_screen = true;
   }
  }
  // Sembunyikan atau tampilkan tombol next/prev sesuai config klik layar
  if (use_click_screen) {
  if(this.click_screen.type === "screen"){
   if (btnNext) btnNext.style.display = 'none';
   if (btnPrev) btnPrev.style.display = 'none';
  } else {
   if (btnNext) btnNext.style.display = 'block';
   if (btnPrev) btnPrev.style.display = 'block';
  }
 }else {
  if (btnNext) btnNext.style.display = 'none';
  if (btnPrev) btnPrev.style.display = 'none';
 }
 
  this.swiper_panel_hr = new Swiper(swiperEl, {
   direction: (this._mode_reading_hr === 'vertical') ? 'vertical' : 'horizontal',
   loop: false,
   allowTouchMove: true,
   slideToClickedSlide: true,
   preventClicksPropagation: false,
   preventClicks: false,
   navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
   },
   keyboard: {
    enabled: true,
    onlyInViewport: true,
   },
   on: {
    slideChange: () => {
     this.active_panel_read = this.swiper_panel_hr.activeIndex;
     this.update_pageOf_panelManga();
     this._update_mini_preview_active();
    },
   },
  });
  let status_dbclick = false;
  let dbclick_timer = null;
  if (use_click_screen) {
   swiperEl.addEventListener('click', (e) => {
    if (status_dbclick) return;
    const swiperWidth = swiperEl.clientWidth;
    const click_kanan_kiri = e.clientX;
    if (click_kanan_kiri <= swiperWidth * 0.2) {
     reverse_use_click_screen ? this.swiper_panel_hr.slideNext() : this.swiper_panel_hr.slidePrev();
    } else if (click_kanan_kiri >= swiperWidth * 0.8) {
     reverse_use_click_screen ? this.swiper_panel_hr.slidePrev() : this.swiper_panel_hr.slideNext();
    }
   });
   swiperEl.addEventListener('dblclick', (e) => {
    status_dbclick = true;
    e.stopPropagation();
    if (dbclick_timer) clearTimeout(dbclick_timer);
    dbclick_timer = setTimeout(() => {
     status_dbclick = false;
    }, 600);
   });
  }
  if (!status_dbclick) {
   this.hidebox();
  }
 }
 
 /*==============================================
  * SETUP Load gambar chapter ke dalam panel (menggunakan Swiper)
  * ✔ RTL & LTR & VERTICAL
 ================================================*/
 load_chapter_image(panelManga, startIndex = 0) {
  this.panelManga = panelManga;
  this.total_panelmanga = panelManga.length;
  
  if (this.swiper_panel_hr) {
   this.swiper_panel_hr.removeAllSlides();
   
   // Panel awal
   if (this.panelStart_panelEnd) {
    this.swiper_panel_hr.appendSlide(`
        <div class="swiper-slide start-panel no-count">
          <div class="manga-page start-message">
            <div class="boxmessage startpanel_message">
              <span class="info">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17m0-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg> 
                ${this._mode_reading_hr === "rtl" ? "Mode RTL Active (swipe ke kanan)" : (this._mode_reading_hr === "ltr" ? "Mode LTR Active (swipe ke kiri)" : "Mode Vertical Active (swipe ke keatas)")}
              </span>
            </div>
          </div>
        </div>
      `);
   }
   
   for (let index = 0; index < panelManga.length; index++) {
    const page = panelManga[index];
    const regex = this.resolusi.check_regexURL;
    let lowRes, highRes;
    
    if (this.resolusi.compresResolusi) {
     if (regex.test(page)) {
      lowRes = this.load_resolusiOriginal(page, this.resolusi.resolusi_low);
      highRes = this.load_resolusiOriginal(page, this.resolusi.resolusi_higth);
     } else {
      lowRes = this.resolusi.default_url || page;
      highRes = page;
     }
    } else {
     lowRes = this.resolusi.default_url;
     highRes = page;
    }
    
    let classDiv_loader;
    let cek_url = new RegExp("/[swh]\\d{2,4}(?:-[swh]\\d{2,4})?(?:-c)?(?:-rw)?/", "gi");
    classDiv_loader = (this.resolusi.compresResolusi && cek_url.test(page)) ? 'divloader' : 'divloader2';
    
    this.swiper_panel_hr.appendSlide(`
        <div class="swiper-slide countable-slide">
          <div class="manga-page">
            <div class="${classDiv_loader}">
              <span class="spinner-loader" loader-index="${index}"></span>
            </div>
            <img data-src="${highRes}" alt="page ${index + 1}" src="${lowRes}" class="panel_gambar lazy">
          </div>
        </div>
      `);
   }
   
   // Panel akhir
   if (this.panelStart_panelEnd) {
    this.swiper_panel_hr.appendSlide(`
        <div class="swiper-slide end-panel no-count">
          <div class="manga-page end-message">
            <div class="boxmessage endpanel_message">
              <span class="info">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17m0-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg> 
                Selesai
              </span>
            </div>
          </div>
        </div>
      `);
   }
   
   // ke slide yang sesuai, offset +1 jika ada start-panel
   const offset = this.panelStart_panelEnd ? 1 : 0;
   this.swiper_panel_hr.slideTo(startIndex + offset, 0);
  }
  
  this.active_panel_read = startIndex;
  this.update_pageOf_panelManga();
  this._update_mini_preview_active();
  this.popupwarning();
  document.querySelectorAll(".manga-page img").forEach(img => this.run_TachiyomiZoom(img));
  this._runLongstripScroll(0); //matikanscroll
 }
 
 /*==============================================
    * SETUP Mode Longstrip: 
    * ✔ menyusun tampilan halaman sebagai longstrip
   ================================================*/
 run_longstrip_mode() {
  const cc_e_longstrip = document.getElementById('longstrip_box');
  const boxparent_dari_cc_e_longstrip = cc_e_longstrip.parentNode;
  
  let slider_hr = '';
  
  // hapus jika sudah ada
  const existingStart = document.querySelector('.longstrip-start-panel');
  const existingEnd = document.querySelector('.longstrip-end-panel');
  if (existingStart) existingStart.remove();
  if (existingEnd) existingEnd.remove();
  
  // Panel awal
  if (this.panelStart_panelEnd) {
   const start_panel = document.createElement('div');
   start_panel.className = 'longstrip-start-panel';
   start_panel.innerHTML = `
      <div class="longstrip-slide start-panel">
        <div class="manga-page start-message">
          <div class="boxmessage startpanel_message">
            <span class="info">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17m0-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>
              Mode Longstip Active (Scroll ke atas)
            </span>
          </div>
        </div>
      </div>
    `;
   boxparent_dari_cc_e_longstrip.insertBefore(start_panel, cc_e_longstrip);
  }
  
  // Isi gambar panel manga
  this.panelManga.forEach((page, index) => {
   const regex = this.resolusi.check_regexURL;
   let lowRes, highRes;
   
   if (this.resolusi.compresResolusi && regex.test(page)) {
    lowRes = this.load_resolusiOriginal(page, this.resolusi.resolusi_low);
    highRes = this.load_resolusiOriginal(page, this.resolusi.resolusi_higth);
   } else {
    if (regex.test(page)) {
     lowRes = this.load_resolusiOriginal(page, this.resolusi.resolusi_low);
    } else {
     lowRes = this.resolusi.default_url || page;
    }
    highRes = page;
   }
   
   slider_hr += `
      <div class="longstrip-slide" data-index="${index}">
        <div class="manga-page">
          <div class="divloader">
            <span class="spinner-loader" loader-index="${index}"></span>
          </div>
          <img data-src="${highRes}" alt="page ${index + 1}" src="${lowRes}" class="panel_gambar lazy" data-index="${index}">
        </div>
      </div>
    `;
  });
  
  cc_e_longstrip.innerHTML = slider_hr;
  this.total_panelmanga = this.panelManga.length;
  
  // Panel akhir
  if (this.panelStart_panelEnd) {
   const end_panel = document.createElement('div');
   end_panel.className = 'longstrip-end-panel';
   end_panel.innerHTML = `
      <div class="longstrip-slide end-panel">
        <div class="manga-page end-message">
          <div class="boxmessage endpanel_message">
            <span class="info">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17m0-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>
              Selesai
            </span>
          </div>
        </div>
      </div>
    `;
   boxparent_dari_cc_e_longstrip.insertBefore(end_panel, cc_e_longstrip.nextSibling);
  }
  this.hidebox();
  this._runLongstripScroll(400); //400px per scroll
  this.run_IntersectionObserver();
  this.run_pinch_SizeMargin();
 }
 
 run_IntersectionObserver() {
  if (this.observer) this.observer.disconnect();
  if (this.resizeObserver) this.resizeObserver.disconnect();
  const self = this;
  const middleViewport = window.innerHeight / 2;
  let lastValidIndex = 0;
  this.observer = new IntersectionObserver((panel_entry) => {
   let index_panel_active = -1;
   let count_panel_terlewat = 0;
   panel_entry.forEach(entry => {
    const index = parseInt(entry.target.getAttribute('data-index'));
    const rect = entry.target.getBoundingClientRect();
    const imageBottom = rect.bottom;
    if (imageBottom < 0) {
     count_panel_terlewat++;
    } else if (imageBottom >= middleViewport) {
     index_panel_active = index;
    }
   });
   
   if (index_panel_active >= 0) {
    lastValidIndex = index_panel_active;
   } else {
    index_panel_active = lastValidIndex;
   }
   requestAnimationFrame(() => {
    self.active_panel_read = index_panel_active;
    self.passed_panel_count = count_panel_terlewat;
    self.update_pageOf_panelManga();
    self._update_mini_preview_active();
   });
  }, {
   root: null, // gunakan viewport browser sebagai area pengamatan
   rootMargin: '0px', // tanpa margin tambahan di atas, bawah, kiri, kanan 
   threshold: this.panelStart_panelEnd ? [0.2] : [0.2] // gambar dianggap terlihat saat 0.2 setengahnya masuk layar 
  });
  this.resizeObserver = new ResizeObserver(entries => {
   entries.forEach(entry => {
    if (entry.target) self.observer.observe(entry.target);
   });
  });
  document.querySelectorAll('.longstrip-slide img.lazy').forEach(img => {
   self.observer.observe(img);
   self.resizeObserver.observe(img);
  });
 }
 /*========================================================
 * SETUP Tap Scroll mode longstrip (beta) 
 * by roka
 * ✔ Support Left/right/top/bottom tap to scroll 
	=========================================================*/
_runLongstripScroll(nilai_px) {
 const config = {
  scroll_px: nilai_px,
  area_atas: 200,
  area_bawah: 200,
  areaRatio_kanan_kiri: 0.26
 };
 
 const scroll_px = config.scroll_px;
 
 function scroll_atas() {
  window.scrollBy({ top: -scroll_px, behavior: 'smooth' });
 }
 
 function scroll_bawah() {
  window.scrollBy({ top: scroll_px, behavior: 'smooth' });
 }
 
 document.addEventListener('click', (event) => {
  const window_width = window.innerWidth;
  const window_height = window.innerHeight;
  const click_kanan_kiri = event.clientX;
  const click_atas_bawah = event.clientY;
  
  const area_kanan_kiri = window_width * config.areaRatio_kanan_kiri;
  
  if (click_atas_bawah <= config.area_atas || click_kanan_kiri <= area_kanan_kiri) {
   scroll_atas();
   return;
  }
  
  if (click_atas_bawah >= window_height - config.area_bawah || click_kanan_kiri >= window_width - area_kanan_kiri) {
   scroll_bawah();
   return;
  }
 });
 
 // Support Arrow Keyboard (PC only)
 window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp') {
   scroll_atas();
  } else if (event.key === 'ArrowDown') {
   scroll_bawah();
  }
 });
}
 /********************************************************
  * untuk scroll longstrip sesuai index mini preview
  *******************************************************/
 _scrollToLongstrip(index) {
  requestAnimationFrame(() => {
   const slides = document.querySelectorAll('.longstrip-slide');
   if (slides.length > 1 && slides[index]) {
    let targetY = slides[index].getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
     top: targetY + 360,
     behavior: 'smooth'
    });
   }
  });
 }
 /*========================================================
 Resolusi gambar
 =========================================================*/
 load_resolusiOriginal(url, s_resolusi) {
  const resolusi = s_resolusi || this.resolusi.s_resolusi;
  const img = url.replace(this.resolusi.regex, `${resolusi}`);
  if (this.resolusi.consoleOuput_regeximg) {
   console.log('Output IMG:', img);
  }
  return img;
 }
 /*========================================================
  Preload link (untuk mempercepat load gambar)
  =========================================================*/
 preloadLink_gambar(page) {
  const src = page;
  if (src && !document.querySelector(`link[rel="preload"][href="${src}"]`)) {
   const link = document.createElement('link');
   link.rel = 'preload';
   link.as = 'image';
   link.href = src;
   document.head.appendChild(link);
  }
 }
 /*========================================================
 * SETUP RUN: mini preview Manga
 * UPDATE:
 * ✔ Mengganti Mini preview menjadi slide dots
 * ✔ Support versi dot swipe & click & akurat
 =========================================================*/
 _run_mini_preview_ltr_rtl_vertical_div_cc() {
  let _mini_preview_div = null;
  if (this._mode_reading_hr === 'longstrip') {
   _mini_preview_div = document.getElementById('mini_preview_longstrip_div_cc');
   _mini_preview_div.className = 'slider_dot_bar left';
  } else {
   _mini_preview_div = document.getElementById('mini_preview_ltr_rtl_vertical_div_cc');
   _mini_preview_div.className = 'slider_dot_bar bottom';
  }
  
  const total_panelmanga = this.panelManga.length;
  let array_sortpanel = Array.from({ length: total_panelmanga }, (_, i) => i);
  if (['rtl', 'longstrip', 'vertical'].includes(this._mode_reading_hr)) {
   array_sortpanel.reverse();
  }
  
  const dot_HTML_slider = array_sortpanel.map((panel_index) => {
   const offset = this.panelStart_panelEnd ? 1 : 0;
   const _modif_index = this._mode_reading_hr !== "longstrip"? panel_index + offset : panel_index;
   
   return `
      <div class="proggres_active bar" data-index="${_modif_index}">
        <span class="dot"></span>
      </div>
    `;
  }).join('');
  
  const _divcc_dot_HTML_slider = document.createElement('div');
  _divcc_dot_HTML_slider.className = '_divcc_progress';
  _divcc_dot_HTML_slider.innerHTML = dot_HTML_slider;
  _mini_preview_div.appendChild(_divcc_dot_HTML_slider);
  
  const boxdiv_dot = _mini_preview_div.querySelectorAll('.proggres_active');
  
  boxdiv_dot.forEach(div => {
   div.addEventListener('click', () => {
    const idx = parseInt(div.dataset.index);
    this._goto_dot_index(idx);
   });
  });
  
  // SWIPE SUPPORT
  const cc_divcc_progress = _mini_preview_div.querySelector('._divcc_progress');
  let startX = 0;
  let active_dot_index = 0;
  
  cc_divcc_progress.addEventListener('touchstart', e => {
   startX = e.touches[0].clientX;
   const active_dot = _mini_preview_div.querySelector('.proggres_active.active');
   active_dot_index = active_dot ? parseInt(active_dot.dataset.index) : this.active_panel_read || 0;
  });
  
  cc_divcc_progress.addEventListener('touchmove', e => {
   const currentX = e.touches[0].clientX;
   const deltaX = currentX - startX;
   
   const dotElement = _mini_preview_div.querySelector('.proggres_active');
   if (!dotElement) return;
   
   const dotWidth = dotElement.offsetWidth || 20;
   let movedDots = Math.floor(deltaX / dotWidth);
   
   if (this._mode_reading_hr === 'ltr') {
       movedDots = -movedDots;
   }
   
   let targetIndex = active_dot_index - movedDots;
   if (targetIndex < 0) targetIndex = 0;
   if (targetIndex >= total_panelmanga) targetIndex = total_panelmanga - 1;
   
   if (targetIndex !== this.active_panel_read) {
    this._goto_dot_index(targetIndex);
   }
  });
 }
 
 _goto_dot_index(index_prm) {
  this.active_panel_read = index_prm;
  
  if (this._mode_reading_hr === 'longstrip') {
   this._scrollToLongstrip(index_prm);
  } else if (this.swiper_panel_hr) {
   this.swiper_panel_hr.slideTo(index_prm, 300);
  }
  this._update_mini_preview_active();
 }
 
 /*========================================================
 Hitung active / Jumlah totals panel Manga
 =========================================================*/
 update_pageOf_panelManga() {
  const pageInfo = document.getElementById('page_panel_active_info');
  
  let active_index_pageOf = this.panelStart_panelEnd ? this.active_panel_read : this.active_panel_read + 1;
  
  if (this._mode_reading_hr === "longstrip") {
   active_index_pageOf = this.active_panel_read + 1;
  }
  
  pageInfo.textContent = `${active_index_pageOf} / ${this.total_panelmanga}`;
 }
 /*****************************************************
  * SETUP tampilan Slide dots agar yang dipilih terlihat
  * UPDATE:
  * ✔ _update_mini_preview_active() dengan Auto-Detect Scroll Type (Horizontal/Vertical)
  * ✔ Mengganti Mini preview menjadi slide dots
  * ✔ Support versi dot swipe & click
  ******************************************************/
 _update_mini_preview_active() {
  let _mini_preview_div = null;
  if (this._mode_reading_hr === 'longstrip') {
   _mini_preview_div = document.getElementById('mini_preview_longstrip_div_cc');
  } else {
   _mini_preview_div = document.getElementById('mini_preview_ltr_rtl_vertical_div_cc');
  }
  if (!_mini_preview_div) return;
  
  const boxdiv_dot = _mini_preview_div.querySelectorAll('.proggres_active');
  const activeIndex = this.active_panel_read || 0;
  
  boxdiv_dot.forEach(item_dot => {
   const index = parseInt(item_dot.getAttribute('data-index'), 10);
   // Tandai hanya yang aktif saat ini
   if (index === activeIndex) {
    item_dot.classList.add('active');
   } else {
    item_dot.classList.remove('active');
   }
   if (index <= activeIndex) {
    item_dot.classList.add('terlewat');
   } else {
    item_dot.classList.remove('terlewat');
   }
  });
  
  // Auto scroll dot agar tetap terlihat
  const activediv = _mini_preview_div.querySelector(`.proggres_active[data-index="${activeIndex}"]`);
  if (activediv) {
   const rect = activediv.getBoundingClientRect();
   const containerRect = _mini_preview_div.getBoundingClientRect();
   const vertical = _mini_preview_div.scrollHeight > _mini_preview_div.clientHeight;
   const horizontal = _mini_preview_div.scrollWidth > _mini_preview_div.clientWidth;
   
   if (vertical) {
    const offsetTop = activediv.offsetTop - (_mini_preview_div.clientHeight / 2) + (activediv.clientHeight / 2);
    const isVisible = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
    if (!isVisible) _mini_preview_div.scrollTop = offsetTop;
   } else if (horizontal) {
    const offsetLeft = activediv.offsetLeft - (_mini_preview_div.clientWidth / 2) + (activediv.clientWidth / 2);
    const isVisible = rect.left >= containerRect.left && rect.right <= containerRect.right;
    if (!isVisible) _mini_preview_div.scrollLeft = offsetLeft;
   }
  }
 }
 /*========================================================
 SETUP run: Lazyload Manga
  =========================================================*/
 _run_LazyLoad() {
  const lazyImages = document.querySelectorAll('img.panel_gambar.lazy');
  const config = {
   rootMargin: '50px 0px',
   threshold: 0.01
  };
  let observer = new IntersectionObserver((entries, self) => {
   entries.forEach(entry => {
    if (entry.isIntersecting) {
     setTimeout(() => {
      // Load gambar
      this._preloadImage(entry.target);
      // Stop meng-observe gambar yang sudah diload
      self.unobserve(entry.target);
     }, this.timer_loader);
    }
   });
  }, config);
  lazyImages.forEach(image => {
   observer.observe(image);
  });
 }
 _preloadImage(img) {
  const src = img.dataset.src;
  if (!src) return;
  img.src = src;
  img.onload = () => {
   img.classList.remove('lazy');
   // Cari spinner di dalam container yang sama dengan gambar
   const spinner = img.parentElement.querySelector('.spinner-loader, .divloader');
   if (spinner) {
    spinner.remove();
   }
  };
 }
 /*========================================================
 * SETUP Zoom in/out v2 
 * by Roka 
 * Keunggulan Perubahan Ini:
 * ✔ Zoom sesuai titik tap. 
 * ✔ Lebih smooth & responsif. 
 * ✔ Drag bisa dilakukan saat zoom aktif.
 * ✔ Mendukung pinch zoom dengan 2 jari.
 * ✔ Tidak perlu obbserver lagi.
 * ✔ Reset zoom jika slide tidak active 
 * ✔ Drag Saat Zoom dengan 2 Jari: drag gambar secara bersamaan dengan zooming menggunakan dua jari
 ========================================================*/
 run_TachiyomiZoom(img) {
  let config = {
   maxScale: 3, //maksimum zoom
   minScale: 1, //minimum zoom
   zoomSpeed: 0.5, //animasi zoom
   smoothDrag: 0.3, //kehalusan drag gambar.
   resetSpeed: 0.1, //Waktu reset saat zoom keluar.
   boundsPadding: 20 //batas gerakan gambar
  };
  let scale = 1,
   lastScale = 1,
   isDragging = false,
   startX, startY,
   translateX = 0,
   translateY = 0,
   lastTouchTime = 0,
   originX = 50,
   originY = 50,
   initialMidX = 0,
   initialMidY = 0;
  const container = img.closest(".manga-page");
  const swiperSlide = img.closest(".swiper-slide");
  const resetZoom = () => {
   scale = 1;
   lastScale = 1;
   translateX = 0;
   translateY = 0;
   img.style.transition = `transform ${config.resetSpeed}s ease`;
   img.style.transform = `scale(1) translate(0px, 0px)`;
  };
  const observer = new MutationObserver(() => {
   if (!swiperSlide.classList.contains("swiper-slide-active")) resetZoom();
  });
  observer.observe(swiperSlide, {
   attributes: true,
   attributeFilter: ["class"]
  });
  img.addEventListener("touchend", (e) => {
   let now = new Date().getTime();
   if (now - lastTouchTime < 300 && e.touches.length === 0) {
    e.preventDefault();
    let rect = img.getBoundingClientRect();
    let touch = e.changedTouches[0];
    originX = ((touch.clientX - rect.left) / rect.width) * 100;
    originY = ((touch.clientY - rect.top) / rect.height) * 100;
    scale = scale > 1 ? 1 : config.maxScale;
    translateX = 0;
    translateY = 0;
    img.style.transition = `transform ${config.zoomSpeed}s ease`;
    img.style.transformOrigin = `${originX}% ${originY}%`;
    img.style.transform = `scale(${scale}) translate(0px, 0px)`;
   }
   lastTouchTime = now;
  });
  img.addEventListener("touchstart", (e) => {
   if (e.touches.length === 2) {
    e.preventDefault();
    let rect = img.getBoundingClientRect();
    let touch1 = e.touches[0];
    let touch2 = e.touches[1];
    let midX = (touch1.clientX + touch2.clientX) / 2;
    let midY = (touch1.clientY + touch2.clientY) / 2;
    initialMidX = midX;
    initialMidY = midY;
    originX = ((midX - rect.left) / rect.width) * 100;
    originY = ((midY - rect.top) / rect.height) * 100;
    img.style.transformOrigin = `${originX}% ${originY}%`;
    let dist = getDistance(touch1, touch2);
    lastScale = scale;
    img.dataset.startDistance = dist;
    isDragging = true;
    startX = midX - translateX;
    startY = midY - translateY;
    img.style.cursor = "grabbing";
   } else if (e.touches.length === 1 && scale > 1) {
    isDragging = true;
    startX = e.touches[0].clientX - translateX;
    startY = e.touches[0].clientY - translateY;
    img.style.cursor = "grabbing";
   }
  });
  img.addEventListener("touchmove", (e) => {
   if (e.touches.length === 2) {
    e.preventDefault();
    let touch1 = e.touches[0];
    let touch2 = e.touches[1];
    let midX = (touch1.clientX + touch2.clientX) / 2;
    let midY = (touch1.clientY + touch2.clientY) / 2;
    let dist = getDistance(touch1, touch2);
    let newScale = (dist / img.dataset.startDistance) * lastScale;
    scale = Math.min(Math.max(config.minScale, newScale), config.maxScale);
    translateX = smoothTransition(translateX, midX - startX, config.smoothDrag);
    translateY = smoothTransition(translateY, midY - startY, config.smoothDrag);
    img.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
   } else if (isDragging && e.touches.length === 1) {
    let moveX = e.touches[0].clientX - startX;
    let moveY = e.touches[0].clientY - startY;
    translateX = smoothTransition(translateX, moveX, config.smoothDrag);
    translateY = smoothTransition(translateY, moveY, config.smoothDrag);
    img.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
   }
  });
  img.addEventListener("touchend", () => {
   isDragging = false;
   img.style.cursor = "grab";
  });
  
  function getDistance(touch1, touch2) {
   let dx = touch2.clientX - touch1.clientX;
   let dy = touch2.clientY - touch1.clientY;
   return Math.sqrt(dx * dx + dy * dy);
  }
  
  function smoothTransition(current, target, smoothness) {
   return current + (target - current) * smoothness;
  }
 }
 /*======================================================== 
 * SETUP Zoom in/out v2 untuk longstrip
 * by roka 
 * ✔ Mendukung pinch zoom dengan dua jari.
 * ✔ Drag Saat Zoom dengan 2 Jari: drag gambar secara bersamaan dengan zooming menggunakan dua jari
 * ✔ Zoom sesuai titik tap. 
 * ✔ Support Kaca pembesar 
	========================================================*/
 run_pinch_SizeMargin() {
 const containerLongStrip = document.querySelector('.longstrip_box');
 const config_moveMagnifier = {
  top: '50%',
  left: '50%',
 }
 const magnifier = document.createElement('div');
 magnifier.id = 'magnifier';
 magnifier.style.cssText = `
    position: fixed;
    border: 2px solid #222;
    border-radius: 50%;
    width: 300px;
    height: 300px;
    overflow: hidden;
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
    display: none;
    background-repeat: no-repeat;
    background-position: center;
    background-size: 300%;
  `;
 document.body.appendChild(magnifier);
 
 const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
 
 const config = {
  maxMargin: 120,
  minMarginThreshold: 0,
  dragSpeed: 0.6,
  zoomSpeed: 0.6,
  zoomScale: 3,
  mode: 'padding' // options: "margin", "padding"
 };
 
 const getStorageKey = (side) => `longstrip_${config.mode}_${side}`;
 
 let savedLeft = parseFloat(localStorage.getItem(getStorageKey('Left'))) || 0;
 let savedRight = parseFloat(localStorage.getItem(getStorageKey('Right'))) || 0;
 
 const applyShift = (left, right) => {
  if (config.mode === 'margin') {
   containerLongStrip.style.marginLeft = `${left}px`;
   containerLongStrip.style.marginRight = `${right}px`;
   containerLongStrip.style.paddingLeft = '';
   containerLongStrip.style.paddingRight = '';
  } else {
   containerLongStrip.style.paddingLeft = `${left}px`;
   containerLongStrip.style.paddingRight = `${right}px`;
   containerLongStrip.style.marginLeft = '';
   containerLongStrip.style.marginRight = '';
  }
  containerLongStrip.style.transition = 'margin 0.3s ease, padding 0.3s ease';
 };
 
 applyShift(savedLeft, savedRight);
 
 const toggleMode = () => {
  config.mode = config.mode === 'margin' ? 'padding' : 'margin';
  savedLeft = parseFloat(localStorage.getItem(getStorageKey('Left'))) || 0;
  savedRight = parseFloat(localStorage.getItem(getStorageKey('Right'))) || 0;
  applyShift(savedLeft, savedRight);
 };
 
 let startLeft = 0;
 let startRight = 0;
 let startDistance = 0;
 let startX = 0;
 let startY = 0;
 let isPinching = false;
 let magnifierActive = false;
 let magnifierTimeout = null;
 let isDraggingMagnifier = false;
 let currentImg = null;
 
 const getDistance = (t1, t2) => {
  const dx = t2.clientX - t1.clientX;
  const dy = t2.clientY - t1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
 };
 
 const activateMagnifier = (img, x, y) => {
  const zoom = config.zoomScale;
  magnifier.style.backgroundImage = `url(${img.src})`;
  magnifier.style.backgroundSize = `${img.width * zoom}px ${img.height * zoom}px`;
  magnifier.style.display = 'block';
  magnifierActive = true;
  containerLongStrip.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  moveMagnifier(x, y);
 };
 
 const moveMagnifier = (x, y) => {
  if (!currentImg) return;
  const rect = currentImg.getBoundingClientRect();
  const zoom = config.zoomScale;
  let posX = clamp(x - rect.left, 0, rect.width);
  let posY = clamp(y - rect.top, 0, rect.height);
  magnifier.style.left = config_moveMagnifier? config_moveMagnifier.left : `${x}px`;
  magnifier.style.top = config_moveMagnifier? config_moveMagnifier.top :`${y}px`;
  magnifier.style.backgroundPosition = `-${posX * zoom - magnifier.offsetWidth / 2}px -${posY * zoom - magnifier.offsetHeight / 2}px`;
 };
 
 const deactivateMagnifier = () => {
  magnifier.style.display = 'none';
  magnifierActive = false;
  isDraggingMagnifier = false;
  currentImg = null;
  containerLongStrip.style.overflow = '';
  document.body.style.overflow = '';
 };
 
 const resetShift = () => {
  applyShift(0, 0);
  localStorage.setItem(getStorageKey('Left'), 0);
  localStorage.setItem(getStorageKey('Right'), 0);
  deactivateMagnifier();
 };
 
 containerLongStrip.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
   isPinching = true;
   startDistance = getDistance(e.touches[0], e.touches[1]);
   startLeft = savedLeft;
   startRight = savedRight;
   clearTimeout(magnifierTimeout);
   deactivateMagnifier();
   
  // Reset zoom default browser
 /* document.body.style.zoom = '1';
  document.documentElement.style.zoom = '1';
  document.body.style.transform = 'scale(1)';
  document.body.style.transformOrigin = '0 0';
  */
  
  } else if (e.touches.length === 1) {
   startX = e.touches[0].clientX;
   startY = e.touches[0].clientY;
   magnifierTimeout = setTimeout(() => {
    const img = document.elementFromPoint(startX, startY)?.closest('img');
    if (img) {
     currentImg = img;
     activateMagnifier(img, startX, startY);
     isDraggingMagnifier = true;
    }
   }, 200);
  }
 });
 
 containerLongStrip.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2 && isPinching) {
   const newDistance = getDistance(e.touches[0], e.touches[1]);
   const moveFactor = (startDistance - newDistance) * config.zoomSpeed;
   const newLeft = clamp(startLeft + moveFactor, config.minMarginThreshold, config.maxMargin);
   const newRight = clamp(startRight + moveFactor, config.minMarginThreshold, config.maxMargin);
   applyShift(newLeft, newRight);
   savedLeft = newLeft;
   savedRight = newRight;
   localStorage.setItem(getStorageKey('Left'), newLeft);
   localStorage.setItem(getStorageKey('Right'), newRight);
  } else if (e.touches.length === 1 && magnifierActive && isDraggingMagnifier) {
   const x = e.touches[0].clientX;
   const y = e.touches[0].clientY;
   const newImg = document.elementFromPoint(x, y)?.closest('img');
   if (newImg && newImg !== currentImg) {
    currentImg = newImg;
    activateMagnifier(newImg, x, y);
   } else {
    moveMagnifier(x, y);
   }
  } else {
   clearTimeout(magnifierTimeout);
  }
 });
 
 containerLongStrip.addEventListener('touchend', () => {
  isPinching = false;
  isDraggingMagnifier = false;
  clearTimeout(magnifierTimeout);
 });
 
 containerLongStrip.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
   e.preventDefault();
   const moveFactor = Math.sign(e.deltaY) * 5;
   const newLeft = clamp(savedLeft - moveFactor, config.minMarginThreshold, config.maxMargin);
   const newRight = clamp(savedRight - moveFactor, config.minMarginThreshold, config.maxMargin);
   applyShift(newLeft, newRight);
   savedLeft = newLeft;
   savedRight = newRight;
   localStorage.setItem(getStorageKey('Left'), newLeft);
   localStorage.setItem(getStorageKey('Right'), newRight);
  }
 }, { passive: false });
 
 containerLongStrip.addEventListener('mousemove', (e) => {
  if (magnifierActive && currentImg) moveMagnifier(e.clientX, e.clientY);
 });
 
 containerLongStrip.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const img = e.target.closest('img');
  if (img) {
   currentImg = img;
   activateMagnifier(img, e.clientX, e.clientY);
  }
 });
 
 document.addEventListener('mouseup', () => {
  if (magnifierActive) deactivateMagnifier();
 });
 
 containerLongStrip.addEventListener('dblclick', () => {
  resetShift();
 });
 
 const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
   if (!entry.isIntersecting) resetShift();
  });
 }, { threshold: 0 });
 
 observer.observe(containerLongStrip);
}
/*======================================================== 
 * SETUP Notif mode reader v1.0
 * ✔ Notif halaman mode & area click 
 ========================================================*/
 notif_modeReader(mode_page, notif_area_click = "tampilkan") {
  // Hapus semua elemen lama jika ada
  const oldElems = document.querySelectorAll('.mode_notif, .click_kiri, .click_kanan, .click_sebelum, .click_lanjut');
  oldElems.forEach(el => el.remove());
  
  const linkIcon = document.querySelector("link[rel~='mangareader']");
  const favicon = linkIcon ? linkIcon.href : `${window.location.origin}/favicon.ico`;
  
  let icon_webmanga = favicon || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuOSB77O510K4odVGY84QUFtbW2PrH6Eu0Gg&usqp=CAU";
  
  let notif_html = '';
  if (mode_page === 'rtl') {
   notif_html = `
      <div class="mode_notif">
        <div class="notif_content">
          <span class="notif_icon">
          <img alt="logoicon" src="${icon_webmanga}">
          </span>
          Halaman (kanan ke kiri)
        </div>
      </div>
      ${this.click_screen.active && notif_area_click === "tampilkan" ?`
       <div class="click_kiri">Lanjut</div>
      <div class="click_kanan">Sebelum</div>` : ''}
    `;
  } else if (mode_page === 'ltr') {
   notif_html = `
      <div class="mode_notif">
        <div class="notif_content">
          <span class="notif_icon">
          <img alt="logoicon" src="${icon_webmanga}">
          </span>
          Halaman (kiri ke kanan)
        </div>
      </div>
      ${this.click_screen.active && notif_area_click === "tampilkan" ?`
      <div class="click_kanan">Lanjut</div>
      <div class="click_kiri">Sebelum</div>`:''}
    `;
  } else if (mode_page === 'longstrip') {
   notif_html = `
      <div class="mode_notif">
        <div class="notif_content">
          <span class="notif_icon">
          <img alt="logoicon" src="${icon_webmanga}">
          </span>
          Mode Longstrip (scroll ke bawah)
        </div>
      </div>
      ${this.click_screen.active && notif_area_click === "tampilkan" ?`
      <div class="click_sebelum_top">Sebelum</div>
      <div class="click_lanjut_bottom">lanjut</div>
      <div class="click_sebelum">Sebelum</div>
      <div class="click_lanjut">Lanjut</div>`:''}
    `;
  } else if (mode_page === 'vertical') {
   notif_html = `
      <div class="mode_notif">
        <div class="notif_content">
          <span class="notif_icon">
          <img alt="logoicon" src="${icon_webmanga}">
          </span>
          Mode Vertikal (per halaman)
        </div>
      </div>
      ${this.click_screen.active && notif_area_click === "tampilkan" ?`
      <div class="click_sebelum">Sebelum</div>
      <div class="click_lanjut">Lanjut</div>`:''}
    `;
  } else {
   return;
  }
  
  const style = `
    <style>
      .mode_notif {
        position: fixed;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(36, 36, 36, 0.9);
        padding: 8px;
        border-radius: 10px;
        font-size: 14px;
        color: #fff;
        z-index: 999;
        display: flex;
        align-items: center;
        animation: fadein 0.3s ease;
      }

      .notif_content {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .notif_icon {
        width: 28px;
        height: 28px;
        border-radius: 10px;
        overflow: hidden;
      }
      .notif_icon img {
        width: 100%;
        height: 100%;
        aspect-ratio: 3/4;
       }
       
      @keyframes fadein {
        from { opacity: 0; transform: translate(-50%, 10px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }

      .click_sebelum, .click_kiri {
        position: fixed;
        top: 0;
        left: 0;
        background: linear-gradient(270deg, #4c4343e6, #a72424ad);
      }

      .click_lanjut, .click_kanan {
        position: fixed;
        top: 0;
        right: 0;
        background: linear-gradient(270deg, #2a2c29e6, #0ea0447d);
      }

      .click_sebelum, .click_lanjut, .click_kanan, .click_kiri {
        width: 26%;
        height: 100vh;
        color: white;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: 500;
        z-index: 5;
        animation: fadein_side 2s ease;
      }
      .click_sebelum_top {
        position: fixed;
        top: 0;
        left: 0;
        background: linear-gradient(270deg, #4c4343e6, #a72424ad);
       }
      .click_lanjut_bottom {
        position: fixed;
        bottom: 0;
        left: 0;
        background: linear-gradient(270deg, #4c4343e6, #a72424ad);
       }
      .click_sebelum_top, .click_lanjut_bottom{
        width: 100%;
        height: 160px;
        color: white;
        text-align: center;
        display: flex;
        font-size: 22 px;
        font-weight: 500;
        z-index: 6;
        animation: fadein_side 2s ease;
        justify-content: center;
        align-items: center;
       }

      @keyframes fadein_side {
        from { opacity: 0;}
        to { opacity: 1;}
      }
    </style>
  `;
  
  document.body.insertAdjacentHTML('beforeend', style + notif_html);
  
  // Hapus semua element notif dan klik area setelah 4 detik
  setTimeout(() => {
   const elems = document.querySelectorAll('.mode_notif, .click_kiri, .click_kanan, .click_sebelum, .click_lanjut, .click_sebelum_top, .click_lanjut_bottom');
   elems.forEach(el => el.remove());
  }, 4000);
 }
 /*======================================================== 
 * SETUP Notif warning v1.0
 * ✔ Notif contextmenu
 ========================================================*/
 popupwarning() {
  // ccs/div popup ke dalam body
  let popupWarning = document.createElement("div");
  popupWarning.id = "popupWarning";
  popupWarning.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(35, 39, 42, 0.13);
  color: #fff;
  padding: 15px;
  border-radius: 10px;
  font-size: 16px;
  text-align: center;
  display: none;
  z-index: 1000;
  width: 280px;
  max-width: 90%;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  overflow: hidden;
`;
  // css/div overlay
  let overlay = document.createElement("div");
  overlay.id = "popupOverlay";
  overlay.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: none;
  z-index: 999;
`;
  document.body.appendChild(overlay);
  document.body.appendChild(popupWarning);
  document.addEventListener("contextmenu", function(event) {
   let target = event.target;
   if (target.tagName === "IMG") {
    event.preventDefault(); 
    event.stopPropagation(); 
    popupWarning.innerHTML = `
   <img src="https://media1.giphy.com/media/4QxQgWZHbeYwM/giphy.gif?cid=6c09b952b93x32w38b1pk4as08ax0llm383z8c8bbfx8kpmy&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g" 
      width="100" 
      height="100" 
    style="display: block;
    margin: -15px -15px auto -15px;
    border-radius: 0 0 5px 5px;
    width: -webkit-fill-available;" alt='warning click'>
      <p><strong>Bleehh..!!!</strong></p>
      <p><strong>Dilarang Mengambil Gambar!</strong></p>
      <p>Silakan nikmati konten tanpa mengambil gambar di website kami!</p>
      <button id="closePopup" style="
        margin-top: 10px; 
        padding: 8px 35px; 
        background: crimson; 
        color: white; 
        border: none; 
        border-radius: 20px;
        cursor: pointer;">
        Close
      </button>
    `;
    popupWarning.style.display = "block";
    overlay.style.display = "block";
    document.getElementById("closePopup").onclick = function() {
     popupWarning.style.display = "none";
     overlay.style.display = "none";
    };
    // Sembunyikan popup setelah 8 detik
    setTimeout(() => {
     popupWarning.style.display = "none";
     overlay.style.display = "none";
    }, 8000);
   }
  });
 }
}
/*===============================================================
 * Btn Mode Reader
 * Inital Script MangaReader 
 * tanpa reload ulang halaman
 * faster script
 ==============================================================*/
document.querySelectorAll('.mode-btn').forEach(button => {
 button.addEventListener('click', () => {
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
  const data_mode = button.getAttribute("data-mode");
  _set_options_mode_reading.mode = data_mode;
  
  (function(seriesId, mode) {
   const request = indexedDB.open("MangaReaderDB", 1);
   request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("modes")) {
     db.createObjectStore("modes", { keyPath: "seriesId" });
    }
   };
   request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(["modes"], "readwrite");
    const store = transaction.objectStore("modes");
    store.put({ seriesId: seriesId, mode: mode });
   };
   request.onerror = (event) => {
    console.error("Error menyimpan mode:", event);
   };
  })(_set_options_mode_reading.seriesId, data_mode);
  
  // Hapus dan isi ulang elemen
  const ltrBox = document.getElementById('ltr_rtl_vertical_div_cc');
  const longstripBox = document.getElementById('longstrip_div_cc');
  const mini_preview_element = document.getElementById('mini_preview_ltr_rtl_vertical_div_cc');
  const mini_preview_longstrip_div_cc = document.getElementById('mini_preview_longstrip_div_cc');
  
  mini_preview_element.innerHTML = "";
  mini_preview_longstrip_div_cc.innerHTML = "";
  
  ltrBox.innerHTML = `<div class="swiper_init_divbox">
				<div class="swiper-wrapper">
				</div>
				<div class="swiper-button-prev"></div>
				<div class="swiper-button-next"></div>
			</div>`;
  longstripBox.innerHTML = `
			<div class="longstrip_box" id="longstrip_box">
				<!-- Slide longstrip akan diinject oleh JS -->
			</div>`;
  
  
  // Sembunyikan semua, lalu tampilkan yang sesuai mode
  ltrBox.style.display = 'none';
  longstripBox.style.display = 'none';
  if (data_mode === 'longstrip') {
   longstripBox.style.display = 'block';
  } else {
   ltrBox.style.display = 'block';
  }
  
  // Reset dan jalankan ulang MangaReader
  if (window.reader) {
   if (typeof window.reader.destroy === "function") {
    window.reader.destroy(); // method destroy
   }
   window.reader = null;
  }
  
  window.reader = new MangaReader(_set_options_mode_reading);
  setTimeout(() => {
   reader.notif_modeReader(data_mode, "tampilkan");
  }, 500);
 });
});