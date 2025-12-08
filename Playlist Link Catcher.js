// Gets all the songs
let songs = document.querySelectorAll('ytmusic-responsive-list-item-renderer');
let output = "";

songs.forEach(song => {
    try {
        let linkTag = song.querySelector('a[href*="watch?v="]');
        if (linkTag) {
            let href = linkTag.href;
            let urlObj = new URL(href);
            let videoId = urlObj.searchParams.get("v");
            
            if (videoId) {
                // add every song to the output varible
                output += `https://music.youtube.com/watch?v=${videoId}\n`;
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
    a.download = 'playlist_links.txt'; // Nome del file che scaricherai
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log(`Fatto! Ho trovato ${output.split('\n').length - 1} canzoni. Il download dovrebbe partire.`);
} else {
    console.log("Warning: I couldn't find any songs. Make sure you scroll down to load them all before running the code.");
}
