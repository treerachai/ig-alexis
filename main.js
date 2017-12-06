let exec = require('child_process').exec;
const fs = require('fs');
const prompt = require('prompt');
const loginUrl = require('./config').loginUrl;

const InstagramAPI = require('./lib/instagram');

class Instagram extends InstagramAPI{

  constructor(userSession) {
    super(userSession);

  }

  loginCli(cb) {
    prompt.start();
    prompt.get([{
      name: 'username',
      required: true,
    },{
      name: 'password',
      description: 'Password',
      type: 'string',
      hidden: true,
      replace: '*',
      required: true,
    }], (err, result) => {
      this.getSession(result, res => {
        return cb(res);
      });
    })
  }

  getSession({ username, password }, cb) {
    exec(`curl -D - '${loginUrl}'`,(err,results) => {
      let csrfToken = results.match(/n=.\w+/gm)[0].slice(2);
      let cmdLogin = `curl -D - '${loginUrl}' -H 'cookie: csrftoken=${csrfToken}; rur=ATN; ig_vw=1366; ig_pr=1; ig_vh=301' -H 'origin: https://www.instagram.com' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: en-US,en;q=0.9' -H 'x-requested-with: XMLHttpRequest' -H 'x-csrftoken: ${csrfToken}' -H 'x-instagram-ajax: 1' -H 'content-type: application/x-www-form-urlencoded' -H 'authority: www.instagram.com' -H 'referer: https://www.instagram.com/accounts/login/' --data 'username=${username}&password=${password}' --compressed`;
      exec(cmdLogin, (err, results) => {
        try {
          let sessionID = results.match(/nid=.+/gm)[0].slice(4);
          let data = {
            sessionID,
            csrfToken
          };
          return cb(data);
        } catch(error) {
          console.log(`Username or Password Wrong, Login Failed !!`)
        }
      })
    })
  }

  logout() {
    fs.writeFile(require('path').resolve(__dirname) + '/users.json', '', (err) => {
      if (err) throw err;
    });
  }

  likeMedia(id) {
    return new Promise((resolve, reject) => {
      this._like(id, (err, output) => {
        if(err) {
          reject(err);
          return;
        }
        resolve(output);
      });
    })
  }

  commentMedia({ id, code }, comment) {
    return new Promise((resolve, reject) => {
      this._comment(id, code, comment, (result) => {
        resolve(result);
      });
    });
  }

  story(username) {
    return new Promise((resolve, reject) => {
      this.getStory(username, cb => {
        resolve(cb);
      });
    })
  }

  getMediaByUserName(username, options) {
    let { limit } = options || { limit: 12 }
    return new Promise((resolve, reject) => {
      this.getAllMedia(username, limit, code => {
        resolve(code.slice(0, limit));
      });
    })
  }

  getTimeLineMedia() {
    return new Promise((resolve,reject) => {
      this.timelineMedia(media => {
        resolve(media);
      });
    })
  }

  getMediaId(url) {
    return new Promise((resolve, reject) => {
      this.mediaId(url, (err, cb) => {
        if(err) {
          reject(err);
          return;
        }
        resolve(cb);
      })
    })
  }

}

module.exports = Instagram;
