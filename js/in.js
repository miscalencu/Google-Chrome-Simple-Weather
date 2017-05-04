var loadingContentScript = true;

$(document).ready(function () {
	// if not newtab of Chrome, give up
	if (!(/chrome\/newtab/).test(document.location.href)) {
		return;
	}

	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
		console.log("[in] message received ...");

		if (loadingContentScript)
			return;

		if (request.action == "highlight") {
			// highlight weather area
			sendResponse("OK");
		}

		if (request.action == "redraw_topsites") {
			console.log("'redraw_topsites' received ...");
			drawTopSites(request.data);
		}

		if (request.action == "set_background") {
			console.log("'set_background' received ...");

			$(".weather_background").css("background-image", "url('" + request.url + "')");

			if (request.image_url != "") {
				var image_title = "";
				if (request.image_title != "")
					image_title = "<span>" + request.image_title + "</span><br />";

				$("#view_details").html(image_title + "<a href='" + request.image_url + "' target='_blank'>" + request.url_text + " ...</a>");
			}
			else {
				$("#view_details").html("");
			}
		}
	});

	chrome.runtime.sendMessage({ message: "content_script_loaded" }, function (response) {
		console.log("[in] response received ...");
		
		if (typeof response == "undefined")
			return;

		if (!isValidWeatherObject(response.Weather))
			return;

		if (typeof response.TopSites == "undefined" || response.TopSites.length == 0)
			return;

		loadCssFile(function () {
			drawContainers();
			drawTopSites(response.TopSites);
			drawWeather(response.Weather, false);
			addEvets();
			loadingContentScript = false;
		});
	});
});

function addEvets() {

	$(".weather_wrapper").show();
	$("#view_backdrop").on("click", function () {
		if ($(".weather_wrapper").is(":visible")) {
			$(".weather_wrapper").slideUp("fast");
			if ($("#view_details").html() != "") {
				$("#view_details").slideDown("fast");
			}
		}
		else {
			$(".weather_wrapper").slideDown("fast");
			$("#view_details").slideUp("fast");
		}
	});	
}

function loadCssFile(callback) {
	try {
		var cssId = "css_start_weather";
		if (!document.getElementById(cssId)) {
			var head = document.getElementsByTagName('head')[0];
			var link = document.createElement('link');
			link.rel = "stylesheet";
			link.type = "text/css";
			link.id = cssId;
			link.href = chrome.runtime.getURL("css/in.css");
			link.media = "all";
			head.appendChild(link);

			$("#" + cssId).on("load", function () {
				if (callback != undefined)
					callback();
			});
		}
	}
	catch (err) {
		console.log("Error: " + err);
	}
}

function drawContainers() {
	//$("<div />").attr("class", "weather_background").appendTo($("body"));
	$("body").wrapInner("<div class=\"weather_wrapper\"></div>");
	$("body").wrapInner("<div class=\"weather_background\"></div>");
	$("#mngb, #prpd").appendTo("body");
	$(".weather_wrapper").width("718px");
	$("<div/>").attr("id", "view_backdrop").addClass("glyphicon glyphicon-eye-open").css("background-image", "url('" + chrome.runtime.getURL("images/eye.png") + "'").attr("title", chrome.i18n.getMessage("popup_text_viewimage")).appendTo("body");
	$("<div/>").attr("id", "view_details").appendTo("body");
}

function drawTopSites(data) {
	var divTiles = $("#mv-tiles");
	var divTilesContent = "";
    for (var i = 0; i < data.length; i++) {
        var url = data[i].url;
		var title = data[i].title;
		var favicon_url = "https://www.google.com/s2/u/0/favicons?domain=" + ExtractDomain(url);
		divTilesContent += "<div class='mv-weather-tile'><a title='" + title + "' href='" + url + "' target='_top'><img border='0' alt='" + title + "' src='" + favicon_url + "' width=\"16\" height=\"16\" /> " + title + "</div>";
		if (i == 7)
			break;
	}
	divTiles.html(divTilesContent); //.attr("id", "mv-weather-tiles");
}

function drawWeather(weatherObj, showBadgeAnimation) {
	try {
		var divTiles = $("#mv-tiles");
		var divWeather = $("<div />").attr("id", "weather-tiles");
		var divWeatherContent = "";
		if (isValidWeatherObject(weatherObj)) {
			divWeatherContent += "<iframe frameborder='0' src='" + chrome.runtime.getURL('weather.htm') + "' scrolling='no' style='width:100%;height:200px;margin-top:20px;' /></iframe>";
		}
		divWeather.html(divWeatherContent).appendTo(divTiles);
	} catch (err) {
		console.log("ERROR: " + err);
	}
}

function ExtractDomain(url) {
	url = url.toLowerCase();
	url = url.replace("http://", "");
	url = url.replace("https://", "");
	url = url.replace("ftp://", "");
	url = url.replace("chrome-extension://", "");
	return url.split("/")[0];
}