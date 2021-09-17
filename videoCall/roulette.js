let createRouletteCallApiTimeout = 0;
const videoRoomData = { Video: null, localDataTrack: null, chatSocket: null, videoRoom: null };
const callStatus = Object.freeze({
    'CONNECTING': 1,
    'CONNECTED': 2,
    'HOLD': 3,
    'RECONNECT': 4,
    'DISCONNECT': 5,
    'DISMISS': 6,
    'ERROR': 7,
    'NONE': 0,
});
const callDetail = {
    status: callStatus.NONE,
    callType: '',
};

function changeSpinnerAndText (text, spinnerStatus) {
    const ftext =  text || 'Searching for next <span class="hide-only-portrait">available</span> host. </br>Please Stand By';
    if (spinnerStatus) {
        if ($('#sun').hasClass('pulses-none')) {
            $('#sun').removeClass('pulses-none');
            $('#sun').removeClass('continue-roulette-call');
            $('#searchingPerfomerIcon').css('display','block');
            $('#reloadPerfomerIcon').css('display','none');
        }
    } else {
        $('#sun').addClass('pulses-none');
        $('#searchingPerfomerIcon').css('display','none');
        $('#reloadPerfomerIcon').css('display','block');
        $('#sun').addClass('continue-roulette-call');
    }
    $('#text-on-searching').html(ftext);
};

function setHtmlForVideoCallScreen (data) {
    const { charname = '', character_pic = '', video_chat_rate } = data;
    const characterPic = character_pic||'/static/images/Girl_Avatart-host.png';
    $('#video-chat-performer-info').children('img').attr('src', characterPic);
    $('#video-chat-performer-info').children('p').html(charname);
    const videoRateText = `${video_chat_rate} credits/min`;
    $('.char-rate-vid-call').html(videoRateText);
    $("#own-vidio-stream").addClass("zoommmm");
};

function handleOnclickScrSize () {
    if ( $('#remote video').css('object-fit') === "contain") {
        $('#remote video').css('object-fit', 'fill');
    } else {
        $('#remote video').css('object-fit', 'contain');
    }
};

function setCustomerBusy (charid) {
    let allRequestedPerformers = localStorage.performerId ? JSON.parse(localStorage.performerId) : [];
    if (charid && (allRequestedPerformers.length == 0 || !allRequestedPerformers.includes(charid))) {
      allRequestedPerformers.push(charid);
      localStorage.setItem('performerId', JSON.stringify(allRequestedPerformers));
    }
};

function list_previous_chat () {
    $('#performer-prev-list').empty();
    $('#performer-prev-list').empty().addClass('loader');
    $.ajax({
        type: "GET",
        url: "/list-previous-chat/", 
        data: {},
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            let listItems = '';
            data.results.forEach(function (item) {
                const {rate, primary_pic_url, display_name } = item;
                const fprimaryPic = primary_pic_url ? `<div class="bottom-shadow"><img src="${primary_pic_url}"></img></div>` : '<div class="bottom-shadow"><img src="/static/images/Girl_Avatart.png"></div>';
                listItems = `${listItems}<a href="javascript:void(0)" class="${rate} performer-box video-chat-roulette" data-charrate="${rate}" data-href="${primary_pic_url}" task='roulette' name="${display_name}" onclick="clickOnListItem(this)">
                <p class="performer-name"><small>${display_name}</small><span></span></p>
                ${fprimaryPic}
                </a>`;
            });
            $('#performer-prev-list').removeClass('loader');
            $('#performer-prev-list').empty().append(listItems);
        },
        error: function (error) {
            console.log(error);
        }
    });
};

