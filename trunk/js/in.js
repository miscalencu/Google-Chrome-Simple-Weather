function OpenWeatherPopup() {
	var w = 740;
	var h = 480;
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

	sw_iframeContainer.style.width = w + "px";
	sw_iframeContainer.style.height = h + "px";

	sw_iframeContainer.innerHTML = "<iframe class=\"sw_framepopup\" id=\"sw_framepopup\" name=\"sw_framepopup\" frameborder=\"0\" width=\"" + w + "\" height=\"" + h + "\" src=\"" + url + "\"></iframe>";
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
	
	document.addEventListener("keyup", function (e) {
		if (e.keyCode == 27) {   // esc
			CloseWeatherPopup();
		}
	});

	document.addEventListener("click", function (e) {
		CloseWeatherPopup(); // mouse click
	});

	// does not work without the timeout
	setTimeout(document.getElementById("sw_framepopup").focus(), 100);
	
	weatherOpened = true;
	return;
}

function CloseWeatherPopup() {
	var sw_iframeContainer = document.getElementById("simple_weather_splash_wrapper_popup");
	sw_iframeContainer.style.display = "none";
	weatherOpened = false;
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
	if (e.altKey && e.keyCode == 87) {  // alt + w
		OpenWeatherPopup();
	}
});

(function () {
	var weatherOpened = false;
	chrome.extension.sendMessage({ message: "reset_timeout_required" }, function (response) { 
		// console.log("'reset_timeout_required' sent ... " + response.status + " received!"); 
		if(response.status == "YES") {
			chrome.extension.sendMessage({ message: "reset_timeout" }, function () 	{ 	console.log("'reset_timeout' sent ..."); 	});
			}
	});
})();