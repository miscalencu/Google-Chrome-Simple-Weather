var weatherObj = null;
var isDay = 1;

$(document).ready(function() {
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
	$("#addGeoLocationLink").on("click", function () { addGeoLocation(); });

	fillValues();
	fillPreviewIcons();
	fillLocations();

	$('[data-toggle="popover"]').popover({ trigger: "hover" });

	$('#preview_icons .wi').on("hover", function () {
	    $("#preview b span").text($(this).attr("title"));
	});

	var locations = JSON.parse(getSettings("weatherLocations"));
	if (locations.length > 0) {
	    GetWeather();
	}
	else {
	    refreshBadge(null);
	}
});

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
				var message = "";
				$.each($(xmlDoc).find("place"), function(){
					var name = $(this).find("name").text();
					var woeid = $(this).find("woeid").text();
					var country = $(this).find("country").text();
					var admin1 = $(this).find("admin1").text();
					var admin2 = $(this).find("admin2").text();
					var admin3 = $(this).find("admin3").text();

					var text = "<b>" + name + "</b> (" + country + ((admin1 != "") ? (" - " + admin1) : "") + ((admin2 != "") ? (" - " + admin2) : "") + ((admin3 != "") ? (" - " + admin3) : "") + ")";

					message += "<a title=\"Add this location!\" data-woeid=\"" + woeid + "\" data-name=\"" + name + "\" class=\"foundLocation\"><span class=\"glyphicon glyphicon-plus\"></span> add</a> <span style=\"color: black\">" + text + "</span><br />";
				});

				$("#message").html(message);

				$(".foundLocation").on("click", function () {
					var locations = JSON.parse(getSettings("weatherLocations"));
					var location = { name: $(this).data("name"), woeid: $(this).data("woeid") };
					locations.push(location);
					setSettings("weatherLocations", JSON.stringify(locations));
					setSettings("weatherLocation", JSON.stringify(location));

					$("#message").html(name + " added!");
					$("#newLocation").val("");
					fillLocations();
					setTimeout(function () {
						$("#add_location").modal("hide");
						GetWeather();
					});
				});
			}

			if($("#message").html() === "") {
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
    var classname = "";
	var defaultIsPresent = false;
	var locations = JSON.parse(getSettings("weatherLocations"));
	var location = JSON.parse(getSettings("weatherLocation"));
	for (var i = 0; i < locations.length; i++) {

	    classname = "";
	    if (location.woeid === locations[i].woeid) {
	        defaultIsPresent = true;
	        classname = "current";
	    }

	    content += "<a href=\"#\" title=\"Remove this location!\" class=\"removeLocation " + classname + "\" data-id=\"" + i + "\"> <span class=\"glyphicon glyphicon-remove\"></span> remove</a>";
	    content += "<span title=\"Remove this location!\" class=\"selectLocation " + classname + "\" data-id=\"" + i + "\">" + locations[i].name + "</span><br />";
	}
	
	$("#weather_locations").html(content);

	$(".removeLocation").on("click", function () {
	    removeLocation($(this).data("id"));
	});

	$(".selectLocation").on("click", function () {
	    setSettings("weatherLocation", JSON.stringify(locations[$(this).data("id")]));
	    fillLocations();
	    GetWeather();
	});

	if (!defaultIsPresent) {
	    if (locations[0] != null) {
	        setSettings("weatherLocation", JSON.stringify(locations[0]));
	        fillLocations();
	        GetWeather();
	    }
	    else {
	        setSettings("weatherLocation", null);
	        refreshBadge(null);
	    }
	}
}

function removeLocation(index) {
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
    $("#add_location").modal();
	$("#newLocation").focus();
}

function addGeoLocation() {
	$("#geo_location").modal();
	getGeoPosition();
}

function getGeoPosition() {
	if (navigator.geolocation) {
		console.log('Geolocation is supported!');
		navigator.geolocation.getCurrentPosition(geoSuccess, geoError, { timeout: 10000, enableHighAccuracy: true, maximumAge: 60 * 60 * 1000 });
	}
	else {
		console.log('Geolocation is not supported for this Browser/OS version yet.');
	}
}

function geoSuccess(position) {
	$("#geo_message").html("Latitude: " + position.coords.latitude + ", Longitude: " + position.coords.longitude);
}

function geoError(error) {
	$("#geo_message").html("<b>Error occurred.<b><br /> Error code: " + error.code + " (" + error.message + ")");
}