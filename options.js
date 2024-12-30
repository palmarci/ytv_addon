document.addEventListener('DOMContentLoaded', function () {
	const saveButton = document.getElementById('saveButton');
	const resetButton = document.getElementById('resetButton');
	saveButton.addEventListener('click', function () {
		saveSettings();
	});
	resetButton.addEventListener('click', function () {
		defaultSettings();
	});
	loadSettings();
});

function loadSettings() {
	chrome.storage.sync.get(null, function (result) {
		if (typeof result.userAgent != 'string') {
			console.log('Invalid or undefined settings detected. Resetting to default.');
			defaultSettings();
			loadSettings();
			return;
		}
		document.getElementById('userAgent').value = result.userAgent;
		document.getElementById('overrideZoom').checked = result.overrideZoom;
		document.getElementById('zoomLevel').value = result.zoomLevel;
	});
}

function saveSettings() {
	var userAgent = document.getElementById('userAgent').value;
	var overrideZoom = document.getElementById('overrideZoom').checked;
	var rawLevel = document.getElementById('zoomLevel').value;
	if (!isInt(rawLevel)) {
		rawLevel = 35;
	}
	var zoomLevel = parseInt(rawLevel);
	if (zoomLevel > 100) {
		zoomLevel = 100;
	} else if (zoomLevel < 10) {
		zoomLevel = 10;
	}

	document.getElementById('zoomLevel').value = zoomLevel;

	var settings = {
		userAgent: userAgent,
		overrideZoom: overrideZoom,
		zoomLevel: zoomLevel
	};
	chrome.storage.sync.set(settings, function () {
		console.log('yttvfix settings saved:', settings);
	});
	notifyBackground();
}

function notifyBackground() {
	chrome.runtime.sendMessage('updateConfig', (response) => {
		console.log('received response: ' + response);
	});
}

function defaultSettings() {
	document.getElementById('userAgent').value = 'Mozilla/5.0 (PS4; Leanback Shell) Gecko/20100101 Firefox/65.0 LeanbackShell/01.00.01.75 Sony PS4/ (PS4, , no, CH)';
	document.getElementById('overrideZoom').checked = true;
	document.getElementById('zoomLevel').value = 35;
	saveSettings();
}

function isInt(value) {
	return !isNaN(value) &&
		parseInt(Number(value)) == value &&
		!isNaN(parseInt(value, 10));
}