/*global XMLHttpRequest, ActiveXObject, window, $, DOMParser, document, google*/

var i, j;

var roreader = (function(){

	var offset = 0;
	var loading = false;
	var currentURL = null;
	var currentItems = null;
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
			this.getFeed_now(subs[0].feeds[0].xmlurl);
		},
		viewAll: function(){
			viewAll = true;
			this.getFeed_now(currentURL);
		},
		viewUnread: function(){
			viewAll = false;
			this.getFeed_now(currentURL);
		},

		items_display: function(items, add) {
			var meta = items[0];
			items = items[1];
			console.log(items[1]);
			if (!add) {
				$("#items_list").empty();
				document.getElementById('feed_title').innerHTML = meta.title;
			}
			var html = '';
			var L = items.length;
			console.log(L);	
			for (i = 0; i < L; i++){
				var content = items[i].description || items[i].content,
					item_readStatus, item_statusBtn;
				if(items[i].read){
					item_readStatus = 'item_read';
					item_statusBtn = '<div class="btn markunread" id="'+items[i].link+'">Mark Unread</div>';
				}
				else {
					item_readStatus = 'item_unread';
					item_statusBtn = '<div class="btn markread" id="'+items[i].link+'">Mark As Read</div>';
				}
				html += '<div class="item_box '+item_readStatus+'">'+
				'<h3><a href="' + items[i].link + '" target="_blank">' + items[i].title + '</a></h3>' +
				'<div>Posted by ' + items[i].author + ' on '+ new Date(items[i].publishedDate).toLocaleString() + '</div>' +
				'<br />' + 
				content + 
				'<br />'
				'<br />' +
				item_statusBtn + 
				'</div>';
			}
			$('#items_list').append(html);
			$('.btn.markread').click(function(){
				var a_id = $(this)[0].id;
				var f_id = meta.feed_id;
				$.ajax({
					url: 'updatearticle?aId=' + encodeURIComponent(a_id) + "&fId=" + encodeURIComponent(f_id),
					dataType: 'json',
					success: function(r){
						console.log('marked read');
					}
				});
				$(this).parent().css('background-color', '#ddd');
				$(this).text('Mark Unread');
				$(this).removeClass('markread');
				$(this).addClass('markunread');
			});
			$('.btn.markunread').click(function(){
				var a_id = $(this)[0].id;
				var f_id = meta.feed_id;
				$.ajax({
					url: 'updatearticle?unread=true&aId=' + encodeURIComponent(a_id) + "&fId=" + encodeURIComponent(f_id),
					dataType: 'json',
					success: function(r){
						console.log('marked unread');
					}
				});
				$(this).parent().css('background-color', '#fff');
				$(this).text('Mark As Read');
				$(this).removeClass('markunread');
				$(this).addClass('markread');
			});
		},

		getFeed_now: function (url, off) {
			loading = true;
			var that = this;
			currentURL = url || null;
			var status = viewAll ? 'all' : false;
			offset = off || 0;
			$.ajax({
				url: 'getarticles?xmlurl=' + encodeURIComponent(url) +'&status=' + encodeURIComponent(status)  + "&offset=" + offset,
				dataType: 'json',
				success: function(result){
					var add = off ? true : false;
					that.items_display(result, add);
					loading = false;
				}
			});
		}
	};

	$(function() {
		roread.getSubscriptions();
		$('#readall').click(function(){
			roread.viewAll();
			document.getElementById('items_view_menu').innerHTML = 'All Items <b class="caret"></b>';
		});
		$('#readunread').click(function(){
			roread.viewUnread();
			document.getElementById('items_view_menu').innerHTML = 'Unread Items <b class="caret"></b>';
		});
		$(window).scroll(function() {
			if($(window).scrollTop() === $(document).height() - $(window).height() && !loading) {
				offset += 10;
				console.log(offset);
				roread.getFeed_now(currentURL, offset);
			}
		});
	});
	return roread;
}());
