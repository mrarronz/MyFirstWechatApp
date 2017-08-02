//app.js

var store = require("./utils/store.js")
var wxNotificationCenter = require("./utils/WxNotificationCenter.js")

App({
  onLaunch: function () {
    console.log(store)
  },
  
  onShow: function () {
    console.log("小程序进入前台")
    // 发送通知刷新首页页面
    wxNotificationCenter.postNotificationName("courseChangeNotification")
    wxNotificationCenter.postNotificationName("lessonChangeNotification")
  },

  onHide: function () {
    console.log("小程序进入后台")
  },

  globalData: {
    userInfo: null,
    encryptedData: null,
    iv: null,
  },

  /**
   * 获取登录用户的信息
   */
  getUserInfo:function(cb){
    var that = this
    //调用登录接口
    wx.login({
      success: function (res) {
        store.loginCode = res.code
        wx.getUserInfo({
          success: function (res) {
            that.globalData.userInfo = res.userInfo
            typeof cb == "function" && cb(that.globalData.userInfo)
          },
          fail: function (res) {
            typeof cb == "function" && cb(that.globalData.userInfo)
          }
        })
      },
      fail: function (res) {
        typeof cb == "function" && cb(that.globalData.userInfo)
      }
    })
  },


  /**
   * 获取用户加密的信息
   */
  getUserEncryptedData: function(cb) {
    var that = this
    //调用登录接口
    wx.login({
      success: function (res) {
        store.loginCode = res.code
        wx.getUserInfo({
          withCredentials: true,
          success: function (res) {
            that.globalData.userInfo = JSON.parse(res.rawData)
            that.globalData.encryptedData = res.encryptedData
            that.globalData.iv = res.iv
            typeof cb == "function" && cb(that.globalData.userInfo)
          },
          fail: function (res) {
            typeof cb == "function" && cb(that.globalData.userInfo)
          }
        })
      },
      fail: function (res) {
        typeof cb == "function" && cb(that.globalData.userInfo)
      }
    })
  },
  
})