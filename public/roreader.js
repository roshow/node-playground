/*global XMLHttpRequest, ActiveXObject, window, $, DOMParser, document, google*/

var i, j;

var roreader = (function(){

	var offset = 0;
	var loading = false;
	var currentURL = null;
	var viewAll = false;
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
			//this.getFeed_now();
		},
		viewAll: function(){
			viewAll = true;
			this.getFeed_now(currentURL, 'all');
		},

		viewUnread: function(){
			viewAll = false;
			this.getFeed_now(currentURL);
		},

		items_display: function(items) {
			var meta = items[0];
			items = items[1];
			$("#itemsList").empty();
			var html = '<div class="item_top" id="'+meta.feed_id+'"><h4>' + meta.title +'</h4></div><div id="list">';
			var L = items.length;
			for (i = 0; i < L; i++){
				var content = items[i].description || items[i].content,
					item_readStatus = items[i].read ? 'item_read' : 'item_unread';
				html += '<div class="item_box '+item_readStatus+'">'+
				'<h3><a href="' + items[i].link + '" target="_blank">' + items[i].title + '</a></h3>' +
				'<br />' + 
				content + 
				'<br />' +
				'<button class="btn" id="'+items[i].link+'" data-toggle:"button">Mark As Read</button>'+
				'</div>';
			}
			$('#itemsList').append(html+'</div>');
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
				$(this).parent().css('background-color', '#ddd');
			});
		},

		getFeed_now: function (url, status) {
			var that = this;
			url = url || null;
			currentURL = url;
			status = viewAll ? 'all' : status || false;
			$.ajax({
				url: 'getarticles?xmlurl=' + encodeURIComponent(url) +'&status=' + encodeURIComponent(status),
				dataType: 'json',
				success: function(result){
					//console.log(result[0]);
					//console.log(result[1]);
					that.items_display(result);
					document.getElementById('itemsList').scrollTop = 0;
				}
			});
		}
	};

	$(function() {
		roread.getSubscriptions();
		$('#readall').click(function(){
			roread.viewAll();
		});
		$('#readunread').click(function(){
			roread.viewUnread();
		});
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
