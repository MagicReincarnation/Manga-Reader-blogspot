 const fitur_custom_regex_url_convert = _config_mode_link.img.fitur_custom_regex_url_convert || false;
 const custom_regex_url_convert = _config_mode_link.img.custom_regex_url_convert || 'kosong tidak ada apa apa';
 const output_url = _config_mode_link.img.output_url || 's1600';
 let array_download = [];
 
 function switchTab(mode) {
 	document.querySelectorAll(".tab_gen button").forEach(btn => btn.classList.remove("active"));
 	document.querySelectorAll(".content").forEach(content => content.classList.remove("active"));
 	
 	document.querySelector(`.tab_gen button[data-mode="${mode}"]`)?.classList.add("active");
 	document.getElementById(mode)?.classList.add("active");
 }
 
 function get_domain_urlpostCh(url) {
 	try {
 		return new URL(url).hostname;
 	} catch {
 		return null;
 	}
 }
 
 function load_local_selector(check_domain) {
 	return JSON.parse(localStorage.getItem("selectors"))?.[check_domain] || { tag_post: "", image: "" };
 }
 
 function save_local_selector(check_domain, tag_article_selector, tag_img_selector) {
 	let selectors = JSON.parse(localStorage.getItem("selectors")) || {};
 	selectors[check_domain] = { tag_post: tag_article_selector, image: tag_img_selector };
 	localStorage.setItem("selectors", JSON.stringify(selectors));
 }
 
 function edit_local_selector() {
 	const postUrl = document.getElementById("postUrl").value;
 	const check_domain = get_domain_urlpostCh(postUrl);
 	if (!check_domain) {
 		alert("ID: URL tidak sesuai format.\n EN: URL is not formatted properly");
 		return;
 	}
 	
 	const tag_article_selector = document.getElementById("tag_article_selector").value.trim();
 	const tag_img_selector = document.getElementById("tag_img_selector").value.trim();
 	
 	if (!tag_article_selector || !tag_img_selector) {
 		alert("ID: Masukkan selector terlebih dahulu!.\n EN: Enter the selector first!");
 		return;
 	}
 	
 	save_local_selector(check_domain, tag_article_selector, tag_img_selector);
 	alert("ID: Selector berhasil diperbarui!.\n EN: Selector successfully updated!");
 }
 
 function run_load_selector() {
 	const postUrl = document.getElementById("postUrl").value;
 	const check_domain = get_domain_urlpostCh(postUrl);
 	if (!check_domain) return;
 	
 	const local_selector = load_local_selector(check_domain);
 	document.getElementById("tag_article_selector").value = local_selector.tag_post || "";
 	document.getElementById("tag_img_selector").value = local_selector.image || "";
 }
 
 
 document.addEventListener("DOMContentLoaded", function() {
 	const mode_get_link = document.getElementById("mode_get_link");
 	const _div_hidden = document.querySelector(".divhidden");
 	const _saved_mode = sessionStorage.getItem("select_mode");
 	if (mode_get_link && _saved_mode) {
 		mode_get_link.value = _saved_mode;
 		_div_hidden.style.display = _saved_mode === "selector" ? "block" : "none";
 	}
 	
 	if (mode_get_link && _div_hidden) {
 		mode_get_link.addEventListener("change", function() {
 			const select_mode_db = this.value;
 			_div_hidden.style.display = select_mode_db === "selector" ? "block" : "none";
 			sessionStorage.setItem("select_mode", select_mode_db);
 		});
 	}
 });
 
 async function generate_mode_link() {
 	const postUrl = encodeURI(document.getElementById("postUrl").value);
 	const btn_getlink = document.getElementById("run_getlink");
 	const mode = document.getElementById("mode_get_link")?.value || _config_mode_link.default_mode_selector;
 	
 	const preset_modelink = _config_mode_link.selector.hasOwnProperty(mode);
 	
 	let tag_article_selector = preset_modelink ?
 		_config_mode_link.selector[mode].tag_post :
 		document.getElementById("tag_article_selector")?.value.trim();
 	
 	let tag_img_selector = preset_modelink ?
 		_config_mode_link.selector[mode].img :
 		document.getElementById("tag_img_selector")?.value.trim();
 	
 	if (!postUrl) {
 		alert(
 			"ID: Masukkan URL post terlebih dahulu! \n EN: Enter the post URL first!");
 		return;
 	}
 	
 	btn_getlink.innerHTML = "Loading, please wait...";
 	btn_getlink.setAttribute("disabled", "disabled");
 	
 	let html_content = null;
 	for (let proxy of _config_mode_link.proxy) {
 		try {
 			const response = await fetch(proxy + postUrl);
 			if (!response.ok) throw new Error(`Proxy ${proxy} gagal!`);
 			html_content = await response.text();
 			break;
 		} catch (error) {
 			console.warn(error);
 		}
 	}
 	
 	if (!html_content) {
 		alert("Gagal mengambil data post! Coba lagi nanti. \n EN: Error to get post data! Please try again later.");
 		btn_getlink.innerHTML = "Try Again";
 		btn_getlink.removeAttribute("disabled");
 		return;
 	}
 	
 	try {
 		const parser = new DOMParser();
 		const doc = parser.parseFromString(html_content, "text/html");
 		let _link_manga_hr = [];
 		
 		// 🔹 Mode 1: Gunakan selector berdasarkan mode
 		if (tag_article_selector && tag_img_selector) {
 			const article = doc.querySelector(tag_article_selector);
 			if (article) {
 				article.querySelectorAll(tag_img_selector).forEach(img => {
 					const imgSrc = img.getAttribute("src");
 					if (imgSrc) _link_manga_hr.push(imgSrc);
 				});
 			}
 		}
 		
 		// 🔹 Mode 2: Westmanga (Script Parsing)
 		else if (mode === "westmanga") {
 			const target_div_element = doc.querySelector(".wrapper");
 			if (target_div_element) {
 				const extract_link = extract_manga_link(target_div_element.outerHTML);
 				document.getElementById("output_linkmanga").value = `<script>\nconst _link_manga_hr = ${extract_link};\n<\/script>`;
 				array_download = Array.isArray(extract_link) ? extract_link : JSON.parse(extract_link);
 				btn_getlink.innerHTML = "Get link success";
 				btn_getlink.removeAttribute("disabled");
 				return;
 			} else {
 				alert("ID: Chapter Manga tidak ditemukan!. \n EN: Manga Chapter not found!");
 			}
 		}
 		
 		if (_link_manga_hr.length > 0) {
 			document.getElementById("output_linkmanga").value = `<script>\nconst _link_manga_hr = ${JSON.stringify(_link_manga_hr, null, 4)};\n<\/script>`;
 			
 			array_download = Array.isArray(_link_manga_hr) ? _link_manga_hr : JSON.parse(_link_manga_hr);
 			btn_getlink.innerHTML = "Get link success";
 		} else {
 			alert("ID: Chapter tidak ditemukan!.\n EN: Chapter not found!");
 			btn_getlink.innerHTML = "Try Again";
 		}
 		
 		btn_getlink.removeAttribute("disabled");
 	} catch (error) {
 		alert("ID: Gagal Memproses data post! Coba lagi nanti. \n EN: Error to Process post data! Try again later");
 		console.error(error);
 		btn_getlink.innerHTML = "Try Again";
 		btn_getlink.removeAttribute("disabled");
 	}
 }
 
 const extract_manga_link = (htmlString) => {
 	const doc = new DOMParser().parseFromString(htmlString, "text/html");
 	const scripts = doc.querySelectorAll("script");
 	
 	for (let script of scripts) {
 		if (script.textContent.includes('"images":[')) {
 			try {
 				const jsonString = script.textContent.match(/\{.*\}/s)[0];
 				const jsonData = JSON.parse(jsonString);
 				const images = jsonData.sources?.[0]?.images || [];
 				return JSON.stringify(images, null, 4);
 			} catch (error) {
 				console.error("JSON Parsing Error:", error);
 			}
 		}
 	}
 	return "[]";
 };
 
 function generate_mode_manual() {
 	const html_content = document.getElementById("manualHtml").value.trim();
 	
 	if (!html_content) {
 		alert("ID: Masukkan URL post terlebih dahulu! \nEN: Enter the post URL first!");
 		return;
 	}
 	
 	const parser = new DOMParser();
 	const doc = parser.parseFromString(html_content, "text/html");
 	
 	const _link_manga_hr = [];
 	
 	doc.querySelectorAll("img").forEach(img => {
 		const imgSrc = fitur_custom_regex_url_convert ? img.getAttribute("src").replace(custom_regex_url_convert, ouput_url) : img.getAttribute("src");
 		if (imgSrc) {
 			_link_manga_hr.push(imgSrc);
 		}
 	});
 	
 	if (_link_manga_hr.length === 0) {
 		alert("ID: Tidak ada gambar yang ditemukan!\nEN: No images found!");
 		return;
 	}
 	
 	document.getElementById("output_linkmanga").value = `<script>\nconst _link_manga_hr = ${JSON.stringify(_link_manga_hr, null, 2)};\n<\/script>`;
 	
 	array_download = Array.isArray(_link_manga_hr) ? _link_manga_hr : JSON.parse(_link_manga_hr);
 }
 
 async function downloadChapter_zip() {
 	let e = new JSZip;
 	document.getElementById("_custom_title_download").style.display = "block", await new Promise(e => {
 		document.querySelector(".ntf_g_button.confirm").onclick = () => {
 			let t = document.getElementById("title-series").value.trim() || "Judul Series",
 				n = document.getElementById("title-chapter").value.trim() || "Chapter Unknown";
 			sessionStorage.setItem("titleSeries", t), document.getElementById("_custom_title_download").style.display = "none", e({
 				titleName: t,
 				chapterName: n
 			})
 		}, document.querySelector(".ntf_g_button.cancel").onclick = () => {
 			document.getElementById("_custom_title_download").style.display = "none", e({})
 		}
 	}).then(async ({
 		titleName: t,
 		chapterName: n
 	}) => {
 		if (!t || !n) {
 			alert("Judul dan Chapter tidak boleh kosong.");
 			return
 		}
 		let a = `chapter ${n}`,
 			l = e.folder(a) || e.folder(a),
 			o = document.getElementById("download_zip");
 		if (!Array.isArray(array_download) || 0 === array_download.length) {
 			alert("ID: Tidak ada gambar yang ditemukan untuk diunduh!\nEN: No images found to download!");
 			return
 		}
 		let r = ["https://api.allorigins.win/raw?url=", "https://api.codetabs.com/v1/proxy?quest=", "https://corsproxy.io/?"],
 			i = 0;
 		o.innerHTML = `Mengunduh... ${i}/${array_download.length}`;
 		let d = array_download.map((e, t) => new Promise(async n => {
 			let a = !1;
 			for (let d of r) try {
 				let u = await fetch(d + e);
 				if (!u.ok) throw Error("Gagal mengambil gambar");
 				let s = await u.blob(),
 					g = `image_${(t+1).toString().padStart(3,"0")}.jpg`;
 				l.file(g, s), i++, o.innerHTML = `Mengunduh... ${i}/${array_download.length}`, a = !0;
 				break
 			} catch (m) {
 				console.warn(`Proxy gagal: ${d} untuk gambar: ${e}`)
 			}
 			a || console.warn(`Gagal mengunduh gambar sepenuhnya: ${e}`), n()
 		}));
 		await Promise.all(d), e.generateAsync({
 			type: "blob"
 		}).then(e => {
 			let n = `${t}.zip`;
 			saveAs(e, n), alert("ID: Gambar berhasil diunduh!\nEN: Images downloaded successfully!"), o.innerHTML = "Download as ZIP"
 		}).catch(e => {
 			console.error("Gagal mengunduh atau menyimpan ZIP:", e), o.innerHTML = "Download as ZIP"
 		})
 	})
 }
 
 document.getElementById("download_zip").addEventListener("click", downloadChapter_zip);
 
 function copyoutput_linkmanga() {
 	const output_linkmanga = document.getElementById("output_linkmanga");
 	const originalValue = output_linkmanga.value;
 	navigator.clipboard.writeText(originalValue)
 		.then(() => {
 			alert("ID: Output berhasil disalin!\n EN: Output copied successfully!");
 			output_linkmanga.value = "";
 		})
 		.catch(() => alert("ID: Gagal menyalin output!\n EN: Error to copy output!"));
 }
 
 document.getElementById("postUrl").addEventListener("input", run_load_selector);
 run_load_selector();