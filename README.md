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

4. Mini dots: Navigasi cepat dengan slide dots kecil

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

#### 0. Pasang library Asset 
 **Swiper & BottomSheet**:
   1. Tambahkan di bagian `<head>`.
   ```html
     <!--swiper-->
     <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
     <!--bottomshet-->
     <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/MagicReincarnation/Manga-Reader-blogspot@main/asset/BottomSheet_v2/bottomSheet.css">
    ```
  2. Tambahkan di atas `</body>`.
    ```html
    <!--swiper-->
    <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
    <!--bottomshet-->
    <script src="https://cdn.jsdelivr.net/gh/MagicReincarnation/Manga-Reader-blogspot@main/asset/BottomSheet_v2/bottomSheet.js" type="text/javascript" charset="utf-8"></script>
    ```

#### 1. Tambahkan elemen di HTML (postingan chapter):
 ```html
<!--Filter label agar bisa mendapatkan label judul series, jika terdapat label lain masukan disini-->
<b:with value='["Chapter"]' var='checkLabel'>
	<b:if cond='data:post.labels any (i => i.name in data:checkLabel)'>
		<b:loop values='data:post.labels filter (i => i.name not in data:checkLabel)' var='l'>
			<div class="mode_manga_reader" expr:data-label="data:l.name">
				<!-- Swipe ltr_rtl_vertical_div_cc -->
				<div class="swiper-container" id="ltr_rtl_vertical_div_cc">
					<div class="swiper_init_divbox">
						<div class="swiper-wrapper">
							<!-- Slide akan diinject oleh JS -->
						</div>
						<div class="swiper-button-prev"></div>
						<div class="swiper-button-next"></div>
					</div>
				</div>
				<!-- Scroll longstrip -->
				<div class="longstrip-container" id="longstrip_div_cc" style="display:none;">
					<div class="longstrip_box" id="longstrip_box">
						<!-- Slide longstrip akan diinject oleh JS -->
					</div>
				</div>
			</div>
			<div class="layout_set_navigasi box_controls_mode">
				<div class="showmenu_next_prev">
					<!-- Slide dots mini_preview_ltr_rtl_vertical_div_cc -->
					<div class="mini-preview bottom" id="mini_preview_ltr_rtl_vertical_div_cc"></div>
					<div class="mini-preview left" id="mini_preview_longstrip_div_cc"></div>
					<!-- Slide dots mini_preview_longstrip_div_cc -->
				</div>
			</div>
			<div class="setting_menu_bottom box_controls_mode">
				<button class="btn_opensheet" id="btn_opensheetSet" type="button"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 1024 1024">
						<path fill="currentColor" d="m924.8 625.7l-65.5-56c3.1-19 4.7-38.4 4.7-57.8s-1.6-38.8-4.7-57.8l65.5-56a32.03 32.03 0 0 0 9.3-35.2l-.9-2.6a443.7 443.7 0 0 0-79.7-137.9l-1.8-2.1a32.12 32.12 0 0 0-35.1-9.5l-81.3 28.9c-30-24.6-63.5-44-99.7-57.6l-15.7-85a32.05 32.05 0 0 0-25.8-25.7l-2.7-.5c-52.1-9.4-106.9-9.4-159 0l-2.7.5a32.05 32.05 0 0 0-25.8 25.7l-15.8 85.4a351.9 351.9 0 0 0-99 57.4l-81.9-29.1a32 32 0 0 0-35.1 9.5l-1.8 2.1a446 446 0 0 0-79.7 137.9l-.9 2.6c-4.5 12.5-.8 26.5 9.3 35.2l66.3 56.6c-3.1 18.8-4.6 38-4.6 57.1c0 19.2 1.5 38.4 4.6 57.1L99 625.5a32.03 32.03 0 0 0-9.3 35.2l.9 2.6c18.1 50.4 44.9 96.9 79.7 137.9l1.8 2.1a32.12 32.12 0 0 0 35.1 9.5l81.9-29.1c29.8 24.5 63.1 43.9 99 57.4l15.8 85.4a32.05 32.05 0 0 0 25.8 25.7l2.7.5a449.4 449.4 0 0 0 159 0l2.7-.5a32.05 32.05 0 0 0 25.8-25.7l15.7-85a350 350 0 0 0 99.7-57.6l81.3 28.9a32 32 0 0 0 35.1-9.5l1.8-2.1c34.8-41.1 61.6-87.5 79.7-137.9l.9-2.6c4.5-12.3.8-26.3-9.3-35M788.3 465.9c2.5 15.1 3.8 30.6 3.8 46.1s-1.3 31-3.8 46.1l-6.6 40.1l74.7 63.9a370 370 0 0 1-42.6 73.6L721 702.8l-31.4 25.8c-23.9 19.6-50.5 35-79.3 45.8l-38.1 14.3l-17.9 97a377.5 377.5 0 0 1-85 0l-17.9-97.2l-37.8-14.5c-28.5-10.8-55-26.2-78.7-45.7l-31.4-25.9l-93.4 33.2c-17-22.9-31.2-47.6-42.6-73.6l75.5-64.5l-6.5-40c-2.4-14.9-3.7-30.3-3.7-45.5c0-15.3 1.2-30.6 3.7-45.5l6.5-40l-75.5-64.5c11.3-26.1 25.6-50.7 42.6-73.6l93.4 33.2l31.4-25.9c23.7-19.5 50.2-34.9 78.7-45.7l37.9-14.3l17.9-97.2c28.1-3.2 56.8-3.2 85 0l17.9 97l38.1 14.3c28.7 10.8 55.4 26.2 79.3 45.8l31.4 25.8l92.8-32.9c17 22.9 31.2 47.6 42.6 73.6L781.8 426zM512 326c-97.2 0-176 78.8-176 176s78.8 176 176 176s176-78.8 176-176s-78.8-176-176-176m79.2 255.2A111.6 111.6 0 0 1 512 614c-29.9 0-58-11.7-79.2-32.8A111.6 111.6 0 0 1 400 502c0-29.9 11.7-58 32.8-79.2C454 401.6 482.1 390 512 390s58 11.6 79.2 32.8A111.6 111.6 0 0 1 624 502c0 29.9-11.7 58-32.8 79.2" />
					</svg></button>
			</div>
			<!-- BottomSheet HTML -->
			<div id="bottomSheet_MangaReader" class="sheet_menu_mangareader">
				<div class="box_bar_drag_Sheet">
					<span class="bar_drag_Sheet"></span>
				</div>
				<div class="head_sheet">
					<h3>Setting</h3>
				</div>
				<div class="bottom-sheet-content">
					<span class="title_set">Mode Reading</span>
					<div class="reading-modes">
						<button class="mode-btn" data-mode="rtl">️<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
								<path fill="currentColor" d="M3.616 19q-.691 0-1.153-.462T2 17.384V6.616q0-.691.463-1.153T3.616 5h1.807q.69 0 1.153.463t.463 1.153v10.769q0 .69-.463 1.153T5.423 19zm7.423 0q-.691 0-1.153-.462t-.463-1.153V6.615q0-.69.463-1.152T11.039 5h9.346q.69 0 1.153.463T22 6.616v10.769q0 .69-.462 1.153T20.385 19z" />
							</svg>Pages (rigth to left)</button>
						<button class="mode-btn" data-mode="ltr"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
								<g transform="scale(-1, 1) translate(-24, 0)">
									<path fill="currentColor" d="M3.616 19q-.691 0-1.153-.462T2 17.384V6.616q0-.691.463-1.153T3.616 5h1.807q.69 0 1.153.463t.463 1.153v10.769q0 .69-.463 1.153T5.423 19zm7.423 0q-.691 0-1.153-.462t-.463-1.153V6.615q0-.69.463-1.152T11.039 5h9.346q.69 0 1.153.463T22 6.616v10.769q0 .69-.462 1.153T20.385 19z" />
								</g>
							</svg>Pages (left to rigth)</button>
						<button class="mode-btn" data-mode="vertical"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
								<path fill="currentColor" d="M22 11H2v2h20zm-4-4H6V4h12zm2-3a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zm-2 11a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z" />
							</svg>Pages (vertical)</button>
						<button class="mode-btn" data-mode="longstrip"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
								<path fill="currentColor" d="M16 5.846c2.828 0 4.243 0 5.121.901C22 7.65 22 9.1 22 12s0 4.351-.879 5.253c-.878.9-2.293.9-5.121.9H8c-2.828 0-4.243 0-5.121-.9C2 16.35 2 14.9 2 12s0-4.351.879-5.253c.878-.9 2.293-.9 5.121-.9z" />
								<path fill="currentColor" fill-rule="evenodd" d="M20.25 2.77a.76.76 0 0 1-.75.768h-15a.76.76 0 0 1-.75-.769A.76.76 0 0 1 4.5 2h15a.76.76 0 0 1 .75.77m0 18.46a.76.76 0 0 1-.75.77h-15a.76.76 0 0 1-.75-.77a.76.76 0 0 1 .75-.768h15a.76.76 0 0 1 .75.769" clip-rule="evenodd" />
							</svg>Pages (longstrip)</button>
					</div>
					<span class="title_set">Background color</span>
					<div>Coming soon</div>
				</div>
			</div>
			<div class="box_panelinfo">
				<span id="page_panel_active_info">1/0</span>
			</div>
		</b:loop>
	</b:if>
</b:with>
```
#### 2. Tambahkan script dibawah ini tepat diatasnya `</body>` untuk menjalankan MangaReader:

