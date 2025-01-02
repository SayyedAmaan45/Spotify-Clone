let currentSong = new Audio();
let songs;
let currentFolder;
let currentPlayingSong = null;

function secondsTominutes(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = Math.floor(seconds % 60);

    let formattedMinutes = String(minutes).padStart(2, '0');
    let formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currentFolder = folder;
    let a = await fetch(`http://127.0.0.1:5500/${folder}/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    songs = []
    for (let i = 0; i < as.length; i++) {
        const element = as[i];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }

    // Show all the songs in the playlist
    let songUl = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUl.innerHTML = "";
    for (const song of songs) {
        let songTitle = decodeURIComponent(song.substring(song.lastIndexOf('/') + 1)).replaceAll("%20", " ");
        songUl.innerHTML += `
<li>
  <img class="invert" src="Svgs/music.svg" alt="">
  <div class="info">
  <div>${songTitle}</div>
  <div>Song Artist</div>
  </div>
  <div class="playnow">
    <span>Play Now</span>
    <img class="invert" src="Svgs/playSongList.svg" alt="">
    </div>
    </li>`;
    }

    // Attach an event listener to each song
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(element => {
        element.addEventListener("click", e => {
            let songTitle = element.querySelector(".info").firstElementChild.innerHTML.trim();

            // Play the clicked song
            playMusic(songTitle);

            let playNowDiv = element.querySelector(".playnow");
            let playNowText = playNowDiv.querySelector("span");
            let playNowIcon = playNowDiv.querySelector("img");

            // If the clicked song is already playing, pause it
            if (currentPlayingSong === element) {
                playNowText.innerText = "Play Now";
                playNowIcon.src = "Svgs/playSongList.svg";
                currentPlayingSong = null;
            } else {
                // Pause the previous song
                if (currentPlayingSong !== null) {
                    let previousPlayNowDiv = currentPlayingSong.querySelector(".playnow");
                    let previousPlayNowText = previousPlayNowDiv.querySelector("span");
                    let previousPlayNowIcon = previousPlayNowDiv.querySelector("img");
                    previousPlayNowText.innerText = "Play Now";
                    previousPlayNowIcon.src = "Svgs/playSongList.svg";
                }

                // Play the new song
                playNowText.innerText = "Pause";
                playNowIcon.src = "Svgs/pauseSongList.svg";
                currentPlayingSong = element;
            }
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currentFolder}/` + track
    if (!pause) {
        currentSong.play()
        play.src = "Svgs/pause.svg"
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = "00.00 / 00.00"
}

async function displayAlbum() {
    let a = await fetch(`http://127.0.0.1:5500/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    // Initialize an array to store promises
    let fetchPromises = [];

    // Loop through each anchor element
    Array.from(anchors).forEach(e => {
        if (e.href.includes("/songs/")) {
            let folder = e.href.split("/").slice(-1)[0];
            // Push fetch promise to array
            fetchPromises.push(
                // fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`)
                fetch(`https://spotify-clone-delta-one-53.vercel.app/songs/${folder}/info.json`)
                    .then(response => response.json())
                    .then(response => {
                        return {
                            folder: folder,
                            response: response
                        };
                    })
            );
        }
    });

    // Wait for all fetch requests to complete
    let albums = await Promise.all(fetchPromises);

    // Generate HTML for all albums
    let newHTML = "";
    albums.forEach(album => {
        newHTML += `
            <div data-folder="${album.folder}" class="card">
                <div class="play">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
                        color="#000000" fill="none">
                        <polygon points="6,4 20,12 6,20" stroke="black" stroke-width="1.5"
                            stroke-linejoin="round" fill="black" />
                    </svg>
                </div>
                <img src="/songs/${album.folder}/cover.jpg" alt="">
                <h2 style="font-size: 24px; font-weight: bold;">${album.response.title}</h2>
                <p style="font-size: 16px; font-weight: normal;">${album.response.description}</p>
            </div>
        `;
    });

    // Set the innerHTML of cardContainer
    cardContainer.innerHTML = newHTML;

    // Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            let songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

async function main() {
    await getSongs("songs/Classic")
    playMusic(songs[0], true)

    displayAlbum()


    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "Svgs/pause.svg"
        }
        else {
            currentSong.pause();
            play.src = "Svgs/play.svg"
        }
    })
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsTominutes(currentSong.currentTime)
            } / ${secondsTominutes(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration / 100) * percent
    })

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })

    previous.addEventListener("click", () => {
        console.log("Previous Clicked");
        console.log(currentSong);
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

    next.addEventListener("click", () => {
        currentSong.pause()
        console.log("Next Clicked");

        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting Volume To:", e.target.value, "/100");
        currentSong.volume = parseInt(e.target.value) / 100
    })

    // Add Event Listener To Mute the Song
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("Svgs/volume.svg")) {
            e.target.src = "Svgs/mute.svg"
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = "Svgs/volume.svg"
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })
}

main()

