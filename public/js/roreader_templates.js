var roread_templates = (function(){

	var templates = {};

	templates.subs_feed= function(sub) {
		return ' '+

		"<div id='" + sub.xmlurl + "' class='feedList_feed'><a>" + 
			sub.title + 
		"</a></div>";
	};
	templates.subs_folder = function(subs, i, innerHtml) {
		return ' '+

		'<div class="accordion-group">'+
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
	};

	templates.items_fullItem = function(item){
		var readStatus, btnText;
		if(item.read){
			readStatus = 'item_read';
			btnText = 'Mark Unread';
		}
		else {
			readStatus = 'item_unread';
			btnText = 'Mark Read';
		}

		return ' '+

		'<div class="item_box 	' + readStatus + '" id="item' + item.$rr.index + '">'+
			'<h3><a href="' + item.link + '" target="_blank">' + item.title + '</a></h3>' +
			'<a href="https://getpocket.com/edit?url=' + item.link +'&title=' + item.title + '" target="_blank">Save to Pocket</a>' +
			' | ' +
			'<a class="item_status_btn" onclick="roread.set_itemStatus(\'' + item.link + '\', \'' + item.feed_id + '\', \'item' + item.$rr.index + '\');" id="' + item.link + '">'  + btnText + '</a>' +
			'<p class="item_byline">Posted by ' + item.author + ' on '+ new Date(item.publishedDate).toLocaleString() + '</p>' +
			'<br />' + 
				item.content + 
			'<br />' +
			'<br />' +
			//Article sharing: basic html for this from http://www.simplesharebuttons.com/html-share-buttons/ 
			'<div id="share-buttons">' + 
				'<a href="http://twitter.com/share?url=' + item.link + '&text=' + item.title + '" target="_blank"><img src="img/sharing/twitter.png" alt="Twitter" /></a>' +
				'<a href="http://www.facebook.com/sharer.php?u=' + item.link + '"target="_blank"><img src="img/sharing/facebook.png" /></a>' +
				'<a href="https://plus.google.com/share?url=' + item.link + '" target="_blank"><img src="img/sharing/google+.png" alt="Google" /></a>' +
				'<a href="http://www.linkedin.com/shareArticle?mini=true&url=' + item.title + '" target="_blank"><img src="img/sharing/linkedin.png" alt="LinkedIn" /></a>' +		
				'<a href="mailto:?Subject=' + item.title + '&Body=' + item.link + ' Sent%20from%20roreader"><img src="img/sharing/email.png" alt="Email" /></a>' +
			'</div>' +
			'<br />' +
			'<a href="https://getpocket.com/edit?url=' + item.link +'&title=' + item.title + '" target="_blank">Save to Pocket</a>' +
		'</div>';
	};

	var ini = {
		ini: function(){
			return templates;
		}
	};
	return ini;

}());