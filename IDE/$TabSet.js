/*
This module does not use flexbox, and thus can be used in less edgy projects.
It does however rely on $().push defined in utils.js
(and the styles in tabs.css)
(and it sets a global $activeTab)
*/
function $TabSet(){
	var $tabset = $("<div class='tabset'/>");
	var $tabstrip = $("<section class='tabstrip'/>").appendTo($tabset);
	var $contents = $("<section class='tabset-contents'/>").appendTo($tabset);
	var $tabs = $();
	var tabs = [];
	
	var tab_width = 100;
	var fnames = [];
	
	var max_tab_width = 150;
	var tab_margin = 6;
	
	$tabset.$activeTab = null;
	
	$tabset.$Tab = function $Tab(_file){
		var $tab = $("<div class='tab-handle'/>").appendTo($tabstrip);
		var $tabtitle = $("<span class='tab-text'/>").appendTo($tab);
		$tab.$content = $("<div class='tab-content'/>").appendTo($contents).hide();
		$tabs.push($tab);
		tabs.push($tab);
		$tab.title = function(title){
			if(title){
				$tabtitle.text(title);
				return $tab;
			}else{
				return $tabtitle.text();
			}
		};
		$tab.ttip = function(ttip){
			if(ttip){
				return $tab.attr("title",ttip);
			}else{
				return $tab.attr("title");
			}
		};
		$tab.close = function(){
			for(var i=0; i<tabs.length; i++){
				if(tabs[i] === $tab){
					if($tab.hasClass("active")){
						if(i>0){
							tabs[i-1].activate();
						}else if(tabs[i+1]){
							tabs[i+1].activate();
						}
					}
					tabs.splice(i,1);
					break;
				}
			}
			$tabs = $tabs.not($tab);
			$tab.$content.remove();
			$tab.css({
				"-webkit-transition": "-webkit-transform .2s ease-in-out, opacity .2s ease-in-out",
				"-webkit-transform": "scale(0.8) translateY(30px)",
				"opacity": 0,
				"pointer-events": "none",
				"z-index": 0
			},function(){
				$tab.remove();
			});
			calc_tab_width();
			order();
		};
		if(_file){
			$tab.title(_file.name).ttip(_file.path);
		}
		
		$tab.on("deactivate",function(){
			$tab.removeClass("active");
			$tab.$content.hide();
		});
		$tab.on("activate",function(){
			$tab.addClass("active");
			$tab.$content.show();
			$tabset.$activeTab = $activeTab = $tab;
		});
		$tab.xto = 0;
		$tab.activate = function(){
			$tabs.not($tab).trigger("deactivate");
			$tab.trigger("activate");
		};
		$tab.activate();
		$tab.on("mousedown",function(e){
			e.preventDefault();
			if(e.button === 1){
				$tab.trigger("close");
				return $tab.close();
			}
			
			$tab.activate();
			
			order();
			
			var offset = e.clientX - $tab.position().left;
			$G.on("mouseup",function mouseup(e){
				order();
				$G.off("mousemove", mousemove);
				$tab.removeClass("dragging");
			});	$G.on("mousemove", mousemove);
				$tab.addClass("dragging");
			function mousemove(e){
				var x = e.clientX - offset;
				x = Math.max(tab_margin, Math.min(x, $tabset.width() - tab_width - tab_margin));
				$tab.css({left: x});
				//@TODO: @BUG @FIX
				tabs.sort(function(a,b){
					var tabSwitchRatio = 1/3;
					if(a === $tab){
						return b.xto < x + tab_width*tabSwitchRatio;
					}else if(b === $tab){
						return x < a.xto + tab_width*tabSwitchRatio;
					}
					return 0;
					//return a.xto > b.xto;
				});
				for(var i=0;i<tabs.length;i++){
					var tab = tabs[i];
					if(tab === $tab) continue;
					tab.css({
						left: tab.xto = tab_width*i + tab_margin
					});
				}
			}
		});
		if($tabs.length === 1){
			$tab.trigger("activate");
		}
		$tabset.triggerHandler("resize");
		
		return $tab;
	};
	function calc_tab_width(){
		//man, I hate functions that sound like they should return a value but then they just set some variable
		tab_width = Math.min($tabstrip.width()/$tabs.length - tab_margin, max_tab_width);
	}
	function order(){
		//calc_tab_width();
		for(var i=0;i<tabs.length;i++){
			tabs[i].css({
				left: tabs[i].xto = tab_width*i + tab_margin,
				width: tab_width - tab_margin,
				zIndex: (200-i) + (tabs[i].hasClass("active")*500)
			});
		}
	}
	$tabset.on("resize", function resize(){
		calc_tab_width();
		$tabs.width(tab_width - tab_margin);
		$tabs.addClass("resizing");
		order();
		setTimeout(function(){
			$tabs.removeClass("resizing");
		},10);
	});
	$tabset.on("resize-animation", function resize(e, new_ts_width, speed){
		
		calc_tab_width();
		var new_tab_width = Math.min(new_ts_width/$tabs.length - tab_margin, max_tab_width);
		$tabs.addClass("resizing");
		for(var i=0;i<tabs.length;i++){
			tabs[i].animate({
				left: tabs[i].xto = new_tab_width*i + tab_margin,
				width: new_tab_width - tab_margin
			}, speed, function(){
				$tabs.removeClass("resizing");
				order();
			});
		}
	});
	
	return $tabset;
}