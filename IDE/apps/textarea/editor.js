
app.open = function($ws, file){
	//file may be optional in the future (that's why it comes second)
	var $tab = new $ws.$Tab(file);
	//$tab.title(file.name);
	//$tab.ttip(file.path);
	var $txt = $("<textarea/>").appendTo($tab.$content);
	
	$tab.on("activate", function(){
		//tab selected
	});
	$tab.on("deactivate", function(){
		//tab contents hidden
	});
	$tab.on("close", function(){
		//cleanup
	});

	file.read(function(err, content){
		$txt.val(content || err);
	});
	$txt.on("keydown",function(e){
		console.log(e.keyCode);
		if(e.ctrlKey && e.keyCode === "S".charCodeAt(0)){
			e.preventDefault();
			file.write($txt.val());
		}
	});
	
	$ws.on("resize",function(){
		//update the size of the editor
		//Use CSS when you can.
	});
};
