const InstagramAPI = require('./lib/instagram');
const InstagramUpload = require('./lib/upload');
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
      this.getSession(result, (err, res) => {
        return cb(res);
      });
    })
  }

  loginByPassword({ username, password }) {
    return new Promise((resolve, reject) => {
      this.getSession({ username, password }, (err, res) => {
        if(err) {
          reject(err);
        }
        resolve(res);
      });
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

  getProfile(username) {
    return new Promise((resolve, reject) => {
      this._getProfile(username,(err, success) => {
        if(err) {
          reject(err);
        }
        resolve(success);
      });
    })
  }
}

module.exports = {
  Instagram,
  InstagramUpload
};
