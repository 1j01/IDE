/*

<!--index.html, server.js etc. are served be server.js, included in index.html-->

this is just ridiculous

Why didn't I just use socket.io?

*/



if(nrequire){
	fs = nrequire("fs");
	mod_path = nrequire("path");
}

//these functions are garunteed to be called on a host NODE
GETs = {
	workspaces: function(callback){
		callback(null,[{
			name: "meta",
			files: ["server.js", "index.html", "ide.js", "main.css"]
		}]);
	},
	apps: function(callback){
		fs.readdir("apps",callback);
	}
};
POSTs = {
	write: function(param, callback){
		//return callback("Save disabled! :)");
		fs.writeFile(param.path, param.content, function(err){
			if(err){
				callback("Failed to write "+param.path);
			}else{
				callback(null,"File written.");
			}
		});
	},
	read: function(param, callback){
		var path = mod_path.resolve(param.path);
		fs.readFile(path, function(err, content){
			if(err){
				callback("Failed to read "+param.path);
			}else{
				callback(null,content+"");
			}
		});
	}
};

GET = function(thing, callback){
	if(REMOTE_SERVER){
		//remote access
		$.ajax({
			url: "http://"+REMOTE_SERVER+"/"+thing+"/",
			dataType: "text",
			contentType: "application/json",
			type: "GET",
			success: function(data){
				var res = JSON.parse(data);
				callback(res.err, res.resobj);
			},
			error: function(xhr,status,error){
				V.error({title:status,message:error});
				callback(error);
			}
		});
	}else if(NODE){
		//direct access
		try{
			var cmdfun = GETs[thing];
			cmdfun(callback);
		}catch(err){
			console.error("@GET "+thing+"(): ",err.message);
			callback(err);
		}
	}else{
		//dummy access
		if(thing === "workspaces"){
			callback(null, [{
				name: "Dummy Meta",
				files: ["../README.md", "server.js", "index.html", "ide.js", "main.css"]
			}]);
		}else if(thing === "apps"){
			callback(null, ["ace", "codemirror", "textarea", "firepad"]);
		}
	}
};

POST = function(action, data, callback){
	if(!$.isPlainObject(data)){
		V.warn("Not a plain object: "+data+"\n(see console)");
		console.warn(data);
	}
	if(REMOTE_SERVER){
		//remote access
		$.ajax({
			url: "http://"+REMOTE_SERVER+"/"+action+"/",
			dataType: "text",
			contentType: "application/json",
			type: "POST",
			data: JSON.stringify(data),
			success: function(res){
				res = JSON.parse(res);
				callback(res.err, res.resobj);
			},
			error: function(xhr,status,error){
				V.error({
					title: status,
					message: error
				});
				console.debug(xhr);
				callback(error);
			}
		});
	}else if(NODE){
		//direct access
		try {
			var cmdfun = POSTs[action];
			cmdfun(data, callback);
		}catch(err){
			console.error("@POST "+action+"(): ", err.message);
			callback(err);
		}
	}else{
		//dummy access
		if(action === "read"){
			var fname = data.path;
			$.ajax({
				url: fname,
				dataType: "text",
				success: function(content){
					callback(null, content);
				},
				fail: function(error){
					callback(error);
				}
			});
		}else{
			V.error({
				title: "No server connection.",
				message: "No write access or anything."
			});
		}
	}
};


