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
	debugger;
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