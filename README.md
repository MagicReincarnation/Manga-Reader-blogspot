# MangaReader

MangaReader untuk membaca manga dengan berbagai mode, termasuk longstrip, RTL, LTR, dan vertikal. Fitur ini juga mendukung zoom, swipe, dan mini preview untuk navigasi yang lebih mudah.

# Demo 
  * Link v3.3: [Video](https://youtu.be/YvrSovTGqgg?si=s4_Y7WUmfRfpKAFj)
  * Live Demo: [Manga Reader](https://magicreincarnation.github.io/Manga-Reader-blogspot/)
  * Generator Link: [Generator converter](https://magicreincarnation.github.io/Manga-Reader-blogspot/Generator%20link/Generator.html)
---

# Fitur Utama

1. Mode Baca: Longstrip, RTL, LTR, Vertikal

2. Lazy Load: Menghemat kuota dengan memuat gambar hanya saat diperlukan

3. Zoom Gesture: Pinch Zoom untuk mode longstrip dan double tap untuk mode RTL, LTR, Vertikal (Zoom in/out gambar Dioptimalkan untuk perangkat mobile)

4. Mini Preview: Navigasi cepat dengan thumbnail kecil

5. Penyimpanan Mode {id}: Mode baca tersimpan di IndexedDB berdasarkan label seriesId: "mySeries"

6. Navigasi keyboard
   1. Keyboard **(Coming soon)**
     1. Left `<` : Halaman sebelumnya 
     2. Right `>` : Halaman berikutnya
   2. Touch
     1. Swipe left/right: Navigasi antar halaman 
     2. Tap left/right: Navigasi antar halaman
     
7. Preloading gambar & Animasi loading.

8. Smooth scrolling. 

---

# Cara pakai

0. Pasang library Swiper:
   1. Tambahkan di bagian `<head>`.
   ```html
     <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
    ```
    2. Tambahkan di atas `</body>`.
    ```html
    <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
    ```

1. Tambahkan elemen ini di HTML (html article chapter manga):
 ```html
<!--Buang label Chapter agar bisa mendapatkan label judul series, jika terdapat label lain masukan disini-->
<b:with value='["Chapter"]' var='checkLabel'>
  <b:if cond='data:post.labels any (i => i.name in data:checkLabel)'>
    <b:loop values='data:post.labels filter (i => i.name not in data:checkLabel)' var='l'>
      <div class="mode_manga_reader" expr:data-label="data:l.name">
        <div class="box_controls_mode">
          <div class="reading-modes">
            <button class="mode-btn" data-mode="ltr"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <g transform="scale(-1, 1) translate(-24, 0)">
                  <path fill="currentColor" d="M3.616 19q-.691 0-1.153-.462T2 17.384V6.616q0-.691.463-1.153T3.616 5h1.807q.69 0 1.153.463t.463 1.153v10.769q0 .69-.463 1.153T5.423 19zm7.423 0q-.691 0-1.153-.462t-.463-1.153V6.615q0-.69.463-1.152T11.039 5h9.346q.69 0 1.153.463T22 6.616v10.769q0 .69-.462 1.153T20.385 19z" />
                </g>
              </svg>Left to rigth</button>
            <button class="mode-btn" data-mode="rtl">️<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path fill="currentColor" d="M3.616 19q-.691 0-1.153-.462T2 17.384V6.616q0-.691.463-1.153T3.616 5h1.807q.69 0 1.153.463t.463 1.153v10.769q0 .69-.463 1.153T5.423 19zm7.423 0q-.691 0-1.153-.462t-.463-1.153V6.615q0-.69.463-1.152T11.039 5h9.346q.69 0 1.153.463T22 6.616v10.769q0 .69-.462 1.153T20.385 19z" />
              </svg>Rigth to left</button>
            <button class="mode-btn" data-mode="vertical"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22 11H2v2h20zm-4-4H6V4h12zm2-3a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zm-2 11a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z" />
              </svg> Vertical</button>
            <button class="mode-btn" data-mode="longstrip"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path fill="currentColor" d="M16 5.846c2.828 0 4.243 0 5.121.901C22 7.65 22 9.1 22 12s0 4.351-.879 5.253c-.878.9-2.293.9-5.121.9H8c-2.828 0-4.243 0-5.121-.9C2 16.35 2 14.9 2 12s0-4.351.879-5.253c.878-.9 2.293-.9 5.121-.9z" />
                <path fill="currentColor" fill-rule="evenodd" d="M20.25 2.77a.76.76 0 0 1-.75.768h-15a.76.76 0 0 1-.75-.769A.76.76 0 0 1 4.5 2h15a.76.76 0 0 1 .75.77m0 18.46a.76.76 0 0 1-.75.77h-15a.76.76 0 0 1-.75-.77a.76.76 0 0 1 .75-.768h15a.76.76 0 0 1 .75.769" clip-rule="evenodd" />
              </svg> Longstrip</button>
          </div>
        </div>
        <div class="swiper-container" id="ltr_rtl_vertical_div_cc">
          <div class="swiper_init_divbox">
            <div class="swiper-wrapper">
            </div>
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
          </div>
        </div>
        <div class="mini-preview bottom" id="mini_preview_ltr_rtl_vertical_div_cc"></div>
        <div class="longstrip-container" id="longstrip_div_cc" style="display:none;">
          <div class="longstrip_box" id="longstrip_box">
          </div>
        </div>
        <div class="mini-preview left" id="mini_preview_longstrip_div_cc"></div>
      </div>
      <div class="box_panelinfo">
        <span id="page_panel_active_info">1/</span>
      </div>
    </b:loop>
  </b:if>
</b:with>
```
2. Tambahkan script dibawah di d atasnya `</body>` untuk menjalankan MangaReader:

```javascript
//<script type="text/javascript">
/*<![CDATA[*/
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
 const _set_options_mode_reading = {
	
	seriesId: document.querySelector('.mode_manga_reader')?.dataset.label || "", // label series untuk membedakan mode tiap series
	
	pages: _link_manga_hr, // link gambad
	
	mode: 'rtl', // default mode
	timer_auto_Hidebox: 0, // 0 = 1 jam 
	reverse_use_click_screen: false, // reverse use_click_screen
	use_click_screen: true, // click to swipe 
	show_nextPrev: true, // chapter next prev.
	
	compresResolusi: true, // fitur replace sxx > resolusi_higth
	resolusi_higth: '/s1600-rw/', // higth reso
	resolusi_low: '/s160-rw/', // low reso (thumb lazy)
	s_resolusi: "/s1600-rw/", //default reso 
	_fitur_custom_regexURL: true, // active custom_regexURL
	custom_regexURL: /\/[swh]\d{2,4}(?:-[swh]\d{2,4})?(?:-c)?(?:-rw)?\//g, //custom regex
};
document.addEventListener('DOMContentLoaded', () => {
	window.reader = new MangaReader(_set_options_mode_reading);
});
		/*]]>*/
//</script>
```

3. pasang Mainscriptnya dibawah config. 
    entah dihost lewat cdn/langsung keblog.
    atau bisa pakai aja ini yang sudah dihost
    ```html 
    <script src="https://cdn.jsdelivr.net/gh/MagicReincarnation/Manga-Reader-blogspot@latest/main.min.js" type="text/javascript"></script>
    ```
4. MANUAL POST: Letakan kode dibawah ini dipostingan (isi dengan link gambar)
  
```javascript
 <script type="text/javascript">
		/*<![CDATA[*/
		let _link_manga_hr = [
		"manga1.jpg", 
		"manga2.jpg", 
		"manga3.jpg" 
		];
		/*]]>*/
	</script>
```

---
# Change Log 
## Version now 3.3.0
###  3.0.0 
  1. rilis awal.

### 3.1.0
  1. Fixbug regex resolusi url gambar blogspot.
  2. Mengupdate function Hidebox & zoom 

### v3.2.0 
  1. Update: mini preview tidak akan diclose saat sedang scroll.
  2. Meningkatkan function hidebox.
  3. Zoom sesuai titik jari.
  4. menghapus observer kode [zoom].
  5. Support Chapter next prev auto.

### v3.3.0 
  1. Menambahkan Info chapter/Mode 
  2. Update Next prev auto 
  3. Update code Mini preview 
  4. Menambahkan tap to scroll (lrt/rtl/vertical/longstrip)
  5. Update zoom 2 jari di mode longstrip
  6. menambahkan default setting config.
  7. Mengoptimalkan option MangaReader.
___

#  Lisensi & Credit

## Credit:

1. Hirutshuji 
2. Roka

## Lisensi MIT:

🔹 Bebas digunakan & dimodifikasi: harap jangan dihapus Credit.

