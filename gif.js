var ffmpeg = require('fluent-ffmpeg');

var command = ffmpeg("N:\\Documents\\GitLab\\gif\\clip.mp4")
  .size('320x240')
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


