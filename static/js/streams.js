const APP_ID = '<APP-ID>'
const  Channel = sessionStorage.getItem('room')
const Token = sessionStorage.getItem('token')
let UID = Number(sessionStorage.getItem('UID'));
let NAME= sessionStorage.getItem('name')
console.log('streams connected')

const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})

let localTracks = []
let remoteUsers = {}
let localScreenTracks = []
let sharingScreen = false

let switchToCamera = async () => {
  let displayFrame = document.getElementById('video-streams');

  // Only create container if it doesn't exist
  let existing = document.getElementById(`user-container-${UID}`);
  if (!existing) {
    let player = `<div class="video-container" id="user-container-${UID}">
                  <div class="username-wrapper"><span class="user-name">${NAME}</span></div>
                  <div class="video-player" id="user-${UID}"></div>
                  </div>`;
    displayFrame.insertAdjacentHTML('beforeend', player);
  }

  // Ensure tracks are unmuted
  await localTracks[0].setMuted(false);
  await localTracks[1].setMuted(false);

  // Play the video track in the container
  localTracks[1].play(`user-${UID}`);
   
  // Delay play slightly to ensure container rendered
  setTimeout(() => {
    localTracks[1].play(`user-${UID}`);
  }, 100);

  // Publish both audio and video tracks
  await client.publish([localTracks[0], localTracks[1]]);

  console.log('Camera switched on and tracks published');
};




let joinAndDisplayLocalStream = async () => {
    document.getElementById('room-name').innerText=Channel

    client.on('user-published',handleUserJoined)
    client.on('user-left',handleUserLeft)
    try{
    await client.join(APP_ID,Channel,Token, UID)
    }

    catch(error){
        console.error(error)
        window.open('/','_self')
    }


    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()
    let member = await createMember()
    let player =  `<div class="video-container" id="user-container-${UID}"> 
                       <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                       <div class="video-player" id="user-${UID}"></div>
                   </div>`

    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

    localTracks[1].play(`user-${UID}`)

    await client.publish([localTracks[0], localTracks[1]])
}

let sharerId = null; // Tracks who is sharing the screen

let handleUserJoined = async (user, mediaType) => {
  remoteUsers[user.uid] = user;
  await client.subscribe(user, mediaType);

  if (mediaType === 'video') {
    // Remove existing container if any
    let existing = document.getElementById(`user-container-${user.uid}`);
    if (existing) existing.remove();

    let member = await getMember(user);

    // Create container
    let container = document.createElement('div');
    container.className = 'video-container';
    container.id = `user-container-${user.uid}`;
    container.innerHTML = `
      <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
      <div class="video-player" id="user-${user.uid}"></div>
    `;

    // Decide where to append based on active screen share
    if (sharerId) {
      // Someone is sharing
      if (user.uid === sharerId) {
        // Should never happen for new join, just in case
        container.classList.add('fullscreen');
        document.getElementById('video-streams').appendChild(container);
      } else {
        container.classList.add('small');
        document.getElementById('small-videos-wrapper').appendChild(container);
      }
    } else {
      // No screen sharing, normal layout
      document.getElementById('video-streams').appendChild(container);
    }

    user.videoTrack.play(`user-${user.uid}`);
  }

  if (mediaType === 'audio') {
    user.audioTrack.play();
  }
};

let handleUserLeft = async (user) =>{
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async () => {
   try {
       if (sharingScreen && localScreenTracks.length > 0) {
           await stopScreenShare();
       }
       
       for (let i = 0; i < localTracks.length; i++) {
           if (localTracks[i]) {
               await client.unpublish([localTracks[i]]);
               localTracks[i].stop();
               localTracks[i].close();
           }
       }

       if (localScreenTracks.length > 0) {
           await client.unpublish(localScreenTracks);
           for (let track of localScreenTracks) {
               track.stop();
               track.close();
           }
       }

       await client.leave();
       await deleteMember();
   } catch (err) {
       console.error("Error leaving channel:", err);
   }

   if (!window.unloading) {
       window.open('/', '_self');
   }
};


let toggleCamera = async(e)=>{
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        e.target.style.backgroundColor='#fff'
    }
    else{
        await localTracks[1].setMuted(true)
        e.target.style.backgroundColor='rgb(255, 80, 80, 1)' 
    }
}
let toggleMic = async(e)=>{
    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        e.target.style.backgroundColor='#fff'
    }
    else{
        await localTracks[0].setMuted(true)
        e.target.style.backgroundColor='rgb(255, 80, 80, 1)' 
    }
}


