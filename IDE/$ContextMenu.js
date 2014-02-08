(function($){
	var $m;
	var $ContextMenu = function(e,menuitems){
		if($m)$m.remove();
		var $menu = $("<ul class='context-menu'/>").appendTo("body");
		$menu.css({
			position: "absolute",
			zIndex: 20000,
			left: e.clientX,
			top: e.clientY
		});
		$(window).one("blur click mousedown",function(){
			$menu.remove();
		});
		$.each(menuitems,function(i,item){
			var $item = $("<li class='context-menu-item'/>");
			$item.text(item.text);
			$item.click(item.click);
			$item.on("mousedown",function(e){
				e.stopPropagation();
			});
			$menu.append($item);
		});
		return $m = $menu;
	};
	$.fn.contextMenu = function(menuitems){
		this.on("contextmenu",function(e){
			$ContextMenu(e,menuitems);
		});
	};
	$.fn.enableCopyPaste = function(menuitems){
		if(typeof process === "undefined"){
			return;//only needed in node-webkit
		}
		this.contextMenu([
			{text:"Cut", click:function(){
				document.execCommand("cut");
			}},
			{text:"Copy", click:function(){
				document.execCommand("copy");
			}},
			{text:"Paste", click:function(){
				document.execCommand("paste");
			}},
		]);
		/*this.contextMenu([
			{text: "Cut", click: function(){
				//?
			}},
			{text: "Copy", click: function(){
				
			}},
			{text: "Paste", click:function(){
				 
			}},
		]);*/
	};
	
})(jQuery);