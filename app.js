function isLocalStorageNameSupported() {
    var testKey = 'test', storage = window.localStorage;
    try {
        storage.setItem(testKey, '1');
        storage.removeItem(testKey);
        return true
    }
    catch (error) {
        return false;
    }
}
var isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;

var a = new Vue({
    el: "#app",
    data: {
        activeCode: "",
        activeAP: {},
        regions: [],
        isPlaying: false,
        loading: false
    },
    computed: {
        // a computed getter
        isPlayingState: function () {
            return this.isPlaying ? "playing" : "paused";
        }
    },
    mounted: function () {
        var self = this;
        var $ = jQuery;

        $("#stream").on("error", function (e) {
            self.error(e);
            self.loading = false;
        });

        $("#stream").on("loadstart", function (e) {
            self.loading = true;
        });

        $("#stream").on("canplay", function (e) {
            self.loading = false;
        });

        $.get("airports.json", function (data) {
            //self.regions = data;

            var x = data.map(function (region) {

                var aps = region.airports.map(function (cv) {
                    return {
                        code: cv[0],
                        text: cv[1],
                        iata: cv[2],
                        error: !!cv[3]
                    }
                });

                region.airports = aps;

                return region;
            });

            self.regions = x;

            //window.XX = data;

            var fil = self.getAirports();

            if (document.location.hash === "#debug") {
                fil.forEach(function (element, index) {
                    setTimeout(function () {
                        self.listenTo(element);
                    }, 1000 * (index + 1));
                }, this);
            } else if (!isMobile) {
                self.listenTo(null)
            } else {
                self.pause();
            }
        });
    },
    methods: {
        getAirports: function () {
            var airports = this.regions.reduce(function (acc, val) {
                return acc.concat(val.airports);
            }, []);

            var fil = airports.filter(function (cv) { return cv.code !== "iss" });
            return fil;
        },
        donateYes: function (e) {
            $("#supportbtns").hide();
            $("#support").show();
        },
        donateNo: function (e) {
            $("#nobtn").text("Okey :(");
        },
        error: function (e) {
            //console.log("Error detected");
            this.activeAP.error = true;
            //var txt = this.activeAP.text;
            //this.activeAP.text = txt += " (Offline)"
            //console.log("Error detected", this.activeAP);
        },
        play: function () {
            if (!this.activeAP.code) {
                this.listenTo(null);
                return;
            }
            this.isPlaying = true;
            //$('.playpause').attr("data-state", "playing");
            var player = SC.Widget("soundcloud_player_iframe");
            var stream = document.getElementById("stream");
            playButton.goToState("playing");
            stream.play();
            player.play();
        },
        pause: function () {
            this.isPlaying = false;
            playButton.goToState("paused");
            //$('.playpause').attr("data-state", "paused");
            var player = SC.Widget("soundcloud_player_iframe");
            var stream = document.getElementById("stream");
            stream.pause();
            player.pause();
        },
        changeState: function () {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        },
        listenTo: function (airport) {
            if (airport === null) {
                var aps = this.getAirports();
                var randomNum = Math.floor(Math.random() * (aps.length));
                var lp = localStorage.getItem("lastPlayed");
                if (lp != null) {
                    airport = aps.find(function (ap) { return ap.code === lp });
                } else {
                    airport = aps[randomNum];
                }
            }
            var code = airport.code;
            if (!code) return;
            this.activeCode = code;
            this.activeAP = airport;
            if (isLocalStorageNameSupported()) {
                localStorage.setItem("lastPlayed", code);
            }

            if (code === "iss") {
                spaceModeOn();
            } else {
                spaceModeOff();
                var url = "http://mtl2.liveatc.net/" + code;
                $("#stream").attr("src", url);
            }

            $(".current").text(airport.text);
            this.play();
        },
        getData: function () {
            return this.regions;
        }
    }

});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

$('#vc_music, #vc_control').on('change input', function () {
    setMusic($(this).val());
});
$('#vc_radio').on('change input', function () {
    setRadio($(this).val());
});

function setRadio(v) {
    var stream = document.getElementById("stream");
    stream.volume = v / 100;
    $('#vc_radio').val(v);
    localStorage.setItem("vc_radio", v);
}
function setMusic(v) {
    var player = SC.Widget("soundcloud_player_iframe");
    player.setVolume(v / 100);
    $('#vc_music, #vc_control').val(v);
    localStorage.setItem("vc_music", v);
}

var scsrc = "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/5281179&auto_play=true&start_track=" + getRandomInt(0, 152);
$("#soundcloud_player_iframe").attr("src", scsrc);

// default volumes
$(function () {
    setRadio(localStorage.getItem("vc_radio") || 50);
    setMusic(localStorage.getItem("vc_music") || 50);
    setTimeout(function () {
        setRadio(localStorage.getItem("vc_radio") || 50);
        setMusic(localStorage.getItem("vc_music") || 50);
    }, 3000);
});

var spacestream = "http://www.ustream.tv/embed/17074538?v=3&wmode=direct&autoplay=true";
var origbg = null;
var isInspace = false;
function spaceModeOn() {
    $('body').addClass("spacemode");
    isInspace = true;
    var stream = document.getElementById("stream");
    stream.pause();
    var $v = $('.video-foreground');
    if (origbg == null) {
        origbg = $v.html();
    }
    $v.html('<iframe width="720" height="437" src="http://www.ustream.tv/embed/17074538?v=3&wmode=direct&autoplay=true" scrolling="no" frameborder="0" style="border: 0px none transparent;"></iframe>');
}

