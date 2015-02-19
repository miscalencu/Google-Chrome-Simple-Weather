var isExtension = (typeof chrome.browserAction !== "undefined");

function getSettings(name) {
	var default_val = "";
	if (!localStorage[name]) {
		switch (name) {
			case "weatherLocations":
				default_val = "[]";
				break;
		    case "weatherLocation":
		        default_val = null;
		        break;
			case "weatherShowLinks":
				default_val = "0";
				break;
			case "weatherShowIn":
				default_val = "C";
				break;
			case "weatherTimeout":
				default_val = "10";
				break;
			case "weatherLabels":
			case "weatherDate":
			case "weatherReadDate":
			case "compactMode":
				default_val = "1";
				break;
			case "imgLocation":
				default_val = "images/weather_icons/YAHOO/YAHOO/";
				break;
			default:
				break;
		}
		return default_val;
	}
	else
		return localStorage[name];
}
function setSettings(name, value) {
	localStorage[name] = value;
}

function GetWeather() {
	var location = JSON.parse(getSettings("weatherLocation"));
	var showin = getSettings("weatherShowIn").toLowerCase();
	if (location != null) {
		var query = escape("select * from weather.forecast where woeid=\"" + location.woeid + "\" and u=\"" + showin + "\"");
		var url = "https://query.yahooapis.com/v1/public/yql?q=" + query + "&format=xml";
		console.log("getting weather from: " + url);

		$.ajax({
			type: "GET",
			dataType: "xml",
			url: url,
			success: function (result) {
				console.log("complete fired ...");
				$.event.trigger({
					type: "weather_complete",
					weather: getWeatherObject(result),
					message: "complete fired.",
					time: new Date()
				});
			},
			fail: function (jqXHR, textStatus) {
				alert("Error: " + textStatus);
			}
		});
	}
	else {
		console.log("no location fired ...");
		$.event.trigger({
			type: "weather_nolocation",
			message: "no location fired.",
			time: new Date()
		});
	}
}

function getWeatherObject(docXML) {

	var weatherObj = new Object();
	weatherObj = new Object();
	weatherObj.LocationCity = $(docXML).find("channel>location").attr("city");
	weatherObj.LocationCountry = $(docXML).find("channel>location").attr("country");
	weatherObj.LocationRegion = $(docXML).find("channel>location").attr("region");

	weatherObj.UnitDistance = $(docXML).find("channel>units").attr("distance");
	weatherObj.UnitPressure = $(docXML).find("channel>units").attr("pressure");
	weatherObj.UnitSpeed = $(docXML).find("channel>units").attr("speed");
	weatherObj.UnitTemperature = $(docXML).find("channel>units").attr("temperature");

	weatherObj.WindChill = $(docXML).find("channel>wind").attr("chill");
	weatherObj.WindDirection = $(docXML).find("channel>wind").attr("direction");
	weatherObj.WindSpeed = $(docXML).find("channel>wind").attr("speed");

	weatherObj.AtmosphereHumidity = $(docXML).find("channel>atmosphere").attr("humidity");
	weatherObj.AtmospherePressure = $(docXML).find("channel>atmosphere").attr("pressure");
	weatherObj.AtmosphereRising = $(docXML).find("channel>atmosphere").attr("rising");
	weatherObj.AtmosphereVisibility = $(docXML).find("channel>atmosphere").attr("visibility");

	weatherObj.AstronomySunrise = $(docXML).find("channel>astronomy").attr("sunrise");
	weatherObj.AstronomySunset = $(docXML).find("channel>astronomy").attr("sunset");

	weatherObj.PubDate = $(docXML).find("item>pubDate").text();
	weatherObj.Date = $(docXML).find("condition").attr("date");
	weatherObj.Description = $(docXML).find("item>description").text();
	weatherObj.Temp = $(docXML).find("condition").attr("temp");
	weatherObj.Icon = getSettings("imgLocation") + $(docXML).find("condition").attr("code") + ".gif";
	weatherObj.ConditionCode = $(docXML).find("condition").attr("code");
    weatherObj.Condition = $(docXML).find("condition").attr("text");
	
	weatherObj.RefreshDate = Date();

    var d = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var ds = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// forecast
    weatherObj.Forecast = new Array();
    $.each($(docXML).find("forecast"), function () {
    	weatherObj.Forecast.push({
    		Code: $(this).attr("code"),
    		Date: $(this).attr("date"),
    		Condition: $(this).attr("text"),
    		Day: d[arrindex(ds, $(this).attr("day"))],
    		High: $(this).attr("high"),
    		Low: $(this).attr("low"),
    	});
    });
	
	setSettings("weatherRefreshDate", Date());
	
	return weatherObj;
}

