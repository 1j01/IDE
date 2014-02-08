
//styles: ["/lib/codemirror/lib/codemirror.css"],
app.open = function($ws, file){
	var $tab = new $ws.$Tab(file);
	$tab.title(file.name);
	$tab.ttip(file.path);
	
	var cm = CodeMirror($tab.$content[0],{
		indentWithTabs: true,//(for f***'s sake)
		lineNumbers: true,
		theme: "ambiance",
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
	$tab.on("close", function(){
		
	});
	$tab.on("activate", function(){
		cm.refresh();
	})
	file.read(function(err, content){
		cm.setValue(content || err);
	});
	
	var mode_matchers = {
		javascript: /\.js$/,
		css: /\.css$/,
		htmlmixed: /\.html?$/,
	};
	setMode();
	for(var mode in mode_matchers){
		if(file.path.match(mode_matchers[mode])){
			setMode(mode);
			break;
		}
	}
	//editor.setOption("mode", mode);
	//CodeMirror.autoLoadMode(editor, mode);
	function setMode(mode){
		if(mode !== undefined){
			cm.setOption('mode', mode);
			CodeMirror.autoLoadMode(cm, mode);
			/*var script = 'lib/codemirror/mode/'+mode+'/'+mode+'.js';

			$.getScript(script, function(data, success) {
				if(success) cm.setOption('mode', mode);
				else cm.setOption('mode', 'clike');
			});*/
		}else{
			cm.setOption('mode', 'clike');
		}
	}
};