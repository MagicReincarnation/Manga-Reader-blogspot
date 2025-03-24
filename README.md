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
    <button class="mode-btn" data-mode="ltr">LTR</button>
    <button class="mode-btn" data-mode="rtl">️RTL</button>
    <button class="mode-btn" data-mode="vertical">Vertical</button>
    <button class="mode-btn" data-mode="longstrip">Longstrip</button>
   </div>
  </div>
  
  <!-- Swiper -->
  <div class="swiper-container" id="ltr_rtl_vertical_div_cc">
   <div class="swiper_init_divbox">
    <div class="swiper-wrapper">
     <!-- Slide akan diinject oleh JS -->
    </div>
    <div class="swiper-button-prev"></div>
    <div class="swiper-button-next"></div>
   </div>
  </div>
  
  <div class="mini-preview bottom" id="mini_preview_ltr_rtl_vertical_div_cc"></div>
  
  
  <!-- Longstrip -->
  <div class="longstrip-container" id="longstrip_div_cc" style="display:none;">
   <div class="longstrip_box" id="longstrip_box">
    <!-- Slide longstrip akan diinject oleh JS -->
   </div>
  </div>
  
  <div class="mini-preview left" id="mini_preview_longstrip_div_cc"></div>
  
 </div>
 
 
 <div class="box_panelinfo">
  <span id="page_panel_active_info">1/0</span>
 </div>
 
   </b:loop>
  </b:if>
 </b:with>
```
2. Tambahkan script dibawah di d atasnya `</body>` untuk menjalankan MangaReader:

```javascript
 <script type="text/javascript">
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
// Ambil seriesId dari data attribute
/********** run Script MangaReader **********/
const _set_options_mode_reading = {
 seriesId: document.querySelector('.mode_manga_reader')?.dataset.label || "", // label series untuk membedakan mode tiap series
 pages: _link_manga_hr, // link gambad
 // mode: 'rtl', // default; bisa diubah lewat tombol mode
 // startIndex: 0, // start panel
 // lazyBatch: 1,  // lazybatch pertama kali load.
 // timer_loader: 500, // timer hidden loader
 // compresResolusi: true, // fitur replace sxx > resolusi_higth
 // resolusi_higth: 's1600', // higth reso
 // resolusi_low: 's160', // low reso (thumb lazy)
 // s_resolusi: "s1600", //default reso 
 // default_url: "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=", //custom img transparant lazy
 // custom_lazyimage_mini_preview_ltr_rtl_vertical_div_cc: "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=",// custom img transparant mini preview lazy
 // custom_regexURL: /s\d{2,4}/g, //custom regex
};
// run: MangaReader Mode default saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
      window.reader = new MangaReader(_set_options_mode_reading);
});
		/*]]>*/
	</script>
```

3. pasang Mainscriptnya dibawah config. 
    entah dihost lewat cdn/langsung keblog.
    atau bisa pakai aja ini yang sudah dihost
    ```html 
    <script src="https://cdn.jsdelivr.net/gh/MagicReincarnation/Manga-Reader-blogspot@main/main.js" type="text/javascript"></script>
    ```
4. Letakan kode dibawah ini dipostingan (isi dengan link gambar)
  
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

