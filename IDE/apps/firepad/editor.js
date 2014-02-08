
//styles: ["/lib/codemirror/lib/codemirror.css"],
app.open = function($ws, file){
	var $tab = new $ws.$Tab(file);
	$tab.title(file.name);
	$tab.ttip(file.path);
	
	var cm = CodeMirror($tab.$content[0],{
		indentWithTabs: true,//(for f***'s sake)
		//lineNumbers: true,
		//theme: "ambiance",
		undoDepth: 1000,
		extraKeys: {
			"Tab": function(cm) {
				CodeMirror.commands[cm.getSelection().length ? "indentMore" : "insertTab"](cm);
			},
			"Shift-Tab": "indentLess"
		},
		saveFunction: function(content){
			file.write(content);
		}
	});
	
	var rid = (""+Math.random()).replace(/\d?\./,"");
	var firepadRef = new Firebase("https://experimental-ide.firebaseio.com/firepad-temp/temp"+rid);
	var firepad = Firepad.fromCodeMirror(firepadRef, cm, {
		richTextToolbar: true,
		richTextShortcuts: true
	});
	firepad.on('ready', function() {
		file.read(function(err,content){
			firepad.setHtml(content);
		});
	});
    
	$tab.on("close", function(){
		firepadRef.remove();
	});
	$tab.on("activate", function(){
		cm.refresh();
	})
};