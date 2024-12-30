"use strict";

var urlMask = "*://*.youtube.com/tv*";
var alreadyResetZoom = false;

var defaultConfig = {
	userAgent: 'Mozilla/5.0 (PS4; Leanback Shell) Gecko/20100101 Firefox/65.0 LeanbackShell/01.00.01.75 Sony PS4/ (PS4, , no, CH)',
	overrideZoom: true,
	zoomLevel: 35
};
var currentConfig = defaultConfig;

function getConfig(callback) {
	chrome.storage.sync.get(null, function (data) {
		callback(data);
	});
}

function setConfig(config, callback) {
	console.log("setting config: ua=" + config.userAgent, + ", override=" + config.overrideZoom + ", level=" + config.overrideZoom);
	chrome.storage.sync.set({
		userAgent: config.userAgent,
		zoomLevel: config.zoomLevel,
		overrideZoom: config.overrideZoom,
	}, callback);
}

function updateConfig(callback) {
	getConfig(function (storageConfig) {
		if (storageConfig.userAgent == undefined) {
			console.log("uninitialized storage detected, setting default values...");
			setConfig(currentConfig, function() {});
		} else {
			currentConfig = storageConfig;
		}
	});
}

function rewriteUserAgent(x) {
	for (var header of x.requestHeaders) {
		if (header.name.toLowerCase() === "user-agent") {
			header.value = currentConfig.userAgent;
		}
	}
	return {
		requestHeaders: x.requestHeaders
	};
}

function applyZoom() {
	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, (tabs) => {
		const activeTab = tabs[0];
		const url = new URL(activeTab.url);
		if (!(url.host.includes("youtube.com") && url.pathname.startsWith("/tv"))) {
			return;
		}
		if (currentConfig.overrideZoom) {
			chrome.tabs.setZoom(activeTab.id, (currentConfig.zoomLevel / 100));
			alreadyResetZoom = false;
		} else {
			if (!alreadyResetZoom) {
				chrome.tabs.setZoom(activeTab.id, 1.0);
				alreadyResetZoom = true;
			}
		}
	})
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request === "updateConfig") {
		updateConfig();
		sendResponse("ok!");
	}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete") {
		applyZoom();
	}
});

chrome.tabs.onCreated.addListener((tab) => {
	applyZoom();
});

browser.webRequest.onBeforeSendHeaders.addListener(rewriteUserAgent, {
	urls: [urlMask]
}, ["blocking", "requestHeaders"]);

updateConfig();