if(NODE){
	
	window.startServer = function startServer(port){
		port = port || 1337;
		if(port > 65535){
			return V.error(
				"Port must be less than or equal to"
				+ "<abbr title='16bit unsigned integer'>"
				+ Math.pow(2,16)
				+ "</abbr>."
			);
		}
		
		var dir = process.cwd();
		
		//serve everything, including this file! :D
		/////////////////
		
		var HTTP = require('http');
		var FS = require('fs');
		var PATH = require("path");
		var URL = require('url');
		
		var mime_types = {
			".html": "text/html",
			".js": "text/javascript",
			".css": "text/css",
			
			".htm": "text/html",
			".txt": "text/plain",
			".jpeg": "image/jpeg",
			".jpg": "image/jpeg",
			".png": "image/png",
		};
		
		var server = HTTP.createServer(function(req, res){
			function send(code, content){
				res.writeHead(code, {
					'Content-Type': "text/plain"
				});
				res.write(content+"\n");
				res.end();
			}
			function sendJSON(code, content){
				res.writeHead(code, {
					'Content-Type': "application/json"
				});
				res.write(JSON.stringify({resobj:content})+"\n");
				res.end();
			}
			function RET_JSON(err, content){
				if(err){
					sendJSON(err.code || 500, content);
				}else{
					sendJSON(200, content);
				}
			}
			var pathname = URL.parse(req.url).pathname;
			//if(pathname === "/"){}else{return V.debug(pathname);}
			
			var m;
			if(pathname === "/"){
				var fname = PATH.join(dir, 'index.html');
				FS.createReadStream(fname).pipe(res);
			}else if(pathname === "/apps/"){
				// list workspaces
				GETs.apps(RET_JSON);
			}else if(pathname === "/workspaces/"){
				// list workspaces
				GETs.workspaces(RET_JSON);
			}else if(m=pathname.match(/^\/workspaces\/(?:([^/])\/(.*))?/)){
				var ws_name = m[1];
				var path = m[2];
				console.log("ACCESS WS.",m);
				
				var ws = workspaces[ws_name];
				if(!ws){
					return V.warn("No workspace '"+ws_name+"'");
				}
				var filename = PATH.join(ws.path, path);
				console.log(filename);
			}else{
				// static file serving
				var filename = PATH.join(dir, pathname);
				FS.lstat(filename, function(err, stats){
					if(err){
						send(404, err.code);
					}else{
						if(stats.isFile()){
							// path exists, is a file
							var mimeType = mime_types[PATH.extname(filename)];
							res.writeHead(200, {
								'Content-Type': mimeType
									// "here is a bunch of bytes, hopefully there is an application over on your end which knows what to do with them"
									|| "application/octet-stream"
							});
							
							FS.createReadStream(filename).pipe(res);
						}else if(stats.isDirectory()){
							// path exists, is a directory
							if(req.method === "GET"){
								send(200, "that's a dir");
							}else{
								send(505, "uh, "+req.method+"?");
							}
						}else{
							// Symbolic link, other?
							// @TODO: follow symlinks? securely?
							send(500, 'what?');
						}
					}
				});
			}
		});
		
		/////////////////
		/*for(var thing in GETs){
			app.get("/"+thing,(function(cmdfun){
				return function(req,res){
					cmdfun(function(err,resobj){
						res.send(JSON.stringify({err:err,resobj:resobj}));
					});
				};
			})(GETs[thing]));
		}
		for(var action in POSTs){
			app.post("/"+action,(function(cmdfun){
				return function(req,res){
					try {
						//console.debug(action,req.body);
						var data = req.body;//JSON.parse(req.body);
						cmdfun(data,function(err,resobj){
							res.send(JSON.stringify({err:err,resobj:resobj}));
						});
					}catch(e){
						res.send(JSON.stringify({err:e.message}));
					}
				};
			})(POSTs[action]));
		}*/
		
		//find local ip
		var ip, ifaces = require('os').networkInterfaces();
		for(var dev in ifaces){
			ifaces[dev].forEach(function(details){
				if(details.family == 'IPv4') {
					//just use the first one i guess
					ip = ip || details.address;
				}
			});
		}
		
		var sockets = [];
		server.listen(port, function(){
			V.success({
				time: -1,
				title: "Server started!",
				html: "<input value=\"http://"+ip+":"+port+"/\"/>"
			});

			server.on('connection', function(socket){
				sockets.push(socket);
				socket.setTimeout(60*1000);
				socket.on('close', function(){
					//console.log('socket closed');
					sockets.splice(sockets.indexOf(socket), 1);
				});
			});
		}).on("error",function(e){
			if(e.code === "EADDRINUSE"){
				var $n = V.error({
					time: -1,
					title: "Port "+port+" is in use.",
					html: "Use a different port?<br>"
						+ "<input type=number step=1 value="+((Math.random()*65535)|0)+"><br>"
						+ "<button>Start server!</button>"
				});
				$n.$("button").click(function(){
					startServer(Number($n.$("input").val()));
					$n.remove();
				});
				$n.$("input").select();
			}else{
				V.error(e);
			}
		});
		
		function stopServer(callback){
			try{
				server.close(function () {
					V.notify("Server stopped.");
					callback && callback();
				});
				$.each(sockets,function(i,socket){
					socket.destroy();
					//console.log("destroyed socket");
				});
			}catch(e){
				if(callback){
					callback(e);
				}else{
					V.error(e);
				}
			}
		}
		
		window.stopServer = stopServer;
		global.server = server;
		global.server.terminate = stopServer;
		global.server.port = port;
	};
	
	if(global.server){
		global.server.terminate(function(e){
			if(e)console.warn(e);
			//This is a restart, so restart the server as well.
			startServer(global.server.port);
		});
	}
	
}