function list_online_char () {
    $('#performer-list-online').empty();
    $('#performer-list-online').empty().addClass('loader');
    $.ajax({
        type: "GET",
        url: "/list-online-char/", 
        data: {},
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            let listItems = '';
            data.perf_list.forEach(function (item) {
                const {video_chat_rate, primary_pic_url, name } = item;
                const fprimaryPic = primary_pic_url ? `<div class="bottom-shadow"><img src="${primary_pic_url}"></img></div>` : '<div class="bottom-shadow"><img src="/static/images/Girl_Avatart.png"></div>';
                listItems = `${listItems}<a href="javascript:void(0)" class="${video_chat_rate} performer-box video-chat-roulette" data-charrate="${video_chat_rate}" data-href="${primary_pic_url}" task='roulette' name="${name}" onclick="clickOnListItem(this)">
                <p class="performer-name"><small>${name}</small><span></span></p>
                ${fprimaryPic}
                </a>`;
            });
            $('#performer-list-online').removeClass('loader');
            $('#performer-list-online').empty().append(listItems);
        },
        error: function (error) {
            console.log(error);
        }
    });
};
function remaining_session(){
    $("#remainingRouletteCalls").empty();
    $('#sessionLoader').empty().addClass('loader');
    $.ajax({
        type: "GET",
        url: "/list-remaining-session/", //WebMethod to be called
        data: {},
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        dataType: "json",
        success: function (data) {
            $('#sessionLoader').removeClass('loader');
            const { sessions_remaining, time_remaining } = data;
            $("#remainingRouletteCalls").empty().html(sessions_remaining);
            if (sessions_remaining === 0) {
                text = `<span class="hide-only-portrait">You have used your daily free sessions. </br>You will again get free sessions in  ${time_remaining}.</span><span class="only-portrait h-auto">Used daily free sessions.</br> Get them back in ${response.time_remaining}</span>`;
                changeSpinnerAndText(text, false);
                clearInterval(createRouletteCallApiTimeout);
            }
        },
        failure: function (response) {
            var r = jQuery.parseJSON(response.responseText);
        }
    });
}

function createCall (data = {}) {
    $.ajax({
        url: "/create-roulette-session/",
        data,
        type: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        dataType: "json",
        success: function(response) {
            if (response.result === 'fail') {
                let text = '';
                callDetail.status = callStatus.DISMISS;
                callDetail.callType = '';
                switch (response.reason) {
                    case 'Not available':
                        text = 'No hosts are available <span class="hide-only-portrait">to  connect.</span> <br> Hit Refresh to try again.';
                        break;
                    case 'Sessions Over':
                        text = `<span class="hide-only-portrait">You have used your daily free sessions. </br>You will again get free sessions in  ${response.time_remaining}. </span><span class="only-portrait h-auto">Used daily free sessions.</br> Get them back in ${response.time_remaining}</span></h3>`;
                        break;
                    case 'Performer busy':
                        text = 'Host is not available for <span class="only-portrait"></br></span> video call right now. </br> Hit refresh to continue on roulette.';
                };
                $('.waiting-screen').css('display', 'none');
                changeSpinnerAndText(text, false);
            } else {
                const { roullete_call = 0 } = data;
                callDetail.callType = roullete_call ? 'FREE_CALL' : 'PAID_CALL';
                callDetail.status = callStatus.CONNECTING;
                received_data.csrftoken = csrftoken
                received_data.vid_token = response.token
                received_data.charname = response.charname
                received_data.charid = response.character_id
                received_data.character_pic = response.character_pic
                received_data.approved_duration_seconds = response.approved_duration_seconds
                received_data.video_session_id = response.video_session_id
                received_data.free_duration = response.free_duration
                received_data.roulette_call = response.roulette_call
                received_data.video_chat_rate = response.video_chat_rate
                received_data.is_premium_customer = response.is_premium_customer
                setHtmlForVideoCallScreen(response);
                videoRoomConnect();
            }
        },
        error: function(err) {
            console.log(err);
            $('.waiting-screen').css('display', 'none');
            changeSpinnerAndText('Something went wrong', false);
        }
    });
};

function check_performer_availability_video_new (data = {}) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: '/girls/available/check-performer-availability',
    		type: 'POST',
    		headers: {'X-CSRFToken': csrftoken},
            data,
            success: function (response) {
                return resolve(response);
            },
            error: function (err) {
                return reject(err);
            }
        })
    });
};

function createApiCall () {
    const { call_interval, customer_channel_type } = received_data;
    createRouletteCallApiTimeout = setTimeout(function() {
        $('.waiting-screen').css('display', 'flex');
        $('.over-lay-text').text('Trying to connect');
        const data = {
            'call':"roulette",
            'roullete_call': 1,
            'customer_channel_type': customer_channel_type,
        };
        createCall(data);
    },call_interval*1000);
};

