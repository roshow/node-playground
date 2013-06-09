/*global XMLHttpRequest, ActiveXObject, window, $, DOMParser, document, google*/

var i, j;

//Google Feed API https://developers.google.com/feed/v1/
google.load("feeds", "1");

var roreader = (function(){

	var offset = 0;
	var loading = false;
	var currentURL = null;

	var roread = {
		getSubscriptions: function() {
			var that = this;
			var xmlhttp;
			if (window.XMLHttpRequest) {
				// code for IE7+, Firefox, Chrome, Opera, Safari
				xmlhttp = new XMLHttpRequest();
			}
			else {
				// code for IE6, IE5
				xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
			}

			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
					that.feeds_display(xmlhttp.responseXML);
					that.xmlDoc = xmlhttp.responseXML;
				}
			};
			xmlhttp.open("GET", "subscriptions.xml", false);
			xmlhttp.send();
			currentURL = "http://roshow.net/feed/";
			offset = 0;
			this.getFeed_now();
		},
		feeds_display: function(xmlDoc) {
			var that = this;
			var feedTemplate = function(node) {
				return "<div id='" + node.getAttribute('xmlUrl') + "' class='feedList_feed'>" + node.getAttribute('title') + "</div>";
			};
			var L = xmlDoc.childNodes[0].childNodes[3].childNodes.length;
			for (i = 0; i < L; i++) {
				var innerHtml = "";
				var html = "";
				var thisNode = xmlDoc.childNodes[0].childNodes[3].childNodes[i];

				if (thisNode.nodeType === 1) {

					var title = thisNode.getAttribute('title');

					if (thisNode.hasChildNodes()) {

						var L2 = thisNode.childNodes.length;
						for (j = 0; j < L2; j++) {
							var folderNode = thisNode.childNodes[j];
							if (folderNode.nodeType === 1) {
								innerHtml += "<span class='indent'>" + feedTemplate(folderNode) + "</span>";
							}
						}

						html = "<div class='feedList_feed' onclick='roreader.toggleFolderFeeds($(this));'><img src='feedList_icon_folder.png' class='feedList_icon' />" + title + "</div><div style='display:none;'>" + innerHtml + "</div>";
						$("#feedList").append(html);


					}
					else {
						html = feedTemplate(thisNode);
						$("#feedList").append(html);
					}
				}
			}
			$(".feedList_feed").click(function(){
				console.log($(this)[0].id);
				currentURL = $(this)[0].id;
				offset = 0;
				that.getFeed_now();
			});
		},
		toggleFolderFeeds: function(id) {
			id.next("div").slideToggle('fast');
		},

		items_display: function(data) {
			if (data !=="") {
				$("#itemsList").empty();
				$("#itemsList").append(data);
			}
		},

		getFeed_now: function () {
			var that = this;
			$.ajax({
				url: "http://localhost:3000/getfeed?url=" + encodeURIComponent(currentURL),
				success: function(result){
					//console.log(result);
					that.items_display(result);
				}
			});
		},

		//google feed
		getFeed_google: function() {
			var that = this;
			var feed = new google.feeds.Feed(currentURL);
			feed.includeHistoricalEntries();
			feed.setNumEntries(offset+10);
			feed.setResultFormat(google.feeds.Feed.MIXED_FORMAT);
			feed.load(function(result) {
				loading = true;
				that.items_display(result.xmlDocument);
			});
		}
	};

	$(function() {
		roread.getSubscriptions();
		/*$(window).scroll(function() {
			if($(window).scrollTop() === $(document).height() - $(window).height() && !loading) {
				offset += 10;
				$("#itemsList").append("<img id='spinner' src='../roReader/spinner.gif' />");
				roread.getFeed_now();
			}
		});*/
	});
	return roread;
}());

console.log("loaded roreader.js")
