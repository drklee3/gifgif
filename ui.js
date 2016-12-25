$(document).ready(function() {

	gif_params = {};

	/* GIF */
	ffmpeg = require('fluent-ffmpeg');
	fs = require("fs");
	io = require("./fs_func.js");

	function padNum(num) {
		var s = num + ""
		if (s.length < 2) {
			return "0" + s;
		} else {
			return s;
		}
	}

	function formatTime(in_time) {
		var hour = Math.floor(in_time / 3600);
		var min = Math.floor((in_time - (hour * 3600)) / 60);
		var sec = in_time - (hour * 3600) - (min * 60);

		var formated = padNum(hour) + ":" + padNum(min) + ":" + padNum(sec);
		return formated;
	}

	function trim_video(gif_vars) {
		var command = ffmpeg(path)
			.on('start', function(commandLine) {
				console.log('Spawned Ffmpeg with command: ' + commandLine);
			})
			.setStartTime(gif_vars['in_format'])
			.duration(gif_vars['duration'])
			.outputOptions([
				'-filter_complex', 'crop=' + gif_vars['crop'] + ',scale=' + gif_vars['scaled_size'] + ':flags=lanczos'
				])
			.on('error', function(err) {
				console.log('An error occurred: ' + err.message);
			})
			.on('end', function() {
				console.log('video trimmed!');
				// CHOOSE BETWEEN GIF OR GFY after trim
				if (gif_vars['type'] == 'gif') {
					create_palette(gif_vars);
				} else {
					create_gfy(gif_vars);
				}
			})
			.save('temp_vid_trimmed.mp4');
	}

	function create_gif(gif_vars) {
		// CREATE GIF
		var command = ffmpeg('temp_vid_trimmed.mp4')
			.addInput('palette.png')
			.outputOptions([
				'-v warning',
				'-filter_complex', 'fps=' + gif_vars['fps'] + ',paletteuse=dither=sierra2_4a'
				])
			.on('start', function(commandLine) {
				console.log('Spawned Ffmpeg with command: ' + commandLine);
			})
			.on('error', function(err) {
				console.log('An error occurred: ' + err.message);
			})
			.on('end', function() {
				console.log('gif created!');
			})
			.save('output.gif');
	}

	function create_gfy(gif_vars) {
		var command = ffmpeg(gif_vars['trimmed_vid'])
			.outputOptions('-v warning')
			.on('start', function(commandLine) {
				console.log('Spawned Ffmpeg with command: ' + commandLine);
			})
			.on('error', function(err) {
				console.log('An error occurred: ' + err.message);
			})
			.on('end', function() {
				console.log('gfy created!');
			})
			.save('output.mp4');
	}

	function create_palette(gif_vars) {
		// CREATE PALETTE
		var command = ffmpeg(gif_vars['trimmed_vid'])
			.on('start', function(commandLine) {
				console.log('Spawned Ffmpeg with command: ' + commandLine);
			})
			.outputOptions('-vf', 'fps=' + gif_vars['fps'] + ',palettegen')
			.on('error', function(err) {
				console.log('An error occurred: ' + err.message);
			})
			.on('end', function() {
				console.log('palette created!');
				create_gif(gif_vars);
			})
			.save('palette.png');
	}

	function round_and_even(in_num) {
		var num = Math.round(in_num)
		if (num % 2 != 0) {
			num += 1;
		}
		return num;
	}

	function scalevideo() {
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

	function createGif(output_type) {
		// SET VARS
		var gif_vars = {};

		gif_vars['type'] = output_type;

		gif_vars['width'] = gif_params['width'];
		gif_vars['height'] = gif_params['height'];

		gif_vars['scale_percentage'] = $('#scale_percentage').val() / 100;

		gif_vars['scaled_width'] = round_and_even(gif_vars['width']*gif_vars['scale_percentage']);
		gif_vars['scaled_height'] = round_and_even(gif_vars['height']*gif_vars['scale_percentage']);

		gif_vars['scaled_size'] = gif_vars['scaled_width'] + ':' + gif_vars['scaled_height'];

		gif_vars['x'] = gif_params['x'];
		gif_vars['y'] = gif_params['y'];

		gif_vars['crop'] = gif_vars['width'] + ':' + gif_vars['height'] + ':' + gif_vars['x'] + ':' + gif_vars['y'];

		gif_vars['in_point'] = gif_params['in'].toFixed(3);
		gif_vars['out_point'] = gif_params['out'].toFixed(3);

		gif_vars['in_format'] = formatTime(gif_vars['in_point']);
		gif_vars['duration'] = formatTime(gif_vars['out_point'] - gif_vars['in_point']);

		gif_vars['fps'] = $('#fps').val();

		var re = /(?:\.([^.]+))?$/;
		gif_vars['extension'] = re.exec(path)[0];
		gif_vars['trimmed_vid'] = 'temp_vid_trimmed' + gif_vars['extension']

		$('#status').html('Creating gif...')

		trim_video(gif_vars);
	}


	function getVideoInfo(video_path, ffprobe_callback) {
	  ffmpeg.ffprobe(video_path, function(err, data) {
		video_data_raw = JSON.parse(JSON.stringify(data));
		console.warn('finished probe');
		ffprobe_callback(video_data_raw);
	  })
	};

	/*END GIF*/


	/* VIDEO PLAYER */


	function ffprobe_callback(video_data_raw) {
		video_data = {};
		video_data['fps'] = video_data_raw['streams'][0]['r_frame_rate'];
		video_data['width'] = video_data_raw['streams'][0]['width'];
		video_data['height'] = video_data_raw['streams'][0]['height'];

		$('#fps').val(getFps(video_data['fps']).toFixed(3));
		console.log(video_data)
	}

	var URL = window.URL || window.webkitURL

	//initialize center
	resizeCrop();

	function renderVideo(file) {
		var type = file.type;
		var player = $('#videoPreview')[0];
		var canPlay = player.canPlayType(type);
		if (canPlay === '') {
			canPlay = 'no';
			alert('failed to play');
		}
		var video_url = URL.createObjectURL(file);
		$('#videoPreview').attr('src', video_url);

	};

	$('#videoPreview').on('loadeddata', function() {
		var video_width = $('#videoPreview').width();
		resizeCrop();
	});

	$('#inputFile').change(function() {

		//console.log(this.files);
		//console.log(this.files[0].size);
		path = this.files[0].path;
		//escape backslashes from path
		//path = path.replace(/\\/g, "\\\\");
		getVideoInfo(path, ffprobe_callback);
		renderVideo(this.files[0]);
	});


	//VIDEO PLAYER

	var video = $('#videoPreview');

	$('.button-play').on('click', function() {
		if(video[0].paused) {
			video[0].play();
			$(this).text('Pause');
		}
		else {
			video[0].pause();
			$(this).text('Play');
		}
		return false;
	});

	// CROP SELECTION
	$(".gif-crop")
		.resizable({
			containment: "#videoPreview",
			handles: "n, e, s, w, ne, se, sw, nw",
		})
		.draggable({
			containment: "#videoPreview"
		});

	/**
	 * Center video and resize crop area when video is updated
	 * @return {none} 
	 */
	function resizeCrop() {
		var video_width = $("#videoPreview").width();

		// center the video
		var parent_width = $(".video-left-padding").parent().width();
		var padding_width = (parent_width - video_width) / 2;
		$(".video-left-padding").css('width', padding_width);

		//resize crop zone
		$(".crop-wrapper").css({
			'width': video_width,
			'left': padding_width
		});
		$(".gif-crop").css({
			'width': video_width - 2,
			'top': 0,
			'left': 0,
			'height': '398px',
		});
	}

	/**
	 * Calculate fps from probe data for frame by frame seeking
	 * @return {number} frames in a second
	 */
	function getFps() {
		// default frame time (in case ffprobe is not finished yet)
		frameTime = 30;

		// get current file frame time
		var frameTime_raw = video_data['fps'];
		var frameTime_split = frameTime_raw.split("/");
		var frameTime = frameTime_split[0] / frameTime_split[1];
		return frameTime;
	}

	// FINE SEEKING SHIT
	$('.button-back-second').click(function() {
		var vid = $('#videoPreview')[0];
		vid.currentTime -= 1;
	});
	$('.button-back-frame').click(function() {
		var vid = $('#videoPreview')[0];
		vid.currentTime -= 1 / getFps();
	});
	$('.button-forward-frame').click(function() {
		var vid = $('#videoPreview')[0];
		vid.currentTime += 1 / getFps();
	});
	$('.button-forward-second').click(function() {
		var vid = $('#videoPreview')[0];
		vid.currentTime += 1;
	});

	// update the duration box
	function set_duration(duration) {
		$('#duration').val(duration.toFixed(3));
	}

	function set_in_point(time) {
		var hour = Math.floor(time / 3600);
		var min = Math.floor((time - (hour * 3600)) / 60);
		var sec = time - (hour * 3600) - (min * 60);
		$('#in_point_hour').val(hour);
		$('#in_point_minute').val(min);
		$('#in_point_second').val(sec.toFixed(2));
	}

	function set_out_point(time) {
		var hour = Math.floor(time / 3600);
		var min = Math.floor((time - (hour * 3600)) / 60);
		var sec = time - (hour * 3600) - (min * 60);
		$('#out_point_hour').val(hour);
		$('#out_point_minute').val(min);
		$('#out_point_second').val(sec.toFixed(2));
	}

	// IN / OUT BUTTONS
	$('.in-point-set').click(function() {
		var current_time = video[0].currentTime;
		// update text boxes
		set_in_point(current_time);

		// update data
		gif_params['in'] = current_time;

		// update duration
		if ("out" in gif_params) {
			var duration = gif_params['out'] - current_time;
			set_duration(duration);
		}
	});

	$('.out-point-set').click(function() {
		var current_time = video[0].currentTime;
		//update text boxes
		set_out_point(current_time);

		//update data
		gif_params['out'] = current_time;

		//update duration
		if ("in" in gif_params) {
			var duration = current_time - gif_params['in'];
			set_duration(duration);
		}

	});

	//get HTML5 video time duration
	video.on('loadedmetadata', function() {
	    $('.duration').text(video[0].duration);
	});

	//update HTML5 video current play time
	video.on('timeupdate', function() {
	    var currentPos = video[0].currentTime; //Get currenttime
	    var maxduration = video[0].duration; //Get video duration
	    var percentage = 100 * currentPos / maxduration; //in %
	    $('.timeBar').css('width', percentage+'%');
	});

	//DRAGGABLE

	var timeDrag = false;   /* Drag status */
	$('.progressBar').mousedown(function(e) {
	    timeDrag = true;
	    updatebar(e.pageX);
	});
	$(document).mouseup(function(e) {
	    if(timeDrag) {
	        timeDrag = false;
	        updatebar(e.pageX);
	    }
	});
	$(document).mousemove(function(e) {
	    if(timeDrag) {
	        updatebar(e.pageX);
	    }
	});

	//update Progress Bar control
	var updatebar = function(x) {
	    var progress = $('.progressBar');
	    var maxduration = video[0].duration; //Video duraiton
	    var position = x - progress.offset().left; //Click pos
	    var percentage = 100 * position / progress.width();

	    //Check within range
	    if(percentage > 100) {
	        percentage = 100;
	    }
	    if(percentage < 0) {
	        percentage = 0;
	    }

	    //Update progress bar and video currenttime
	    $('.timeBar').css('width', percentage+'%');
	    video[0].currentTime = maxduration * percentage / 100;
	};

	// DURATION DRAGGER
	$(".duration-bar").resizable({
		containment: ".duration-bar-full",
		handles: "e"
	});

	$('#duration').change(function() {
		var duration = $(this).val();

		//update out point
		if ("in" in gif_params) {
			var in_point = parseFloat(gif_params['in']);
			var out_point = in_point + parseFloat(duration);
			gif_params['out'] = out_point;

			set_out_point(out_point);
		}

	});

	$('#create_gif').click(function(){
		scalevideo();
		createGif('gif');
	});

	$('#create_gfy').click(function() {
		scalevideo();
		createGif('gfy');
	})

});
