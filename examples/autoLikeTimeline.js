const Ig = require('../main');
let ig = new Ig();

const TIMEOUT = 6000; // 6 seconds;

// const username = 'username';
// const password = 'password';

async function doLike() {
  try {
    await ig.loginByPassword({ username, password });
    let medias = await ig.getTimeLineMedia();
    medias.map(async ({ node }) => {
      console.log(node);
        let now = new Date().getTime();
        let fourHours = 3600 * 4 * 1000;
        let mediaTimePost = node.taken_at_timestamp * 1000;
        if(mediaTimePost >= now - fourHours) {
            if(!node.viewer_has_liked) {
                let x = await ig.likeMedia(node.id);
                console.log(x);
                return x;
            }
        }
    })
  } catch (error) {
    console.error(error);
  }
  // setTimeout(doLike, TIMEOUT)
}

doLike();

// module.exports = doLike;
