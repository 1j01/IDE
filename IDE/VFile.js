
function VFile(path_or_File){
	var f = this;
	
	if(path_or_File instanceof File){
		var aFile = path_or_File;
		f.path = aFile.path;
		f.name = aFile.name;
		f.content = "@TODO: readonly local file access?";
		f.__READ_TIME__ = Date.now() + 60*1000;
	}else{
		var path = path_or_File;
		f.relative_path = path;
		f.path = mod_path ? mod_path.resolve(path) : (location.href.replace(/index.html$/, "")+path);
		f.name = path.replace(/^.*\//,"");
		f.vpath = "workspaces/"+path;
	}
	
	
	f.toString = function(){
		return f.vpath? ("<vpath:"+f.vpath+">") : ("<path:"+f.path+">");
	};
	
	//f.__READING__ = false;
	vhost.GET(f.vpath, function(err, content){
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
				vhost.GET(f.vpath,function(err, content){
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
		vhost.PUT(f.vpath, content, function(err){
			if(err){
				V.error({
					title: "Failed to write file "+f.path,
					message: (err.message||err)
				});
			}else{
				V.success("Saved file "+f.path, {t:2000});
			}
			callback && callback(err);
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
				console.log("live editting "+f+" like a boss");
			}
		});
	};
}