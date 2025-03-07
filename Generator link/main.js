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
 	return JSON.parse(localStorage.getItem("selectors"))?.[check_domain] || { article: "", image: "" };
 }
 
 function save_local_selector(check_domain, tag_article_selector, tag_img_selector) {
 	let selectors = JSON.parse(localStorage.getItem("selectors")) || {};
 	selectors[check_domain] = { article: tag_article_selector, image: tag_img_selector };
 	localStorage.setItem("selectors", JSON.stringify(selectors));
 }
 
 function edit_local_selector() {
 	const postUrl = document.getElementById("postUrl").value;
 	const check_domain = get_domain_urlpostCh(postUrl);
 	if (!check_domain) {
 		alert("URL tidak valid!");
 		return;
 	}
 	
 	const tag_article_selector = document.getElementById("tag_article_selector").value.trim();
 	const tag_img_selector = document.getElementById("tag_img_selector").value.trim();
 	
 	if (!tag_article_selector || !tag_img_selector) {
 		alert("Masukkan selector terlebih dahulu!");
 		return;
 	}
 	
 	save_local_selector(check_domain, tag_article_selector, tag_img_selector);
 	alert("Selector berhasil diperbarui!");
 }
 
 function run_load_selector() {
 	const postUrl = document.getElementById("postUrl").value;
 	const check_domain = get_domain_urlpostCh(postUrl);
 	if (!check_domain) return;
 	
 	const local_selector = load_local_selector(check_domain);
 	document.getElementById("tag_article_selector").value = local_selector.article || "";
 	document.getElementById("tag_img_selector").value = local_selector.image || "";
 }
 
async function generate_mode_link() {
	const postUrl = document.getElementById("postUrl").value;
	const btn_getlink = document.getElementById("run_getlink");
	let tag_article_selector = document.getElementById("tag_article_selector").value.trim();
	let tag_img_selector = document.getElementById("tag_img_selector").value.trim();
	
	if (!postUrl) {
		alert("Masukkan URL post Blogger terlebih dahulu!");
		return;
	}
	
	const check_domain = get_domain_urlpostCh(postUrl);
	if (!check_domain) {
		alert("URL tidak valid!");
		return;
	}
	
	const local_selector = load_local_selector(check_domain);
	if (!tag_article_selector) tag_article_selector = local_selector.article;
	if (!tag_img_selector) tag_img_selector = local_selector.image;
	
	if (!tag_article_selector || !tag_img_selector) {
		alert("Masukkan selector artikel dan gambar terlebih dahulu!");
		return;
	}
	
	try {
		btn_getlink.innerHTML = "loading pls wait..";
		btn_getlink.setAttribute("disabled", "disabled");
		const proxyUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(postUrl);
		const response = await fetch(proxyUrl);
		const html_content = await response.text();
		
		const parser = new DOMParser();
		const doc = parser.parseFromString(html_content, "text/html");
		
		const _link_manga_hr = [];
		const article = doc.querySelector(tag_article_selector) || doc;
		
		article.querySelectorAll(tag_img_selector).forEach(img => {
			
			const imgSrc = img.getAttribute("src").replace(/s\d{2,4}(-[a-z]{1,2}\d{2,4})?/g, 's2048');
			
			if (imgSrc) {
				_link_manga_hr.push(imgSrc);
			}
		});
		
		save_local_selector(check_domain, tag_article_selector, tag_img_selector);
		
		document.getElementById("output_linkmanga").value = `<script>\nconst _link_manga_hr = ${JSON.stringify(_link_manga_hr, null, 2)};\n<\/script>`;
		
		btn_getlink.innerHTML = "Get link success";
		btn_getlink.removeAttribute("disabled");
	} catch (error) {
		alert("Gagal mengambil data post!");
		console.error(error);
	}
}
 
 function generate_mode_manual() {
 	const html_content = document.getElementById("manualHtml").value.trim();
 	
 	if (!html_content) {
 		alert("Masukkan HTML terlebih dahulu!");
 		return;
 	}
 	
 	const parser = new DOMParser();
 	const doc = parser.parseFromString(html_content, "text/html");
 	
 	const _link_manga_hr = [];
 	
 	doc.querySelectorAll("img").forEach(img => {
 		const imgSrc = img.getAttribute("src").replace(/s\d{2,4}(-[a-z]{1,2}\d{2,4})?/g, 's2048');
 		if (imgSrc) {
 			_link_manga_hr.push(imgSrc);
 		}
 	});
 	
 	document.getElementById("output_linkmanga").value = `<script>\nconst _link_manga_hr = ${JSON.stringify(_link_manga_hr, null, 2)};\n<\/script>`;
 }
 
 function copyoutput_linkmanga() {
 	const output_linkmanga = document.getElementById("output_linkmanga");
 	output_linkmanga.select();
 	document.execCommand("copy");
 	alert("output_linkmanga berhasil disalin!");
 }
 
 document.getElementById("postUrl").addEventListener("input", run_load_selector);
 run_load_selector();