```javascript
//<script type="text/javascript">
/*<![CDATA[*/
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
  const _set_options_mode_reading = {
   
   seriesId: document.querySelector('.mode_manga_reader')?.dataset.label || "", // label series untuk membedakan mode tiap series
   
   pages: _link_manga_hr, // link gambad
   
   mode: 'rtl', // default; bisa diubah lewat tombol mode
   timer_auto_Hidebox: 0, // 0 = 1 jam 
   
   // fitur click next prev page
   click_screen: {
    active: true, // fitur:  true = on, false = off 
    type: "screen", // type : "screen", "button"
    reverse: false, // reverse click screen:  true = on, false = off 
   },
   
   panelStart_panelEnd: true, // Show panel start dan penel end
   
   configNextprev: {
    show_nextPrev: true, // Show link next prev chapter 
    mode: "spa", // mode: "spa" atau "normal"
    max: 30,
    start: 1,
    labelMain: "Series",
    site: "https://www.mikoroku.com", // kosongkan untuk default
    classSelector: ".mode_manga_reader",
    selector_postbody: ".post-body img",
    modif_title_Chapter: ["([vV]olume|[cC]hapter|[pP]rolog[ue]?|[eE]pisode|[sS]eason|[cC]h|[vV]ol|[eE]p|[sS])\\s*\\d+(?=[\\s\\W]|$)(.*)"], //Regex Filter Title Chapter/Episode/Volume dll.
    replaceList_ch: [
     { target: "Volume", change_to: 'Vol' },
     { target: "Season", change_to: 'S' },
    ], // Replace penyingkat judul Chapter/Episode/Volume dll.
    textError: "Error",
   },
   
   resolusi: {
    compresResolusi: true, // fitur replace sxx > resolusi_higth
    s_resolusi: '/s1600-rw/', //default reso 
    resolusi_higth: '/s1600-rw/', // higth reso
    resolusi_low: '/s160-rw/', // low reso (thumb lazy)
    regex: new RegExp("/[swh]\\d{2,4}(?:-[swh]\\d{2,4})?(?:-c)?(?:-rw)?/", "gi"), //custom regex
   },
  };
  document.addEventListener('DOMContentLoaded', () => {
   window.reader = new MangaReader(_set_options_mode_reading);
  });
  
  /* Script BottomSheet */
  const bottomSheet_MangaReader = new BottomSheet({ el: '#bottomSheet_MangaReader' });
  document.getElementById('btn_opensheetSet')?.addEventListener('click', () => {
   bottomSheet_MangaReader.open();
  });
  document.querySelectorAll('.mode-btn')?.forEach(button => {
   button.addEventListener('click', () => {
    bottomSheet_MangaReader.close();
   });
  });
		/*]]>*/
//</script>
```

#### 3. pasang Mainscriptnya dibawah config. 
    entah dihost lewat cdn/langsung keblog.
    atau bisa pakai aja ini yang sudah dihost
    ```html 
    <script src="https://cdn.jsdelivr.net/gh/MagicReincarnation/Manga-Reader-blogspot@latest/main.min.js" type="text/javascript"></script>
    ```
#### 4. MANUAL POST: Letakan kode dibawah ini dipostingan (isi dengan link gambar)
  
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
## Version now 4.0.0
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

### v4.0.0
  1. Mengganti mini preview dengan slider dots 
  2. Menambahkan next prev button 
  3. Menambahkan menu sidebar bottom 
  4. Menambahkan Mode Single page next prev & Normal Mode
  5. Merubah struktur configurasi
  6. Mengupdate fitur [zoom longstrip, click scroll, click next prev]
  7. Menambahkan Libary BottomSheet sebagai menu setting Mode baca
  8. Meningkatkan akurasi hitung halaman saat ini 
___

#  Lisensi & Credit

## Credit:

1. Hirutshuji 
2. Roka

## Lisensi MIT:

🔹 Bebas digunakan & dimodifikasi: harap jangan dihapus Credit.