function spaceModeOff() {
    if (isInspace) {
        $('body').removeClass("spacemode");
        $('.video-foreground').html(origbg);
    }
    isInspace = false;

}

function handleVisibilityChange() {
    var video = document.getElementById("video");
    if (!video) return;

    var iframe = video.contentWindow;

    var func;
    if (document.hidden) {
        func = 'pauseVideo';
    } else {
        func = 'playVideo';
    }
    iframe.postMessage('{"event":"command","func":"' + func + '","args":""}', '*');
}

document.addEventListener("visibilitychange", handleVisibilityChange, false);


var layers = [],
		objects = [],
		
		world = document.getElementById( 'world' ),
		viewport = document.getElementById( 'viewport' ),
		
		d = 0,
		p = 1000,
		worldXAngle = 0,
		worldYAngle = 0;
	
	viewport.style.webkitPerspective = p;
	viewport.style.MozPerspective = p;
	viewport.style.oPerspective = p;
	
	generate();
	
	function createCloud(data) {
	
		var div = document.createElement( 'div'  );
		div.className = 'cloudBase';
		var x = 256 - ( Math.random() * 512 );
		var y = 256 - ( Math.random() * 512 );
		var z = 256 - ( Math.random() * 512 );
		var t = 'translateX( ' + x + 'px ) translateY( ' + y + 'px ) translateZ( ' + z + 'px )';
		div.style.webkitTransform = t;
		div.style.MozTransform = t;
		div.style.oTransform = t;
		world.appendChild( div );
		
		for( var j = 0; j < 5; j++ ) {
			var cloud = document.createElement( 'img' );
			cloud.style.opacity = 0;
			var r = Math.random();
			var src = 'cloud.png';
			( function( img ) { img.addEventListener( 'load', function() {
				img.style.opacity = .8;
			} ) } )( cloud );
			cloud.setAttribute( 'src', src );
			cloud.className = 'cloudLayer';
			
            if(!data){
                var x = 256 - ( Math.random() * 512 );
                var y = 256 - ( Math.random() * 512 );
                var z = 100 - ( Math.random() * 200 );
                var a = Math.random() * 360;
                var s = 0.25 + Math.random();
                x *= .2; y *= .2;
                cloud.data = { 
                    x: x,
                    y: y,
                    z: z,
                    a: a,
                    s: s,
                    speed: .001 * Math.random()
                };
                console.log(cloud.data);
            }else {
                cloud.data = data;
            }
			var t = 'translateX( ' + x + 'px ) translateY( ' + y + 'px ) translateZ( ' + z + 'px ) rotateZ( ' + a + 'deg ) scale( ' + s + ' )';
			cloud.style.webkitTransform = t;
			cloud.style.MozTransform = t;
			cloud.style.oTransform = t;
		
			div.appendChild( cloud );
			layers.push( cloud );
		}
		
		return div;
	}
	
	/*window.addEventListener( 'mousewheel', onContainerMouseWheel );
	window.addEventListener( 'DOMMouseScroll', onContainerMouseWheel ); */

	window.addEventListener( 'mousemove', function( e ) {
		mpx = e.clientX;
        mpy = e.clientY;
        //wx+= mpx;
        //wy+= mpy;
	} );

    var wy = 0;
    var wx = 0;
    var mpx = 0;
    var mpy = 0;
    var anim = function () {
        requestAnimationFrame(function () {

            //console.log(mpx);
            //console.log(mpy);

            //console.log("wy",wy);
            //console.log("xy", wx);

            wy += 1/10;
            wx += 1/10;

            worldYAngle = -( 0.5 - ( wy  / window.innerWidth ) ) * 180;
            worldXAngle = ( 0.5 - ( wx / window.innerHeight ) ) * 180;
            updateView();
            update();
            anim();
        });
    };
    anim();
	
	function generate() {
		objects = [];
		if ( world.hasChildNodes() ) {
			while ( world.childNodes.length >= 1 ) {
				world.removeChild( world.firstChild );       
			} 
		}

        /*objects.push(createCloud({ 
				x: x,
				y: y,
				z: z,
				a: a,
				s: s,
				speed: .001 * Math.random()
			}));*/
        objects.push(createCloud());
        objects.push(createCloud());
        objects.push(createCloud());
        objects.push(createCloud());
	}
	
	function updateView() {
		var t = 'translateZ( ' + d + 'px ) rotateX( ' + worldXAngle + 'deg) rotateY( ' + worldYAngle + 'deg)';
		world.style.webkitTransform = t;
		world.style.MozTransform = t;
		world.style.oTransform = t;
	}
	
	function onContainerMouseWheel( event ) {
			
		event = event ? event : window.event;
		d = d - ( event.detail ? event.detail * -5 : event.wheelDelta / 8 );
		updateView();
		
	}
	
	function update (){
		
		for( var j = 0; j < layers.length; j++ ) {
			var layer = layers[ j ];
			//layer.data.a += layer.data.speed;
			var t = 'translateX( ' + layer.data.x + 'px ) translateY( ' + layer.data.y + 'px ) translateZ( ' + layer.data.z + 'px ) rotateY( ' + ( - worldYAngle ) + 'deg ) rotateX( ' + ( - worldXAngle ) + 'deg ) scale( ' + layer.data.s + ')';
			layer.style.webkitTransform = t;
			layer.style.MozTransform = t;
			layer.style.oTransform = t;
		}
		
		//requestAnimationFrame( update );
		
	}
	
	//update();
