/*global XMLHttpRequest, ActiveXObject, window, $, DOMParser, document, google*/

var i, j;

//Google Feed API https://developers.google.com/feed/v1/
google.load("feeds", "1");

var roreader = (function(){

	var offset = 0;
	var loading = false;
	var currentURL = null;
	function feedTemplate(sub) {
		return "<div id='" + sub.xmlurl + "' class='feedList_feed'>" + sub.title + "</div>";
	}

	var roread = {
		getSubscriptions: function() {
			var that = this;
			$.ajax({
				url: "/getsubs",
				dataType: "json",
				success: function(result){
					that.subs_display(result);
					console.log(result);
				}
			});
		},
		subs_display: function(subs) {
			var that = this,
				L = subs.length,
				html = '',
				L2, innerHtml;
			for (i = 0; i < L; i++) {
				innerHtml = '';
				L2 = subs[i].feeds.length;
				for (j = 0; j < L2; j++) {
					innerHtml += "<span class='feedList_feed'>" + feedTemplate(subs[i].feeds[j]) + "</span>";
				}
				html += "<div class='feedList_folder'><i class='icon-list icon-white'></i>" + subs[i].tag + "</div><div class='feedList_folderList'>" + innerHtml + "</div>";
			}
			$('#feedList').append(html);
			$('.feedList_feed').click(function(){
				that.getFeed_now($(this)[0].id);
			});
			$('.feedList_folder').click(function(){
				$(this).next('div').slideToggle('fast');
			});
			this.getFeed_now('http://roshow.net/feed');
		},

		items_display: function(items) {
			$("#itemsList").empty();
			var html = '<div class="item_top"><h4>' + items[0].meta.title +'</h4></div>';
			var L = items.length;
			for (i = 0; i < L; i++){
				html += '<div class="item_box"><h3><a href="' + items[i].link + '" target="_blank">' + items[i].title + '</a></h3> <br />' + items[i].description + '</div>';
			}
			$('#itemsList').append(html);
		},

		getFeed_now: function (url) {
			var that = this;
			$.ajax({
				url: 'getfeed?url=' + encodeURIComponent(url),
				dataType: 'json',
				success: function(result){
					console.log(result[0]);
					console.log(result[1]);
					that.items_display(result[1]);
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
