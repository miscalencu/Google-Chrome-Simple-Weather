var currentPage = "background";

function Init() {
    var location = getDefaultLocation();
    if (location.indexOf("#") > -1) {
        GetWeather(location.split("#")[0], location.split("#")[1]);
    }
    else
        GetWeather(location);
}
	
function setBadge()
	{
	    updateBadge();
	    timeOut = window.setTimeout(function () { Init(); }, pollInterval);
	}

var pollInterval = 1000 * 60 * parseInt(localStorage.weatherTimeout);  // default 10 minutes
Init();