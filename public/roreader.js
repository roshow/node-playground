/*global XMLHttpRequest, ActiveXObject, window, $, DOMParser, document, google*/

var i, j;

var roreader = (function(){

	var offset = 0;
	var loading = false;
	var currentURL = null;
	function feedTemplate(sub) {
		return "<div id='" + sub.xmlurl + "' class='feedList_feed'><a>" + sub.title + "</a></div>";
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
					innerHtml += feedTemplate(subs[i].feeds[j]);
				}
				html += '<div class="accordion-group">'+
				'<div class="accordion-heading feedList_folder">'+

				//use this if you want opening a folder to not close other open ones:
				'<a class="accordion-toggle" data-toggle="collapse" href="#tag'+ i +'">'+
				//use this is you want only one folder to be open at a time:
				//'<a class="accordion-toggle" data-toggle="collapse" data-parent="#feedList" href="#tag'+ i +'">'+


				'<i class="icon-list"></i>' + subs[i].tag + '</div><div class="feedList_folderList">' + 
				'</a></div>' +
				'<div id="tag' + i + '" class="accordion-body collapse">' +
      			'<div class="accordion-inner">' +
      			innerHtml +
      			'</div></div></div>';
			}

			$('#feedList').append(html);
			$('.feedList_feed').click(function(){
				that.getFeed_now($(this)[0].id);
				$('.feedList_feed').css('font-weight', 'normal');
				$(this).css('font-weight', 'bold');
			});
			this.getFeed_now();
		},

		items_display: function(items) {
			var meta = items[0];
			items = items[1];
			$("#itemsList").empty();
			var html = '<div class="item_top" id="'+meta.feed_id+'"><h4>' + meta.title +'</h4></div>';
			var L = items.length;
			for (i = 0; i < L; i++){
				var content = items[i].description || items[i].content;
				html += '<div class="item_box">'+
				'<h3><a href="' + items[i].link + '" target="_blank">' + items[i].title + '</a></h3>' +
				'<br />' + 
				content + 
				'<br />' +
				'<div class="btn" id="'+items[i].link+'">Mark As Read</div>'+
				'</div>';
			}
			$('#itemsList').append(html);
			$('.btn').click(function(){
				var a_id = $(this)[0].id;
				var f_id = $(this).parent().parent().find('.item_top')[0].id;
				$.ajax({
					url: 'updatearticle?aId=' + encodeURIComponent(a_id) + "&fId=" + encodeURIComponent(f_id),
					dataType: 'json',
					success: function(r){
						console.log(JSON.stringify(r));
					}
				});
				$(this).parent().find('a').css('color', 'gray');
			});
		},

		getFeed_now: function (url) {
			url = url || 'http://roshow.net/feed/'
			var that = this;
			$.ajax({
				url: 'getarticles?xmlurl=' + encodeURIComponent(url),
				dataType: 'json',
				success: function(result){
					console.log(result[0]);
					console.log(result[1]);
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
