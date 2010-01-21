function Init()
	{
	GetWeather(getDefaultLocation());
	}
	
function setBadge()
	{
	updateBadge();
	timeOut = window.setTimeout("Init();", pollInterval);
	}
