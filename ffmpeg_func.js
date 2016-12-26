var exports = module.exports = {};

ffmpeg = require('fluent-ffmpeg');
queue = require("./queue_func.js");
io = require("./fs_func.js");
os = require('os');
npath = require('path');

exports.padNum = function(num) {
	var s = num + ""
	if (s.length < 2) {
		return "0" + s;
	} else {
		return s;
	}
}

exports.formatTime = function(in_time) {
	var hour = Math.floor(in_time / 3600);
	var min = Math.floor((in_time - (hour * 3600)) / 60);
	var sec = in_time - (hour * 3600) - (min * 60);

	var formated = exports.padNum(hour) + ":" + exports.padNum(min) + ":" + exports.padNum(sec);
	return formated;
}

exports.trim_video = function(gif_vars) {
	queue.modify_queue(gif_vars['filename'], "trim");

	var video_options = '-filter_complex crop=' + gif_vars['crop'] + ',scale=' + gif_vars['scaled_size'] + ':flags=lanczos';
	var speed = gif_vars['speed'];

	if (speed != 1) {
		video_options += ",setpts=" + speed + "*PTS";
	}

	var command = ffmpeg(path)
		.on('start', function(commandLine) {
			console.log('Spawned Ffmpeg with command: ' + commandLine);
		})
		.setStartTime(gif_vars['in_format'])
		.duration(gif_vars['duration'])
		.outputOptions(video_options)
		.on('error', function(err) {
			console.log('An error occurred: ' + err.message);
		})
		.on('end', function() {
			console.log('video trimmed!');
			// CHOOSE BETWEEN GIF OR GFY after trim
			if (gif_vars['type'] == 'gif') {
				exports.create_palette(gif_vars);
			} else {
				exports.create_gfy(gif_vars);
			}
		})
		.save(gif_vars['file_path'] + '_temp.mp4');
}

exports.create_gif = function(gif_vars) {
	// uses FILENAME as identifier, do not use path
	queue.modify_queue(gif_vars['filename'], "gif");

	var gif_options = '-filter_complex fps=' + gif_vars['fps'] + ',paletteuse=dither=sierra2_4a';

	// CREATE GIF
	var command = ffmpeg(gif_vars['file_path'] + '_temp.mp4')
		.addInput(gif_vars['file_path'] + '_palette.png')
		.outputOptions([
			'-v warning',
			gif_options
			])
		.on('start', function(commandLine) {
			console.log('Spawned Ffmpeg with command: ' + commandLine);
		})
		.on('error', function(err) {
			console.log('An error occurred: ' + err.message);
		})
		.on('end', function() {
			queue.modify_queue(gif_vars['filename'], "finished");
			queue.update_queue_num("finish");

			//delete temp files
			io.delete_file(gif_vars['file_path'] + '_temp.mp4')
			io.delete_file(gif_vars['file_path'] + '_palette.png')
			console.log('gif created!');
		})
		.save(gif_vars['file_path'] + '.gif');
}

exports.create_gfy = function(gif_vars) {
	queue.modify_queue(gif_vars['filename'], "gfy");

	var mute = gif_vars['mute_audio'];
	var gfy_options = "-v warning";
	if (mute) {
		gfy_options += " -an"
	}

	var command = ffmpeg(gif_vars['file_path'] + '_temp.mp4')
		.outputOptions(gfy_options)
		.on('start', function(commandLine) {
			console.log('Spawned Ffmpeg with command: ' + commandLine);
		})
		.on('error', function(err) {
			console.log('An error occurred: ' + err.message);
		})
		.on('end', function() {
			queue.modify_queue(gif_vars['filename'], "finished");
			queue.update_queue_num("finish");

			//delete temp files
			io.delete_file(gif_vars['file_path'] + '_temp.png')
			console.log('gfy created!');
		})
		.save(gif_vars['file_path'] + '.mp4');
}

exports.create_palette = function(gif_vars) {
	queue.modify_queue(gif_vars['filename'], "palette");

	var palette_options = '-vf fps=' + gif_vars['fps'] + ',palettegen';

	// CREATE PALETTE
	var command = ffmpeg(gif_vars['file_path'] + '_temp.mp4')
		.on('start', function(commandLine) {
			console.log('Spawned Ffmpeg with command: ' + commandLine);
		})
		.outputOptions(palette_options)
		.on('error', function(err) {
			console.log('An error occurred: ' + err.message);
		})
		.on('end', function() {
			console.log('palette created!');
			exports.create_gif(gif_vars);
		})
		.save(gif_vars['file_path'] + '_palette.png');
}

exports.round_and_even = function(in_num) {
	var num = Math.round(in_num)
	if (num % 2 != 0) {
		num += 1;
	}
	return num;
}

