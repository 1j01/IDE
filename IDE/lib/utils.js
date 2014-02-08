
function choose(a){
	if(arguments.length>1)a=Array.prototype.slice.call(arguments);
	return a[Math.floor(Math.random()*a.length)];
}
function chooseKeyFromObject(o){
	var a=[],i;for(i in o)if(o.hasOwnProperty(i))a.push(i);
	return a[Math.floor(Math.random()*a.length)];
}
function chooseValueFromObject(o){
	var a=[],i;for(i in o)if(o.hasOwnProperty(i))a.push(o[i]);
	return a[Math.floor(Math.random()*a.length)];
}
function irandom(x){
	return (Math.random()*(x+1))|0;
}
function randomCSSColor(){
	return "hsla("+Math.floor(Math.random()*360)+","+Math.floor(Math.random()*100)+"%,"+Math.floor(Math.random()*100)+"%,0.9)";
}
function prevent(e){
	e.preventDefault();
	return false;
}


(function($) {
	$.fn.$ = $.fn.find;
    $.fn.attrs = function(){
        var attrs = {}; 

        if(this.length){
            $.each(this[0].attributes, function(index, attr){
				//IE lists unspecified attributes (must check for specified)
				//in other browsers, specified will probably always be true for compatibility
				if(attr.specified){
                	attrs[attr.name.toLowerCase()] = attr.value;
				}
            }); 
        }

        return attrs;
    };
	$.fn.appendText = function(text){
		return this.each(function(){
			var textNode = document.createTextNode(text);
			$(this).append(textNode);
		});
	};
	$.fn.push = function(elements){
		var $addTo = this;
		var $elements = $(elements);
		$elements.each(function(){
			$addTo[$addTo.length++] = this;
		});
	};
	
	var gotten = [];
	$.getScripts = function(resources, callback){
		var deferreds = [];
		
		for(var i=0; i<resources.length; i++){
			if(gotten.indexOf(resources[i]) == -1){
				deferreds.push($.getScript(resources[i]));
			}
		}

		$.when.apply(null, deferreds).then(callback);
	};
	//$.getScripts = function(scripts, callback){
	//	$.when.apply(null, $.map(scripts,$.getScript)).then(callback);
	//};
})(jQuery);