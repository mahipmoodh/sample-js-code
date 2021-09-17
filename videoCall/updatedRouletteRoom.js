let callSocketTimeoutValue = 0;
let freeRouletteCallTimoutValue = 0;
let autoReloadTimeoutValue = 0;
let increasedTimerValue = 0;
let decrementTimerValue = 0;
let continueChatOptionTimer = 0;
let inactivePerformerTimeout = 0;
let decrementTime = 0;
let incrementTime = 0;

//---------- utility functions start ---------

function convertTimeInSeconds(time) {
  const timeArray = time.split(':');
  return parseInt(timeArray[0] * 60) + parseInt(timeArray[1]);
};

function pad(val) {
  const valString = val + "";
  if (valString.length < 2) {
      return "0" + valString;
  } else {
      return valString;
  }
};

function playSound(url) {
  const audio = new Audio(url);
  try {
    audio.play();
  } catch (e) {
    console.log('sound play exception');
  };
};

function generateToast (msg) {
  $('#toast-msg').css('display', 'block');
  $('#toast-msg').toast('show');
  $('#toast-body').text(msg);
};

//---------- utility functions end ---------

function maintainPerformerObjectIds(charid) {
  // For determining Customer already in Call or Not
  let allRequestedPerformers = localStorage.performerId ? JSON.parse(localStorage.performerId) : [];
  if (charid && allRequestedPerformers.includes(charid)) {
      allRequestedPerformers.splice(allRequestedPerformers.findIndex(item => item == charid), 1)
      localStorage.setItem('performerId', JSON.stringify(allRequestedPerformers));
  }
};

function incrementTimer() {
  function setTime() {
    ++incrementTime;
    const time = pad(parseInt(incrementTime / 60)) + ':' + pad(incrementTime % 60);
    $('#timer').html(time);
  }
  increasedTimerValue = setInterval(setTime, 1000);
};

function decrementTimer(data) {
  const { countDownTime } = data;
  const mins = Math.floor(parseInt(countDownTime) / 60);
  const secs = (parseInt(countDownTime) % 60);
  const counter = document.getElementById("time-left");
  counter.innerHTML = pad(mins) + ':' + pad(secs);
  if (countDownTime > 0) {
    decrementTimerValue = setTimeout(function () {
      const decrementTimerData = { countDownTime: countDownTime - 1 };
      decrementTimer(decrementTimerData);
    }, 1000);
  }
};


function changeView (data = {}) {
  const { screenShow, videoCallViewType } = data;
  $('.waiting-screen').css('display', 'none');
  if (screenShow === 'video-call-view') {
    $('#local').css('display', 'block');
    $('#own-vidio-stream-wrap').css('display', 'none');
    $('#remote').css('display', 'block');
    $('#vid_req_accepted').css('display', 'none');
    $('.videochat-sec').css('display', 'block');
    $('.arousr-main-head').css('display', 'none');
    $('#timer').css('display', 'block');
    $('.videochat-continue-call').css('display', 'none');
    $('.review-popup-sec').css('display', 'none');
    switch (videoCallViewType) {
      case 'roulette-free-call' :
        document.getElementById('micro-phone').firstElementChild.setAttribute('src', '/static/images/mic-icon.svg');
        document.getElementById('micro-phone').firstElementChild.classList.add('unmute');
        $('.mic-wrap').removeClass('mic-wrap-mute');
        $('.videochat-skip').css('display', 'block');
        $('#time-left-wrap').css('display', 'none');
        $('.videochat-sendtips-wrap').css('display', 'none');
        break;
      case 'roulette-free-to-paid-call' :
        $('.videochat-skip').css('display', 'none');
        $('#time-left-wrap').css('display', 'block');
        $('.videochat-sendtips-wrap').css('display', 'flex');
        break;
      case 'paid-call' :
        document.getElementById('micro-phone').firstElementChild.setAttribute('src', '/static/images/mic-icon.svg');
        document.getElementById('micro-phone').firstElementChild.classList.add('unmute');
        $('.mic-wrap').removeClass('mic-wrap-mute');
        $('.videochat-skip').css('display', 'none');
        $('#time-left-wrap').css('display', 'block');
        $('.videochat-sendtips-wrap').css('display', 'none');
        break;
    };
  } else if (screenShow === 'search-screen-view') {
      $('#vid_req_accepted').css('display', 'block');
      $('#local').css('display', 'none');
      $('#own-vidio-stream-wrap').css('display', 'block');
      $('#remote').css('display', 'none');
      $('.videochat-sec').css('display', 'none');
      $('.arousr-main-head').css('display', 'block');
      $('#timer').css('display', 'none');
      $('#time-left-wrap').css('display', 'none');
      $('#timer').empty().html('00:00');
      $('#time-left').empty().html('00:00');
      $('.review-popup-sec').css('display', 'none');
  } else if (screenShow === 'review-screen-view') {
      $('#vid_req_accepted').css('display', 'none');
      $('#local').css('display', 'none');
      $('#own-vidio-stream-wrap').css('display', 'none');
      $('#remote').css('display', 'none');
      $('.videochat-sec').css('display', 'none');
      $('.arousr-main-head').css('display', 'block');
      $('#timer').css('display', 'none');
      $('#time-left-wrap').css('display', 'none');
      $('.review-popup-sec').css('display', 'flex');
      document.getElementById('roulette_review').value = '';
      document.getElementById('submit-review-btn').removeAttribute('disabled');
  }
};

