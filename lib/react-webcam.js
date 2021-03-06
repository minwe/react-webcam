var React = require('react');

function hasGetUserMedia() {
  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

module.exports = React.createClass({
  displayName: 'Webcam',

  getDefaultProps: function() {
    return {
      audio: true,
      height: 480,
      width: 640
    };
  },

  getInitialState: function() {
    return {
      on: false
    };
  },

  statics: {
    mountedInstances: [],
    userMediaRequested: false,
  },

  componentWillMount: function() {
    Webcam.mountedInstances.push(this);
  },

  componentDidMount: function() {
    self = this;

    if (!hasGetUserMedia()) return;
    if (Webcam.userMediaRequested) return;

    navigator.getUserMedia = navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia;

    if (this.props.audioSource && this.props.videoSource) {
      sourceSelected(this.props.audioSource, this.props.videoSource);
    } else {
      MediaStreamTrack.getSources(function(sourceInfos) {
        var audioSource = null;
        var videoSource = null;

        sourceInfos.forEach(function(sourceInfo) {
          if (sourceInfo.kind === 'audio') {
            //console.log(sourceInfo.id, sourceInfo.label || 'microphone');

            audioSource = sourceInfo.id;
          } else if (sourceInfo.kind === 'video') {
            //console.log(sourceInfo.id, sourceInfo.label || 'camera');

            videoSource = sourceInfo.id;
          } else {
            //console.log('Some other kind of source: ', sourceInfo);
          }
        });

        sourceSelected(audioSource, videoSource);
      });
    }

    function sourceSelected(audioSource, videoSource) {
      var constraints = {
        video: {
          optional: [{sourceId: videoSource}]
        }
      };

      if (self.props.audio)
        constraints.audio = {
          optional: [{sourceId: audioSource}]
        }

      navigator.getUserMedia(constraints, function(stream) {
        Webcam.mountedInstances.forEach(function(instance) {
          instance._successCallback(stream);
        });
      }, function(e) {
        Webcam.mountedInstances.forEach(function(instance) {
          instance._errorCallback(e);
        });
      });
    }

    Webcam.userMediaRequested = true;
  },

  _successCallback: function(stream) {
    var video = this.refs.video.getDOMNode();
    this.setState({on:true});
    video.src = window.URL.createObjectURL(stream);
  },

  _errorCallback:function(e) {
    var video = this.refs.video.getDOMNode();
    video.src = self.props.fallbackURL;
  },

  componentWillUnmount: function() {
    var url = video.src;
    var video = this.refs.video.getDOMNode();
    window.URL.revokeObjectUrl(url);
  },

  getScreenshot: function() {
    if (!this.state.on) return;

    var video = this.refs.video.getDOMNode();

    var canvas = document.createElement('canvas');
    canvas.height = video.clientHeight;
    canvas.width = video.clientWidth;

    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/webp');
  },

  render: function () {
    return (
      <video autoPlay width={this.props.width} height={this.props.height} ref='video'></video>
    );
  }
});
