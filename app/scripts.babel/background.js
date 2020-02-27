chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);

  Storage.get({ accessToken: null }).then(function(storage) {
    new Background(new GithubAPI(storage.accessToken));
  });
});

chrome.runtime.onStartup.addListener(function() {
  console.log('onStartup called ');
  Storage.get({ accessToken: null }).then(function(storage) {
    new Background(new GithubAPI(storage.accessToken));
  });
});

chrome.runtime.onSuspend.addListener(function() {
  console.log('onSuspend called ');
});

chrome.runtime.onSuspendCanceled.addListener(function() {
  console.log('onSuspendCanceled called ');
});

function Background(_githubAPI) {
  let _this = {};
  let _runtimeOnConnectHandler = {};

  function init() {
    chrome.runtime.onConnect.addListener(function(port) {
      console.log('background: chrome.runtime.onConnect.addListener called with port: ' + port);
      LinearPort.addPort(port).onMessage.addListener(function(response, _port) {
        let handler = _runtimeOnConnectHandler[response.message];
        typeof handler === 'function' && handler(response.data, _port);
      });
    });
  }

  _runtimeOnConnectHandler.loadAutoMergeButtonStatus = function({ pathData }, _port) {
    let { owner, repo, pr_number } = pathData;

    $.ajax(`${ENV.HOST}/auto_merges/${pathData.pr_number}.json`, {
      data: {
        pathData: new Object({ owner, repo, pr_number })
      },
      dataType: 'json'
    })
    .then(function(data){
      data = data || {};
      _port.postMessage({
        message: 'loadAutoMergeButtonStatusCompleted',
        data: {
          pathData: pathData,
          lastUpdated: data.last_updated,
          autoMergeBy: data.auto_merge_by,
          isOwner: data.is_owner,
          recordExists: !!(data.state === 'pending')
        }
      });
    })
    .fail(function(deferred, type, errorType) {
      if (errorType === 'Unauthorized') {
        _port.postMessage({
          message: 'requestLogin',
          data: {}
        });
      }
    });
  }

  _runtimeOnConnectHandler.createAutoMerge = function({ pathData, commit_title, commit_message }) {
    let { owner, repo, pr_number } = pathData;

    $.ajax(`${ENV.HOST}/auto_merges`, {
      type: 'POST',
      dataType: 'json',
      data: { pathData, owner, repo, pr_number, commit_title, commit_message }
    });
  }

  _runtimeOnConnectHandler.cancelAutoMerge = function({ pathData }) {
    $.ajax(`${ENV.HOST}/auto_merges/${pathData.pr_number}`, {
      type: 'DELETE'
    });
  }

  init();

  return _this;
}
