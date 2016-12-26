var exports = module.exports = {};

var spawn = require('child_process');

/**
 * open a folder in explorer
 * @param  {string} path path to file/folder
 * @return {none}     
 */
exports.open_folder = function(path) { 
	spawn.exec('start "" "' + path + '"');
}

/**
 * Add an item to the queue table
 * @param {string} path   file path
 * @param {string} id     file name
 * @param {string} status initial status, should usually just be "starting"
 */
exports.add_queue = function(path, id, status) {
	var queue_item = "<tr id='" + id + "'><td>" + path + "</td><td>" + status + "</td></tr>";
	$('#queue_table > tbody:first-child').prepend(queue_item);
}

/**
 * update queue counter in button
 * @param  {string} status adding or finishing a queue item
 * @return {none}        modifies html
 */
exports.update_queue_num = function(status) {

	var queue_num = $('#queue_numbers').html();

	var queue_items = queue_num.split("/");

	var queue_completed = parseInt(queue_items[0]);
	var queue_total = parseInt(queue_items[1]);

	if (status == "add") {
		queue_total++;
	} else if (status == "finish") {
		queue_completed++;
	}

	var queue_write = queue_completed + "/" + queue_total;

	$('#queue_numbers').html(queue_write);
}

/**
 * modify queue items with status
 * @param  {string} id     id of status, also the filename
 * @param  {string} status new status of output
 * @return {none}        
 */
exports.modify_queue = function(id, status) {
	switch(status) {
		case "trim":
			var status_message = "<span style='color:#f1c40f'>trimming video</span>";
			break;
		case "palette":
			var status_message = "<span style='color:#e67e22'>creating palette</span>";
			break;
		case "gfy":
			var status_message = "<span style='color:#3498db'>creating gfy</span>";
			break;
		case "gif":
			var status_message = "<span style='color:#3498db'>creating gif</span>";
			break;
		case "finished":
			var status_message = "<span style='color:#2ecc71'>finished</span>";
			break;
	}
	$("#" + id + "td:last-child").html(status_message);
}