/*!
 * Project: Manga Reader
 * Author: Hirutshuji
 * Patner: Roka
 * Website: https://datakodehiru.blogspot.com
 * Github Repo: https://github.com/MagicReincarnation/Manga-Reader-blogspot
 * Description: MangaReader untuk membaca manga dengan berbagai mode, termasuk longstrip, RTL, LTR, dan vertikal. Fitur ini juga mendukung zoom, swipe, dan mini preview untuk navigasi yang lebih mudah.
 * Version: 3.3.0
 * License: MIT
 * 
 * Created: 2025-03-06
 * Last Updated: 2025-03-24
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
		this.panelManga = options.pages || ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyBlBbu_foi7ylDLgSySiil8TQ07S1llJO9kNTw1rcD9q0CFU_ybxPQk0&s=10'];
		this._mode_reading_hr = options.mode || 'rtl';
		this.active_panel_read = options.startIndex || 0;
		this.lazyload_bacth = options.lazyBatch || 3;
		this.timer_loader = options.timer_loader || 500;
		this.timer_auto_Hidebox = options.timer_auto_Hidebox || 3000;
	 this.reverse_swipe_nextprev = options.reverse_swipe_nextprev || false;
	 this.use_click_screen = options.use_click_screen || true;
	 this.arr = [];
	 this.show_nextPrev = options.show_nextPrev || false;
		this.config = Object.assign({
			max: 150,
			start: 1,
			labelMain: "Series",
			site: "",
			classSelector: ".mode_manga_reader",
			textError: "Error",
		}, options.configNextprev || {});
  this.s_resolusi = options.s_resolusi || "s1600";
		this.compresResolusi = options.compresResolusi || true;
		this.default_url = options.default_url || 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';
		this.custom_lazyimage_mini_preview_ltr_rtl_vertical_div_cc = options.custom_lazyimage_mini_preview_ltr_rtl_vertical_div_cc || 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';
		this.resolusi_higth = options.resolusi_higth || 's1600';
		this.resolusi_low = options.resolusi_low || 's160';
		this.custom_regexURL = options._fitur_custom_regexURL && options.custom_regexURL || /s\d{4,4}/g;
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
					db.createObjectStore(this.storename_setmode, { keyPath: "seriesId" });
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
		store.put({ seriesId: this.seriesId, mode: mode });
	}
	
	/*========================================================
Auto Next Prev Link Chapter
=========================================================*/
	sortData(data) {
		return data.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
	}
	compile() {
	if (!this.arr.length) {
		console.error("[DEBUG] Data array kosong");
		return;
	}
	const sortedData = this.sortData(this.arr).reverse();
	const currentURL = location.href;
	sortedData.forEach((item, index) => {
		if (currentURL.includes(item.url)) {
			const prevItem = sortedData[index + 1];
			const nextItem = sortedData[index - 1];
			const prevUrl = (prevItem && !prevItem.cat.includes(this.config.labelMain)) ? prevItem.url : "";
			const nextUrl = (nextItem && !nextItem.cat.includes(this.config.labelMain)) ? nextItem.url : "";
		
			const startPanel = document.querySelector('.startpanel_message');
			const endPanel = document.querySelector('.endpanel_message');
			
			// Inject Pesan ke .startpanel_message
			if (startPanel) {
				  startPanel.innerHTML = "";
				if (prevUrl) {
					startPanel.innerHTML = `
                    <span class="boxsc">
                    <span class="status">Sebelumnya:</span> <a rel="prevCh" href="${prevUrl}">
                    <span class="ch">
                    ${prevItem.title}
                    </span> 
                    </a>
                    </span>
                    <span class="boxsc">
                    <span class="status">Saat ini:</span>
                    <span class="ch">${item.title}</span>
                    </span>
                    <span class="info"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg> ${this._mode_reading_hr === "rtl"? "Mode RTL Active (swipe ke kanan)" : (this._mode_reading_hr ==="ltr"? "Mode LTR Active (swipe ke kiri)" : (this._mode_reading_hr === "vertical"? "Mode Vertical Active (swipe ke keatas)" : "Mode Longstrip Active (Scroll ke atas)"))}</span>
                    `;
				} else {
					startPanel.innerHTML = `
                    <span class="info"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg> Tidak ada bab sebelumnya</span>
                    <span class="boxsc">
                    <span class="status">Saat ini:</span>
                    <span class="ch">${item.title}</span>
                    </span>
                    <span class="info"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg> ${this._mode_reading_hr === "rtl"? "Mode RTL Active (swipe ke kanan)" : (this._mode_reading_hr ==="ltr"? "Mode LTR Active (swipe ke kiri)" : (this._mode_reading_hr === "vertical"? "Mode Vertical Active (swipe ke keatas)" : "Mode Longstrip Active (Scroll ke atas)"))}</span>`;
				 }
			}
			// Inject Pesan ke .endpanel_message
			if (endPanel) {
				endPanel.innerHTML = "";
				if (nextUrl) {
					endPanel.innerHTML = `
																				<span class="boxsc">
                    <span class="status">Selesai:</span>
                    <span class="ch">${item.title}</span>
                    </span> 
                    
																				<span class="boxsc">
                    <span class="status">Selanjutnya:</span>
                    <a rel="nextCh" href="${nextUrl}">
                    <span class="ch">
                    ${nextItem.title}
                    </span></a>
                    </span>
                    `;
				} else {
					endPanel.innerHTML = `
																				<span class="boxsc">
                    <span class="status">Selesai:</span>
                    <span class="ch">${item.title}</span>
                    </span> 
                    <span class="info"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg> Tidak ada bab Selanjutnya </span>`;
				}
			}
		}
	});
}

	xhr() {
	const { site, cat, start, max, textError } = this.config;
	// Konversi label menjadi URL-friendly format
	const labelUrl = encodeURIComponent(cat); // Jika ingin pakai "-" gunakan: cat.replace(/\s+/g, "-");
	const url = `${site}/feeds/posts/summary/-/${labelUrl}?alt=json&start-index=${start}&max-results=${max}`;
	if (site && new URL(site).origin !== location.origin) {
 	const callbackName = this._create_callback();
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
					this.respon_data(response);
				} else {
					this.showError(textError);
				}
			}
		};
		request.send();
	}
}
	
	_create_callback() {
		const callbackName = `callback_${Math.random().toString(36).substr(2, 9)}`;
		window[callbackName] = (response) => {
			this.respon_data(response);
			delete window[callbackName];
		};
		return callbackName;
	}
	
	respon_data(response) {
		const { feed } = response;
		if (feed && feed.entry) {
			feed.entry.forEach(entry => {
				this.arr.push({
					title: entry.title.$t,
					url: entry.link.find(link => link.rel === "alternate").href,
					cat: entry.category.map(category => category.term)
				});
			});

			if (feed.entry.length >= this.config.max) {
				this.config.start += this.config.max;
				this.xhr();
			} else {
				this.compile();
			}
		} else if (this.arr.length > 0) {
			this.compile();
		} else {
			this.showError(this.config.textError);
		}
	}
	
	showError(message) {
		const errorElem = document.querySelector('.startpanel_message');
		const errorElem2 = document.querySelector('.endpanel_message');
		if (errorElem) errorElem.innerHTML = `<span class="info"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg> Tidak ada bab Sebelumnya (${message}) </span> <span class="info"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg> ${this._mode_reading_hr === "rtl"? "Mode RTL Active (swipe ke kanan)" : (this._mode_reading_hr ==="ltr"? "Mode LTR Active (swipe ke kiri)" : (this._mode_reading_hr === "vertical"? "Mode Vertical Active (swipe ke keatas)" : "Mode Longstrip Active (Scroll ke atas)"))}</span>`;
		
		if(errorElem2) errorElem2.innerHTML = `<span class="info"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg> Tidak ada bab Selanjutnya (${message}) </span>`;
	}
	
	run() {
		if (this.show_nextPrev) {
		const container = document.querySelector(this.config.classSelector);
		if (!container) return console.error("[DEBUG] Elemen tidak ditemukan.");
		
		const label = container.getAttribute("data-label");
		if (!label) return console.error("[DEBUG] Label tidak ditemukan.");
		
		this.config.cat = label;
		this.xhr();
		}
	}
	/*========================================================
	Status Active Btn Mode Reader Manga
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
		this._run_mini_preview_ltr_rtl_vertical_div_cc();
		this._run_LazyLoad();
	}
	
	/*========================================================
	Hidden box Mode,info,mini preview [vertical/LTR/RTL/Longstip]
	 * Update by roka:
	 * Tap center Show/Hide box
	 * Auto Hide 3s
	=========================================================*/
	hidebox() {
	// Mini Preview untuk [vertical/LTR/RTL]
	const swiper_cc_hr = document.getElementById('ltr_rtl_vertical_div_cc'),
		swiperEl = document.querySelector('.swiper_init_divbox'),
		longstrip_cc_hr = document.getElementById('longstrip_div_cc'),
		cc_e_longstrip = document.getElementById('longstrip_box'),
		
		nextBtn = document.querySelector('.swiper-button-next'),
		prevBtn = document.querySelector('.swiper-button-prev'),
		boxInfo = document.querySelector('.box_panelinfo'),
		
		// Mini Preview untuk [vertical/LTR/RTL]
		mini_preview_element = document.getElementById('mini_preview_ltr_rtl_vertical_div_cc'),
		// Mini Preview untuk Longstrip
		mini_preview_Longstrip_hr = document.getElementById('mini_preview_longstrip_div_cc'),
		// Untuk box controls (btn navigation + box btn mode)
		controls_mode_hr = document.querySelectorAll('.box_controls_mode');
	
	// Deteksi mode saat ini
	let mode_active = this._mode_reading_hr;
	
	let element_box = [boxInfo, mini_preview_element];
	
	// Jika mode adalah "longstrip", tambahkan mini_preview_Longstrip_hr
	if (mode_active === "longstrip") {
		element_box.push(mini_preview_Longstrip_hr);
	} else {
		// Mini Preview Longstrip disembunyikan di mode selain longstrip
		mini_preview_Longstrip_hr.style.display = "none";
	}
	
	// Sembunyikan box saat pertama kali dijalankan (kecuali nextBtn & prevBtn)
	element_box.forEach(el => el?.style && (el.style.display = 'none'));
	controls_mode_hr.forEach(el => el.style.display = 'none');
	
	let _is_box_displayed = false;
	let hide_timeout;
	let time_boxshow = this.timer_auto_Hidebox;
	let run_clicker = true; // Cegah clicker terlalu cepat setelah showbox_cc()
	
	function showbox_cc() {
		if (!run_clicker) return; // Jika belum bisa clicker, hentikan function ini.
		
		element_box.forEach(el => el?.style && (el.style.display = 'flex'));
		controls_mode_hr.forEach(el => el.style.display = 'flex');
		_is_box_displayed = true;
		
		clearTimeout(hide_timeout);
		hide_timeout = setTimeout(() => hidebox_cc(), time_boxshow);
		
		run_clicker = false;
		setTimeout(() => run_clicker = true, 300); // Jeda 300ms sebelum clicker bisa dilakukan lagi
	}
	
	function hidebox_cc() {
		if (!run_clicker) return; // Jika belum bisa clicker, hentikan fungsi
		
		element_box.forEach(el => el?.style && (el.style.display = 'none'));
		controls_mode_hr.forEach(el => el.style.display = 'none');
		_is_box_displayed = false;
	}
	
	function reset_hidebox() {
		clearTimeout(hide_timeout);
		hide_timeout = setTimeout(() => hidebox_cc(), 3000);
	}
	
	function clicker_display(event) {
		// Cegah jika yang diklik adalah btn next prev
		if (event.target === nextBtn || event.target === prevBtn) return;
		
		const rect = event.target.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const width = rect.width;
		
		// Hitung area klik (25% kiri, 25% kanan, 50% tengah)
		const leftArea = width * 0.25;
		const rightArea = width * 0.75;
		
		// run clicker jika klik di area tengah
		if (clickX > leftArea && clickX < rightArea) {
			if (_is_box_displayed) {
				hidebox_cc();
			} else {
				showbox_cc();
			}
		}
	}
	
	// Menampilkan box saat klik area tertentu
	[swiperEl, cc_e_longstrip].forEach(el => {
		el?.addEventListener('click', clicker_display);
	});
	
	// Cegah close saat scroll pada preview
	mini_preview_element?.addEventListener('scroll', reset_hidebox);
	mini_preview_Longstrip_hr?.addEventListener('scroll', reset_hidebox);
	
	this.popupwarning();
}
	popupwarning() {
		// ccs/div popup ke dalam body
		let popupWarning = document.createElement("div");
		popupWarning.id = "popupWarning";
		popupWarning.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.3);
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
		
		// Blokir klik kanan pada gambar dan tampilkan popup
		document.addEventListener("contextmenu", function(event) {
			let target = event.target;
			
			// Cek apakah yang diklik adalah gambar
			if (target.tagName === "IMG") {
				event.preventDefault(); // Blokir klik kanan
				event.stopPropagation(); // Cegah event bubbling
				
				// popup dengan innerHTML
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
				
				// Tampilkan popup dan overlay
				popupWarning.style.display = "block";
				overlay.style.display = "block";
				
				// tombol Close
				document.getElementById("closePopup").onclick = function() {
					popupWarning.style.display = "none";
					overlay.style.display = "none";
				};
				
				// Sembunyikan popup setelah 10 detik
				setTimeout(() => {
					popupWarning.style.display = "none";
					overlay.style.display = "none";
				}, 10000);
			}
		});
	}
	/*========================================================
	Run Mode [vertical/LTR/RTL]=========================================================*/
	run_swiperlibary() {
	if (this.swiper_panel_hr) {
		this.swiper_panel_hr.destroy(true, true);
		this.swiper_panel_hr = null;
	}
	
	const swiperEl = document.querySelector('.swiper_init_divbox');
	const btnNext = document.querySelector('.swiper-button-next');
	const btnPrev = document.querySelector('.swiper-button-prev');
	
	// Untuk mode RTL, set attribute dir pada container swiper
	if (this._mode_reading_hr === 'rtl') {
		swiperEl.setAttribute('dir', 'rtl');
	} else {
		swiperEl.removeAttribute('dir');
	}
	
	// Pengaturan Apakah Menggunakan Klik Layar
	const use_click_screen = this.use_click_screen;

 let reverse_swipe_nextprev = this.reverse_swipe_nextprev;

if (reverse_swipe_nextprev) {
	if (this._mode_reading_hr === 'ltr' || this._mode_reading_hr === 'vertical') {
		reverse_swipe_nextprev = true;
 	} else if (this._mode_reading_hr === 'rtl') {
		reverse_swipe_nextprev = false;
	 }
  }else {
	if (this._mode_reading_hr === 'ltr' || this._mode_reading_hr === 'vertical') {
	   reverse_swipe_nextprev = false;
	 } else if (this._mode_reading_hr === 'rtl') {
		 reverse_swipe_nextprev = true;
 	}
}

	// Tampilkan atau Sembunyikan Tombol Next & Prev
	if (use_click_screen) {
		if (btnNext) btnNext.style.display = 'none';
		if (btnPrev) btnPrev.style.display = 'none';
	} else {
		if (btnNext) btnNext.style.display = 'block';
		if (btnPrev) btnPrev.style.display = 'block';
	}
	
	// run Swiper
	this.swiper_panel_hr = new Swiper('.swiper_init_divbox', {
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
	
	if (use_click_screen) {
		let status_dbclick = false;
		let dbclick_timer = null;
		
		swiperEl.addEventListener('click', (e) => {
			if (status_dbclick) return; // Jika dblclick terdeteksi, abaikan klik biasa
			
			const swiperWidth = swiperEl.clientWidth;
			const clickX = e.clientX;
			
			if (clickX <= swiperWidth * 0.2) {
				reverse_swipe_nextprev ? this.swiper_panel_hr.slideNext() : this.swiper_panel_hr.slidePrev();
			} else if (clickX >= swiperWidth * 0.8) {
				reverse_swipe_nextprev ? this.swiper_panel_hr.slidePrev() : this.swiper_panel_hr.slideNext();
			}
		});
		
		swiperEl.addEventListener('dblclick', (e) => {
			status_dbclick = true; 
			e.stopPropagation();
			if (dbclick_timer) clearTimeout(dbclick_timer);
			dbclick_timer = setTimeout(() => {
				status_dbclick = false;
			}, 300);
		});
	}
	this.hidebox();
}

	load_chapter_image(panelManga, startIndex = 0) {
		this.panelManga = panelManga;
		this.total_panelmanga = panelManga.length;
		if (this.swiper_panel_hr) {
			this.swiper_panel_hr.removeAllSlides();
			
			// * panel pertama khusus
			this.swiper_panel_hr.appendSlide(`
            <div class="swiper-slide start-panel">
                <div class="manga-page start-message">
                    <div class="boxmessage startpanel_message">
                     <span class="info"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg> ${this._mode_reading_hr === "rtl"? "Mode RTL Active (swipe ke kanan)" : (this._mode_reading_hr ==="ltr"? "Mode LTR Active (swipe ke kiri)" : "Mode Vertical Active (swipe ke keatas)")}</span>
                    </div>
															</div>
            </div>
        `);
        
			for (let index = 0; index < panelManga.length; index++) {
				const page = panelManga[index];
				const regex = this.custom_regexURL;
				
				const lowRes = this.compresResolusi && regex.test(page) ?
					this.loadXHR(page, this.resolusi_low) :
					(regex.test(page) ? this.loadXHR(page, this.resolusi_low) : (this.default_url || page));
				
				const highRes = this.compresResolusi && regex.test(page) ?
					this.loadXHR(page, this.resolusi_higth) :
					page;
				
				//lazy load: gambar dimuat dengan data-src
				if (index < this.lazyload_bacth) {
					this.swiper_panel_hr.appendSlide(`
                    <div class="swiper-slide">
                        <div class="manga-page">
                            <div class="${this.compresResolusi && regex.test(page) ? 'divloader' : 'divloader2'}">
                                <span class="spinner-loader" loader-index="${index}"></span>
                            </div>
                            <img data-src="${highRes}" alt="Manga page" src="${lowRes}" class="lazy">
                        </div>
                    </div>
                `);
				} else {
					
					this.swiper_panel_hr.appendSlide(`
                    <div class="swiper-slide">
                        <div class="manga-page">
                            <div class="${this.compresResolusi && regex.test(page) ? 'divloader' : 'divloader2'}">
                                <span class="spinner-loader" loader-index="${index}"></span>
                            </div>
                            <img data-src="${highRes}" alt="Manga page" src="${lowRes}" class="lazy">
                        </div>
                    </div>
                `);
				}
			}
			
			// * panel terakhir khusus
			this.swiper_panel_hr.appendSlide(`
            <div class="swiper-slide end-panel">
                <div class="manga-page end-message">
                    <div class="boxmessage endpanel_message">
                       <span class="info"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg> Selesai</span>
         													</div>
															</div>
            </div>
        `);
			
			this.swiper_panel_hr.slideTo(startIndex, 0);
		}
		
		this.active_panel_read = startIndex;
		this.update_pageOf_panelManga();
		this._update_mini_preview_active();
		this._run_LazyLoad();
		this.run();
  // v2.1: Support Zoom sesuai titik tap. 
  document.querySelectorAll(".manga-page img").forEach(img => this.run_TachiyomiZoom(img));
	}
	
	/*========================================================
	Run mode longstrip
	=========================================================*/
	run_longstrip_mode() {
		const cc_e_longstrip = document.getElementById('longstrip_box');
		let slider_hr = "";
	
			// * panel pertama khusus
			slider_hr +=` 
            <div class="swiper-slide start-panel">
                <div class="manga-page start-message">
                    <div class="boxmessage startpanel_message">
                     <span class="info"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>  Mode Longstip Active (Scroll ke atas)</span>
                    </div>
															</div>
            </div>
        `;
        
		this.panelManga.forEach((page, index) => {
			const regex = this.custom_regexURL;
			const lowRes = this.compresResolusi && regex.test(page) ?
				this.loadXHR(page, this.resolusi_low) :
				(regex.test(page) ? this.loadXHR(page, this.resolusi_low) : (this.default_url || page));
			const highRes = this.compresResolusi && regex.test(page) ? this.loadXHR(page, this.resolusi_higth) : page;
			
			slider_hr += `
      <div class="longstrip-slide" data-index="${index}">
          <div class="manga-page">
             <div class="divloader">
              <span class="spinner-loader" loader-index="${index}"></span>
              </div>
              <img data-src="${highRes}" alt="Manga page ${index}" 
                   src="${lowRes}" 
                   class="lazy" 
                   data-index="${index}">
          </div>
      </div>
    `;
		});
		
		// * panel terakhir khusus
		slider_hr += `
      <div class="swiper-slide end-panel">
          <div class="manga-page end-message">
                <div class="boxmessage endpanel_message">
                       <span class="info"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg> Selesai</span>
         													</div>
          </div>
      </div>
  `;
		
		// Set HTML setelah loop selesai
		cc_e_longstrip.innerHTML = slider_hr;
		
		this.total_panelmanga = this.panelManga.length;
		this.hidebox();
		this.run();
  // khusus longstrip
  this._runLongstripScroll();
  this.run_pinch_SizeMargin();
  this.run_IntersectionObserver();
  
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
			index_panel_active = lastValidIndex; // Menggunakan index terakhir yang valid
		}
		
		requestAnimationFrame(() => {
			self.active_panel_read = index_panel_active;
			self.passed_panel_count = count_panel_terlewat;
			self.update_pageOf_panelManga();
			self._update_mini_preview_active();
		});
	}, {
		root: null,
		rootMargin: '0px',
		threshold: [0]
	});
	
	this.resizeObserver = new ResizeObserver(entries => {
		entries.forEach(entry => {
			if (entry.target) self.observer.observe(entry.target);
		});
	});
	
	document.querySelectorAll('.longstrip-slide img').forEach(img => {
		self.observer.observe(img);
		self.resizeObserver.observe(img);
	});
}

	
	/*========================================================
 Tap Scroll mode longstrip (beta) 
 * by roka
 * Support Left/right tap to scroll 
	=========================================================*/
	_runLongstripScroll() {
	const cc_e_longstrip = document.getElementById('longstrip_box');
	let scroll_px = 400; // Jumlah scroll dalam piksel (sesuaikan sesuai kebutuhan)
	
	if (!cc_e_longstrip) return;
	
	// Fungsi untuk scroll ke atas
	function scrollUp() {
		window.scrollBy({
			top: -scroll_px,
			behavior: 'smooth'
		});
	}
	
	// Fungsi untuk scroll ke bawah
	function scrollDown() {
		window.scrollBy({
			top: scroll_px,
			behavior: 'smooth'
		});
	}
	
	// Event Listener untuk klik kiri & kanan
	cc_e_longstrip.addEventListener('click', (event) => {
		const rect = cc_e_longstrip.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const width = rect.width;
		
		// Area klik kiri & kanan (25% kiri dan 25% kanan)
		const leftArea = width * 0.25;
		const rightArea = width * 0.75;
		
		// Klik di kiri -> Scroll ke atas
		if (clickX <= leftArea) scrollUp();
		
		// Klik di kanan -> Scroll ke bawah
		if (clickX >= rightArea) scrollDown();
	});
}
	/*========================================================
	Hitung active / Jumlah totals panel Manga
	=========================================================*/
	update_pageOf_panelManga() {
		const pageInfo = document.getElementById('page_panel_active_info');
		pageInfo.textContent = `${this.active_panel_read}/${this.total_panelmanga}`;
	}
	
	/*========================================================
	Resolusi gambar
	=========================================================*/
	loadXHR(url, s_resolusi) {
		return url.replace(this.custom_regexURL, s_resolusi ? s_resolusi : this.s_resolusi);
	}
	/*========================================================
	Run: mini preview Manga
	=========================================================*/
	_run_mini_preview_ltr_rtl_vertical_div_cc() {
		let _mini_preview_ltr_rtl_vertical_div_cc_cc_hr;
		// Mini preview berdasarkan mode
		if (this._mode_reading_hr === 'longstrip') {
			_mini_preview_ltr_rtl_vertical_div_cc_cc_hr = document.getElementById('mini_preview_longstrip_div_cc');
			_mini_preview_ltr_rtl_vertical_div_cc_cc_hr.className = 'mini-preview left';
		} else if (this._mode_reading_hr === 'vertical') {
			_mini_preview_ltr_rtl_vertical_div_cc_cc_hr = document.getElementById('mini_preview_ltr_rtl_vertical_div_cc');
			_mini_preview_ltr_rtl_vertical_div_cc_cc_hr.className = 'mini-preview left';
		} else {
			_mini_preview_ltr_rtl_vertical_div_cc_cc_hr = document.getElementById('mini_preview_ltr_rtl_vertical_div_cc');
			_mini_preview_ltr_rtl_vertical_div_cc_cc_hr.className = 'mini-preview bottom';
		}
		
		// Hanya untuk mode RTL, urutannya dibalik.
		let pagesForMini = [...this.panelManga];
		if (this._mode_reading_hr === 'rtl') {
			pagesForMini.reverse();
		}
		
		// Mini preview dengan data-index yang dibalik di mode RTL
		_mini_preview_ltr_rtl_vertical_div_cc_cc_hr.innerHTML = pagesForMini.map((page, index) => {
			
			let dataIndex = this._mode_reading_hr === 'rtl' ?
				(this.panelManga.length - 1 - index) :
				index;
			
			const lowRes = this.compresResolusi ? this.loadXHR(page, this.resolusi_low) : (page || this.default_url);
			
			return `<img data-src="${lowRes}" data-index="${dataIndex}" alt="Preview ${dataIndex}" src="${this.custom_lazyimage_mini_preview_ltr_rtl_vertical_div_cc}" class="lazy">`;
		}).join('');
		
		// Klik untuk pindah panel Manga
		_mini_preview_ltr_rtl_vertical_div_cc_cc_hr.querySelectorAll('img').forEach(img => {
			img.addEventListener('click', (e) => {
				const idx = parseInt(e.target.dataset.index);
				this.active_panel_read = idx;
				
				if (this._mode_reading_hr === 'longstrip') {
					this._scrollToLongstrip(idx);
				} else if (this.swiper_panel_hr) {
					this.swiper_panel_hr.slideTo(idx + 1, 300);
				}
				
				this._update_mini_preview_active();
			});
		});
		this._run_LazyLoad();
	}
	/********************************************************
	 * untuk scroll longstrip sesuai index mini preview
	 *******************************************************/
	_scrollToLongstrip(index) {
		requestAnimationFrame(() => {
			const slides = document.querySelectorAll('.longstrip-slide');
			
			if (slides.length > 0 && slides[index]) {
				let targetY = slides[index].getBoundingClientRect().top + window.scrollY;
				window.scrollTo({
					top: targetY,
					behavior: 'smooth'
				});
			}
		});
	}
	
	/*****************************************************
	 * tampilan mini preview agar thumbnail yang dipilih terlihat
	 * Update by roka
	 * _update_mini_preview_active() dengan Auto-Detect Scroll Type (Horizontal/Vertical)
	 * 
	 ******************************************************/
	 _update_mini_preview_active() {
	let _mini_preview_div = null;
	
	if (this._mode_reading_hr === 'longstrip') {
		_mini_preview_div = document.getElementById('mini_preview_longstrip_div_cc');
	} else {
		_mini_preview_div = document.getElementById('mini_preview_ltr_rtl_vertical_div_cc');
	}
	
	if (!_mini_preview_div) return;
	
	const mini_preview_gambar = _mini_preview_div.querySelectorAll('img');
	let activeIndex_panel_hr = this.active_panel_read;
	
	let prevActive = _mini_preview_div.querySelector('.active');
	if (prevActive) prevActive.classList.remove('active');
	
	let activeThumb = _mini_preview_div.querySelector(`img[data-index="${activeIndex_panel_hr - 1}"]`);
	if (activeThumb) {
		activeThumb.classList.add('active');
		
		const rect = activeThumb.getBoundingClientRect();
		const containerRect = _mini_preview_div.getBoundingClientRect();
		
		// detect Scroll Type (Vertical / Horizontal)
		const _vertical_active = _mini_preview_div.scrollHeight > _mini_preview_div.clientHeight;
		const _horizontal_active = _mini_preview_div.scrollWidth > _mini_preview_div.clientWidth;
		
		if (_vertical_active) {
			// Scroll Y (Vertical)
			const offsetTop = activeThumb.offsetTop - (_mini_preview_div.clientHeight / 2) + (activeThumb.clientHeight / 2);
			const _scrollY_active = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
			
			if (!_scrollY_active) {
				_mini_preview_div.scrollTop = offsetTop;
			}
		} else if (_horizontal_active) {
			// Scroll X (Horizontal)
			const offsetLeft = activeThumb.offsetLeft - (_mini_preview_div.clientWidth / 2) + (activeThumb.clientWidth / 2);
			const _scrollX_active = rect.left >= containerRect.left && rect.right <= containerRect.right;
			
			if (!_scrollX_active) {
				_mini_preview_div.scrollLeft = offsetLeft;
			}
		}
	}
}
	/*========================================================
	run: Lazyload Manga (Beta)
	=========================================================*/
	_run_LazyLoad() {
		const lazyImages = document.querySelectorAll('img.lazy');
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
						// Cari spinner di dalam container yang sama dengan gambar
						const spinner = entry.target.parentElement.querySelector('.spinner-loader, .divloader');
						if (spinner) {
							spinner.remove();
						}
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
		zoomSpeed: 0.2, //animasi zoom
		smoothDrag: 0.2, //kehalusan drag gambar.
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
	observer.observe(swiperSlide, { attributes: true, attributeFilter: ["class"] });
	
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
	========================================================*/
	run_pinch_SizeMargin() {
	const containerLongStrip = document.querySelector('.longstrip_box');
	let config = {
		maxMargin: 120,
		minMarginThreshold: -20,
		dragSpeed: 0.6,
		zoomSpeed: 0.8,
		zoomScale: 3 // zoom saat double-click
	};
	
	let startMarginLeft = 0;
	let startMarginRight = 0;
	let startDistance = 0;
	let startX = 0;
	let startY = 0;
	let isPinching = false;
	let isDragging = false;
	let isZoomedIn = false;
	
	let savedMarginLeft = parseFloat(localStorage.getItem('longstripMarginLeft')) || 0;
	let savedMarginRight = parseFloat(localStorage.getItem('longstripMarginRight')) || 0;
	
	containerLongStrip.style.marginLeft = `${savedMarginLeft}px`;
	containerLongStrip.style.marginRight = `${savedMarginRight}px`;
	
	containerLongStrip.addEventListener('touchstart', (e) => {
		if (e.touches.length === 2) {
			isPinching = true;
			isDragging = true;
			startDistance = getDistance(e.touches[0], e.touches[1]);
			startMarginLeft = parseFloat(getComputedStyle(containerLongStrip).marginLeft) || 0;
			startMarginRight = parseFloat(getComputedStyle(containerLongStrip).marginRight) || 0;
			
			startX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
			startY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
		} else if (e.touches.length === 1) {
			isPinching = false;
			isDragging = true;
			startX = e.touches[0].clientX;
			startMarginLeft = parseFloat(getComputedStyle(containerLongStrip).marginLeft) || 0;
			startMarginRight = parseFloat(getComputedStyle(containerLongStrip).marginRight) || 0;
		}
	});
	
	containerLongStrip.addEventListener('touchmove', (e) => {
		if (isPinching && e.touches.length === 2) {
			e.preventDefault();
			let newDistance = getDistance(e.touches[0], e.touches[1]);
			let moveFactor = (startDistance - newDistance) * config.zoomSpeed;
			
			let newMarginLeft = Math.max(-config.maxMargin, Math.min(startMarginLeft + moveFactor, config.maxMargin));
			let newMarginRight = Math.max(-config.maxMargin, Math.min(startMarginRight + moveFactor, config.maxMargin));
			
			containerLongStrip.style.marginLeft = `${newMarginLeft}px`;
			containerLongStrip.style.marginRight = `${newMarginRight}px`;
			
			localStorage.setItem('longstripMarginLeft', newMarginLeft);
			localStorage.setItem('longstripMarginRight', newMarginRight);
			
			isZoomedIn = (newMarginLeft !== 0 || newMarginRight !== 0);
			
			let midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
			let midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
			
			let moveX = (midX - startX) * config.dragSpeed;
			let moveY = (midY - startY) * config.dragSpeed;
			
			containerLongStrip.style.transform = `translate(${moveX}px, ${moveY}px)`;
		} else if (isDragging && e.touches.length === 1) {
			if (startMarginLeft > config.minMarginThreshold && startMarginRight > config.minMarginThreshold) return;
			
			let moveX = (e.touches[0].clientX - startX) * config.dragSpeed;
			let newMarginLeft = startMarginLeft + moveX;
			let newMarginRight = startMarginRight - moveX;
			
			if (newMarginLeft > 0 && newMarginRight < 0) {
				newMarginLeft = Math.max(0, newMarginLeft);
				newMarginRight = Math.min(0, newMarginRight);
			} else if (newMarginRight > 0 && newMarginLeft < 0) {
				newMarginRight = Math.max(0, newMarginRight);
				newMarginLeft = Math.min(0, newMarginLeft);
			}
			
			containerLongStrip.style.marginLeft = `${newMarginLeft}px`;
			containerLongStrip.style.marginRight = `${newMarginRight}px`;
			
			localStorage.setItem('longstripMarginLeft', newMarginLeft);
			localStorage.setItem('longstripMarginRight', newMarginRight);
		}
	});
	
	containerLongStrip.addEventListener('touchend', () => {
		isPinching = false;
		isDragging = false;
		containerLongStrip.style.transform = 'translate(0, 0)';
	});
	
	containerLongStrip.addEventListener('dblclick', (e) => {
		if (!isZoomedIn) {
			zoomToArea(e.clientX, e.clientY);
		} else {
			resetMargin();
		}
	});
	
	function zoomToArea(x, y) {
		const rect = containerLongStrip.getBoundingClientRect();
		const offsetX = x - rect.left;
		const offsetY = y - rect.top;
		
		const scaleX = config.zoomScale;
		const scaleY = config.zoomScale;
		
		containerLongStrip.style.transformOrigin = `${(offsetX / rect.width) * 100}% ${(offsetY / rect.height) * 100}%`;
		containerLongStrip.style.transform = `scale(${scaleX}, ${scaleY})`;
		
		isZoomedIn = true;
	}
	
	function resetMargin() {
		containerLongStrip.style.marginLeft = '0px';
		containerLongStrip.style.marginRight = '0px';
		containerLongStrip.style.transform = 'scale(1)';
		localStorage.removeItem('longstripMarginLeft');
		localStorage.removeItem('longstripMarginRight');
		isZoomedIn = false;
	}
	
	function getDistance(touch1, touch2) {
		let dx = touch2.clientX - touch1.clientX;
		let dy = touch2.clientY - touch1.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}
}
}

/************************************************************
 * Btn Mode Reader
 * Inital Script MangaReader 
 ************************************************************/
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
		
		document.getElementById('ltr_rtl_vertical_div_cc').style.display = 'none';
		document.getElementById('longstrip_div_cc').style.display = 'none';
		
		if (data_mode === 'longstrip') {
			document.getElementById('longstrip_div_cc').style.display = 'block';
		} else {
			document.getElementById('ltr_rtl_vertical_div_cc').style.display = 'block';
		}
		
		if (!window.reader) {
			window.reader = new MangaReader(_set_options_mode_reading);
		}
		setTimeout(() => {
		location.reload();
		}, 1000);
	});
});