function startAnotherCall(){
    console.log('---------- in start another call---------');
    changeSpinnerAndText('', true);
    checkDevicePermission();
    remaining_session(); // define in roulette.js
    // createApiCall(); // define in roulette.js
    list_previous_chat(); // define in roulette.js
    list_online_char(); // define in roulette.js
};

function updateProfilePicAndName (videoCallData) {
  const { primaryPicUrl =  '', charnmae = '', creditUsed, timeSpentInString } = videoCallData;
  primaryPicUrl ? $('.profile-img').attr('src', primaryPicUrl) : $('.profile-img').attr('src', '/static/images/Girl_Avatart.png');
  charnmae ? $('.char-name').text(charnmae) : $('.char-name').text('performer');
  timeSpentInString ? $('#time-spent').text(timeSpentInString) : $('#time-spent').text('00:00');
  creditUsed ? $('#credit-used').text(creditUsed.toFixed(2)) : $('#credit-used').text(0);
};

function onClickSubmitReview () {
	const {charid, custid, video_session_id} = received_data;
	const rating = parseInt($('#roulette_stars img.selected').last().data('value'), 10);
	const comment = $('#roulette_review').val();
	$.ajax({
		url : '/create-review/',
		data: {
				'rating': rating,
				'comment': comment,
				'objid2perf_character': charid,
				'video_session_id': video_session_id,
				'objid2cst_contact':custid
		},
		type: 'POST',
		headers: {'X-CSRFToken': csrftoken},
		success: function(result){
		const viewScreenData = { screenShow: 'search-screen-view' };
  		changeView(viewScreenData);
			startAnotherCall();
		},
		error: function(error) {
				console.log(error);
		}
	});
};

function postForegroundTime() {
  const { video_session_id } = received_data;
  $.ajax({
    url: '/video_session',
      data: {
          'action': 'performer_foreground',
          video_session_id,
          'source': 'customer',
          'performer_foreground_duration': incrementTime,
      },
      type: 'POST',
      headers: {'X-CSRFToken': csrftoken},
    success: function () {
      console.info('post foreground time');
    },
    error: function () {
      console.error('post foreground time');
    }
  });
};

function endVideoCallApi(data = {}) {
  const { video_session_id, isCustomerEligibleForReview = false } = data;
  $.ajax({
    url: '/video_session',
    data: {
    'action': 'end',
    'video_session_id': video_session_id,
    'source': 'customer'
    },
    type: 'POST',
    headers: {'X-CSRFToken': csrftoken},
    success: function (result) {
      if (!isCustomerEligibleForReview) {
        startAnotherCall();
      }
    },
    error: function (err) {
      console.log(err);
      const { code = '', result = '' } = err.responseJSON.error;
      if (code === 'E1000') {
        
        console.warn(result);
      } else {
        console.error(code, result);
      }
    }
  });
};

