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

if(NODE){
	//direct access
	GET = function(thing, callback){
		try {
			var cmdfun = GETs[thing];
			cmdfun(callback);
		}catch(err){
			console.error("@GET "+thing+"(): ",err.message);
			callback(err);
		}
	};
	POST = function(action, data, callback){
		try {
			var cmdfun = POSTs[action];
			cmdfun(data, callback);
		}catch(err){
			console.error("@POST "+action+"(): ",err.message);
			callback(err);
		}
	};
}else if(SERVER){
	//remote access
	GET = function(thing, callback){
		$.ajax({
			url: "http://"+SERVER+"/"+thing+"/",
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
	};
	POST = function(action, data, callback){
		if(!$.isPlainObject(data)){
			V.warn("Not a plain object: "+data+"\n(see console)");
			console.warn(data);
		}
		$.ajax({
			url: "http://"+SERVER+"/"+action+"/",
			dataType: "text",
			contentType: "application/json",
			type: "POST",
			data: JSON.stringify(data),
			success: function(res){
				res = JSON.parse(res);
				callback(res.err, res.resobj);
			},
			error: function(xhr,status,error){
				V.error({title:status,message:error});
				console.debug(xhr);
				callback(error);
			}
		});
	};
}else{
	//dummy access
	V.info({title:"Running in dummy mode.",message:"No write access or anything."});
	GET = function(thing, callback){
		if(thing === "workspaces"){
			callback(null, [{
				name: "Dummy Meta",
				files: ["../README.md", "index.html", "ide.js", "main.css"]
			}]);
		}else if(thing === "apps"){
			callback(null, ["ace", "codemirror", "textarea", "firepad"]);
		}
	};
	POST = function(action, data, callback){
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
			V.error({title:"No server connection.",message:"No write access or anything."});
		}
	};
}


if(NODE){
	
	window.startServer = function startServer(port){
		port = port || 1337;
		if(port > 65535){
			return V.error("Port must be less than or equal to <abbr title='16bit unsigned integer'>65535</abbr>.");
		}
		
		var express = nrequire("express");
		var ex = express();
		var cwd = process.cwd();
		
		//serve everything, including this file! :D
		ex.use(express.static(cwd));
		ex.use(express.json());
		
		for(var thing in GETs){
			ex.get("/"+thing,(function(cmdfun){
				return function(req,res){
					cmdfun(function(err,resobj){
						res.send(JSON.stringify({err:err,resobj:resobj}));
					});
				};
			})(GETs[thing]));
		}
		for(var action in POSTs){
			ex.post("/"+action,(function(cmdfun){
				return function(req,res){
					try {
						//console.debug(action,req.body);
						var data = req.body;//JSON.parse(req.body);
						cmdfun(data,function(err,resobj){
							res.send(JSON.stringify({err:err,resobj:resobj}));
						});
					}catch(e){
						res.send(JSON.stringify({err:"JSON.parse error (probably): "+e.message}));
					}
				};
			})(POSTs[action]));
		}
		
		//find local ip
		var ip;
		var os = nrequire('os');
		var ifaces = os.networkInterfaces();
		for(var dev in ifaces) {
			ifaces[dev].forEach(function(details){
				if(details.family == 'IPv4') {
					//just use the first one i guess
					ip = ip || details.address;
				}
			});
		}
		
		var sockets = [];
		var server = ex.listen(port,function(){
			V.success({
				time:-1,
				title:"Server started!",
				html:"<input value=\"http://"+ip+":"+port+"/\"/>"
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
				V.error({
					time:-1,
					title:"Port "+port+" is in use.",
					html:"Use a different port?<br>"
						+"<input type=number step=1 value="+((Math.random()*65535)|0)+"><br>"
						+"<button>Start server!</button>"
				});
			}else{
				V.error.apply(null,arguments);
			}
		});
		
		function stopServer(callback){
			try {
				server.close(function () {
					V.notify("Server stopped.");
					callback && callback();
				});
				$.each(sockets,function(i,socket){
					socket.destroy();
					//console.log("destroyed socket");
				});
			} catch(e) {
				if(callback){
					callback(e);
				}else{
					V.error(e);
				}
			}
		}
		
		window.stopServer = stopServer;
		global.server = server;
		global.server.TERMINATE = stopServer;
	};
	
	if(global.server){
		global.server.TERMINATE(function(e){
			if(e)console.warn(e);
			//This is a restart, restart the server as well.
			startServer();
		});
	}
	
}