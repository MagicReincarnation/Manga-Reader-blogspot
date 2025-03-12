/*!
 * Project: Manga Reader
 * Author: Hirutshuji
 * Patner: Roka
 * Website: https://datakodehiru.blogspot.com
 * Github Repo: https://github.com/MagicReincarnation/Manga-Reader-blogspot
 * Description: MangaReader untuk membaca manga dengan berbagai mode, termasuk longstrip, RTL, LTR, dan vertikal. Fitur ini juga mendukung zoom, swipe, dan mini preview untuk navigasi yang lebih mudah.
 * Version: 3.0.0
 * License: MIT
 * 
 * Created: 2025-03-06
 * Last Updated: 2025-03-06
 * 
 * Copyright (c) 2025 Hirutshuji & Roka
 * All rights reserved.
 */
/* Source Code Regex 
 * https://stackoverflow.com/questions/62802497/how-can-i-simplify-this-regular-expression-to-select-blogger-image-parameters
 */
class MangaReader {
	constructor(options) {
		this.seriesId = options.seriesId;
		this.panelManga = options.pages;
		this._mode_reading_hr = options.mode || 'rtl';
		this.active_panel_read = options.startIndex || 0;
		this.lazyload_bacth = options.lazyBatch || 3;
		this.timer_loader = options.timer_loader || 500;
		this.s_resolusi = options.s_resolusi || "s1600";
		this.compresResolusi = options.compresResolusi;
		this.default_url = options.default_url;
		this.custom_lazyimage_mini_preview_ltr_rtl_vertical_div_cc = options.custom_lazyimage_mini_preview_ltr_rtl_vertical_div_cc;
		this.resolusi_higth = options.resolusi_higth;
		this.resolusi_low = options.resolusi_low;
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
	
	let hide_timeout;
	let time_boxshow = 5000;
	function showbox_cc(event) {
		// Cek apakah box yang diklik adalah nextBtn atau prevBtn
		if (event.target === nextBtn || event.target === prevBtn) return;
		// Tampilkan elemen
		element_box.forEach(el => el?.style && (el.style.display = 'flex'));
		controls_mode_hr.forEach(el => el.style.display = 'flex');
		clearTimeout(hide_timeout);
		hide_timeout = setTimeout(() => {
			// Sembunyikan kembali setelah 5 detik (jika tidak sedang scroll)
			hidebox_cc();
		}, time_boxshow);
	}
	
	
	function hidebox_cc() {
  	element_box.forEach(el => el?.style && (el.style.display = 'none'));
	controls_mode_hr.forEach(el => el.style.display = 'none');
	}
	
	function reset_hidebox() {
		clearTimeout(hide_timeout);
		hide_timeout = setTimeout(() => {
			// Sembunyikan kembali setelah 3 detik (jika tidak sedang scroll)
			hidebox_cc();
		}, 3000);
	}
	
	// Menampilka box saat area diklik
[swiperEl, cc_e_longstrip, swiper_cc_hr, longstrip_cc_hr].forEach(el => {
	el?.addEventListener('click', (event) => {0
			showbox_cc(event);
	});
});
	
	// Mencegah penutupan saat scroll pada preview
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
		
		// Untuk mode RTL, set attribute dir pada container swiper
		if (this._mode_reading_hr === 'rtl') {
			swiperEl.setAttribute('dir', 'rtl');
		} else {
			swiperEl.removeAttribute('dir');
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
		
		this.hidebox();
	}
	
	load_chapter_image(panelManga, startIndex = 0) {
		this.panelManga = panelManga;
		this.total_panelmanga = panelManga.length;
		
		if (this.swiper_panel_hr) {
			this.swiper_panel_hr.removeAllSlides();
						// **panel pertama khusus**
			this.swiper_panel_hr.appendSlide(`
            <div class="swiper-slide end-panel">
                <div class="manga-page">
                <img  alt="Manga banner page" src="https://64.media.tumblr.com/fe5de7eaa145e2856a1c50d0c49a330e/6f1e23be289c9913-19/s540x810/b23a0b928a86d2b23f7cc1191e6991907c166cb3.gif">
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
			
			// **panel terakhir khusus**
			this.swiper_panel_hr.appendSlide(`
            <div class="swiper-slide end-panel">
                <div class="manga-page end-message">
                    <h2>Bersambung! Kamu telah mencapai panel akhir.</h2>
                    <p>Terima kasih telah membaca! Jangan lupa untuk komentar tentang chapter ini oke!🥳</p>
                    <button class="nextbtn" onclick="alert('Chapter Belum ada')">Next</button>
                    <button class="prevbtn" onclick="alert('Chapter Belum ada')">Prev</button>
                </div>
            </div>
        `);
			
			this.swiper_panel_hr.slideTo(startIndex, 0);
		}
		
		this.active_panel_read = startIndex;
		this.update_pageOf_panelManga();
		this._update_mini_preview_active();
		this._run_LazyLoad();
  // v2.1: Support Zoom sesuai titik tap. 
  document.querySelectorAll(".manga-page img").forEach(img => run_TachiyomiZoom(img));
	}
	
	/*========================================================
	Run mode longstrip
	=========================================================*/
	run_longstrip_mode() {
		const cc_e_longstrip = document.getElementById('longstrip_box');
		let slider_hr = "";
		
		slider_hr +=`<div class="longstrip-slide start-panel">
            <div class="manga-page">
            <img  alt="Manga banner page" src="https://64.media.tumblr.com/fe5de7eaa145e2856a1c50d0c49a330e/6f1e23be289c9913-19/s540x810/b23a0b928a86d2b23f7cc1191e6991907c166cb3.gif">
                </div>
            </div>`;
            
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
		
		// **panel terakhir khusus**
		slider_hr += `
      <div class="swiper-slide end-panel">
          <div class="manga-page end-message">
              <h2>Bersambung! Kamu telah mencapai panel akhir.</h2>
              <p>Terima kasih telah membaca! Jangan lupa untuk komentar tentang chapter ini oke!🥳</p>
              <button class="nextbtn" onclick="alert('Chapter Belum ada')">Next</button>
              <button class="prevbtn" onclick="alert('Chapter Belum ada')">Prev</button>
          </div>
      </div>
  `;
		
		// Set HTML setelah loop selesai
		cc_e_longstrip.innerHTML = slider_hr;
		
		this.total_panelmanga = this.panelManga.length;
		
		this.hidebox();
		
		// Pastikan observer dihentikan dulu jika sudah ada
		if (this.observer) {
			this.observer.disconnect();
		}
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}
		
		this.observer = new IntersectionObserver(this._longstripScroll.bind(this), {
			root: null,
			rootMargin: '0px',
			threshold: [1]
		});
		
		this.resizeObserver = new ResizeObserver(entries => {
			entries.forEach(entry => {
				if (entry.target) {
					this.observer.observe(entry.target);
				}
			});
		});
		
		document.querySelectorAll('.longstrip-slide img').forEach(img => {
			this.observer.observe(img);
			this.resizeObserver.observe(img);
		});
		
		this.update_pageOf_panelManga();
		this._update_mini_preview_active();
  // khusus longstrip
  run_pinch_SizeMargin();
	}
	
	_longstripScroll(panel_entry) {
		let index_panel_active = 0;
		let count_panel_terlewat = 0;
		
		panel_entry.forEach(entry => {
			const index = parseInt(entry.target.getAttribute('data-index'));
			
			if (entry.boundingClientRect.bottom < window.innerHeight) {
				count_panel_terlewat++;
			}
			
			if (entry.intersectionRatio > 0.5) {
				index_panel_active = index;
			}
		});
		
		requestAnimationFrame(() => {
			this.active_panel_read = index_panel_active;
			this.passed_panel_count = count_panel_terlewat;
			
			this.update_pageOf_panelManga();
			this._update_mini_preview_active();
		});
	}
	/*========================================================
	Hitung active / Jumlah totals panel Manga
	=========================================================*/
	update_pageOf_panelManga() {
		const pageInfo = document.getElementById('page_panel_active_info');
		pageInfo.textContent = `${this.active_panel_read + 1}/${this.total_panelmanga}`;
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
			
			return `<img data-src="${page}" data-index="${dataIndex}" alt="Preview ${dataIndex}" src="${this.custom_lazyimage_mini_preview_ltr_rtl_vertical_div_cc}" class="lazy">`;
		}).join('');
		
		// Klik untuk pindah panel Manga
		_mini_preview_ltr_rtl_vertical_div_cc_cc_hr.querySelectorAll('img').forEach(img => {
			img.addEventListener('click', (e) => {
				const idx = parseInt(e.target.dataset.index);
				this.active_panel_read = idx;
				
				if (this._mode_reading_hr === 'longstrip') {
					this._scrollToLongstrip(idx);
				} else if (this.swiper_panel_hr) {
					this.swiper_panel_hr.slideTo(idx, 300);
				}
				
				this._update_mini_preview_active();
			});
		});
		this._run_LazyLoad();
	}
	/**
	 * untuk scroll longstrip sesuai index mini preview
	 */
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
	
	/**
	 * tampilan mini preview agar thumbnail yang dipilih terlihat
	 */
	_update_mini_preview_active() {
		let _mini_preview_ltr_rtl_vertical_div_cc_cc = (this._mode_reading_hr === 'longstrip') ?
			document.getElementById('mini_preview_longstrip_div_cc') :
			document.getElementById('mini_preview_ltr_rtl_vertical_div_cc');
		
		const mini_preview_gambar = _mini_preview_ltr_rtl_vertical_div_cc_cc.querySelectorAll('img');
		
		let activeIndex_panel_hr = this.active_panel_read;
		
		let prevActive = _mini_preview_ltr_rtl_vertical_div_cc_cc.querySelector('.active');
		if (prevActive) prevActive.classList.remove('active');
		
		let activeThumb = _mini_preview_ltr_rtl_vertical_div_cc_cc.querySelector(`img[data-index="${activeIndex_panel_hr}"]`);
		if (activeThumb) {
			activeThumb.classList.add('active');
			
			// Auto scroll agar thumbnail aktif terlihat di tengah
			let container = _mini_preview_ltr_rtl_vertical_div_cc_cc;
			let offsetLeft = activeThumb.offsetLeft - (container.clientWidth / 2) + (activeThumb.clientWidth / 2);
			container.scrollLeft = offsetLeft;
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
	
}


/********** MINI PREVIEW **********/
function _mini_preview_panel_hr() {
	// Mini Preview untuk [vertical/LTR/RTL]
	const swiper_cc_hr = document.getElementById('ltr_rtl_vertical_div_cc');
	const mini_preview_element = document.getElementById('mini_preview_ltr_rtl_vertical_div_cc');
	
	if (swiper_cc_hr && mini_preview_element) {
		swiper_cc_hr.addEventListener('contextmenu', function(e) {
			e.preventDefault();
			mini_preview_element.style.display = (mini_preview_element.style.display === 'block') ? 'none' : 'block';
		});
		
		document.addEventListener('click', function(e) {
			if (!mini_preview_element.contains(e.target) && e.target !== swiper_cc_hr) {
				mini_preview_element.style.display = 'none';
			}
		});
	}
	
	// Mini Preview untuk Longstrip
	const longstrip_cc_hr = document.getElementById('longstrip_div_cc');
	const mini_preview_Longstrip_hr = document.getElementById('mini_preview_longstrip_div_cc');
	
	if (longstrip_cc_hr && mini_preview_Longstrip_hr) {
		longstrip_cc_hr.addEventListener('contextmenu', function(e) {
			e.preventDefault();
			mini_preview_Longstrip_hr.style.display = (mini_preview_Longstrip_hr.style.display === 'block') ? 'none' : 'block';
		});
		
		document.addEventListener('click', function(e) {
			if (!mini_preview_Longstrip_hr.contains(e.target) && e.target !== longstrip_cc_hr) {
				mini_preview_Longstrip_hr.style.display = 'none';
			}
		});
	}
	
	// Untuk box controls (btn navigation + box btn mode)
	const controls_mode_hr = document.querySelectorAll('.box_controls_mode');
	
	if (controls_mode_hr.length > 0) {
		document.addEventListener('contextmenu', function(e) {
			e.preventDefault();
			controls_mode_hr.forEach(control => {
				control.style.display = (getComputedStyle(control).display === 'none') ? 'flex' : 'none';
			});
		});
		
		document.addEventListener('click', function(e) {
			controls_mode_hr.forEach(control => {
				if (!control.contains(e.target)) {
					control.style.display = 'none';
				}
			});
		});
	}
}
// run: script setelah DOM selesai dimuat

// document.addEventListener('DOMContentLoaded', _mini_preview_panel_hr);

/********** 
 * SETUP Zoom in/out v2 
 * by Roka 
 * Keunggulan Perubahan Ini:
 * ✔ Zoom sesuai titik tap. 
 * ✔ Lebih smooth & responsif. 
 * ✔ Drag bisa dilakukan saat zoom aktif.
 * ✔ Mendukung pinch zoom dengan dua jari.
 * ✔ Tidak perlu obbserver lagi.
 **********/
 function run_TachiyomiZoom(img) {
	let scale = 1,
		lastScale = 1,
		isDragging = false,
		startX, startY,
		translateX = 0,
		translateY = 0,
		lastTouchTime = 0,
		originX = 50,
		originY = 50;
	
	let container = img.closest(".manga-page");
	
	// **Double Tap Zoom**
	img.addEventListener("touchend", (e) => {
		let now = new Date().getTime();
		if (now - lastTouchTime < 300) {
			e.preventDefault();
			let rect = img.getBoundingClientRect();
			let touch = e.changedTouches[0];
			
			// **Hitung posisi klik jari terhadap gambar**
			originX = ((touch.clientX - rect.left) / rect.width) * 100;
			originY = ((touch.clientY - rect.top) / rect.height) * 100;
			
			scale = scale > 1 ? 1 : 2.5;
			translateX = 0;
			translateY = 0;
			
			img.style.transition = "transform 0.3s ease";
			img.style.transformOrigin = `${originX}% ${originY}%`;
			img.style.transform = `scale(${scale}) translate(0px, 0px)`;
		}
		lastTouchTime = now;
	});
	
	// **Pinch Zoom Gesture**
	img.addEventListener("touchstart", (e) => {
		if (e.touches.length === 2) {
			e.preventDefault();
			let rect = img.getBoundingClientRect();
			let touch1 = e.touches[0];
			let touch2 = e.touches[1];
			
			// **Hitung titik tengah sentuhan**
			let midX = (touch1.clientX + touch2.clientX) / 2;
			let midY = (touch1.clientY + touch2.clientY) / 2;
			
			// **Konversi ke persentase posisi dalam gambar**
			originX = ((midX - rect.left) / rect.width) * 100;
			originY = ((midY - rect.top) / rect.height) * 100;
			
			img.style.transformOrigin = `${originX}% ${originY}%`;
			
			let dist = getDistance(touch1, touch2);
			lastScale = scale;
			img.dataset.startDistance = dist;
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
			let dist = getDistance(e.touches[0], e.touches[1]);
			let newScale = (dist / img.dataset.startDistance) * lastScale;
			scale = Math.min(Math.max(1, newScale), 3);
			img.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
		} else if (isDragging && e.touches.length === 1) {
			let moveX = e.touches[0].clientX - startX;
			let moveY = e.touches[0].clientY - startY;
			translateX = limitBounds(moveX, scale, img);
			translateY = limitBounds(moveY, scale, img);
			img.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
		}
	});
	
	img.addEventListener("touchend", () => {
		isDragging = false;
		img.style.cursor = "grab";
	});
	
	// **untuk mendapatkan jarak antara dua jari**
	function getDistance(touch1, touch2) {
		let dx = touch2.clientX - touch1.clientX;
		let dy = touch2.clientY - touch1.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}
	
	// **Batasan agar tidak keluar dari frame**
	function limitBounds(value, scale, img) {
		let maxMove = (img.offsetWidth * (scale - 1)) / 2;
		return Math.max(-maxMove, Math.min(value, maxMove));
	}
}

/********** 
 * SETUP Zoom in/out v2 untuk longstrip
 * by roka 
 * ✔ Mendukung pinch zoom dengan dua jari.
 **********/
function run_pinch_SizeMargin() {
	const containerLongStrip = document.querySelector('.longstrip_box');
	let startMarginLeft = 0;
	let startMarginRight = 0;
	let startDistance = 0;
	let startX = 0;
	let isPinching = false;
	const MAX_MARGIN = 120; // **Batas maksimal margin**
	const MIN_MARGIN_THRESHOLD = -20; // **Batas minimal untuk bisa geser satu jari**
	
	// **Ambil margin terakhir dari LocalStorage jika ada**
	let savedMarginLeft = parseFloat(localStorage.getItem('longstripMarginLeft')) || 0;
	let savedMarginRight = parseFloat(localStorage.getItem('longstripMarginRight')) || 0;
	
	containerLongStrip.style.marginLeft = `${savedMarginLeft}px`;
	containerLongStrip.style.marginRight = `${savedMarginRight}px`;
	
	// **Detect pinch zoom (dua jari)**
	containerLongStrip.addEventListener('touchstart', (e) => {
		if (e.touches.length === 2) {
			isPinching = true;
			startDistance = getDistance(e.touches[0], e.touches[1]);
			startMarginLeft = parseFloat(getComputedStyle(containerLongStrip).marginLeft) || 0;
			startMarginRight = parseFloat(getComputedStyle(containerLongStrip).marginRight) || 0;
		} else if (e.touches.length === 1) {
			// **Mulai geser dengan satu jari jika salah satu margin <= -20px MIN_MARGIN_THRESHOLD**
			isPinching = false;
			startX = e.touches[0].clientX;
			startMarginLeft = parseFloat(getComputedStyle(containerLongStrip).marginLeft) || 0;
			startMarginRight = parseFloat(getComputedStyle(containerLongStrip).marginRight) || 0;
		}
	});
	
	// **Pinch zoom (ubah margin keduanya)**
	containerLongStrip.addEventListener('touchmove', (e) => {
		if (e.touches.length === 2 && isPinching) {
			e.preventDefault();
			let newDistance = getDistance(e.touches[0], e.touches[1]);
			let moveFactor = (startDistance - newDistance) * 0.5; // **Dibalik arah zoom**
			let newMarginLeft = Math.max(-MAX_MARGIN, Math.min(startMarginLeft + moveFactor, MAX_MARGIN));
			let newMarginRight = Math.max(-MAX_MARGIN, Math.min(startMarginRight + moveFactor, MAX_MARGIN));
			
			containerLongStrip.style.marginLeft = `${newMarginLeft}px`;
			containerLongStrip.style.marginRight = `${newMarginRight}px`;
			
			localStorage.setItem('longstripMarginLeft', newMarginLeft);
			localStorage.setItem('longstripMarginRight', newMarginRight);
		} else if (e.touches.length === 1) {
			if (startMarginLeft > MIN_MARGIN_THRESHOLD && startMarginRight > MIN_MARGIN_THRESHOLD) return;
			
			let moveX = e.touches[0].clientX - startX;
			let newMarginLeft = startMarginLeft + moveX * 0.6;
			let newMarginRight = startMarginRight - moveX * 0.6;
			
			// **margin tetap berlawanan**
			if (newMarginLeft > 0 && newMarginRight < 0) {
				newMarginLeft = Math.max(0, newMarginLeft);
				newMarginRight = Math.min(0, newMarginRight);
			} else if (newMarginRight > 0 && newMarginLeft < 0) {
				newMarginRight = Math.max(0, newMarginRight);
				newMarginLeft = Math.min(0, newMarginLeft);
			}
			
			// **Update margin**
			containerLongStrip.style.marginLeft = `${newMarginLeft}px`;
			containerLongStrip.style.marginRight = `${newMarginRight}px`;
			
			localStorage.setItem('longstripMarginLeft', newMarginLeft);
			localStorage.setItem('longstripMarginRight', newMarginRight);
		}
	});
	
	// **Gunakan event dblclick untuk reset**
	containerLongStrip.addEventListener('dblclick', () => {
		resetMargin();
	});
	
	function resetMargin() {
		containerLongStrip.style.marginLeft = '0px';
		containerLongStrip.style.marginRight = '0px';
		localStorage.removeItem('longstripMarginLeft');
		localStorage.removeItem('longstripMarginRight');
	}
	
	function getDistance(touch1, touch2) {
		let dx = touch2.clientX - touch1.clientX;
		let dy = touch2.clientY - touch1.clientY;
		return Math.sqrt(dx * dx + dy * dy);
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
		if (window.reader) {
			if (window.reader.swiper) {
				window.reader.swiper.destroy(true, true);
			}
			window.reader = null;
		}
		// run: MangaReader berdasarkan mode yang dipilih
		window.reader = new MangaReader(_set_options_mode_reading);
		location.reload();
	});
});