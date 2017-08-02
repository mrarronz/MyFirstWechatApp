var define = require("./defines.js")
var store = require("./store.js")
var md5 = require("./md5.js")

/**
 * 获取加密后的参数sign
*/
function encryptedParams(params){
  var sortedKeys = Object.keys(params).sort()
  var signStr = define.appSecret
  for (var i = 0; i < sortedKeys.length; i++) {
    signStr = signStr + sortedKeys[i] + params[sortedKeys[i]]
  }
  let encryptedStr = md5.hexMD5(signStr)
  let finalStr = encryptedStr.toUpperCase()
  return finalStr
}

/**
 * 解析课件详情数据，得到对应的视频、音频、文件和图片数组
 */
function getCoursewareData(contentType, items){
  var newItems = []
  for (var index in items) {
    let obj = items[index]
    let objType = obj["type"]
    if (contentType == objType) {
      newItems.push(obj)
    }
  }
  var sortedItems = newItems.sort(compare("sort"))
  return sortedItems
}

/**
 * 对数组中字典进行排序
 */
function compare(property){
  return function(a, b){
    var value1 = a[property]
    var value2 = b[property]
    return value1-value2
  }
}

module.exports = {
  
  /**
   * 获取第三方session
   */
  getThirdSession: function(cb) {
    console.log("code字段的值：" + store.loginCode)
    // 接口需要微信登录之后的code参数，这个参数如果为空说明微信授权登录失败，无法进行下一步调用
    var loginCode = store.loginCode
    if (loginCode == null) {
      cb(null)
      return
    }
    // 基本的请求参数
    var params = {
      "appID": define.appId,
      "code": loginCode,
    }
    // 得到sign参数之后重新拼装请求参数
    let sign = encryptedParams(params)
    params["sign"] = sign
    // 发起请求
    wx.request({
      url: define.baseURL + "/User/Index/login",
      data: params,
      header: {
        'content-type': 'application/json'
      },
      method: "POST", //请求参数默认为GET，接口全部改为用POST
      success: function(res) {
        console.log("/User/Index/login请求结果：")
        console.log(res)
        let response = res.data
        let status = response.status

        // 得到结果后根据status的值判断请求结果是成功还是失败
        if (status == 200) {
          let result = response.data
          store.thirdSession = result["3rd_session"]
          wx.setStorageSync("thirdSessionKey", store.thirdSession)
          cb(store.thirdSession)
        } else {
          cb(null)
        }
      },
      fail: function(res) {
        // 接口调用失败了
        console.log("/User/Index/login请求失败：")
        console.log(res)
        cb(null)
      } 
    })
  },

  /**
   * 获取学生已授权的课程列表
   */
  getAuthorizedCourse: function(cb) {
    let thirdSession = wx.getStorageSync("thirdSessionKey")
    // 请求参数
    let params = {
      "appID": define.appId,
      "3rd_session": thirdSession
    }
    let sign = encryptedParams(params)
    params["sign"] = sign
    wx.request({
      url: define.baseURL + "/Course",
      data: params,
      method: "POST",
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        console.log("/Course请求结果：")
        console.log(res)
        let response = res.data
        let status = response.status
        // 得到结果后根据status的值判断请求结果是成功还是失败
        if (status == 200) {
          let result = response.data
          if (result == null || result == "") {
            result = []
          }
          cb(result, status)
        } else {
          cb([], status)
        }
      },
      fail: function(res) {
        console.log("/Course请求失败：")
        console.log(res)
        cb([], -10000)
      }
    })
  },

  /**
   * 获取课程课件列表
   */
  getCourseware: function(courseId, cb) {
    let thirdSession = wx.getStorageSync("thirdSessionKey")
    // 请求参数
    let params = {
      "appID": define.appId,
      "3rd_session": thirdSession,
      "course_id": courseId
    }
    let sign = encryptedParams(params)
    params["sign"] = sign
    wx.request({
      url: define.baseURL + "/Courseware",
      data: params,
      method: "POST",
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        console.log("/Courseware请求结果")
        console.log(res)
        let response = res.data
        let status = response.status
        // 得到结果后根据status的值判断请求结果是成功还是失败
        if (status == 200) {
          let result = response.data
          cb(result)
        } else {
          cb([])
        }
      },
      fail: function (res) {
        console.log("/Courseware请求失败：")
        console.log(res)
        cb([])
      }
    })
  },

  /**
   * 获取课件的详情页列表项
   */
  getItemListOfCourseware: function(coursewareId, cb) {
    let thirdSession = wx.getStorageSync("thirdSessionKey")
    // 请求参数
    let params = {
      "appID": define.appId,
      "3rd_session": thirdSession,
      "courseware_id": coursewareId
    }
    let sign = encryptedParams(params)
    params["sign"] = sign
    wx.request({
      url: define.baseURL + "/Courseware/Item",
      data: params,
      method: "POST",
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        console.log("/Courseware/Item请求结果：")
        console.log(res)
        let response = res.data
        let status = response.status
        // 得到结果后根据status的值判断请求结果是成功还是失败
        if (status == 200) {
          let result = response.data
          cb(result)
        } else {
          cb([])
        }
      },
      fail: function (res) {
        console.log("/Courseware/Item请求失败：")
        console.log(res)
        cb([])
      }
    })
  },

  getCoursewareData: getCoursewareData,

/**
 * 获取当前登录账号的状态
 */
  getLoginStatus: function(cb) {
    wx.checkSession({
      success: function() {
        // 登录有效
        cb(true)
      },
      fail: function(){
        // 登录无效
        cb(false)
      }
    })
  },

  /**
   * 首次登录获取3rd_session
   */
  registerThirdSession: function(iv, encryptedData, cb) {
    // 接口需要微信登录之后的code参数，这个参数如果为空说明微信授权登录失败，无法进行下一步调用
    var loginCode = store.loginCode
    if (loginCode == null) {
      cb(null)
      return
    }
    // 基本的请求参数
    var params = {
      "appID": define.appId,
      "code": loginCode,
      "encryptedData" : encryptedData,
      "iv" : iv
    }
    // 得到sign参数之后重新拼装请求参数
    let sign = encryptedParams(params)
    params["sign"] = sign

    // 发起请求
    wx.request({
      url: define.baseURL + "/User/Index/register",
      data: params,
      header: {
        'content-type': 'application/json'
      },
      method: "POST", //请求参数默认为GET，接口全部改为用POST
      success: function (res) {
        console.log("/User/Index/register请求结果：")
        console.log(res)
        let response = res.data
        let status = response.status

        // 得到结果后根据status的值判断请求结果是成功还是失败
        if (status == 200) {
          let result = response.data
          store.thirdSession = result["3rd_session"]
          wx.setStorageSync("thirdSessionKey", store.thirdSession)
          cb(store.thirdSession)
        } else {
          cb(null)
        }
      },
      fail: function (res) {
        // 接口调用失败了
        console.log("/User/Index/register请求失败：")
        console.log(res)
        cb(null)
      }
    })
  },
}