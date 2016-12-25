var exports = module.exports = {};

var spawn = require('child_process');

exports.open_folder = function(path) { 
	spawn.exec('start "" "' + path + '"');
}