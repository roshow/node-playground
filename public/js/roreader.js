/*global XMLHttpRequest, ActiveXObject, window, $, DOMParser, document, google*/

var i, j;

var roreader = (function(){

	var offset = 0;
	var loading = false;
	var currentURL = null;
	var currentItems = null;
	var viewAll = false;
	var itemIds = [];
	var scrollTo = 0;
	var itemHeights = [];

	function feedTemplate(sub) {
		return "<div id='" + sub.xmlurl + "' class='feedList_feed'><a>" + 
			sub.title + 
			"</a></div>";
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

		items_display: function(items, add, addL) {
			if (!add){
				itemIds = [];
				scrollTo = 0;
				addL = 0;
				itemHeights = [];
			}
			var meta = items[0];
			items = items[1];
			console.log(items[1]);
			if (!add) {
				$("#items_list").empty();
				$("#scroll_nav").empty();
				document.getElementById('feed_title').innerHTML = meta.title.slice(0,30);
			}
			//var html = '';
			var html;
			var L = items.length;

			//html string for the scrollspy hidden navbar
			var scroll_html = '';
			
			for (i = 0; i < L; i++){
				html = '';
				var thisItem = 'item'+(addL+i);
				itemIds.push('#'+thisItem);

			//make item_box with article
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
				html += '<div class="item_box 	' + item_readStatus + '" id="' + thisItem + '">'+
					'<h3><a href="' + items[i].link + '" target="_blank">' + (addL+i) + '. ' + items[i].title + '</a></h3>' +
					'<p class="item_byline">Posted by ' + items[i].author + ' on '+ new Date(items[i].publishedDate).toLocaleString() + '</p>' +
					'<br />' + 
					content + 
					'<br />' +
					'<br />' +
								
					//Article sharing
					//got the basic html for this from http://www.simplesharebuttons.com/html-share-buttons/ 
					
					'<div id="share-buttons">' + 
						'<a href="http://twitter.com/share?url=' + items[i].link + '&text=' + items[i].title + '" target="_blank"><img src="img/sharing/twitter.png" alt="Twitter" /></a>' +
						'<a href="http://www.facebook.com/sharer.php?u=' + items[i].link + '"target="_blank"><img src="img/sharing/facebook.png" /></a>' +
						'<a href="https://plus.google.com/share?url=' + items[i].link + '" target="_blank"><img src="img/sharing/google+.png" alt="Google" /></a>' +
						'<a href="http://www.linkedin.com/shareArticle?mini=true&url=' + items[i].title + '" target="_blank"><img src="img/sharing/linkedin.png" alt="LinkedIn" /></a>' +		
						//Pinterest ain't straight-forward <a href="javascript:void((function()%7Bvar%20e=document.createElement(\'script\');e.setAttribute(\'type\',\'text/javascript\');e.setAttribute(\'charset\',\'UTF-8\');e.setAttribute(\'src\',\'http://assets.pinterest.com/js/pinmarklet.js?r=\'+Math.random()*99999999);document.body.appendChild(e)%7D)());"><img src="http://www.simplesharebuttons.com/images/somacro/pinterest.png" alt="Pinterest" /></a>' +
						'<a href="mailto:?Subject=' + items[i].title + '&Body=' + items[i].link + ' Sent%20from%20roreader"><img src="img/sharing/email.png" alt="Email" /></a>' +
					'</div>' +

					'<br />' +
					'<br />' +
					'<button class="item_status_btn btn-small" id="' + items[i].link + '">'  + item_btn_text + '</button>' +
				'</div>';

				$('#items_list').append(html);
				itemHeights.push($('#'+thisItem).outerHeight(true));

			//add to hidden navbar for scrollspy
				scroll_html += '<li class="" id="_'+thisItem+'"><a href="#' + thisItem + '">' + (addL+i) + '</a></li>';

			}

			var iH = 0;
			$.each(itemHeights,function() {
			    total += this;
			});

			console.log('total item heights: ' + total);
			console.log('main_content height: ' + $('#main_content')[0].scrollHeight);


			console.log(itemIds);
			//$('#items_list').append(html);
			$('.item_status_btn').click(function(){
				var a_id = $(this)[0].id;
				var f_id = meta.feed_id;
				if ($(this).parent().hasClass('item_unread')){
					$.ajax({
						url: 'updatearticle?aId=' + encodeURIComponent(a_id) + "&fId=" + encodeURIComponent(f_id),
						dataType: 'json',
						success: function(r){
							console.log('marked read');
						}
					});
					$(this).parent().removeClass('item_unread');
					$(this).parent().addClass('item_read');
					$(this).text('Mark Unread');
				}
				else {
					$.ajax({
						url: 'updatearticle?unread=true&aId=' + encodeURIComponent(a_id) + "&fId=" + encodeURIComponent(f_id),
						dataType: 'json',
						success: function(r){
							console.log('marked unread');
						}
					});
					$(this).parent().removeClass('item_read');
					$(this).parent().addClass('item_unread');
					$(this).text('Mark Read');
				}
			});

			window.onload=function(){
				console.log('loaded');
			};
			//set scrollspy html
			$('#scroll_nav').append(scroll_html);
			//$("#navbarExample").scrollspy();
			/*$('[data-spy="scroll"]').each(function()
			{
			    $(this).scrollspy('refresh');
			});*/
			$("#main_content").scrollspy('refresh');
			$("#scroll_nav li").on("activate", function()
			{
			    console.log("ACTIVATED");
			    console.log($(this)[0].id.slice(5));

			    var id = $(this)[0].id.slice(5);
			    scrollTo = id;
			    if ($('#item' + id).hasClass('item_unread')){
			    	$('#item' + id + ' > button.item_status_btn').trigger('click');
			    }
			});
			if (!add){
				$('#main_content').scrollTop(0);
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
				console.log(offset);
				roread.getFeed_now(currentURL, offset);
			}

			var ist = '#item' + scrollTo;
			console.log(ist);
			var mt = $('#main_content').scrollTop();
			var it = $(ist).position().top;

			if (it > 42 - $(ist).outerHeight(true) && it < 42) {
				console.log('#item' + scrollTo);
			}
			else if (it > 42 - $(ist).outerHeight(true)) {
				if (scrollTo != 0) {
					scrollTo--;
				}
			}
			else if ( it < 42){
				scrollTo++;
			}

			//console.log('main_content top: ');
			//console.log(mt);
			//console.log('#item1 top: ' + it);
		});
		$(document).bind('keydown', 'j', function(){
			if(scrollTo < itemIds.length - 1) {
				scrollTo++;
				console.log('keydown j: '+itemIds[scrollTo]);
				$('#main_content').scrollTo(itemIds[scrollTo], {offset: -42});
			}
		});
		$(document).bind('keydown', 'k', function(){
			if(scrollTo >= 0) {
				if (scrollTo>0) {
					scrollTo--;
				}
				console.log('keydown k: '+itemIds[scrollTo]);
				$('#main_content').scrollTo(itemIds[scrollTo], {offset: -42});
			}
		});
		//$("#navbarExample").scrollspy();
	});
	return roread;
}());