function checkDevicePermission () {
    navigator.mediaDevices.getUserMedia({ audio: true, video: {
        width: 640,
        height: 480,
    } })
        .then(function(stream) {
            const videoElement = document.getElementById('own-vidio-stream');
            if ('srcObject' in videoElement) {
                videoElement.srcObject = stream;
            } else {
            // fallback
                videoElement.src = URL.createObjectURL(stream );
            }
            createApiCall();
        })
        .catch(function(err) {
            console.log(err, 'failed');
            const text = 'It seems you did not allow </br>camera or microphone';
            changeSpinnerAndText(text, false);
            $(".main-pop-Oops-roulette").css('display', 'block');
            $(".roulette-oops-text").html('It seems you did not allow camera or microphone');
        });
};

async function clickOnListItem (obj) {
    const currentBalance = parseInt(document.getElementById('currentUpdatedBalance').value);
    const char_name = $(obj).attr("name");
    const taskType = $(obj).attr('task');
    const char_rate = $(obj).data('charrate');
    createRouletteCallApiTimeout && clearInterval(createRouletteCallApiTimeout);
    if (currentBalance < 200) {
		$('.main-pop-Oops').css('display', 'block');
		$('.buyCredits').click( function(){
            $('.main-pop-Oops').css("display","none");
			window.parent.location.pathname = "/purchase/";
		});
    } else {
        const availableCheckData = { charname : char_name };
        const response = await check_performer_availability_video_new(availableCheckData);
        // const status = await response.text();
        try {
            if (response === 'True') {
                $('.char-name-vid').html(char_name);
                $('.char-credit-vid').html(char_rate);
                $('#rv-call-confirmation-popup-ok').attr('charname', char_name);
                $('#vid_char_busy-roulette').css("display","none");
                $('#rv-call-confirmation-popup').css("display","block");
            } else {
                $('#vid_char_busy-roulette').css("display","block");
                $('#rv-call-confirmation-popup').css("display","none");
            }
        } catch (error) {
            console.log(error);
        }
    }
};

async function paidRouletteCall(obj) {
    $('#rv-call-confirmation-popup').css("display","none");
    const charname = $(obj).attr('charname');
    changeSpinnerAndText('', false);
    $('.waiting-screen').css('display', 'flex');
    $('.over-lay-text').text('Waiting For host Response');
    const availableCheckData = { charname };
    const response = await check_performer_availability_video_new(availableCheckData);
    try {
        if (response === 'True') {
            const data = {
                'roullete_call': 0,
                'customer_channel_type': 'BROWSER',
                'char_name':charname, 
            };
            createCall(data);
        } else {
            $('#vid_char_busy-roulette').css("display","block");
            $('#rv-call-confirmation-popup').css("display","none");
            $('.waiting-screen').css('display', 'none');
        }
    } catch (error) {
        console.log(error);
    }
};

// ------------------- Web socket------------------

function initialise_web_socket() {
    console.log("Initialising web socket functions");
    const { base_url } = received_data;
    const chatSocket = new WebSocket(base_url + '/ws/api/');
    return chatSocket;
};

function socketCallbackHandler () {
    const { chatSocket, localDataTrack, videoRoom } = videoRoomData;
    const { custid, video_session_id } = received_data;
    chatSocket.onmessage = function (e) {
      const jsonObj = JSON.parse(e.data);
      if ('status' in jsonObj) {
        const status = jsonObj.status;
        let updatedDuration = 0;
  
        if ('balance' in jsonObj) {
          let balance = jsonObj.balance;
          document.getElementById('currentUpdatedBalance').value = balance;
          const { video_chat_rate } = received_data;
          updatedDuration = (balance/video_chat_rate) * 60;
        }
  
        if (status == "CREATED") {
          // successfully creation
          console.log('---------successfully created------------');
        }
        if (status == "CONTINUE") {
          console.log('-----continue this session -------');

          clearInterval(decrementTimerValue);
          const decrementTimerData = { countDownTime: updatedDuration };
          decrementTimer(decrementTimerData);
  
          const hostTimer = Math.floor(updatedDuration);
          const performerMsg = {
              content: hostTimer,
              type: 'timer',
          };
          localDataTrack.send(JSON.stringify(performerMsg));
        }
        if (status == "DISCONNECT") {
          // call End , balance not available
          console.log("--------------Disconnected --------")
          if (videoRoom) {
            videoRoom.disconnect();
          } else {
            const endVideoSessionData = { errorFormSocket: true };
            endVideoSession(endVideoSessionData);
          }
        }
        if (status == "DELETED") {
          // after disconnected confirmation
          console.log("inside close chatSocket")
          clearInterval(callSocketTimeoutValue);
        }
      }
    };
  
    chatSocket.onopen = function (e) {
        console.log("-------------- socket connected -----------------");
    };
  
    chatSocket.onerror = function (e) {
        console.error("WebSocket error observed:", e);
        if (videoRoom) {
            videoRoom.disconnect();
        } else {
            const endVideoSessionData = {
                errorFormSocket: true,
            };
            endVideoSession(endVideoSessionData);
        }
        websocketevtevent();
        chatSocket.close();
    };
};

