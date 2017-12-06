let exec = require('child_process').exec;
let fs = require('fs');

let host = 'https://www.instagram.com';
let mediaImage = [];
let i = 0;
let startDate;

class InstagramApi {

  constructor(userSession) {
    this.userSession = userSession;
  }

  getStory(username, cb) {
    let cmd = `curl '${host}/${username}/?__a=1' -H 'pragma: no-cache' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'upgrade-insecure-requests: 1' -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36' -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8' -H 'cache-control: no-cache' -H 'authority: www.instagram.com' -H 'cookie: sessionid=${this.userSession.sessionID}' -H 'save-data: on' --compressed`
    let dataUrl = [];
    exec(cmd, (err, st) => {
      try {
        let response = JSON.parse(st);
        let storycmd = `curl '${host}/graphql/query/?query_id=17873473675158481&variables=%7B%22reel_ids%22%3A%5B%22${response.user.id}%22%5D%2C%22precomposed_overlay%22%3Afalse%7D' -H 'pragma: no-cache' -H 'cookie: sessionid=${this.userSession.sessionID}' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36' -H 'accept: */*' -H 'cache-control: no-cache' -H 'authority: www.instagram.com' -H 'x-requested-with: XMLHttpRequest' -H 'referer: https://www.instagram.com/' -H 'save-data: on' --compressed`
        exec(storycmd, (err, sto) => {
            let { data } = JSON.parse(sto);
            if(data.reels_media.length > 0) {
              let { items } = data.reels_media[0];
              for (let i = 0; i < items.length; i++) {
                if(items[i].is_video) {
                  dataUrl.push(items[i].video_resources[items[i].video_resources.length - 1].src);
                } else {
                  dataUrl.push(items[i].display_resources[items[i].display_resources.length - 1].src);
                }
              }
              cb(dataUrl);
            }
          })
      } catch(error) {
        return 'User Not Have Story';
      }
    })
  }

  getAllMedia(username, countImage , cb) {
    let cmd = `curl '${host}/${username}/?__a=1' -H 'pragma: no-cache' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'upgrade-insecure-requests: 1' -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36' -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8' -H 'cache-control: no-cache' -H 'authority: www.instagram.com' -H 'cookie: sessionid=${this.userSession.sessionID}' -H 'save-data: on' --compressed`
    exec(cmd, (err, sto) => {
      try {
          let response = JSON.parse(sto);
          let { nodes, page_info } = response.user.media;
          for (let i = 0; i < nodes.length; i++) {
            mediaImage.push({
              id: nodes[i].id,
              code: (!nodes[i].comments_disabled) ? nodes[i].code : null,
              src: nodes[i].display_src,
              comments_disabled: nodes[i].comments_disabled,
            })
          }
          this.doLoop(Math.floor(countImage / 12) - 1, page_info.end_cursor, response.user, (code) => {
            return cb(code);
          });
      } catch(error) {
          console.log('Username IG not Found !!');
      }
    })

  }

  doLoop(countImage, nextCursor, idUser, cb) {
    let qid = `17888483320059182&variables=%7B%22id%22%3A%22${idUser.id}%22%2C%22first%22%3A12%2C%22after%22%3A%22${nextCursor}%22%7D`
    let cmds = `curl '${host}/graphql/query/?query_id=${qid}' -H 'pragma: no-cache' -H 'cookie: sessionid=${this.userSession.sessionID}' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36' -H 'accept: */*' -H 'cache-control: no-cache' -H 'authority: www.instagram.com' -H 'x-requested-with: XMLHttpRequest' -H 'referer: ${host}/${idUser.username}/' -H 'save-data: on' --compressed`;
    exec(cmds, (err, sto2) => {
      let response2 = JSON.parse(sto2);
      let { page_info, edges } = response2.data.user.edge_owner_to_timeline_media;
      for (let i = 0; i < edges.length; i++) {
        mediaImage.push({
          id: edges[i].node.id,
          code: (!edges[i].node.comments_disabled) ? edges[i].node.shortcode : null,
          src: edges[i].node.display_url,
          comments_disabled: edges[i].node.comments_disabled,
        })
      }

      if(countImage < 1) {
        return cb(mediaImage);
      }

      if(page_info.has_next_page) {
        countImage -= 1;
        return this.doLoop(countImage, page_info.end_cursor, idUser, cb );
      }
    })
  }

  _comment(id, code, comment, cb) {
      if(!code) {
          cb(`media #${id} disable comment`);
          return;
      }
      let cmd = `curl '${host}/web/comments/${id}/add/' -H 'cookie: sessionid=${this.userSession.sessionID};csrftoken=${this.userSession.csrfToken};' -H 'origin: ${host}' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36' -H 'x-requested-with: XMLHttpRequest' -H 'save-data: on' -H 'x-csrftoken: ${this.userSession.csrfToken}' -H 'pragma: no-cache' -H 'x-instagram-ajax: 1' -H 'content-type: application/x-www-form-urlencoded' -H 'accept: */*' -H 'cache-control: no-cache' -H 'authority: www.instagram.com' -H 'referer: ${host}/p/${code}/?taken-by=${process.argv.slice(3)[0]}' --data 'comment_text=${comment}' --compressed`;
      exec(cmd, (err, sto) => {
          if(err) {
              console.log(err);
              return;
          } else {
              cb(sto);
          }
      })
  }

  timelineMedia(cb) {
    try {
      var cmd =`wget --header="cookie: sessionid=${this.userSession.sessionID}" https://instagram.com/ -qO -`;
      exec(cmd,function(e,so,si){
        let ind = so.split('window._sharedData = ')
        let dataScrap = ind[1].split(';</script>')
        let tojson = JSON.parse(dataScrap[0])
        let media = tojson.entry_data.FeedPage[0].graphql.user.edge_web_feed_timeline.edges
        cb(media)
      })
    } catch (error) {
      console.error('No Sessions Found, Please Re-Login');
    }
  }

  _like(id, cb) {
    let commandLike = `curl '${host}/web/likes/${id}/like/' -X POST -H 'cookie: sessionid=${this.userSession.sessionID};csrftoken=${this.userSession.csrfToken};' -H 'origin: ${host}' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36' -H 'x-requested-with: XMLHttpRequest' -H 'save-data: on' -H 'x-csrftoken: ${this.userSession.csrfToken}' -H 'pragma: no-cache' -H 'x-instagram-ajax: 1' -H 'content-type: application/x-www-form-urlencoded' -H 'accept: */*' -H 'cache-control: no-cache' -H 'authority: www.instagram.com' -H 'referer: ${host}/' -H 'content-length: 0' --compressed`
    exec(commandLike,function(e,so,si) {
        cb(e, so);
    });
  }

  mediaId(url, cb) {
    let cmd = `curl 'https://api.instagram.com/oembed/?callback=&url=${url}' -H 'pragma: no-cache' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'upgrade-insecure-requests: 1' -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36' -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8' -H 'cache-control: no-cache' -H 'authority: api.instagram.com' -H 'cookie: sessionid=${this.userSession.sessionID} csrftoken=${this.userSession.csrfToken};' -H 'save-data: on' --compressed`;
    exec(cmd, (e,so,si) => {
      let { author_name, author_id, media_id, thumbnail_url } = JSON.parse(so);
      cb(e, { author_name, author_id, media_id, thumbnail_url });
    });
  }
}

module.exports = InstagramApi;