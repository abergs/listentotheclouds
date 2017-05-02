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

var VISIBLE_DEFAULT = 15;

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
        //playButton.init();

        var lang = window.navigator.language;
        
        if(lang && lang.indexOf("ru") > -1) {
            //$("#donatebtn").text(" Поддержать этот сайт ");
            $("#donateq").text("Поддержите проект?");
            $("#yesbtn").text("да");
            $("#donatepp").text("Спасибо - Нажмите здесь, чтобы пожертвовать любую сумму, которую вы хотите");

        }

        if (isMobile) {
            jQuery("body").addClass("isMobile");
        }

        if (isMobile) {

            jQuery('.video-foreground').html("");
        }

        $('.nxt').on('click', function () {
            var player = SC.Widget("soundcloud_player_iframe");
            player.next();
        });

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
                        time: cv[3],
                        error: cv[4] === true
                    }
                });

                aps.sort(function(a,b) {
                    var xx = a.error-b.error;
                    //console.log(xx);
                    return xx;
                });

                region.airports = aps;
                region.showAll = false;

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
        getHiddenCount: function(region) {
            return region.airports.length - VISIBLE_DEFAULT;
        },
        getAirports: function () {
            var airports = this.regions.reduce(function (acc, val) {
                return acc.concat(val.airports);
            }, []);

            var fil = airports.filter(function (cv) { return cv.code !== "iss" && !cv.error && cv.code !== "" });
            return fil;
        },
        airportsBucket: function(region) {
            
            if(region.showAll){
                return region.airports;
            }else {
                return region.airports.slice(0,VISIBLE_DEFAULT);
            }
            return region.airports;
        },
        showMore: function (region) {
            
            region.showAll = true;
            
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
            //playButton.goToState("playing");
            stream.play();
            player.play();
        },
        pause: function () {
            this.isPlaying = false;
            //playButton.goToState("paused");
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
            if (!airport) {
                var aps = this.getAirports();
                var randomNum = Math.floor(Math.random() * (aps.length));
                var lp = localStorage.getItem("lastPlayed");
                if (lp) {
                    airport = aps.find(function (ap) { return ap.code === lp });
                }
                
                if(!airport) {
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

if(isLocalStorageNameSupported()) {
    var views = localStorage.getItem("views");
    views = parseInt(views || 0, 10);
    views +=1
    localStorage.setItem("views",views);

    if(views >= 3) {
        //$('.donate').insertAfter($(".airport-info"));
    }
}