function refreshBadge(weather) {
	chrome.extension.sendMessage({ message: "update_badge", weather: weather }, function () { console.log("'update_badge' sent ..."); });
}

function ShowWeatherBackground(weatherObj) {

	// fill background array
	var bg = new Array();
	bg[0] = "storm.jpg"; // 'tornado'
	bg[1] = "storm.jpg"; // 'tropical storm'
	bg[2] = "storm.jpg"; // 'hurricane'
	bg[3] = "storm.jpg"; // 'severe thunderstorms'
	bg[4] = "storm.jpg"; // 'thunderstorms
	bg[5] = "rain_snow.jpg"; // 'mixed rain and snow'
	bg[6] = "rain_snow.jpg"; // 'mixed rain and sleet'
	bg[7] = "rain_snow.jpg"; // 'mixed snow and sleet'
	bg[8] = "freezing_drizzle.jpg"; // 'freezing drizzle'
	bg[9] = "freezing_drizzle.jpg"; // 'drizzle'
	bg[10] = "freezing_drizzle.jpg"; // 'freezing rain'
	bg[11] = "showers.jpg"; // 'showers'
	bg[12] = "showers.jpg"; // 'showers'
	bg[13] = "light_snow.jpg"; // 'snow flurries'
	bg[14] = "light_snow.jpg"; // 'light snow showers'
	bg[15] = "blowing_snow.jpg"; // 'blowing snow'
	bg[16] = "snow.jpg"; // 'snow'
	bg[17] = "hail.jpg"; // 'hail'
	bg[18] = "sleet.jpg"; // 'sleet'
	bg[19] = "dust.jpg"; // 'dust'
	bg[20] = "foggy.jpg"; // 'foggy'
	bg[21] = "haze.jpg"; // 'haze'
	bg[22] = "foggy.jpg"; // 'smoky'
	bg[23] = "blow.jpg"; // 'blustery'
	bg[24] = "windy.jpg"; // 'windy'
	bg[25] = "cold.jpg"; // 'cold'
	bg[26] = "cloudy.jpg"; // 'cloudy'
	bg[27] = "mostly-cloudy-night.jpg"; // 'mostly cloudy (night)'
	bg[28] = "mostly-cloudy-day.jpg"; // 'mostly cloudy (day)'
	bg[29] = "partly_cloudy_night.jpg"; // 'partly cloudy (night)'
	bg[30] = "partly_cloudy_day.jpg"; // 'partly cloudy (day)'
	bg[31] = "clear_night.jpg"; // 'clear (night)'
	bg[32] = "sunny.jpg"; // 'sunny'
	bg[33] = "fair_night.jpg"; // 'fair (night)'
	bg[34] = "fair_day.jpg"; // 'fair (day)'
	bg[35] = "rain_snow.jpg"; // 'mixed rain and hail'
	bg[36] = "hot.jpg"; // 'hot'
	bg[37] = "thunderstorms.jpg"; // 'isolated thunderstorms'
	bg[38] = "thunderstorms.jpg"; // 'scattered thunderstorms'
	bg[39] = "thunderstorms.jpg"; // 'scattered thunderstorms'
	bg[40] = "showers.jpg"; // 'scattered showers'
	bg[41] = "heavy_snow.jpg"; // 'heavy snow'
	bg[42] = "scattered_snow.jpg"; // 'scattered snow showers'
	bg[43] = "heavy_snow.jpg"; // 'heavy snow'
	bg[44] = "partly_cloudy_day.jpg"; // 'partly cloudy'
	bg[45] = "thunderstorms.jpg"; // 'thundershowers'
	bg[46] = "light_snow.jpg"; // 'snow showers'
	bg[47] = "thunderstorms.jpg"; // 'isolated thundershowers'
	bg[3200] = ""; // 'not available'

	// apply background image
	if (bg[weatherObj.ConditionCode] != undefined) {
	    $("body").css("background-image", "url('../images/backgrounds/" + bg[weatherObj.ConditionCode] + "')");
	    $("body").css("background-color", "transparent");
	}


}
	
function getLabel(str) {
	return (getSettings("weatherLabels") == "1") ? str : "";
}

function DateDiff(date1, date2) {
    var datediff = date1.getTime() - date2.getTime(); //store the getTime diff - or +
    return (datediff / 1000); //Convert values to -/+ seconds and return value      
}

function OpenWindow(url) {
	if(url === "options") {
		chrome.tabs.create({url: chrome.extension.getURL('options.html')});
		return;
	}
	
	chrome.tabs.create({url: url});
}

// Format to local time from UTC
function formatToLocalTimeDate(inDate) {
	try {
	    return dateFormat(inDate, "ddd, d mmmm yyyy, h:MM:ss TT");
	}
	catch (err) {
	    return inDate;
	}
}

