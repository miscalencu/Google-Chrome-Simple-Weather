function OpenWeatherPopup() {
	var w = 600;
	var h = 400;
	var url = chrome.extension.getURL("popup.htm");

	var sw_splashContainer = document.getElementById("simple_weather_splash_wrapper_popup");
	var sw_imageContainer = document.getElementById("simple_weather_popupContainer");
	if (sw_splashContainer == null) {
		var sw_splashContainer = document.createElement("div");
		sw_splashContainer.className = "simple_weather_splash_wrapper";
		sw_splashContainer.id = "simple_weather_splash_wrapper_popup";
		sw_splashContainer.innerHTML = "<img alt=\"\" src=\"" + chrome.extension.getURL("images/opa50_black.png") + "\" width=\"5000\" height=\"5000\" />";
		document.body.appendChild(sw_splashContainer);

		sw_iframeContainer = document.createElement("div");
		sw_iframeContainer.style.position = "absolute";
		sw_iframeContainer.id = "simple_weather_popupContainer";
		sw_splashContainer.appendChild(sw_iframeContainer);
	}

	sw_iframeContainer.style.width = (w + 14) + "px";
	sw_iframeContainer.style.height = (h + 14) + "px";

	sw_iframeContainer.innerHTML = "<iframe class=\"sw_framepopup\" frameborder=\"0\" width=\"" + w + "\" height=\"" + h + "\" src=\"" + url + "\"></iframe>";
	sw_splashContainer.style.display = "block";

	var myWidth = window.innerWidth, myHeight = window.innerHeight;
	var scrOfX = window.pageYOffset, scrOfY = window.pageXOffset;

	var Top = ((myHeight - h) / 2);
	var Left = ((myWidth - w) / 2);
	if (Top < 0)
		Top = 0;
	if (Left < 0)
		Top = 0;

	sw_iframeContainer.style.top = Top + "px";
	sw_iframeContainer.style.left = Left + "px";
	sw_iframeContainer.style.padding = "7px";

	document.addEventListener("keyup", function (e) {
		if (e.keyCode == 27) { CloseWeatherPopup(); }   // esc
	});

	document.addEventListener("click", function (e) {
		CloseWeatherPopup(); // mouse click
	});

	return;
}
function CloseWeatherPopup() {
	var sw_iframeContainer = document.getElementById("simple_weather_splash_wrapper_popup");
	sw_iframeContainer.style.display = "none";
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	console.log("message received ...");
	if (request.args == "open")	{ 
		OpenWeatherPopup();
		sendResponse("OK");
	}
	if (request.args == "close") {
		CloseWeatherPopup(false);
		sendResponse("OK");
	}
});

// close popup on Escape
window.addEventListener("message", function (e) {
	console.log("window message received ...");
	if (e.data.args === 'close') {
		CloseWeatherPopup(false); 
	}
});

// open popup on Alt + w
document.addEventListener("keyup", function (e) {
	if (e.altKey && event.keyCode == 87) 
		OpenWeatherPopup();
});