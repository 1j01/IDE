(function(){
	
	options = {mimes:{},appsettings:{}};
	
	workspaces = [];
	
	apps = {};
	$(apps).data("loaded",false);
	
	var fs, mod_path;
	if(nrequire){
		fs = nrequire("fs");
		mod_path = nrequire("path");
	}
	
	var fb = new Firebase("https://experimental-ide.firebaseio.com/firepads");
	var userID = Math.random();
	//window._fb = fb;
	
	$.ajaxSetup({ cache: true });
	$G = $(window);
	
	$activeWorkspace = null;
	$activeTab = null;
	
	GET("apps", function(err, app_names){
		if(err){
			V.error({
				title: "Failed to load the list of apps!!!!!! >:(",
				message: err
			});
		}else{
			console.log("Apps: "+app_names.join(", "));
			var n_apps = app_names.length;//Object.keys(apps).length;
			var n_loaded = 0;
			var n_failed = 0;
			var count = function(){
				//console.debug("apps loaded: "+n_loaded+"/"+n_apps);
				if(n_loaded >= n_apps){
					V.success("All apps loaded.",{t:5000});
				}else if(n_failed >= n_apps){
					V.error("(All apps failed to load!)");
				}else if(n_loaded + n_failed >= n_apps){
					V.warn("(Some apps failed to load.)");
				}if(n_loaded + n_failed >= n_apps){
					$(apps).trigger("loaded").data("loaded", true);
				}
			};
			var one_loaded = function(){
				n_loaded++;
				count();
			};
			var one_failed = function(){
				n_failed++;
				count();
			};
			$.each(app_names, function(i,app_dirname){
				var app_path = "apps/"+app_dirname+"/";
				var app_name;
				var E = function(e){
					V.error({
						title: (app_name || ("App \""+app_dirname)+"\"")+" failed to load!",
						message: (e.message||e)
					});
					one_failed();
				};
				$.ajax({
					type: "GET",
					url: app_path+"manifest.json",
					dataType: "text",//actually json, but jquery likes to parse that
					success: function(json){
						var app;
						try{
							app = JSON.parse(json);
						}catch(e){
							return E("Parsing manifest.json: "+e.message);
						}
						
						var requiredFields = {
							"name": "App Name",
							"description": "A description of your app.",
							"edit": ["code","text/*"],
							"main": "editor-main.js"
						};
						for(var f in requiredFields){
							if(!app[f]){
								return E("manifest.json missing required field: '"+f+"'");
							}
							var requiredType = typeof requiredFields[f];
							if(typeof app[f] !== requiredType){
								return E("manifest.json field '"+f+"' must be "+requiredType);
							}
						}
						app_name = app.name;
						
						$.ajax({
							type: "GET",
							url: app_path + app.main,
							dataType: "text",//actually a script, but jquery likes to EXECUTE scripts
							success: function(js){
								var params = {
									app: app
								};
								var args = [];
								var argvals = [];
								for(var p in params){
									args.push(p);
									argvals.push(params[p]);
								}
								try{
									args.push(js);
									var f = Function.apply(null,args);
									f.apply(null,argvals);
								}catch(e){
									return E("Script error: "+e);
								}
								
								//@NOTE: @UH, loading scripts after executing the app's main file? @TODO
								if(app.scripts){
									$.getScripts($.map(app.scripts,function(url){
										if(url[0] === "/"){
											return url.replace(/^\//,"");
										}else{
											return app_path+url;
										}
									}),function(){
										//app.__LOADED__ = true;
									});
								}
								if(app.styles){
									for(var i=0;i<app.styles.length;i++){
										$('<link/>', {
											rel: 'stylesheet',
											type: 'text/css',
											href: app_path+app.styles[i]
										}).appendTo('head');
									}
								}
								
								//finally!
								apps[app_dirname] = app;
								app.path = app_path;
								
								one_loaded();
							},
							error: function(xhr,status,err){
								E(err+"\n("+status+"?)");
							}
						});
					},
					error: function(xhr,status,err){
						E(err+"\n("+status+"?)");
					}
				});
				
			});
		}
	});
	
	$(function(){
		var $body = $("body");
		var $workspaces_list = $("#workspaces-list");
		var $sidebar = $("#sidebar");
		var $sidebar_handle = $("#sidebar-handle");
		//sidebar handle width
		var sbhw = $sidebar_handle.width() || 5;
		//extended sidebar width
		var esbw = 200;

		var $workspaces = $();
		GET("workspaces", function(err, workspaces){
			if(err){
				V.error(err);
			}else{
				if(workspaces.length === 0){
					$workspaces_list.html('Create a workspace to begin.<br/>Right click over here!<br/>');
				}else{
					$workspaces_list.empty();
					$.map(workspaces,function(wsobj){
						var $ws = new $Workspace(wsobj);
						$workspaces.push($ws);
						$ws.openAllFiles();
						return $ws;
					});
				}
			}
		});
		
		//start out minimized
		$sidebar.width(sbhw);
		
		var dragged = false;
		var click = function(e){
			if(dragged)return;
			//$sidebar.width(($sidebar.width()>sbhw+10)?sbhw:esbw,"slow");//@TODO: why is this backwards?
			var new_sbw = ($sidebar.width()>sbhw+10)?sbhw:esbw;
			var speed = 400;
			$sidebar.animate({
				width: new_sbw
			}, speed, function(){
				$workspaces.triggerHandler("resize");
			});
			$workspaces.triggerHandler("resize-animation", [innerWidth - new_sbw, speed]);
		};
		var mousemove = function(e){
			$sidebar.width(Math.max(sbhw,e.clientX+sbhw/2));
			$workspaces.triggerHandler("resize");
			dragged = true;
		};
		var mousedown = function(e){
			$G.on("mousemove.col-resize",mousemove);
			$body.addClass("col-resize");
			dragged = false;
		};
		var mouseup = function(e){
			$body.removeClass("col-resize");
			$G.off("mousemove.col-resize",mousemove);
		};
		$sidebar_handle.on("mousedown",mousedown);
		$sidebar_handle.on("selectstart",prevent);
		$sidebar_handle.on("click",click);
		$G.on("mouseup",mouseup);
		
		$G.on("resize now",function(){
			$workspaces.triggerHandler("resize");
		}).triggerHandler("now");
		setTimeout(function(){
			$G.triggerHandler("resize");
		},10);
		
		
		$G.on("keydown",function(e){
			if(e.ctrlKey){
				if(e.keyCode === ord("S")){
					if(!$activeTab){
						return V.error("No active tab to save.",{t:2000});
					}
					if(!$activeTab.file){
						return V.error("The active tab doesn't have a file to save!",{t:2000});
					}
					if(e.shiftKey || e.altKey){
						//Ctrl-Shift-S / Ctrl-Alt-S: save as
					}else{
						//Ctrl-S: save
					}
				}else if(e.keyCode === 13){
					if(e.altKey)return;
					//Ctrl-Enter: live edit
				}
			}
			function ord(c){
				return c.charCodeAt(0);
			}
		});
		
		//open files
		if(typeof nw_gui !== "undefined"){
			nw_gui.App.on("open",function(cmdline){
				V.success(cmdline,{title:"Command Line:"});
				$activeWorkspace.openFile(cmdline);
			});
		}
		
		//drag and drop files
		$.event.props.push('dataTransfer');
		
		$("html").on("dragover", function(e){
			e.preventDefault();  
			e.stopPropagation();
			$(this).addClass('dragging');
		});
		
		$("html").on("dragleave", function(e){
			e.preventDefault();  
			e.stopPropagation();
			$(this).removeClass('dragging');
		});
		
		$("html").on("drop", function(e) {
			var files = e.dataTransfer.files;
			if(files && files.length > 0){
				e.preventDefault();  
				e.stopPropagation();
				$.each(files,function(i,file){
					$activeWorkspace.openFile(file);
				});
			}
		});
	});

	function $Workspace(ws_def){
		var $handle = $("<div class='workspace-handle'/>");
		$handle.text(name).on("click", function(){
			$ws.toggle();
			if($ws.is(":visible")){
				$activeWorkspaace = $ws;
				$activeTab = $ws.$activeTab;
			}
		});
		
		var $ws = new $TabSet();
		$ws.addClass('workspace');
		$activeWorkspace = $ws;
		
		$ws.name = ws_def.name;
		$ws.files = ws_def.files;
		
		$ws.openAllFiles = function(_app){
			$.each($ws.files,function(i,file){
				$ws.openFile(file, _app);
			});
		};
		
		$ws.openFile = function(file, _app){
			if(!(file instanceof rFile)){
				file = new rFile(file);
			}
			
			if($(apps).data("loaded")){
				go();
			}else{
				$(apps).on("loaded",go);
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
					app.open($ws, file);
					done = true;
				}
			}
		};
		
		//add self to the page
		$("#workspaces-list").append($handle);
		$("#workspaces").append($ws);
		
		return $ws;
	}

	//"Real File"
	function rFile(relative_path_or_File){
		var f = this;
		
		if(relative_path_or_File instanceof File){
			var aFile = relative_path_or_File;
			f.path = relative_path_or_File.path;
			f.name = relative_path_or_File.name;
			if(NODE){
				f.relative_path = mod_path.relative(process.cwd(),f.path);
			}else{
				f.path = "?";
				f.relative_path = "?";
				f.content = "@TODO: readonly local file access?";
				f.__READ_TIME__ = Date.now() + 60*1000;
			}
		}else{
			var rel_path = relative_path_or_File;
			f.relative_path = rel_path;
			f.path = mod_path ? mod_path.resolve(rel_path) : (location.href.replace(/index.html$/, "")+rel_path);
			f.name = rel_path.replace(/^.*\//,"");
		}
		
		
		f.toString = function(){
			return "<"+f.path+">";
		};
		
		//f.__READING__ = false;
		POST("read",{path:f.relative_path},function(err, content){
			if(err){
				V.error({
					title: "Failed to read file:",
					text: f.path
				});
				console.error(err);
			}else{
				f.content = content;
				f.__READ_TIME__ = Date.now();
				console.log("auto read file "+f.path);
			}
			$(f).trigger("read", [err, content]);
		});
		
		f.read = function(callback){
			//f.__READING__ = true;
			if(f.content === undefined){
				$(f).on("read",function(e, err, content){
					//console.debug(e,err,content);
					callback && callback(err, content);
				});
			}else{
				var secondsSinceRead = (Date.now() - f.__READ_TIME__)/1000;
				if(secondsSinceRead < 10){
					callback && callback(f.content);
				}else{
					V.debug("re-reading file "+f.name);
					POST("read",{path:f.relative_path},function(err, content){
						if(err){
							V.error({
								title: "Failed to (re)read file:",
								text: f.path
							});
							console.error(err);
						}else{
							f.__READ_TIME__ = new Date();
							f.content = content;
							$(f).trigger("read",[err, f.content]);
						}
					});
				}
			}
		};
		f.write = function(content, callback){
			//save to disk and apply/execute changes without 
			f.live(content);
			POST("write",{
				path: f.relative_path,
				content: content
			},function(err, content){
				if(err){
					V.error({
						title: "Failed to write file "+f.path,
						message: (err.message||err)
					});
				}else{
					V.success("Saved file "+f.path,{t:2000});
				}
				callback && callback(err, content);
			});
		};
		f.live = function(content){
			//apply/execute changes without saving to disk
			$("link[rel=stylesheet][href]").each(function(){
				var $link = $(this);
				if($link.prop("href") === f.name){
					$link.prop('disabled',true);
					var id = "edit-"+f.name.replace(/\W/g,"-");
					var $style = $("style#"+id);
					if($style.length === 0){
						$style = $("<style id='"+id+"'>").appendTo("head");
					}
					$style.text(content);
					//$link.text(content);
					console.log("live editting "+f.path+" like a boss");
				}
			});
		};
	}
	
	
})();