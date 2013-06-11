/*global XMLHttpRequest, ActiveXObject, window, $, DOMParser, document, google*/

var i, j;

//Google Feed API https://developers.google.com/feed/v1/
google.load("feeds", "1");

var roreader = (function(){

	var offset = 0;
	var loading = false;
	var currentURL = null;
	function htmlDecode(value){
	    return $('<div/>').html($('<div/>').html(value).text()).text();
	}

	var roread = {
		getSubscriptions: function() {
			var that = this;
			$.ajax({
				url: "getsubs",
				dataType: "json",
				success: function(result){
					that.feeds_display(result.opml.body.outline);
				}
			});
		},
		feeds_display: function(subs) {
			var that = this,
			L = subs.length,
			L2, innerHtml, html
			var feedTemplate = function(sub) {
				return "<div id='" + sub.xmlUrl + "' class='feedList_feed'>" + sub.title + "</div>";
			};
			for (i = 0; i < L; i++) {
				html = '';
				innerHtml = '';
				if (subs[i].outline) {
					L2 = subs[i].outline.length;
					for (j = 0; j < L2; j++) {
						innerHtml += "<span class='indent'>" + feedTemplate(subs[i].outline[j]) + "</span>";
					}
					html = "<div class='feedList_feed' onclick='roreader.toggleFolderFeeds($(this));'><img src='feedList_icon_folder.png' class='feedList_icon' />" + subs[i].title + "</div><div style='display:none;'>" + innerHtml + "</div>";
					$("#feedList").append(html);
				}
				else {
					html = feedTemplate(subs[i]);
					$("#feedList").append(html);
				}
			}
			$(".feedList_feed").click(function(){
				console.log($(this)[0].id);
				currentURL = $(this)[0].id;
				offset = 0;
				that.getFeed_now($(this)[0].id);
			});
			console.log('subscriptions list via json');
			this.getFeed_now('http://roshow.net/feed');
		},
		toggleFolderFeeds: function(id) {
			id.next("div").slideToggle('fast');
		},

		items_display: function(feed) {
			$("#itemsList").empty();
			var L = feed.length;
			for (i = 0; i < L; i++){
				var html = "<div class='item_box'><h3>" + feed[i].title + "</h3> <br />" + feed[i].description + "</div>";
				$("#itemsList").append(html);
			}
		},

		getFeed_now: function (url) {
			var currentURL = url || currentURL;
			var that = this;
			$.ajax({
				url: "getfeed?url=" + encodeURIComponent(currentURL),
				dataType: "json",
				success: function(result){
					that.items_display(result);
				}
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

console.log("loaded roreader.js");
