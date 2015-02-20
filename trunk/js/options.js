var weatherObj = null;
var isDay = 1;

$(document).ready(function() {
	
	var locations = JSON.parse(getSettings("weatherLocations"));
	if(locations.length > 0) {
		GetWeather();
	}
	
	$("#showInC").on("click", function () {
		setSettings("weatherShowIn", "C");
		var locations = JSON.parse(getSettings("weatherLocations"));
		if(locations.length > 0) {
			GetWeather();
		}
	});

	$("#showInF").on("click", function () {
		setSettings("weatherShowIn", "F");
		var locations = JSON.parse(getSettings("weatherLocations"));
		if(locations.length > 0) {
			GetWeather();
			}
	});

	$("#updateTimeout").on("change", function () {
		setSettings("weatherTimeout", $(this).val());
		chrome.extension.sendMessage({ message: "update_timeout" }, function () { console.log("'updateTimeout' sent ..."); });
	});
	
	$("#imgLocation").on("change", function () {
		setSettings("imgLocation", $(this).val());
		fillPreviewIcons();
		if(weatherObj != null) {
			refreshBadge(weatherObj);
		}
	});

	$("#showLabels").on("click", function () {
		setSettings("weatherLabels", ($(this).is(":checked") ? '1' : '0'));
		if(weatherObj != null) {
			refreshBadge(weatherObj);
		}
	});

	$("#showExternal").on("click", function () { 
		setSettings("weatherShowLinks", ($(this).is(":checked") ? '1' : '0')); 
		if(weatherObj != null) {
			refreshBadge(weatherObj);
			}
	});

	$("#showDate").on("click", function () {
		setSettings("weatherDate", ($(this).is(":checked") ? '1' : '0'));
		if(weatherObj != null) {
			refreshBadge(weatherObj);
		}
	});
	
	$("#showReadDate").on("click", function () {
		setSettings("weatherReadDate", ($(this).is(":checked") ? '1' : '0'));
		refreshBadge(weatherObj);
	});

	$(".logo").on("click", function () {
	    switch (isDay) {
	        case 1:
	            $(this).find(".wi").removeClass("wi-day-cloudy");
	            $(this).find(".wi").addClass("wi-night-cloudy");
	            isDay = 0;
	            break;
	        case 0:
	            $(this).find(".wi").removeClass("wi-night-cloudy");
	            $(this).find(".wi").addClass("wi-cloudy");
	            isDay = -1;
	            break;
	        case -1:
	            $(this).find(".wi").removeClass("wi-cloudy");
	            $(this).find(".wi").addClass("wi-day-cloudy");
	            isDay = 1;
	            break;
	        default:
	            break
	    }

	    fillPreviewIcons();
	});

	$("#btnAdd").on("click", function () { checkNewLocation() } );
	$("#addLocationLink").on("click", function () { addLocation(); });

	fillValues();
	fillSkins();
	fillPreviewIcons();
	fillLocations();

	//getGeoPosition();
});


function getGeoPosition() {
	if (navigator.geolocation) {
		console.log('Geolocation is supported!');
		navigator.geolocation.getCurrentPosition(geoSuccess, geoError, { timeout: 10000, enableHighAccuracy: true, maximumAge:  60 * 60 * 1000 });
	}
	else {
		console.log('Geolocation is not supported for this Browser/OS version yet.');
	}
}

function geoSuccess(position) {
	console.log("Latitude: " + position.coords.latitude + ", Longitude: " + position.coords.longitude);
}

function geoError(error) {
	console.log('Error occurred. Error code: ' + error.code + " (" + error.message + ")");
}

function fillPreviewIcons() {
	var icons = new Array(49);
	var foldericons = getSettings("imgLocation");
	var content = "";

	for (var i = 0; i <= 48; i++) {
		icons[i] = i + ".gif";
	}

	for (var i = 0; i < icons.length; i++) {
		icon = getIcon(i, isDay);
		if (icon != "") {
		    content += "<div>" + icon + "</div>";
		}
		else {
			content += "<img src=\"" + foldericons + icons[i] + "\" />";
		}
	}

	$("#preview_icons").html(content);
}

$(document).on("weather_complete", function (event) {
	console.log("weather complete received ...");
	weatherObj = event.weather;
	refreshBadge(event.weather);
})

