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

	templates.items_fullItem = function(item_readStatus, thisItem, item_btn_text, meta, content, items, i){
		return ' '+

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
	};

	var ini = {
		ini: function(){
			return templates;
		}
	};
	return ini;

}());