function endVideoSession(data = {}) {
  console.log('------------in end video Session--------------');
  const { errorFormSocket = false } = data;
  const { chatSocket } = videoRoomData;
  const { charid, custid ,video_session_id, is_premium_customer, charname, character_pic, video_chat_rate } = received_data;
  let isCustomerEligibleForReview = false;
  maintainPerformerObjectIds(charid);
// --------------------Review Screen --------------------------
  let timeSpent = 0;
  let timeSpentInString = '';
  if (document.getElementById('timer')) {
    timeSpentInString = document.getElementById('timer').innerHTML;
    timeSpent = (timeSpentInString && convertTimeInSeconds(timeSpentInString)) || 0;
  }
  const creditUsed = Math.floor((timeSpent*(video_chat_rate/60)));
  if(timeSpent >= 120 && is_premium_customer) {
    isCustomerEligibleForReview = true;
    const videoCallData = {
      primaryPicUrl: character_pic,
      charnmae: charname,
      timeSpentInString,
      creditUsed,
    };
    updateProfilePicAndName(videoCallData);
    const viewScreenData = { screenShow: 'review-screen-view' };
    changeView(viewScreenData);
  } else {
    const viewScreenData = { screenShow: 'search-screen-view' };
    changeView(viewScreenData);
  }
// -------------------------------------------------

  // ----------  stop timers -------
  incrementTime = 0;
  decrementTimerValue && clearInterval(decrementTimerValue);
  increasedTimerValue && clearInterval(increasedTimerValue);
  freeRouletteCallTimoutValue && clearInterval(freeRouletteCallTimoutValue);
  continueChatOptionTimer && clearInterval(continueChatOptionTimer);
  callSocketTimeoutValue && clearInterval(callSocketTimeoutValue);

  // -----------  end video call Api and disconnect from socket -------
  if (!errorFormSocket) {
    // const endApiData = {
    //   video_session_id,
    //   isCustomerEligibleForReview,
    // };
    // endVideoCallApi(endApiData);
    if (videoRoomData && videoRoomData.videoRoom) {
      let video_status = videoRoomData.videoRoom.participants.size ? 'ended' : 'dismissed';
      const socketMessage = {
        'customer_id': custid,
        'video_session_id': video_session_id,
        'type': 'disconnect',
        video_status,
      };
      sendSocketMessage(socketMessage);
      if (!isCustomerEligibleForReview) {
        startAnotherCall();
      }
    }
  } else {
    console.log('Call Disconnect from socket');
  }

};

function sendTip(data = {}) {
  const { tipCredits, btnObj } = data;
  const { localDataTrack } = videoRoomData;
  const { charid } = received_data;
  $.ajax({
      url : '/cust-send-tip',
      data: {
          'character_id': charid,
          'tip_amount': tipCredits,
      },
      type: 'POST',
      headers: {'X-CSRFToken': csrftoken},
      success: function(response){
          const parseResponse = JSON.parse(response);
          $(btnObj).css('background', '#FD7663');
          $(btnObj).attr('disabled', false);
          const msg = parseResponse.reason;
          generateToast(msg);
          if (parseResponse.result === 'success') {
              const performerMsg = {
                  content: `Awesome! You have got ${tipCredits} credits tip from the customer.`,
                  type: 'tip',
              };
              localDataTrack.send(JSON.stringify(performerMsg));
          }
      },
      error: function(err) {
        console.log('getting error in send tip');
        $(btnObj).css('background', '#FD7663');
        $(btnObj).attr('disabled', false);
      }
  });
};

function sendTipPopupOpen (data = {}) {
  const { tipCredits } = data;
  return new Promise(function (resolve, reject) {
    $('.char-credit-tip').text(tipCredits);
    $('#tip-confirmation-popup').css('display', 'block');
    $('#tip-confirmation-popup-ok').click(function () {
        return resolve(true);
    });
    $('.tip-confirmation-popup-cancel').click(function () {
        reject(new Error('click on cancel'));
    });
  });
};

function free2PaidVideoCall(data = {}) {
  const { videoSessionId, room, localDataTrack } = data;
  const { approved_duration_seconds, charname } = received_data;
  $.ajax({
      url: '/video_session',
      data: {
          'action': 'update',
          'video_session_id': videoSessionId,
          'source': 'customer',
          'call': 'Free2Paid',
          'char_name': charname,
          'sid': room.sid
      },
      type: 'POST',
      headers: {'X-CSRFToken': csrftoken},
      success: function (result) {
        const performerMsg = {
            content: 'You are now in premium chat',
            type: 'premium',
        };
        localDataTrack.send(JSON.stringify(performerMsg));
        callSocketWrapper();
        callDetail.callType = 'PAID_CALL';
        clearInterval(increasedTimerValue); // increment timer....
        incrementTime = 0;
        incrementTimer(); // increment timer....

        const decrementTimerData = { countDownTime: approved_duration_seconds };
        decrementTimer(decrementTimerData); // decrement timer....

        const viewScreenData = {
          screenShow: 'video-call-view',
          videoCallViewType: 'roulette-free-to-paid-call',
        };
        changeView(viewScreenData);
      },
      error: function (e) {
        console.log('error in shift free to paid call', e);
        callDetail.callType = '';
        room.disconnect();
      }
  });
};

