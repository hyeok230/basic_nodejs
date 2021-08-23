var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path'); //보안을 위해 사용된 모듈
var sanitizeHtml = require('sanitize-html');


var template = require('./lib/template.js');

var app = http.createServer(function(request,response){
    var _url = request.url;
	var queryData = url.parse(_url, true).query;
	var pathname = url.parse(_url, true).pathname;
	if (pathname === '/'){
		if (queryData.id === undefined) {
			fs.readdir('./data', function(error, filelist){
				var title = 'Welcome';
				var description = 'Hello, Node.js';
				var list = template.list(filelist);
				var html = template.html(title, list, `<h2>${title}</h2>${description}`
						,`<a href="/create">create</a>`);
				response.writeHead(200);
				response.end(html);
			});
		} else {
			fs.readdir('./data', function(error, filelist){
				var filteredId = path.parse(queryData.id).base; // path 모듈을 사용하여 다른 디렉토의 파일에 접근하는 것을 차단할 수 있음.
				fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
					var title = queryData.id;
					var sanitizedTitle = sanitizeHtml(title);
					var sanitizedDescription = sanitizeHtml(description, {
						allowedTags:['h1']
					}); // sanitize를 사용하면 html을 지워 자바스크립트를 강제로 삽입하는 것을 방지할 수 있다.
					var list = template.list(filelist);
					var html = 	template.html(title, list, 
						`<h2>${title}</h2>${description}`,
						`<a href="/create">create</a> 
						 <a href="/update?id=${title}">update</a>
						 <form action="/delete_process" method="post"> 
						 	<input type="hidden" name="id" value="${title}">
							<input type="submit" value="delete">
						 </form>`
					);				
					response.writeHead(200);
					response.end(html);
				});
			});
		}
	} else if (pathname === '/create') {
		fs.readdir('./data', function(error, filelist){
			var title = 'WEB - create';
			var list = template.list(filelist);
			var html = template.html(title, list, `
				<form action="/create_process" method="post">
					<p><input type="text" name="title" placeholder="title"></p>
					<p>
						<textarea name="description" placeholder="description"></textarea>
					</p>
					<p>
						<input type="submit">
					</p>
				</form>`, '');
			response.writeHead(200);
			response.end(html);
		});
	} else if (pathname === '/create_process') {
		var body = '';
		request.on('data', function(data){
			body = body + data;
		});
		request.on('end', function(){
			var post = qs.parse(body);
			var title = post.title;
			var description = post.description;
			fs.writeFile(`data/${title}`, description, 'utf8', function(err){
				response.writeHead(302, {Location:`/?id=${title}`});
				response.end();
			});
		});
	} else if (pathname === '/update'){
		var filteredId = path.parse(queryData.id).base;
		fs.readdir('./data', function(error, filelist){
			fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
				var title = queryData.id;
				var list = template.list(filelist);
				var html = 	template.html(title, list, 
				 `<form action="/update_process" method="post">
				 	<input type="hidden" name="id" value="${title}"
					<p><input type="text" name="title" placeholder="title" value="${title}"></p>
					<p>
						<textarea name="description" placeholder="description">${description}</textarea>
					</p>
					<p>
						<input type="submit">
					</p>
				</form>`, '');
			response.writeHead(200);
			response.end(html);
			});
		});
	} else if (pathname === '/update_process') {
		var body = '';
		request.on('data', function(data){
			body = body + data;
		});
		request.on('end', function(){
			var post = qs.parse(body);
			var id = post.id;
			var title = post.title;
			var description = post.description;
			fs.rename(`data/${id}`, `data/${title}`, function(error){
				fs.writeFile(`data/${title}`, description, 'utf8', function(err){
					response.writeHead(302, {Location:`/?id=${title}`});
					response.end();
				});
			})
		});
	} else if (pathname === '/delete_process') {
		var body = '';
		request.on('data', function(data){
			body = body + data;
		});
		request.on('end', function(){
			var post = qs.parse(body);
			var id = post.id;
			var filteredId = path.parse(id).base;
			fs.unlink(`data/${filteredId}`, function(error){
				response.writeHead(302, {Location: '/'});
				response.end();
			});
		});
	} else {
		response.writeHead(404);
		response.end('Not found');
	}
});
app.listen(3000);