function ExtractString(content, start, end) {
    var index1 = content.indexOf(start);
    var index2 = content.indexOf(end, index1 + start.length + 1);

    if (end == "[end]")
        index2 = content.length;

    if (index1 > -1 && index2 > -1 && index2 > index1 + start.length) {
        return content.substring(index1 + start.length, index2);
    }
    else
        return "";
}

function arrindex(arr, obj) {
    obj = obj.replace("\n", "").replace("\r", "");
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == obj) {
            return i;
            break;
        }
    }
    return -1;
}

function getIcon(code, isDay) {

    var daypart = (isDay == 1) ? "-day" : ((isDay == 0) ? "-night" : "");
	var icon = "";
	var title = "";

	switch (code) {
		default:
		case 0:
			icon = "<i class=\"wi wi-tornado\"></i>"; // 'tornado'
			title = "Tornado";
			break;
		case 1:
		    icon = "<i class=\"wi wi" + daypart + "-rain\"></i>"; // 'tropical storm'
			title = "Tropical Storm";
			break;
		case 2:
		    icon = "<i class=\"wi wi-hurricane\"></i>"; // 'hurricane'
		    title = "Hurricane";
			break;
		case 3:
		    icon = "<i class=\"wi wi" + daypart + "-thunderstorm\"></i>"; // 'severe thunderstorms'
		    title = "Severe Thunderstorms";
			break;
		case 4:
		    icon = "<i class=\"wi wi-storm-showers\"></i>"; // 'thunderstorms
		    title = "Thunderstorms";
			break;
		case 5:
		    icon = "<i class=\"wi wi-rain-mix\"></i>"; // 'mixed rain and snow'
		    title = "Mixed rain and snow";
			break;
		case 6:
			icon = ""; // 'mixed rain and sleet'
			break;
		case 7:
			icon = ""; // 'mixed snow and sleet'
			break;
		case 8:
			icon = ""; // 'freezing drizzle'
			break;
		case 9:
			icon = ""; // 'drizzle'
			break;
		case 10:
			icon = ""; // 'freezing rain'
			break;
		case 11:
			icon = ""; // 'showers'
			break;
		case 12:
			icon = ""; // 'showers'
			break;
		case 13:
			icon = ""; // 'snow flurries'
			break;
		case 14:
			icon = ""; // 'light snow showers'
			break;
		case 15:
			icon = ""; // 'blowing snow'
			break;
		case 16:
			icon = ""; // 'snow'
			break;
		case 17:
			icon = ""; // 'hail'
			break;
		case 18:
			icon = ""; // 'sleet'
			break;
		case 19:
			icon = ""; // 'dust'
			break;
		case 20:
			icon = ""; // 'foggy'
			break;
		case 21:
			icon = ""; // 'haze'
			break;
		case 22:
			icon = ""; // 'smoky'
			break;
		case 23:
			icon = ""; // 'blustery'
			break;
		case 24:
			icon = ""; // 'windy'
			break;
		case 25:
			icon = ""; // 'cold'
			break;
		case 26:
			icon = ""; // 'cloudy'
			break;
		case 27:
			icon = ""; // 'mostly cloudy (night)'
			break;
		case 28:
			icon = ""; // 'mostly cloudy (day)'
			break;
		case 29:
			icon = ""; // 'partly cloudy (night)'
			break;
		case 30:
			icon = ""; // 'partly cloudy (day)'
			break;
		case 31:
			icon = ""; // 'clear (night)'
			break;
		case 32:
			icon = ""; // 'sunny'
			break;
		case 33:
			icon = ""; // 'fair (night)'
			break;
		case 34:
			icon = ""; // 'fair (day)'
			break;
		case 35:
			icon = ""; // 'mixed rain and hail'
			break;
		case 36:
			icon = ""; // 'hot'
			break;
		case 37:
			icon = ""; // 'isolated thunderstorms'
			break;
		case 38:
			icon = "";// 'scattered thunderstorms'
			break;
		case 39:
			icon = ""; // 'scattered thunderstorms'
			break;
		case 40:
			icon = ""; // 'scattered showers'
			break;
		case 41:
			icon = ""; // 'heavy snow'
			break;
		case 42:
			icon = ""; // 'scattered snow showers'
			break;
		case 43:
			icon = ""; // 'heavy snow'
			break;
		case 44:
			icon = ""; // 'partly cloudy'
			break;
		case 45:
			icon = ""; // 'thundershowers'
			break;
		case 46:
			icon = ""; // 'snow showers'
			break;
		case 47:
			icon = ""; // 'isolated thundershowers'
			break;
		case 3200:
			icon = ""; // 'not available'
			break;
	}

	if (icon != "") {
		icon = icon.replace("<i ", "<i title=\"" + title + "\" ");
	}

	return icon;
}