function sendSocketMessage (message = {}) {
    const { custid, video_session_id } = received_data;
    const { chatSocket } = videoRoomData;
    const { type } = message;
    if (chatSocket && chatSocket.readyState === 1) {
        chatSocket.send(JSON.stringify(message));
        return;
    } else if  (chatSocket && chatSocket.readyState === 3) {
        videoRoomData.chatSocket = initialise_web_socket();
        socketCallbackHandler();
        sendSocketMessage(message);
    }
};

//----------------------Web socket end --------------

function rvfullscreenok() {
    console.log('in on click');
    $('#rv-fullscreen-popup').css('display', 'none');
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(function () {
            $('#rv-fullscreen-popup').css('display', 'none');
        }).catch(err => {
            console.log(err.name);
        });
    } else {
        document.documentElement.webkitRequestFullscreen().then(function () {
            $('#rv-fullscreen-popup').css('display', 'none');
        }).catch(err => {
            console.log(err.name);
        });
    }
}

$(document).ready(function () {
    const query = window.matchMedia("(orientation:landscape)");
    if (query.matches) {
        $('#rv-fullscreen-popup').css('display', 'block');
    }
    videoRoomData.Video = Twilio.Video;
    videoRoomData.localDataTrack = new videoRoomData.Video.LocalDataTrack();
    const characterId = received_data.charid;
    setCustomerBusy(characterId);
    videoRoomData.chatSocket = initialise_web_socket();
    socketCallbackHandler();
    // start Video call connection 

    // =============api calls roulette start================
    checkDevicePermission();
    remaining_session();
    list_previous_chat();
    list_online_char();
    //  =============api calls roulette end================
    // =========event handle start =============
    $(document).on('click', '#buyCreditRoulette', function () {
        window.parent.location.pathname = "/purchase/";
    });

    $(document).on('click', '.cross-wraper', function () {
        clearInterval(createRouletteCallApiTimeout);
        window.parent.location.href='/roulette/';
    });

    $(document).on('click', '.continue-roulette-call', function () {
        startAnotherCall();
    });

    $(document).on('click', '.rv-call-close-popup', function () {
        $('#rv-call-confirmation-popup').css("display","none");
        startAnotherCall();
    });

    $('#toast-msg').on('hidden.bs.toast', function () {
        $('#toast-msg').css('display', 'none');
    });

    $('.close-pop-roulette').click(function () {
        $('#vid_char_busy-roulette').css("display","none");
        startAnotherCall();
    });
    // $(document).on('click','.close-pop-roulette', function () {
    //     startAnotherCall();
    // });
    window.addEventListener('resize', function () {
        const isMobile = document.getElementById('isMobileDevice').value;
        if (isMobile === "True") {
            const mobileOS = document.getElementById('mobileDeviceOs').value;
            if (window.innerHeight < window.innerWidth) {
                console.log(mobileOS, 'mobileOS');
                if ((!(document.webkitFullscreenElement) || window.navigator.standalone) && mobileOS !== "iphone" ) {
                    $('#rv-fullscreen-popup').css('display', 'block');
                }
            } else {
                $('#rv-fullscreen-popup').css('display', 'none');
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(err => {
                        console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                    });
                } else {
                    document.webkitCancelFullScreen().catch(err => {
                        console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                    });
                }
            }
        }
    });



    // ---------review.js -------------
    
    $('#roulette_stars img').on('mouseover', function(){
    var onStar = parseInt($(this).data('value'), 10); // The star currently mouse on

    // Now highlight all the roulette_stars that's not after the current hovered star
        $(this).parent().children('img.star').each(function(e){
            if (e < onStar) {
                $(this).addClass('hover');
                $(this).attr('src', '/static/images/review-star.svg');
                var comments = ['Bad', 'Disappointing', 'Good', 'Very Good', 'Excellent'];
                var ratingValue = parseInt($('#roulette_stars img.hover').last().data('value'), 10);
                var selected_comment = comments[ratingValue - 1];
                // $('.after-rate-text').text(selected_comment);
            }
            else {
                $(this).removeClass('hover');
                $(this).removeClass('selected');
                $(this).attr('src', '/static/images/review-star-na.svg');
            }
        });
    
    }).on('mouseout', function(){
        $(this).parent().children('img.star').each(function(e){
            $(this).removeClass('hover');
            var comments = ['Bad', 'Disappointing', 'Good', 'Very Good', 'Excellent'];
            var ratingValue = parseInt($('#roulette_stars img.selected').last().data('value'), 10);
            var selected_comment = comments[ratingValue - 1];
            // $('.after-rate-text').text(selected_comment);
        });
    });
    
    
      /* 2. Action to perform on click */
    $('#roulette_stars img').on('click', function(){
        var onStar = parseInt($(this).data('value'), 10); // The star currently selected
        var roulette_stars = $(this).parent().children('img.star');

        for (i = 0; i < roulette_stars.length; i++) {
            $(roulette_stars[i]).removeClass('selected');
        }

        for (i = 0; i < onStar; i++) {
            $(roulette_stars[i]).addClass('selected');
        }

        // JUST RESPONSE (Not needed)
        var ratingValue = parseInt($('#roulette_stars img.selected').last().data('value'), 10);
        var comments = ['Bad', 'Disappointing', 'Good', 'Very Good', 'Excellent'];
        var selected_comment = comments[ratingValue - 1];
        // $('.after-rate-text').text(selected_comment);
    });

    $(document).on('click', '.submit-review-btn', function() {
        let form_review_comment = $('#roulette_review').val();
        $(this).attr('disabled', true);
        if(!form_review_comment){
            $('#roulette_review').css('border','1px solid #ff3434');
            $('#roulette_review_err_msg').css('display','inline-block');
            $('#roulette_review_err_msg').text('Please write a review').show();
            $('#roulette_review').focus();
            $(this).attr('disabled', false);
        }
        else{
            $('#roulette_review_err_msg').css('display','none');
            $('#roulette_review').css('border','1px solid #3a414b');
            onClickSubmitReview();
        }
    });

    $(document).on('click', '.cancel-review-btn', function() {
        const viewScreenData = { screenShow: 'search-screen-view' };
        changeView(viewScreenData);
        startAnotherCall();
    });

    //----------------------roulette - room js -------------
    

    // event handling Start

    $('.roulette-tip-send').click(function () {
        const tipCredits = $(this).data('tipcredits');
        const btnObj = this;
        $(this).attr('disabled', true);
        $(this).css('background', '#fffafae3');
        const sendTipData = { tipCredits };
        sendTipPopupOpen(sendTipData)
        .then(function () {
            $('#tip-confirmation-popup').css('display', 'none');
            const sendTipData = { characterId, tipCredits, btnObj };
            sendTip(sendTipData);
        })
        .catch(function () {
            $('#tip-confirmation-popup').css('display', 'none');
            $(btnObj).css('background', '#FD7663');
            $(btnObj).attr('disabled', false);
        });
    });

    window.addEventListener("beforeunload", function () {
        const { videoRoom = null } = videoRoomData;
        if (videoRoom && videoRoom.state !== 'disconnected') {
            console.log('---------insidebefore unload----------------', videoRoom.state, videoRoom);
            videoRoom.disconnect();
        } else {
            console.log('Room does not exist or already disconnected');
        }
    });

});
