/*global XMLHttpRequest, ActiveXObject, window, $, DOMParser, document, google, roread_templates*/

var i, j;

var scrollTo = 0;

var roread = (function(tmpl){

	var offset = 0;
	var loading = false;
	var currentURL = null;
	var viewAll = false;

	var citems = [];

	function saveToPocket(url){
		url = 'https://getpocket.com/edit?url=' + encodeURIComponent(url);
		window.href(url, '_blank');
	}

	var roread = {
		//Get stuff
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
		},

		//Display stuff
		subs_display: function(subs) {
			var that = this,
				L = subs.length,
				html = '',
				L2, innerHtml;
			for (i = 0; i < L; i++) {
				innerHtml = '';
				L2 = subs[i].feeds.length;
				for (j = 0; j < L2; j++) {
					innerHtml += tmpl.subs_feed(subs[i].feeds[j]);
				}
				html += tmpl.subs_folder(subs, i, innerHtml);
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
		items_display: function(feed, add) {

			var items = feed[1],
				meta = feed[0],
				L = items.length,
				html;
			
			if (!add){
				citems = [];
				scrollTo = 0;
				$("#items_list").empty();
				document.getElementById('feed_title').innerHTML = meta.title.slice(0,30);
			}

			var indexOffset = citems.length;
			
			for (i = 0; i < L; i++){
				items[i].content = items[i].description || items[i].content;
				items[i].feed_id = meta.feed_id;
				items[i].$rr = {
					index: indexOffset+i,
					id: '#item'+(indexOffset+i)
				};
				html = '';
				html += tmpl.items_fullItem(items[i]);
				$('#items_list').append(html);

				citems.push(items[i]);
			}
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


		var key = {
			j: 0,
			k: 0
		};
		$('#main_content').scroll(function() {
			key.j = (key.j > 0) ? key.j -1 : 0;
			key.k = (key.k > 0) ? key.k -1 : 0;
			if($('#main_content').scrollTop() + $('#main_content').height() === $('#main_content')[0].scrollHeight && !loading) {
				offset += 10;
				roread.getFeed_now(currentURL, offset);
			}
			
			(function(ia, off)	{
				off = off || 0;
				var ist = '#item' + scrollTo;
				var it = $(ist).position().top;
				if (it >= off - $(ist).outerHeight(true) && it <= off) {
					//console.log(ist + '...');
				}
				else if (it > off - $(ist).outerHeight(true)) {
					if (scrollTo !== 0) {
						console.log('it: '+it);
						scrollTo--;
					}
				}
				else if (it < off){
					console.log('it: '+it);
					scrollTo++;	
					ist = '#item' + scrollTo;
					if ($(ist).hasClass('item_unread')){
		    			$(ist + ' > a.item_status_btn').trigger('click');
		    		}
				}
			}(citems, 42));
		});
		$(document).bind('keydown', 'j', function(){	
			if(!loading){
				if(scrollTo < citems.length-1) {
					if(scrollTo !=0 && key.k > 0 && scrollTo < citems.length-1){
						scrollTo++;
					}
					scrollTo++;
					var ist = '#item' + scrollTo;
					$('#main_content').scrollTop($(ist)[0].offsetTop-42);	

					if ($(ist).hasClass('item_unread')){
		    			$(ist + ' > a.item_status_btn').trigger('click');
		    		}

		    		if (scrollTo === citems.length-1) {
		    			offset += 10;
						roread.getFeed_now(currentURL, offset);	
		    		}
				}
				key.j = (key.j < 2) ? 2 : key.j;
			}
			
		});
		$(document).bind('keydown', 'k', function(){
			if(scrollTo >= 0) {
				if(key.j > 0 && scrollTo>0){
					scrollTo--;
				}
				$('#main_content').scrollTop($('#item' + scrollTo)[0].offsetTop-42);
				if (scrollTo>0) {
					scrollTo--;
				}
				key.k = (key.k < 2) ? 2 : key.k;
			}
		});
		$(document).bind('keydown', 'm', function(){
			$('#item' + scrollTo + ' .item_status_btn').trigger('click');
		});
	});
	return roread;
}(roread_templates.ini()));

console.log('refactorin');
