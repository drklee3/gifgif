$(document).ready(function() {

	/* GIF */
	ffmpeg = require('fluent-ffmpeg');

	function createGif(params) {
	  // parameter dictinary
	  params

	  var command = ffmpeg("N:\\Documents\\GitLab\\gif\\clip.mp4")
	    .size('320x240')
	    .setStartTime('')
	    .outputOptions('-vf', 'fps=15,palettegen')
	    .on('error', function(err) {
	      console.log('An error occurred: ' + err.message);
	    })
	    .on('end', function() {
	      console.log('palette created!');


	      var command = ffmpeg("N:\\Documents\\GitLab\\gif\\clip.mp4")
	        .addInput('palette.png')
	        .outputOptions([
	          '-v warning',
	          '-filter_complex', 'fps=15,scale=320:-1:flags=lanczos[x];[x][1:v]paletteuse'
	          ])
	        .on('error', function(err) {
	          console.log('An error occurred: ' + err.message);
	        })
	        .on('end', function() {
	          console.log('gif created!');
	        })
	        .save('output.gif');
	    })
	    .save('palette.png');

	};

	function getVideoInfo(video_path) {
	  ffmpeg.ffprobe(video_path, function(err, data) {
	  	console.dir(data);
	  	var results = JSON.parse(data);
	    return results;
	  })
	};

	/*END GIF*/




	var URL = window.URL || window.webkitURL

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
		console.log(video_url);
		$('#videoPreview').attr('src', video_url);

	};

	$('#videoPreview').on('loadeddata', function() {
		var video_width = $('#videoPreview').width();
		console.log(video_width);
		resizeCrop();
	});

	$('#inputFile').change(function() {

		console.log(this.files);
		console.log(this.files[0].size);
		path = this.files[0].path;
		path = path.replace(/\\/g, "\\\\");
		var video_info = getVideoInfo(path);
		console.dir(video_info);
		console.log(video_info['streams'][0]['r_frame_rate'])
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

	// IN OUT DRAGGER
	$(".in-out-bar").resizable({
		containment: ".in-out-bar-full",
		handles: "e"
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

	function resizeCrop() {

		
		console.log('resizing');
		var video_width = $("#videoPreview").width();

		// center the video
		var parent_width = $(".video-left-padding").parent().width();
		var padding_width = (parent_width - video_width) / 2;
		$(".video-left-padding").css('width', padding_width);

		//resize crop zone
		console.log(video_width);
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

	gif_params = {};
	// IN / OUT SETTING
	$('.in-point-set').click(function() {
		var current_time = $('#videoPreview')[0].currentTime;
		gif_params['in'] = current_time;
	});

	$('.out-point-set').click(function() {
		var current_time = $('#videoPreview')[0].currentTime;
		gif_params['out'] = current_time;
	});
});