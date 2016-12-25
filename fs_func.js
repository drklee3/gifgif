fs = require("fs");

/**
 * Check if file exists
 * @param  {path}   file path to file
 * @param  {func} cb   callback function
 * @return {bool}        if path exists and is a file
 */
function if_exist(file, cb) {
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

function create_file(file, cb) {
	fs.writeFile(file, "ayy lmao", function(err) {
		if (err) {
			return console.log(err);
		}
		console.log("file " + file + " was saved!");
	}); 
}

/**
 * Generates new unique filename 
 * @param  {string} file starting filename
 * @return {string}      new filename
 */
function new_filename(file, callback) {
	if_exist(file, function(err, isFile) {
		if (isFile) { 						// if file exists
			file = increment_file(file);	// generate new filename
			new_filename(file, callback);	// check again if exists
		} else {
			callback(file);					// function callback
		}
	});
}

/**
 * creates new numerated filename
 * @param  {string} file input file name
 * @return {string}      new file name with extension
 */
function increment_file(file) {
	var re = /(?:\.([^.]+))?$/;
	var extension = re.exec(file)[0];

	var filename = file.substring(file.lastIndexOf('/')+1).replace(extension, "");	// filename without extension
	var number_match = filename.match(/\d+$/); 						// returns null if no match

	var filename_nonum = filename.replace(number_match, ""); 	// raw filename without number

	if (number_match) { // if already has a number at end
		number = parseInt(number_match[0], 10);
		number += 1;
	} else { 			// if no existing number
		number = 1;
	}

	var new_filename = filename_nonum + pad_num(number) + extension;
	return new_filename;
}

/**
 * pads numbers with zeros
 * @param  {int} number input number to be padded
 * @return {string}        padded number
 */
function pad_num(number) {
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