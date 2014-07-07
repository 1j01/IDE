/*

<!--index.html, server.js etc. are served be server.js, included in index.html-->

this is just ridiculous

Why didn't I just use socket.io?

*/



if(nrequire){
	fs = nrequire("fs");
	mod_path = nrequire("path");
}

function VHost(REMOTE_SERVER){
	this.REMOTE_SERVER = REMOTE_SERVER;
}
$.each(["GET","PUT","POST","DELETE"], function(i, METHOD){
	VHost.prototype[METHOD] = function(){
		var callback = function(){
			V.error("No callback specified");
		};
		var data = void 0;
		var path = "ERROR/FAIL/UM";
		for(var i=0; i<arguments.length; i++){
			var a = arguments[i];
			if(typeof a === "function"){
				callback = a;
			}else if(typeof a === "string"){
				path = a;
			}else if(typeof a === "object"){
				data = a;
			}
		}
		if(this.REMOTE_SERVER){
			//remote access
			$.ajax({
				url: "http://"+this.REMOTE_SERVER+"/"+path+"/",
				dataType: "text",
				contentType: "application/json",
				type: METHOD,
				success: function(data){
					var res = JSON.parse(data);
					callback(res[0], res[1]);
				},
				error: function(xhr, status, error){
					V.error({title:status, message:error});
					callback(error);
				}
			});
		}else if(NODE){
			//direct access
			try{
				var cmdfun = GETs[path];
				cmdfun(callback);
			}catch(err){
				console.error("err within DIRECT "+METHOD+" "+path+": ", err.message);
				callback(err);
			}
		}else{
			//dummy access
			if(path === "workspaces"){
				callback(null, [{
					name: "Dummy Meta",
					files: ["../README.md", "server.js", "index.html", "ide.js", "main.css"]
				}]);
			}else if(path === "apps"){
				callback(null, ["ace", "codemirror", "textarea", "firepad"]);
			}
		}
	};
});

//these functions are garunteed to be called on a host NODE
GETs = {
	workspaces: function(callback){
		callback(null, [{
			name: "meta",
			files: ["server.js", "index.html", "ide.js", "main.css"]
		}]);
	},
	apps: function(callback){
		fs.readdir("apps", callback);
	}
};

/*
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
				callback(res[0], res[1]);
			},
			error: function(xhr, status, error){
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
*/

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
				res.write(JSON.stringify([undefined, content])+"\n");
				res.end();
			}
			function U_WANT_SOME_JSON_BRO(stuff_wanted){
				if(req.method === "GET"){
					GETs[stuff_wanted](function(err, content){
						if(err){
							sendJSON(err.code || 500, content);
						}else{
							sendJSON(200, content);
						}
					});
				}else{
					sendJSON(400, req.method+" not supported. You can only GET "+stuff_wanted);
				}
			}
			var pathname = URL.parse(req.url).pathname;
			
			var m;
			if(pathname === "/"){
				var fname = PATH.join(dir, 'index.html');
				FS.createReadStream(fname).pipe(res);
			}else if(pathname === "/apps/"){
				U_WANT_SOME_JSON_BRO("apps");
				GETs.apps(RET_JSON);
			}else if(pathname === "/workspaces/"){
				U_WANT_SOME_JSON_BRO("workspaces");
			}else if(m=pathname.match(/^\/workspaces\/(?:([^/])\/(.*))?/)){
				//@TODO: any security at all?
				var ws_name = m[1];
				var path = m[2];
				V.info("ACCESS WS "+ws_name+", path="+path);
				
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
						send(404, err.code+err.message);
					}else{
						if(stats.isFile()){
							// path exists, is a file
							var mimeType = mime_types[PATH.extname(filename)] || "application/octet-stream";
							res.writeHead(200, {
								'Content-Type': mimeType
							});
							
							FS.createReadStream(filename).pipe(res);
						}else if(stats.isDirectory()){
							// path exists, is a directory
							if(req.method === "GET"){
								send(200, "That's a directory. What, do you want a listing or something?");
							}else{
								send(505, req.method+" is not supported on directories.");
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