/* let toggleScreen = async (e) => {
  let screenButton = e.currentTarget;
  screenButton.disabled = true; // Disable immediately to block further clicks
  let cameraButton = document.getElementById('camera-btn');
  const displayFrame = document.getElementById('video-streams');

  try {
    if (!sharingScreen) {
      sharingScreen = true;
      screenButton.style.backgroundColor = 'rgb(255, 80, 80, 1)';
      cameraButton.style.display = 'none';

      localScreenTrack = await AgoraRTC.createScreenVideoTrack();

      let userContainer = document.getElementById(`user-container-${UID}`);
      if (userContainer) userContainer.remove();

      //displayFrame.style.display = 'block';

      let player = `
        <div class="video-container" id="user-container-${UID}">
          <div class="video-player" id="user-${UID}"></div>
        </div>`;
      document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);

      userIdInDisplayFrame = `user-container-${UID}`;
      localScreenTrack.play(`user-${UID}`);

      await client.unpublish([localTracks[1], localTracks[0]]);
      await client.publish([localScreenTrack]);
       applyScreenShareLayout(UID);
      

      // shrink other videos
      /*
      let videoFrames = document.getElementsByClassName('video-container');
      for (let i = 0; i < videoFrames.length; i++) {
        if (videoFrames[i].id !== userIdInDisplayFrame) {
          videoFrames[i].style.height = '50px';
          videoFrames[i].style.width = '50px';
        }
      }
        
    } else {
  // Stop screen sharing
  sharingScreen = false;
  cameraButton.style.display = 'block';
  screenButton.style.backgroundColor = '#fff';

  // Remove screen container
  let userContainer = document.getElementById(`user-container-${UID}`);
  if (userContainer) userContainer.remove();

  // Unpublish and close screen track
  await client.unpublish([localScreenTrack]);
  localScreenTrack.close();

  // Reset layout for all users
  resetLayout();

  // Switch back to camera
  await switchToCamera();
}
  } catch (error) {
    console.error('Error toggling screen sharing:', error);
    sharingScreen = false;
    cameraButton.style.display = 'block';
  } finally {
    // Re-enable button no matter what happened
    screenButton.disabled = false;
  }
};
 */


