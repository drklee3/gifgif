var exports = module.exports = {};

fs = require("fs");
var npath = require("path");

/**
 * Check if exact file exists
 * @param  {path}   file path to file
 * @param  {func} cb   callback function
 * @return {bool}        if path exists and is a file
 */
exports.if_exist = function(file, cb) {
	fs.stat(file, function fsStat(err, stats) {
		if (err) {
			if (err.code === 'ENOENT') {
				return cb(null, false);
			} else {
				return cb(err);
			}
		}
		return cb(null, stats.isFile());
	});
}


/**
 * checks if fileNAME exists in a directory. for checking if temp files exist
 * @param  {string}   path   path to directory
 * @param  {string}   search filename to search for
 * @param  {func} 	cb     callback function
 * @return {bool}          returns if found file or not
 */
exports.if_exists_in_dir = function(path, search, cb) {
	fs.readdir(path, function(err, files) {
		var found = false;
		files.forEach(function(n) {
			if (n.indexOf(search) >= 0) {
				found = true;
			} 
		})
		return cb(found);
	})
}

exports.create_file = function(file, cb) {
	fs.writeFile(file, "ayy lmao", function(err) {
		if (err) {
			return console.log(err);
		}
		console.log("file " + file + " was saved!");
	}); 
}

exports.delete_file = function(file) {
	fs.unlink(file, function(err) {
		if (err) {
			return console.log(err);
		}
		console.log('deleted file');
	})
}

/**
 * Generates new unique filename 
 * @param  {string} file starting filename
 * @return {string}      new filename
 */
exports.new_filename = function(file, callback) {
	exports.if_exist(file, function(err, isFile) {
		if (isFile) { 						// if file exists
			file = exports.increment_file(file);	// generate new filename
			exports.new_filename(file, callback);	// check again if exists
		} else {
			callback(file);					// function callback
		}
	});
}

/**
 * creates new numerated filename
 * @param  {string} file input file name
 * @return {string}      new file name with extension WITHOUT path
 */
exports.increment_file = function(file) {
	var re = /(?:\.([^.]+))?$/;
	var extension = re.exec(file)[0];

	var filename = npath.basename(file).replace(extension, "");	// filename without extension
	var filepath = npath.dirname(file);
	var number_match = filename.match(/\d+$/); 						// returns null if no match

	var filename_nonum = filename.replace(number_match, ""); 	// raw filename without number

	if (number_match) { // if already has a number at end
		number = parseInt(number_match[0], 10);
		number += 1;
	} else { 			// if no existing number
		number = 1;
	}

	var new_filename = filename_nonum + exports.pad_num(number) + extension;
	return npath.join(filepath, new_filename);
}

/**
 * pads numbers with zeros
 * @param  {int} number input number to be padded
 * @return {string}        padded number
 */
exports.pad_num = function(number) {
	var str = "" + number
	var pad = "0000"
	var padded = pad.substring(0, pad.length - str.length) + str

	return padded;
}

//test run
//
//new_filename('test.txt', function(file) {
//	console.log(file);
//})