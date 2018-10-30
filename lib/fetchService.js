const request = require('request');

class FetchService {
  constructor(url) {
    this.head = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    URL = uri || config.uri;
  }

  data(data, typeData) {
    if(typeData) {
      delete this.head.headers['Content-Type']
      this.head.body = data;
    } else {
      this.head.body = JSON.stringify(data);
    }
    return this;
    }

  async exec() {

  }

  get() {
      this.head.method = 'GET';
      return this.exec();
    }

  post() {
      this.head.method = 'POST';
      return this.exec();
    }

  endpoint(uri) {
    this.uri = URL + '/' + uri;
    return this;
  }
}

module.exports = FetchService;
