$(document).ready(function () {
	// if not newtab of Chrome, give up
	if (!(/chrome\/newtab/).test(document.location.href)) {
		return;
	}

	//$("<div />").attr("class", "weather_background").appendTo($("body"));
	$("body").wrapInner("<div class=\"weather_wrapper\"></div>");
	$("body").wrapInner("<div class=\"weather_background\"></div>");
	$("#mngb, #prpd").appendTo("body");
	$(".weather_wrapper").width("718px");
	$("<div/>").attr("id", "view_backdrop").addClass("glyphicon glyphicon-eye-open").css("background-image", "url('" + chrome.runtime.getURL("images/eye.png") + "'").attr("title", chrome.i18n.getMessage("popup_text_viewimage")).appendTo("body");
	$("<div/>").attr("id", "view_details").appendTo("body");

	chrome.runtime.sendMessage({ message: "content_script_loaded" }, function (response) {
		console.log("[in] response received ...");
		if (typeof response == "undefined")
			return;

		drawTopSites(response.TopSites);
		drawWeather(response.Weather, false);
	});

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        console.log("[in] message received ...");
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

			$(".weather_background").css("background-color", "rgb(52, 73, 94)");
			$(".weather_background").css("background-image", "url('" + request.url + "')");

			if (request.image_url != "") {
				$("#view_details").html("<a href='" + request.image_url + "' target='_blank'>" + request.url_text + " ...</a>");
			}
			else {
				$("#view_details").html("");
			}
		}
	});

	$("#view_backdrop").on("click", function () {
		if ($(".weather_wrapper").is(":visible")) {
			$(".weather_wrapper").slideUp("fast");
			$("#view_details").slideDown("fast");
		}
		else {
			$(".weather_wrapper").slideDown("fast");
			$("#view_details").slideUp("fast");
		}
	});
});

function setWeatherBackGroud(url, woeid) {
	
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
	var divTiles = $("#mv-tiles");
	var divWeather = $("<div />").attr("id", "weather-tiles");
	var divWeatherContent = "";
	if (isValidWeatherObject(weatherObj)) {
		divWeatherContent += "<iframe frameborder='0' src='" + chrome.runtime.getURL('weather.htm') + "' scrolling='no' style='width:100%;height:200px;margin-top:20px;' /></iframe>";
	}
	divWeather.html(divWeatherContent).appendTo(divTiles);
}

function ExtractDomain(url) {
	url = url.toLowerCase();
	url = url.replace("http://", "");
	url = url.replace("https://", "");
	url = url.replace("ftp://", "");
	return url.split("/")[0];
}