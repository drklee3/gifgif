$(document).ready(function() {

	gif_params = {};


	fs = require("fs");
	gifgif = require("./ffmpeg_func.js");
	queue = require("./queue_func.js");
	npath = require("path");



	/* VIDEO PLAYER */


	function ffprobe_callback(video_data_raw) {
		video_data = {};
		video_data['fps'] = video_data_raw['streams'][0]['r_frame_rate'];
		video_data['width'] = video_data_raw['streams'][0]['width'];
		video_data['height'] = video_data_raw['streams'][0]['height'];
		video_data['bitrate'] = video_data_raw['format']['bit_rate'];

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
		gifgif.getVideoInfo(path, ffprobe_callback);
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
		gifgif.scalevideo();
		gifgif.createGif('gif');
	});

	$('#create_gfy').click(function() {
		gifgif.scalevideo();
		gifgif.createGif('gfy');
	});

	var queue_status = false;

	$("#queue_button").click(function() {
		if (queue_status) { // HIDE QUEUE
			// button css
			css = {
				bottom: 0
			}
			// for the container
			css2 = {
				top: 850
			}
			$("#queue_arrow").removeClass("fa-chevron-down").addClass("fa-chevron-up")
			queue_status = false;
		} else {	// SHOW QUEUE

			var button_bottom = $("#queue_content").height()

			var container_top = $(document).height() - $("#queue_content").height()
			if (container_top <= 200) {
				// change this val to adjust height for queue
				var distance_from_top = 400;

				container_top = distance_from_top;
				button_bottom = 850 - distance_from_top;
				$("#queue_container").css({
					"overflow-y": "scroll",
					"height": button_bottom
				})
			} else {
				$("#queue_container").css("overflow-y", "")
			}

			//button location
			css = {
				bottom: button_bottom
			}

			// container location
			css2 = {
				top: container_top
			}
			$("#queue_arrow").removeClass("fa-chevron-up").addClass("fa-chevron-down")
			queue_status = true;
		}
		$(this).animate(css, 500, 'easeOutQuint');
		$("#queue_container").animate(css2, 500, 'easeOutQuint');
	});

	$("tbody").on('click', 'a.queue_item', function() {
		var file_path = $(this).text();
		var path_without_file = npath.dirname(file_path);
		queue.open_folder(path_without_file);
	});

});