$(document).on("weather_nolocation", function (event) {
    console.log("weather_nolocation received ...");
    refreshBadge(null);
})

function checkNewLocation() {

	$("message").html("");
	
	var woeid = "", name = "";
	var query = escape("select * from geo.places where text=\"" + $("#newLocation").val() + "\"")
	var strUrl = "https://query.yahooapis.com/v1/public/yql?q=" + query + "&format=xml"
	console.log("getting info from " + strUrl);

	var result = jQuery.ajax({
		type: "GET",
		dataType: "xml",
		url: strUrl,
		success: function (xmlDoc) {
			if (xmlDoc != null) {
				if ($(xmlDoc).find("place").length > 0) {
					woeid = $($(xmlDoc).find("place>woeid")[0]).text();
					name = $($(xmlDoc).find("place>name")[0]).text();
				}
			}

			if (woeid != "") {
				var locations = JSON.parse(getSettings("weatherLocations"));
				var location = { name: name, woeid: woeid };
				locations.push(location);
				setSettings("weatherLocations", JSON.stringify(locations));
				setSettings("weatherLocation", JSON.stringify(location));
				
				$("message").html(name + " added!");
				$("#newLocation").val("");
				fillLocations();
				GetWeather();
			}
			else {
				$("#message").html("No location found! Please try to specify City, Country, Code...");
			}
		},
		fail: function (jqXHR, textStatus) {
				alert("Error: " + textStatus);
			}
	});
}

function fillLocations() {
	var content = "";
	var defaultIsPresent = false;
	var locations = JSON.parse(getSettings("weatherLocations"));
	var location = JSON.parse(getSettings("weatherLocation"));
	for (var i = 0; i < locations.length; i++) {
	    content += locations[i].name + "&nbsp;&nbsp;&nbsp;<a href=\"#\" id=\"removeLocation_" + i + "\">remove</a><br />";
	    if (location.woeid === locations[i].woeid)
	        defaultIsPresent = true;
	}
	
	$("#weather_locations").html(content);

	if (locations.length > 0) {
	    for (var i = 0; i < locations.length; i++) {
	        var ii = i;
	        $("#removeLocation_" + i).on("click", function () { removeLocation("loc_" + ii); });
	    }
	}

	if (!defaultIsPresent) {
	    if (locations[0] != null) {
	        setSettings("weatherLocation", JSON.stringify(locations[0]));
	    }
	    else {
	        setSettings("weatherLocation", null);
	    }
	    GetWeather();
	}
}

function removeLocation(index) {
	index = index.replace("loc_", "");

	var content = "";
	var contentInitial = "";
	var locations = JSON.parse(getSettings("weatherLocations"));

	locations.splice(index, 1);
	setSettings("weatherLocations", JSON.stringify(locations));

	fillLocations();
}

function fillSkins() {
    var ddl = $("#imgLocation");
    ddl.append($('<option></option>').val("images/weather_icons/YAHOO/Yahoo/").html("Default (from Yahoo)"));
	ddl.append($('<option></option>').val("images/weather_icons/YAHOO/Simple/").html("Simple"));
	ddl.append($('<option></option>').val("images/weather_icons/YAHOO/Nice/").html("Nice"));
	$("#imgLocation").val(getSettings("imgLocation"));
}

function fillValues()
	{
	$("#showIn" + getSettings("weatherShowIn")).attr("checked", "checked");

	if(getSettings("weatherShowLinks") == "1")
		$("#showExternal").attr("checked", "checked");

	if(getSettings("weatherLabels") == "1")
		$("#showLabels").attr("checked", "checked");

	if(getSettings("weatherDate") == "1")
		$("#showDate").attr("checked", "checked");

	if(getSettings("weatherReadDate") == "1")
		$("#showReadDate").attr("checked", "checked");

	$("#updateTimeout").val(getSettings("weatherTimeout"));
		
	var poweredby = $(".poweredby");
    poweredby.html("<a href=\"http://developer.yahoo.com/weather/\" target=\"_blank\"><img align=\"middle\" border=\"0\" src=\"images/yahoo_logo.png\" width=\"180\" alt=\"Yahoo Weather API\" title=\"Yahoo Weather API\" /></a>");
	}

function addLocation() {
	$("#add_location").show();
	$("#newLocation").focus();
}