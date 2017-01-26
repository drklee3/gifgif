var exports = module.exports = {};

var app = require('app');
var ffbinaries = require('ffbinaries');
var user_data_dir = app.getPath(userData);

exports.check_ffbinaries = function() {
	user_data_dir
}

exports.download_ffbinaries = function() {
	var platform = ffbinaries.detectPlatform();
	var dest = user_data_dir + '/binaries';
}