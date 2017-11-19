let exec = require('child_process').exec;
let fs = require('fs');

let host = 'https://www.instagram.com';
let idPoto = [];
let codePoto = [];
let i = 0;
let startDate;


class Instagram {

  constructor() {
    this.argv = {};
  }

  get delay() {
    return this.argv.d || 4000;
  }

  sessions() {
    return JSON.parse(fs.readFileSync(require('path').resolve(__dirname) + '/users.json').toString());
  }

  nextMedia(nextCursor, idUser) {
      let cmds = `curl '${host}/graphql/query/?query_id=17888483320059182&variables=%7B%22id%22%3A%22${idUser.id}%22%2C%22first%22%3A12%2C%22after%22%3A%22${nextCursor}%22%7D' -H 'pragma: no-cache' -H 'cookie: sessionid=${this.sessionID}' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36' -H 'accept: */*' -H 'cache-control: no-cache' -H 'authority: www.instagram.com' -H 'x-requested-with: XMLHttpRequest' -H 'referer: ${host}/${idUser.username}/' -H 'save-data: on' --compressed`;
      exec(cmds, (err, sto2) => {
          let response2 = JSON.parse(sto2);
          let { page_info, edges } = response2.data.user.edge_owner_to_timeline_media;
          for (let i = 0; i < edges.length; i++) {
              codePoto.push((!edges[i].node.comments_disabled) ? edges[i].node.shortcode : null);
              idPoto.push(edges[i].node.id)
          }
          if(page_info.has_next_page) {
              return this.nextMedia(page_info.end_cursor, idUser);
          }
          startDate = new Date().getTime();
          this.like(idPoto);
      })
  }

  exec(argv) {
    Object.assign(this.argv, argv);
    let username = argv._[0];
    let { sessionID, csrftoken } = this.sessions();
    this.sessionID = sessionID;
    this.csrftoken = csrftoken;

    let story = argv.story || argv.s;
    let cmd = `curl '${host}/${username}/?__a=1' -H 'pragma: no-cache' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'upgrade-insecure-requests: 1' -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36' -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8' -H 'cache-control: no-cache' -H 'authority: www.instagram.com' -H 'cookie: sessionid=${sessionID}' -H 'save-data: on' --compressed`

    exec(cmd,(err, sto) => {
        try {
            let response = JSON.parse(sto);
            let { nodes, page_info, count } = response.user.media;
            if (story) {
              let storycmd = `curl '${host}/graphql/query/?query_id=17873473675158481&variables=%7B%22reel_ids%22%3A%5B%22${response.user.id}%22%5D%2C%22precomposed_overlay%22%3Afalse%7D' -H 'pragma: no-cache' -H 'cookie: sessionid=${sessionID}' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36' -H 'accept: */*' -H 'cache-control: no-cache' -H 'authority: www.instagram.com' -H 'x-requested-with: XMLHttpRequest' -H 'referer: https://www.instagram.com/' -H 'save-data: on' --compressed`
              exec(storycmd, (err, sto) => {
                let { data } = JSON.parse(sto);
                if(data.reels_media.length > 0) {
                  let { items } = data.reels_media[0];
                  for (let i = 0; i < items.length; i++) {
                    if(items[i].is_video) {
                      console.log(items[i].video_resources[1].src);
                    } else {
                      console.log(items[i].display_resources[1].src);
                    }
                  }
                }
              })
              return;
            }
            let tot = argv.n || count;
            let date = ((tot * this.delay  + 2000) / 1000 ) / 60;
            console.log(`Estimated like and comment ${date.toFixed(3)} minutes`);
            for (let i = 0; i < nodes.length; i++) {
                let { code, id, comments_disabled } = nodes[i];
                idPoto.push(id);
                codePoto.push((!comments_disabled) ? code : null);
            }
            this.nextMedia(page_info.end_cursor, response.user);
        } catch(error) {
            console.log('Session Time Out or Username IG not Found !!');
        }
    })
  }

  comment(id, code, comment) {
      if(!code) {
          console.log(`media #${id} disable comment`);
          return;
      }
      let cmd = `curl '${host}/web/comments/${id}/add/' -H 'cookie: sessionid=${this.sessionID};csrftoken=${this.csrftoken};' -H 'origin: ${host}' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36' -H 'x-requested-with: XMLHttpRequest' -H 'save-data: on' -H 'x-csrftoken: ${this.csrftoken}' -H 'pragma: no-cache' -H 'x-instagram-ajax: 1' -H 'content-type: application/x-www-form-urlencoded' -H 'accept: */*' -H 'cache-control: no-cache' -H 'authority: www.instagram.com' -H 'referer: ${host}/p/${code}/?taken-by=${process.argv.slice(3)[0]}' --data 'comment_text=${comment}' --compressed`;
      exec(cmd, (err, sto) => {
          if(err) {
              console.log(err);
              return;
          } else {
              console.log(`media comment => ${comment}`);
          }
      })
  }

  like(id, code) {

      let length = idPoto.length;
      if(this.argv.n < length) {
          length = this.argv.n;
      }

      let to = setTimeout(() => {
          if(i >= length) {
              clearTimeout(to);
              let finishDate = new Date().getTime() - startDate;
              let date = (finishDate / 1000) / 60
              console.log(`Like Done in ${date.toFixed(3)} Minutes!`);
              return;
          }
          let commandLike = `curl '${host}/web/likes/${idPoto[i]}/like/' -X POST -H 'cookie: sessionid=${this.sessionID};csrftoken=${this.csrftoken};' -H 'origin: ${host}' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36' -H 'x-requested-with: XMLHttpRequest' -H 'save-data: on' -H 'x-csrftoken: ${this.csrftoken}' -H 'pragma: no-cache' -H 'x-instagram-ajax: 1' -H 'content-type: application/x-www-form-urlencoded' -H 'accept: */*' -H 'cache-control: no-cache' -H 'authority: www.instagram.com' -H 'referer: ${host}/' -H 'content-length: 0' --compressed`
          exec(commandLike,function(e,so,si) {
              if(!e){
                  console.log('Like =>',idPoto[i])
              }
          });
          if(this.argv.c) {
            this.comment(idPoto[i], codePoto[i], this.argv.c);
          }
          this.like(idPoto[i]);
          i++
      },this.delay);
  }
}

module.exports = new Instagram();
