// 初始化命令行设置
var commanderInit = require('./commanderInit');
var dirpath = "c:/CloudMusic";

var fs = require("fs");
var path = require("path");
var url = require("url");

// 将我们需要的文件扩展名和MIME名称列出一个字典
var mimeNames = require('../lib/mine');

function sendResponse(response, responseStatus, responseHeaders, readable) {
	response.writeHead(responseStatus, responseHeaders);
	response.on('end', function() {
		response.flush();
	});
	if (readable == null) {
		response.end();
	} else
		readable.on("open", function() {
			readable.pipe(response);
		});
	readable.on('end', function() {
		readable.close();
		readable.destroy();
	});

	return null;
}

function getMimeNameFromExt(ext) {
	var result = mimeNames[ext.toLowerCase()];

	// 最好给一个默认值
	if (result == null)
		result = "application/octet-stream";

	return result;
};

function readRangeHeader(range, totalLength) {
	/*
	 * Example of the method &apos;split&apos; with regular expression.
	 *
	 * Input: bytes=100-200
	 * Output: [null, 100, 200, null]
	 *
	 * Input: bytes=-200
	 * Output: [null, null, 200, null]
	 */

	if (range == null || range.length == 0)
		return null;

	var array = range.split(/bytes=([0-9]*)-([0-9]*)/);
	var start = parseInt(array[1]);
	var end = parseInt(array[2]);
	var result = {
		Start: isNaN(start) ? 0 : start,
		End: isNaN(end) ? (totalLength - 1) : end
	};

	if (!isNaN(start) && isNaN(end)) {
		result.Start = start;
		result.End = totalLength - 1;
	}

	if (isNaN(start) && !isNaN(end)) {
		result.Start = totalLength - end;
		result.End = totalLength - 1;
	}

	return result;
}

function FileServerController() {};

FileServerController.prototype.get = function(request, response, next) {
	// We will only accept 'GET' method. Otherwise will return 405 'Method Not Allowed'.
	if (request.method != 'GET') {
		sendResponse(response, 405, {
			'Allow': 'GET'
		}, null);
		return null;
	}

	var filename =
		dirpath + url.parse(request.url, true, true).pathname.split('/').join(path.sep);

	filename = decodeURIComponent(filename);

	// Check if file exists. If not, will return the 404 'Not Found'. 
	if (!fs.existsSync(filename)) {
		sendResponse(response, 404, null, null);
		return null;
	}

	var responseHeaders = {};
	responseHeaders['Connection'] = 'close';

	var contentType = path.extname(filename).replace(/^\./, '');

	var stat = fs.statSync(filename);
	var rangeRequest = readRangeHeader(request.headers['range'], stat.size);
	if (rangeRequest) {
		var start = rangeRequest.Start;
		var end = rangeRequest.End;
		if (start || end) {
			responseHeaders['Accept-Ranges'] = 'bytes';
			// 只有客户端主动请求长连接，服务端才嗲长连接
			if (request.headers['connection'] === 'keep-alive')
				responseHeaders['Connection'] = 'keep-alive';
		}
	}


	// If 'Range' header exists, we will parse it with Regular Expression.
	if (rangeRequest == null) {

		responseHeaders['Content-Type'] = getMimeNameFromExt(contentType);
		responseHeaders['Content-Length'] = stat.size; // File size.
		//  If not, will return file directly.
		sendResponse(response, 200, responseHeaders, fs.createReadStream(filename));
		return null;
	}
	// If the range can't be fulfilled. 
	if (start >= stat.size || end >= stat.size) {
		// Indicate the acceptable range.
		responseHeaders['Content-Range'] = 'bytes */' + stat.size; // File size.

		// Return the 416 'Requested Range Not Satisfiable'.
		sendResponse(response, 416, responseHeaders, null);
		return null;
	}

	// Indicate the current range. 
	responseHeaders['Content-Range'] = 'bytes ' + start + '-' + end + '/' + stat.size;
	responseHeaders['Content-Length'] = start == end ? 0 : (end - start + 1);
	responseHeaders['Content-Type'] = getMimeNameFromExt(contentType);
	responseHeaders['Cache-Control'] = 'no-cache';

	// Return the 206 'Partial Content'.
	sendResponse(response, 206,
		responseHeaders, fs.createReadStream(filename, {
			start: start,
			end: end
		}));
};

module.exports = FileServerController;