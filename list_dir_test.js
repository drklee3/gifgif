fs = require('fs');

function contains(path, search, cb) {
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

contains("N:\\Documents\\GitLab\\gif", "ffmpeg_func", function(found) {
	console.log(found)
})