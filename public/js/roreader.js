/*global XMLHttpRequest, ActiveXObject, window, $, DOMParser, document, google*/

var i, j;

var scrollTo = 0;

var roread = (function(){

	var offset = 0;
	var loading = false;
	var currentURL = null;
	var currentItems = null;
	var viewAll = false;
	var itemIds = [];
	var itemHeights = [];

	function feedTemplate(sub) {
		return "<div id='" + sub.xmlurl + "' class='feedList_feed'><a>" + 
			sub.title + 
		"</a></div>";
	}

	function saveToPocket(url){
		url = 'https://getpocket.com/edit?url=' + encodeURIComponent(url);
		window.href(url, '_blank');
	}

	var roread = {
		getSubscriptions: function() {
			var that = this;
			$.ajax({
				url: "/getsubs",
				dataType: "json",
				success: function(result){
					that.subs_display(result);
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
					'<a class="accordion-toggle" data-toggle="collapse" href="#tag'+ i +'">'+
					//'<a class="accordion-toggle" data-toggle="collapse" data-parent="#feedList" href="#tag'+ i +'">'+
					'<i class="icon-list"></i>' +
					subs[i].tag +
					'</div><div class="feedList_folderList">' +
					'</a></div>' +
					'<div id="tag' + i + '" class="accordion-body collapse">' +
	      			'<div class="accordion-inner">' +
	      				innerHtml +
      			'	</div>' + 
      			'</div>' +
      		'</div>';
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
		set_itemStatus : function(a_id, f_id, i_id){
			if ($('#'+i_id).hasClass('item_unread')){
				$.ajax({
					url: 'updatearticle?aId=' + encodeURIComponent(a_id) + "&fId=" + encodeURIComponent(f_id),
					dataType: 'json',
					success: function(r){
						console.log('marked read');
					}
				});
				$('#'+i_id).removeClass('item_unread');
				$('#'+i_id).addClass('item_read');
				$('#'+i_id+' .item_status_btn').text('Mark Unread');
			}
			else {
				$.ajax({
					url: 'updatearticle?unread=true&aId=' + encodeURIComponent(a_id) + "&fId=" + encodeURIComponent(f_id),
					dataType: 'json',
					success: function(r){
						console.log('marked unread');
					}
				});
				$('#'+i_id).removeClass('item_read');
				$('#'+i_id).addClass('item_unread');
				$('#'+i_id+' .item_status_btn').text('Mark Read');
			}
		},
		items_display: function(items, add, addL) {
			if (!add){
				itemIds = [];
				scrollTo = 0;
				addL = 0;
			}
			var meta = items[0];
			items = items[1];

			if (!add) {
				$("#items_list").empty();
				document.getElementById('feed_title').innerHTML = meta.title.slice(0,30);
			}
			var html;
			var L = items.length;
			
			for (i = 0; i < L; i++){
				html = '';
				var thisItem = 'item'+(addL+i);
				itemIds.push('#'+thisItem);

				var content = items[i].description || items[i].content;
				var item_readStatus;
				var item_btn_text;
				if(items[i].read){
					item_readStatus = 'item_read';
					item_btn_text = 'Mark Unread';
				}
				else {
					item_readStatus = 'item_unread';
					item_btn_text = 'Mark Read';
				}
				html += 
				'<div class="item_box 	' + item_readStatus + '" id="' + thisItem + '">'+
					'<h3><a href="' + items[i].link + '" target="_blank">' + items[i].title + '</a></h3>' +
					'<a href="https://getpocket.com/edit?url=' + items[i].link +'&title=' + items[i].title + '" target="_blank">Save to Pocket</a>' +
					' | ' +
					'<a class="item_status_btn" onclick="roread.set_itemStatus(\'' + items[i].link + '\', \'' + meta.feed_id + '\', \'' + thisItem + '\');" id="' + items[i].link + '">'  + item_btn_text + '</a>' +
					'<p class="item_byline">Posted by ' + items[i].author + ' on '+ new Date(items[i].publishedDate).toLocaleString() + '</p>' +
					'<br />' + 
						content + 
					'<br />' +
					'<br />' +
					//Article sharing: basic html for this from http://www.simplesharebuttons.com/html-share-buttons/ 
					'<div id="share-buttons">' + 
						'<a href="http://twitter.com/share?url=' + items[i].link + '&text=' + items[i].title + '" target="_blank"><img src="img/sharing/twitter.png" alt="Twitter" /></a>' +
						'<a href="http://www.facebook.com/sharer.php?u=' + items[i].link + '"target="_blank"><img src="img/sharing/facebook.png" /></a>' +
						'<a href="https://plus.google.com/share?url=' + items[i].link + '" target="_blank"><img src="img/sharing/google+.png" alt="Google" /></a>' +
						'<a href="http://www.linkedin.com/shareArticle?mini=true&url=' + items[i].title + '" target="_blank"><img src="img/sharing/linkedin.png" alt="LinkedIn" /></a>' +		
						'<a href="mailto:?Subject=' + items[i].title + '&Body=' + items[i].link + ' Sent%20from%20roreader"><img src="img/sharing/email.png" alt="Email" /></a>' +
					'</div>' +
					'<br />' +
					'<a href="https://getpocket.com/edit?url=' + items[i].link +'&title=' + items[i].title + '" target="_blank">Save to Pocket</a>' +
				'</div>';

				$('#items_list').append(html);
			}
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
					that.items_display(result, add, itemIds.length);
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
		$('#main_content').scroll(function() {
			if($('#main_content').scrollTop() + $('#main_content').height() === $('#main_content')[0].scrollHeight && !loading) {
				offset += 10;
				roread.getFeed_now(currentURL, offset);
			}

			(function(ia, off)	{
				off = off || 0;
				var ist = ia[scrollTo];
				var it = $(ist).position().top;
				if (it > off - $(ist).outerHeight(true) && it < off) {
					//console.log(ist + '...');
				}
				else if (it > off - $(ist).outerHeight(true)) {
					if (scrollTo !== 0) {
						scrollTo--;
					}
				}
				else if (it < off){
					scrollTo++;	
					if ($(ia[scrollTo]).hasClass('item_unread')){
		    			$(ia[scrollTo] + ' > a.item_status_btn').trigger('click');
		    		}
				}
			}(itemIds, 42));
		});
		$(document).bind('keydown', 'j', function(){	
			if(!loading){
				if(scrollTo < itemIds.length-1) {
					
					scrollTo++;
					var ist = itemIds[scrollTo];
					$('#main_content').scrollTo(ist, {offset: -41});	

					if ($(ist).hasClass('item_unread')){
		    			$(ist + ' > a.item_status_btn').trigger('click');
		    		}

		    		if (scrollTo === itemIds.length-1) {
		    			offset += 10;
						roread.getFeed_now(currentURL, offset);	
		    		}
				}
			}
		});
		$(document).bind('keydown', 'k', function(){
			if(scrollTo >= 0) {
				$('#main_content').scrollTo(itemIds[scrollTo], {offset: -43});
				if (scrollTo>0) {
					scrollTo--;
				}
			}
		});
		$(document).bind('keydown', 'm', function(){
			$(itemIds[scrollTo] + ' .item_status_btn').trigger('click');
		});
	});
	return roread;
}());
