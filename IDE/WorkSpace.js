
function Workspace(ws_def){
	activeWorkspace = this;
	
	TabSet.call(this);
	
	var $handle = this.$handle = $("<div class='workspace-handle'/>");
	$handle.text(name).on("click", function(){
		$wsa.toggle();
		if($wsa.is(":visible")){
			activeWorkspaace = ws;
			$activeTab = ws.$activeTab;
		}
	});
	
	var $wsa = this.$tabset = new $TabSet();
	$wsa.addClass('workspace');
	
	$wsa.name = ws_def.name;
	$wsa.files = ws_def.files;
	
	this.openAllFiles = function(_app){
		$.each(ws.files,function(i,file){
			ws.openFile(file, _app);
		});
	};
	
	this.openFile = function(file, _app){
		if(!(file instanceof VFile)){
			file = new VFile(file);
		}
		
		if($(apps).data("loaded")){
			go();
		}else{
			$(apps).on("loaded", go);
		}
		
		function go(){
			var done = false;
			
			if(_app){
				return open_with(_app);
			}
			
			//uhhhhhhhhhhhh......... @TODO
			if(options.mimes instanceof Object){
				var pref = options.mimes[file.type];
				if(pref){
					if(apps[pref]){
						return open_with(file, apps[pref]);
					}else{
						V.warn("Preference "+pref+" isn't installed.");
					}
				}
			}
			$.each(["edit","view"],function(i, method){
				var ext = file.path.match(/\..*/);
				if(ext){
					ext = ext[0];
					$.each(apps,function(an, app){
						if(!app[method]){
							return true;//continue;
						}
						if(~app[method].indexOf(("*"+ext).toLowerCase())){
							open_with(app);
							return false;
						}
					});
				}
				if(done)return;
				//assume file is code :O
				$.each(apps,function(an, app){
					if(!app[method]){
						return true;//continue;
					}
					if(~app.edit.indexOf("code")){
						open_with(app);
						return false;
					}
				});
				if(done)return;
			});
			if(done)return;
			V.error("Couldn't find an app to open "+file.name);
			
			
			function open_with(app){
				//app can be an app object or the dirname of an app
				if(!app){
					V.error({
						title: "I tried to open "+file.name+" with... nothing?",
						message: "I'm confused. :("
					});
				}
				if(!app.open){
					if(typeof app === "string"){
						if(!apps[app]){
							V.error({
								title: "I tried to open "+file.name+" with... "+app,
								message: app+" doesn't seem to exist?"
							});
						}
						app = apps[app];
					}else{
						V.error({
							title: "I tried to open "+file.name+" with... "+app,
							message: "It didn't work so well. :("
						});
					}
				}
				app.open(ws, file);
				done = true;
			}
		}
	};
	
	//add self to the page
	$("#workspaces-list").append($handle);
	$("#workspaces").append($ws);
	
	return $ws;
}