let toggleScreen = async (e) => {
  const screenButton = e.currentTarget;
  const cameraButton = document.getElementById('camera-btn');
  screenButton.disabled = true;

  try {
    if (!sharingScreen) {
      // START SCREEN SHARING
      sharingScreen = true;
      sharerId = UID; // mark self as sharer
      screenButton.style.backgroundColor = 'rgb(255, 80, 80, 1)';
      cameraButton.style.display = 'none';

      // Create screen track
      localScreenTrack = await AgoraRTC.createScreenVideoTrack();

      // Fullscreen container for screen
      let screenContainer = document.createElement('div');
      screenContainer.className = 'video-container fullscreen';
      screenContainer.id = `screen-container-${UID}`;
      screenContainer.innerHTML = `<div class="video-player" id="screen-${UID}"></div>`;
      document.getElementById('video-streams').appendChild(screenContainer);

      localScreenTrack.play(`screen-${UID}`);

      // Move camera to small wrapper
      let camContainer = document.getElementById(`user-container-${UID}`);
      if (camContainer) {
        document.getElementById('small-videos-wrapper').appendChild(camContainer);
        camContainer.classList.add('small');
        camContainer.classList.remove('fullscreen');
      }

      // Publish screen only
      await client.unpublish([localTracks[0], localTracks[1]]);
      await client.publish([localScreenTrack]);

      // Arrange layout for viewers
      applyScreenShareLayout(UID);

    } else {
      // STOP SCREEN SHARING
      sharingScreen = false;
      sharerId = null; // reset sharer
      screenButton.style.backgroundColor = '#fff';
      cameraButton.style.display = 'block';

      // Remove screen container
      let screenContainer = document.getElementById(`screen-container-${UID}`);
      if (screenContainer) screenContainer.remove();

      // Unpublish and close screen track
      await client.unpublish([localScreenTrack]);
      localScreenTrack.close();

      // Move camera back to main layout
      let camContainer = document.getElementById(`user-container-${UID}`);
      if (camContainer) {
        document.getElementById('video-streams').appendChild(camContainer);
        camContainer.classList.remove('small');
        camContainer.classList.add('video-container');
      }

      // Republish camera/mic
      await switchToCamera();

      // Reset layout for viewers
      resetLayout();
    }
  } catch (err) {
    console.error("Error toggling screen share:", err);
    sharingScreen = false;
    sharerId = null;
    cameraButton.style.display = 'block';
  } finally {
    screenButton.disabled = false;
  }
};


let chatpopup = async (e) => {
  const chatPopup = document.getElementById('chat-popup');
  const style = window.getComputedStyle(chatPopup).display;
  const chatBtn = document.getElementById('chat-btn');

  if (style === 'none') {
    chatPopup.style.display = 'block';
    chatBtn.src = "{% static 'images/chat-icon.svg' %}";  // use a different icon to show open state
  } else {
    chatPopup.style.display = 'none';
    chatBtn.src = "{% static 'images/chat-icon.svg' %}"; // icon when closed
  }
};

let createMember = async () =>{
    let response = await fetch("/create_member/",{
        method:'POST',
        headers:{
            'Content-Type': 'application/json'
        },

        body:JSON.stringify({'name':NAME, 'room_name':Channel, 'UID':UID})
    })
    let member = await response.json()
    return member
}   


let getMember = async(user)=>{
    
    let response =await fetch(`/get_member/?UID=${user.uid}&room_name=${Channel}`)
    let member = await response.json()

    return member

}

let deleteMember = async () => {
    let response = await fetch('/delete_member/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':Channel, 'UID':UID})
    })
    let member = await response.json()
}

window.addEventListener("beforeunload", async () => {
    await leaveAndRemoveLocalStream();
});


joinAndDisplayLocalStream()

document.getElementById('leave-btn').addEventListener('click',leaveAndRemoveLocalStream)
document.getElementById('camera-btn').addEventListener('click',toggleCamera)
document.getElementById('mic-btn').addEventListener('click',toggleMic)
document.getElementById('screen-btn').addEventListener('click',toggleScreen)

document.getElementById('chat-btn').addEventListener('click',chatpopup)



function applyScreenShareLayout(sharerId) {
  const streamsWrapper = document.getElementById("video-streams");
  const smallWrapper = document.getElementById("small-videos-wrapper");

  // Reset first
  resetLayout();

  document.querySelectorAll('.video-container').forEach(vc => {
    if (vc.id === `screen-container-${sharerId}`) {
      // Screen container fullscreen
      streamsWrapper.appendChild(vc);
      vc.classList.add("fullscreen");
      vc.classList.remove("small");
    } else {
      // Other videos small
      smallWrapper.appendChild(vc);
      vc.classList.add("small");
      vc.classList.remove("fullscreen");
    }
  });

  smallWrapper.style.display = "flex";
}

function resetLayout() {
  const streamsWrapper = document.getElementById("video-streams");
  const smallWrapper = document.getElementById("small-videos-wrapper");

  document.querySelectorAll('.video-container').forEach(vc => {
    // Put everything back in main
    streamsWrapper.appendChild(vc);
    vc.classList.remove("fullscreen", "small");
  });


  smallWrapper.style.display = "none";
}