exports.scalevideo = function() {
	var scaled_video_width = $("#videoPreview").width();
	var scaled_video_height = $("#videoPreview").height();
	var select_box_width = $(".gif-crop").width();
	var select_box_height = $(".gif-crop").height();

	var height_ratio = select_box_height/scaled_video_height;
	var width_ratio = select_box_width/scaled_video_width;

	var real_vid_wid = video_data['width'];
	var real_vid_hei = video_data['height'];

	var out_w = real_vid_wid*width_ratio;
	var out_h = real_vid_hei*height_ratio;

	//calculating x and y
	var displayvideo = $("#videoPreview").offset();
	var selectbox = $(".gif-crop").offset();

	var disp_x = displayvideo['left'];
	var disp_y = displayvideo['top'];

	var select_x = selectbox['left'];
	var select_y = selectbox['top'];

	var ratio_width = (select_x - disp_x)/scaled_video_width;
	var ratio_height = (select_y - disp_y)/scaled_video_height;

	var x = real_vid_wid*ratio_width;
	var y = real_vid_hei*ratio_height;

	// snap to edges within 15 pixels
	if (out_w > video_data['width'] - 15) {
		out_w = video_data['width'];
	}
	if (out_h > video_data['height'] - 15) {
		out_h = video_data['height'];
	}

	// prevent negative values
	if (x < 0) {
		x = 0;
	}
	if (y < 0) {
		y = 0;
	}

	console.log('w/h: ' + out_w + '/' + out_h);
	console.log('x/y: ' + x + '/' + y);

	gif_params['width'] = out_w.toFixed(2)
	gif_params['height'] = out_h.toFixed(2)
	gif_params['x'] = x.toFixed(2)
	gif_params['y'] = y.toFixed(2)
}

exports.createGif = function(output_type) {
	// SET VARS
	gif_vars = {};

	gif_vars['type'] = output_type;

	gif_vars['width'] = gif_params['width'];
	gif_vars['height'] = gif_params['height'];

	gif_vars['speed'] = 100 / $('#speed').val();

	gif_vars['scale_percentage'] = $('#scale_percentage').val() / 100;

	gif_vars['scaled_width'] = exports.round_and_even(gif_vars['width']*gif_vars['scale_percentage']);
	gif_vars['scaled_height'] = exports.round_and_even(gif_vars['height']*gif_vars['scale_percentage']);

	gif_vars['scaled_size'] = gif_vars['scaled_width'] + ':' + gif_vars['scaled_height'];

	gif_vars['x'] = gif_params['x'];
	gif_vars['y'] = gif_params['y'];

	gif_vars['crop'] = gif_vars['width'] + ':' + gif_vars['height'] + ':' + gif_vars['x'] + ':' + gif_vars['y'];

	gif_vars['in_point'] = gif_params['in'].toFixed(3);
	gif_vars['out_point'] = gif_params['out'].toFixed(3);

	gif_vars['in_format'] = exports.formatTime(gif_vars['in_point']);
	gif_vars['duration'] = exports.formatTime(gif_vars['out_point'] - gif_vars['in_point']);

	gif_vars['fps'] = $('#fps').val();

	gif_vars['mute_audio'] = $('#mute_audio')[0].checked;

	// save to desktop/gifgif
	var output_path = npath.join(os.homedir(), 'Desktop', 'gifgif');

	// full path and file
	output_full_path = npath.join(output_path, 'output.' + gif_vars['type']);

	$('#status').html('Creating gif...');

	io.new_filename(output_full_path, function(file) {

		var re = /(?:\.([^.]+))?$/;
		var extension = re.exec(file)[0];					// extension with dot

		gif_vars['filename'] = npath.basename(file).replace(extension, ""); // filename without extension
		gif_vars['file_path'] = npath.join(output_path, gif_vars['filename']);

		var new_full_path = gif_vars['file_path'] + gif_vars['type'];

		queue.add_queue(new_full_path, gif_vars['filename'], "starting")

		// add to counter
		queue.update_queue_num("add");

		// check if path exists
		io.if_exist(file, function(err, isFile) {
			if (!isFile) { // if folder doesn't exist
				fs.mkdir(npath.dirname(new_full_path), function() {
					// start making the gif shit after creating folder
					exports.trim_video(gif_vars);
				})
			}
		});
	});
}


exports.getVideoInfo = function(video_path, ffprobe_callback) {
  ffmpeg.ffprobe(video_path, function(err, data) {
	video_data_raw = JSON.parse(JSON.stringify(data));
	console.warn('finished probe');
	ffprobe_callback(video_data_raw);
  })
};