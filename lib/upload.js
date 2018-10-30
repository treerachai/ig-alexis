const uuidv4 = require('uuid/v4');
const crypto = require('crypto');
const sizeOf = require('image-size');
const fs = require('fs');
const request = require('request-promise');
const j = request.jar();
const config = require('../config');


class InstagramUpload {

  constructor(session) {
    if(session) {
      this.setSession(JSON.parse(session))
    }
  }

  timelineFeed() {
    return this.sendRequest('feed/timeline/','GET');
  }

  generateSignature(data){
    let cr = crypto.createHmac('sha1', config.IG_SIG_KEY).update(data).digest('hex');
    return 'ig_sig_key_version=' + config.SIG_KEY_VERSION + '&signed_body=' + cr + '.' + encodeURI(data);
  }

  generateUUID() {
    return uuidv4().replace(/-/g,'');
  }

  generateDeviceID(seed) {
    let volatile_seed = "12345"
    const enc = crypto.createHash('md5').update(seed + volatile_seed).digest('hex');
    return 'android-' + enc.substr(0, 16);
  }

  async login(username, password) {
    this.username = username;
    this.password = password;
    const enc = crypto.createHash('md5').update(this.username + this.password).digest('hex');

    this.device_id = this.generateDeviceID(enc);
    this.uuid = this.generateUUID();

    await this.sendRequest('si/fetch_headers/?challenge_type=signup&guid=' + this.generateUUID(), 'GET');
    let data = {
      'phone_id': this.generateUUID(),
      '_csrftoken': this.csrfToken,
      'username': this.username,
      'guid': this.uuid,
      'device_id': this.device_id,
      'password': this.password,
      'login_attempt_count': '0',
    };
    let signature = this.generateSignature(JSON.stringify(data));
    return await this.sendRequest('accounts/login/', 'POST', signature);
  }

  setSession(session) {
    let url = 'https://www.instagram.com';
    session.session.map((v) => {
      let cookie = request.cookie(v);
      j.setCookie(cookie, url);
    })
    this.jars = j;
    this.uuid = session._uuid;
    this.username_id = session._uid;
    this.xToken = session._csrftoken;
  }

  async uploadPhoto(path, caption) {
    let uploadID = new Date().getTime();
    let imageBuffer = fs.createReadStream(path);
    let headers = {
      'X-IG-Capabilities': '3Q4=',
      'X-IG-Connection-Type': 'WIFI',
      'Cookie2': '$Version=1',
      'Accept-Language': 'en-US',
      'Accept-Encoding': 'gzip, deflate',
      'Content-type': `multipart/form-data; boundary=${this.uuid}`,
      'Connection': 'close',
      'User-Agent': config.USER_AGENT,
    }

    let options = {
      uri: config.API_URL + 'upload/photo/',
      headers,
      method: 'POST',
      resolveWithFullResponse: true,
      formData: {
        photo: {
          value:  imageBuffer,
          options: {
            filename: `pending_media_${uploadID}.jpg`,
            contentType: 'image/jpeg'
          }
        },
        image_compression: '{"lib_name":"jt","lib_version":"1.3.0","quality":"87"}',
        upload_id: uploadID
      },
      jar: this.jars,
    }
      try {
        let response = await request(options);
        if(response.statusCode === 200) {
          let responseConfig = await this.configure(uploadID, path, caption);
          if(responseConfig) {
            let data = {
              '_uuid': this.uuid,
              '_uid': this.username_id,
              'id': this.username_id,
              '_csrftoken': this.xToken,
              'experiment': 'ig_android_profile_contextual_feed'
            }
            return await this.sendRequest('qe/expose/', this.generateSignature(JSON.stringify(data)))
          }
        }
      } catch (error) {
        console.error('Upload Error: ',error);
        return false
      }
  }

  async configure(upload_id, path, caption) {
    let { width, height } = sizeOf(path);
    let configPhoto = {
      '_csrftoken': this.xToken,
      'media_folder': 'Instagram',
      'source_type': 4,
      '_uid': this.username_id,
      '_uuid': this.uuid,
      'caption': caption,
      'upload_id': upload_id,
      'device': config.DEVICE_SETTINGS,
      'edits': {
          'crop_original_size': [width * 1.0, height * 1.0],
          'crop_center': [0.0, 0.0],
          'crop_zoom': 1.0
      },
      'extra': {
          'source_width': width,
          'source_height': height
      }}
      let data = JSON.stringify(configPhoto);
      return await this.sendRequest('media/configure/?', 'POST',this.generateSignature(data))
    }

  static getUserJsonPath() {
    let filePath = __dirname+'/../users.json';
    let userCredentials = fs.readFileSync(filePath);
    return userCredentials;
  }

  async sendRequest(endpoint, method, body, isLogin) {
    let options = {
      uri: config.API_URL + endpoint,
      headers : {
        'Connection': 'close',
        'Accept': '*/*',
        'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie2': '$Version=1',
        'Accept-Language': 'en-US',
        'User-Agent': config.USER_AGENT,
      },
      method,
      resolveWithFullResponse: true,
    }

    if(body) {
      Object.assign(options, {
        body,
        json: true ,
      });
    }

    if(this.xToken) {
      Object.assign(options, { jar: this.jars });
    }

      try {
        let response = await request(options);
        if(response.statusCode === 200) {
          this.csrfToken = response.headers['set-cookie'].join(' ').match(/(en=.+?;)/gm)[0].slice(3,-1);
          this.responseJson = response.body;
          if(this.responseJson.logged_in_user) {
            this.xToken = this.csrfToken;
            let saveCredentials = {
              _uuid: this.uuid,
              _uid: this.responseJson.logged_in_user.pk,
              id: this.responseJson.logged_in_user.pk,
              _csrftoken: this.xToken,
              session: response.headers['set-cookie'],
            }
            let filePath = __dirname+'/../users.json';
            let userCredentials = fs.readFileSync(filePath);
            fs.writeFileSync(filePath, JSON.stringify(Object.assign({}, JSON.parse(userCredentials), saveCredentials), null, 2));
            this.setSession(saveCredentials);
            return;
          }
          return response.body;
        }
      } catch (error) {
        if(error.message !== 'TypeError: Method must be a valid HTTP token') {
          console.log(error.message);
        }
      }
  }
}

module.exports = InstagramUpload;
