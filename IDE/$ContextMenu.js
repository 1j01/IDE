(function($){
	var $old_menu;
	var $ContextMenu = function(x, y, items){
		if($old_menu){
			$old_menu.remove();
		}
		var $menu = $("<ul class='context-menu'/>").appendTo("body");
		$menu.css({
			position: "absolute",
			zIndex: 20000,
			left: x,
			top: y
		});
		$(window).one("blur click mousedown", function(){
			$menu.remove();
		});
		$.each(items, function(i, item){
			var $item = $("<li class='context-menu-item'/>");
			$item.css({
				cursor: "default"
			});
			$item.text(item.text);
			$item.click(function(e){
				e.preventDefault();
				item.click();
			});
			$item.on("mousedown",function(e){
				e.preventDefault();
				e.stopPropagation();
			});
			$menu.append($item);
		});
		return $old_menu = $menu;
	};
	$.fn.contextMenu = function(items){
		if(items === "clipboard"){
			if(typeof process === "undefined"){
				return;//only needed in node-webkit
			}
			items = [
				{text:"Cut", click:function(){
					document.execCommand("cut");
				}},
				{text:"Copy", click:function(){
					document.execCommand("copy");
				}},
				{text:"Paste", click:function(){
					document.execCommand("paste");
				}},
			];
		}
		this.on("contextmenu", function(e){
			$ContextMenu(e.clientX, e.clientY, items);
		});
	};
})(jQuery);