function websocketevtevent() {
  console.log('WebSocket Evt Event');
  const video_session_id = received_data.video_session_id;
  $.ajax({
      url: '/video_error_evtevent',
      data: {
          'video_session_id': video_session_id
      },
      type: 'POST',
      headers: {'X-CSRFToken': csrftoken},
      success: function (result) {
        console.log('WebSocket Evt Event Created')
      }
  });
};

function callSocketWrapper () {
  function callSocket() {
    const { custid, video_session_id } = received_data;
    const socketMessage = {
      'customer_id': custid,
      'video_session_id': video_session_id,
      'type': 'calculate'
    };
    sendSocketMessage(socketMessage);
  };
  callSocketTimeoutValue = setInterval(callSocket, 6000);
};


function trackSubscribed(div, track) {
  console.log('-----------inside trackSubscribed-------------');
  if (track.kind === 'video') {
    if (increasedTimerValue) {
      clearInterval(increasedTimerValue);
    }
    incrementTimer();
    if (inactivePerformerTimeout) {
      clearInterval(inactivePerformerTimeout);
    }
  }
  $('.waiting-screen').css('display', 'none');
  div.appendChild(track.attach());
};

function trackUnsubscribed(track) {
  console.log('--------------- inside trackUnsubscribed-------------');
  if (track.kind === 'video') {
    if (increasedTimerValue) {
      postForegroundTime();
      clearInterval(increasedTimerValue);
    }
    $('.waiting-screen').css('display', 'flex');
    $('.over-lay-text').text('Trying to connect');
    inactivePerformerTimeout = setTimeout(endVideoSession, 30000);
  }
  track.detach().forEach(element => element.remove());
}

function participantConnected(participant) {
  console.log('Participant "%s" connected', participant.identity);
  if (participant.identity.startsWith("char")) {
      const div = document.getElementById('remote');
      participant.on('trackSubscribed', track => trackSubscribed(div, track));
      participant.on('trackUnsubscribed', trackUnsubscribed);
  }
};

// function participantDisconnected(data = {}) {
//   const { participants = null } = data;
//   //document.getElementById(participant.sid).remove();
//   endVideoSession();
// };


function roomJoined(data) {
  const { Video, room, callType, chatSocket, videoSessionId, custid } = data;
  const{ free_duration, approved_duration_seconds } = received_data;
  Video.createLocalVideoTrack().then(track => {
      room.localParticipant.publishTrack(track);
      const localMediaContainer = document.getElementById('local');
      $(localMediaContainer).empty();
      localMediaContainer.appendChild(track.attach());
  });

  Video.createLocalAudioTrack({ workaroundWebKitBug1208516: false }).then(track => {
      room.localParticipant.publishTrack(track);
  });

  room.on('participantConnected', function (participant) {
    participantConnected(participant);
    // play Sound 
    playSound('/static/sound/callConnectSound.mp3');

    // manage timers
    if(callType === 'roulette'){
      freeRouletteCallTimoutValue = setTimeout(function () {
        console.log('--------------disconnect free roulette call------------');
        room.disconnect();
      }, free_duration*1000);
      continueChatOptionTimer = setTimeout(function () {
        $('.videochat-continue-call').css('display', 'block');
      }, 20000);
    }
    else{
      if (decrementTimerValue) {
        clearInterval(decrementTimerValue);
      }
      const decrementTimerData = { countDownTime: approved_duration_seconds };
      decrementTimer(decrementTimerData);
      callSocketWrapper();
    }

    clearTimeout(autoReloadTimeoutValue);

    // change screen view 
    const videoCallViewType = callType === 'roulette' ? 'roulette-free-call' : 'paid-call';
    const viewScreenData = {
      screenShow: 'video-call-view',
      videoCallViewType,
    };
    changeView(viewScreenData);
  });

  room.on('participantDisconnected', function () {
    console.log('---------remote participant disconnected-------');
    // participantDisconnected(room);
  });

  room.once('disconnected', (room) => {
    console.log(room.participants, '-------local participant disconnected-------');
    endVideoSession();
  });

  room.on('reconnecting', error => {
    if (error.code === 53001) {
        console.log('Reconnecting your signaling connection!', error.message);
    } else if (error.code === 53405) {
        console.log('Reconnecting your media connection!', error.message);
    }
  });

  room.on('reconnected', () => {
    console.log("inside reconnected")
  });
};

