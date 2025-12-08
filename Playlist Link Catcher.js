// firt part of the code return in the console all the links of the playlist.
let songs = document.querySelectorAll('ytmusic-responsive-list-item-renderer');
let output = "";

songs.forEach(song => {
    try {
        let linkTag = song.querySelector('a[href*="watch?v="]');
        if (linkTag) {
            let href = linkTag.href;
            let urlObj = new URL(href);
            let songId = urlObj.searchParams.get("v");
            
            if (songId) {
                // add every song to the output variable by adding the songId
                output += `https://music.youtube.com/watch?v=${songId}\n`;
            }
        }
    } catch (e) {
      // Skips errors
      console.log(e);
    }
});
console.log(output);
//This second part of code generate a txt file with all links. You can skip this part of code if you just want the list from the console. 
if (output.length > 0) {
    let blob = new Blob([output], { type: 'text/plain' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'playlist_links.txt'; // Name of the file. You can chage it to whatever you want.
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log(`Done! Found ${output.split('\n').length - 1} songs. Start download txt file...`);
} else {
    console.log("Warning: I couldn't find any songs. Make sure you scroll down to load them all before running the code.");
}
