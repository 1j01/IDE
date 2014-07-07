
var modelist, themelist, Emmet;
var _app = app.path;
var _ace = "lib/ace/";

//app.open = ({file, $tab, $area})->
app.open = function(o){
	//coffeescript makes this a lot nicer
	var file = o.file;
	var $tab = o.$tab;
	var $area = o.$area;
	
	if(typeof ace !== "undefined"){
		go();
	}else{
		requirejs([_ace+"ace.js"],go);
	}
	function go(){
		if($tab.CLOSED)return;
		
		var editor = ace.edit($tab.$content[0]);
		
		editor.setTheme("ace/theme/twilight");
		editor.getSession().setUseSoftTabs(false);//(for f***'s sake)
		
		$tab.on("activate", function(){
			editor.resize();
		});
		$tab.on("deactivate", function(){
			
		});
		$tab.on("close", function(){
			editor.destroy();
		});
		$ws.on("resize",function(){
			editor.resize();
		});
		
		editor.setValue("Loading...", -1);
		file.read(function(err, content){
			if(err){
				editor.setValue(err, -1);
			}else{
				editor.setValue(content, -1);
			}
			setTimeout(function(){editor.session.getUndoManager().$undoStack=[];});
		});
		editor.commands.addCommand({
			name: 'save',
			bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
			exec: function(editor){
				file.write(editor.getValue());
			},
			readOnly: false // don't exec save in readOnly mode
		});
		
		$.getScripts([
			_ace+'ext-modelist.js',
			_ace+'ext-themelist.js',
			_ace+'ext-emmet.js',
			'http://nightwing.github.io/emmet-core/emmet.js'
		],function(){
			if(Emmet = Emmet || ace.require('ace/ext/emmet')){
				if(typeof emmet !== "undefined"){
					Emmet.setCore(emmet);
					editor.setOption("enableEmmet", true);
				}
			}
			
			if(modelist = modelist || ace.require('ace/ext/modelist')){
				var mode = modelist.getModeForPath(file.path).mode;
				editor.getSession().setMode(mode);
			}
			/*if(themelist = themelist || ace.require('ace/ext/themelist')){
				var theme = choose(themelist.themes);
				editor.setTheme(theme.theme);
			}*/
		});
	}
};