function updateVideoSession(data = {}) {
  const { room, callType, videoSessionId, chatSocket, custid } = data;
  console.log('--------------update video session----------');
  $.ajax({
      url: '/video_session',
      data: {
          'action': 'update',
          'sid': room.sid,
          'video_session_id': videoSessionId,
          'call': callType
      },
      type: 'POST',
      headers: {'X-CSRFToken': csrftoken},
      cache: false,
      success: function () {
        console.log('Success of updateVideo Session Api');
        callDetail.status = callStatus.CONNECTED;
        const socketMessage = {
          'customer_id': custid,
          'video_session_id': videoSessionId,
          'type': 'create',
          'created_timestamp': new Date().getTime()
        };
        sendSocketMessage(socketMessage);
      }
  });
};


function videoRoomConnect () {
  const { Video, localDataTrack, chatSocket } = videoRoomData;
  const {custid, charid, video_session_id: videoSessionId,
     vid_token, custname, charname, roulette_call
    } = received_data;
  const roomname = custname + '-' + charname;
  Video.connect(vid_token, {audio: true, name: roomname, tracks: [localDataTrack]})
  .then(room => {
    console.log('------------- Connected to Room --------', room.name, room.sid);
    const { video_session_id } = received_data;
    // if performer not connect in room then auto reload page
    // clear interval on participantConnected 
    autoReloadTimeoutValue = setTimeout(function() {
      $('.waiting-screen').css('display', 'none');
      const socketMessage = {
        'customer_id': custid,
        video_session_id,
        'type': 'disconnect',
        'video_status': 'wait_timeout',
      };
      sendSocketMessage(socketMessage);
      videoRoomData.videoRoom = null;
      location.reload();
    }, 40000);
    // set Room object globally 
    videoRoomData.videoRoom = room;

    const callType = roulette_call ? 'roulette' : 'paid';
    const customerRoomJoinData = { Video, room, callType, chatSocket, videoSessionId, custid };
    roomJoined(customerRoomJoinData);

    const updateVideoSessionData = { room, callType, videoSessionId, chatSocket, custid };
    updateVideoSession(updateVideoSessionData);

    $('#micro-phone').off().click(function (e) {
      const audioAction = (e.target.classList.value === "unmute" ? 'mute' : 'unmute');
      if (audioAction === 'mute' ){
        $('.mic-wrap').addClass('mic-wrap-mute');
        e.target.setAttribute('src', '/static/images/mic-mute-portrait.svg');
        e.target.classList.remove('unmute');
      }
      else{
        $('.mic-wrap').removeClass('mic-wrap-mute');
        e.target.setAttribute('src', '/static/images/mic-icon.svg');
        e.target.classList.add('unmute');
      }
      room.localParticipant.audioTracks.forEach(function (trackId, track) {
        audioAction === 'mute' ? trackId.track.disable() : trackId.track.enable();
      });
    });
  
    $('#Free2Paid').off().click(function () {
      const currentBalance = parseInt(document.getElementById('currentUpdatedBalance').value);
      if (currentBalance >= 200) {
        const f2pData = { videoSessionId, room, localDataTrack };
        clearInterval(freeRouletteCallTimoutValue);
        free2PaidVideoCall(f2pData);
      }else {
        $('.main-pop-Oops').css('display', 'block');
        $('.buyCredits').click( function() {
            $('.main-pop-Oops').css("display","none");
            window.parent.location.pathname = "/purchase/";
        });
      }
    });

    $('#close-video-call, #skip-roulette').off().on('click', function () {
      console.log('-------disconnect free roulette call--------------');
      room.disconnect();
    });

  })
  .catch(error => {
    if (error.message === 'Permission denied' || error.message === 'Permission dismissed' || error.name === 'NotAllowedError') {
      const data = { chatSocket };
      endVideoSession(data);
    }
    console.log('error in room connection', error);
  });
};