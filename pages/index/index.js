//index.js

var service = require("../../utils/service.js")
var store = require("../../utils/store.js")
var wxNotificationCenter = require("../../utils/WxNotificationCenter.js") 

//获取应用实例
var app = getApp()
Page({
  data: {
    userInfo: {},
    classList: [],
    loginSuccess: true,  // 默认用户登录成功了
    isUserAuthorized: true, // 默认用户授权了
    hasClassInfo: true // 默认已经报班了，班级列表不为空
  },

  // 声明周期函数
  onLoad: function () {
    console.log("onLoad ——> index页面加载")
    this.checkLoginProcess()
    wxNotificationCenter.addNotification("courseChangeNotification", this.courseChangeNotificationHandler, this)
  },

  onReady: function () {
    
  },

  onShow: function () {
    console.log("onShow ——> index页面显示")
  },

  onHide: function () {
    console.log("onHide ——> index页面隐藏")
  },

  onUnload: function () {
    console.log("onUnload ——> index页面卸载")
    wxNotificationCenter.removeNotification("courseChangeNotification", this)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    if (!this.data.isUserAuthorized) {
      wx.stopPullDownRefresh()
      return
    }
    var thirdSession = wx.getStorageSync("thirdSessionKey")
    if (thirdSession == null || thirdSession == "") {
      this.loginWithEncryptedProcess(true)
      console.log("onPullDownRefresh ——> 开始调用register接口刷新数据");
    } else {
      console.log("onPullDownRefresh ——> 根据登录状态来刷新数据");
      this.getUserCourse(true)
    }
  },

  //点击了用户头像
  userAvatarTap: function () {
    // wx.navigateTo({
    //   url: '../profile/profile'
    // })
  },

  // 点击了班级列表item，进入课时列表界面
  classItemTap: function (e) {
    var title = e.currentTarget.dataset.title
    var courseId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../lesson/lesson?title=' + title + "&id=" + courseId
    })
  },

  /**
   * 点击登录按钮
   */
  loginButtonTap: function () {
    this.checkLoginProcess()
  },

  /**
   * 点击允许授权按钮
   */
  agreeButtonTap: function () {
    var that = this
    wx.openSetting({
      success: function (res) {
        console.log("成功打开设置页面")
        console.log(res)
        let isUserAuthed = res.authSetting["scope.userInfo"]
        if (isUserAuthed) {
          that.checkLoginProcess()
        }
      },
      fail: function (res) {
        console.log(res)
      }
    })
  },

  /**
   * 用户正常登录操作
   * 1、先调用wx.login获取code字段
   * 2、调用wx.getUserInfo获取用户信息
   * 3、调用后台/User/Index/login接口获取3rd_session
   * 4、使用3rd_session字段调用后台接口获取班级课程
   */
  loginWithNormalProcess: function () {
    var that = this
    app.getUserInfo(function (userInfo) {
      // 如果登录之后的code字段没有得到，说明调用wx.login接口失败了，此时需要显示登录按钮
      if (store.loginCode == null) {
        that.setData({
          loginSuccess: false
        })
        return
      }
      //登录成功，UI正常显示
      that.setData({
        loginSuccess: true
      })
      // 如果登录成功之后用户信息没有获取到，说明此时用户没有进行授权，头像和昵称显示默认值
      if (userInfo == null) {
        that.setData({
          hasClassInfo: false,
          isUserAuthorized: false
        })
      } else {
        // 用户授权成功，更新数据
        that.setData({
          isUserAuthorized: true,
          userInfo: userInfo
        })
        // 成功获取授权之后再调用接口获取班级列表
        wx.showLoading({
          title: '加载中...',
        })
        that.getUserCourse(false)
      }
    })
  }, 

  /**
   * 用户首次登录或更换设备进入小程序的操作
   * 1、先调用wx.login得到code字段
   * 2、调用wx.getUserInfo得到加密的用户信息，得到encryptedData和iv字段
   * 3、使用上述三个字段调用后台/User/Index/register接口得到3rd_session
   * 4、使用3rd_session字段调用后台接口获取班级课程
   */
   loginWithEncryptedProcess: function (isPullDownRefresh) {
     var that = this
     app.getUserEncryptedData(function (userInfo) {
       if (store.loginCode == null) {
         that.setData({
           loginSuccess: false
         })
         return
       }
       //登录成功，UI正常显示
       that.setData({
         loginSuccess: true
       })
       if (userInfo == null) {
         that.setData({
           hasClassInfo: false,
           isUserAuthorized: false
         })
       } else {
         //用户授权成功，更新数据
         that.setData({
           isUserAuthorized: true,
           userInfo: userInfo,
         })
         // 获取班级列表
         if (!isPullDownRefresh) {
           wx.showLoading({
             title: '加载中...',
           })
         }
         let iv = app.globalData.iv
         let encryptedData = app.globalData.encryptedData
         service.registerThirdSession(iv, encryptedData, function (res) {
           if (res == null) {
             that.hideHUD(isPullDownRefresh)
             that.setData({
               hasClassInfo: false
             })
             return
           }
           service.getAuthorizedCourse(function (result, statusCode) {
             let hasClass = (result.length > 0)
             that.hideHUD(isPullDownRefresh)
             that.setData({
               classList: result,
               hasClassInfo: hasClass
             })
           })
         })
       }
     })
   },

   /**
    * 根据本地存储的thirdSession字段判断应该调用哪个流程的登录方法
    */
    checkLoginProcess: function() {
      // 检查本地是否存储3rd_session字段
      var thirdSession = wx.getStorageSync("thirdSessionKey")
      if (thirdSession == null || thirdSession == "") {
        console.log("checkLoginProcess ——> 首次进入app，使用index/register流程")
        this.loginWithEncryptedProcess(false)
      } else {
        console.log("checkLoginProcess ——> index/login流程")
        this.loginWithNormalProcess()
      }
    },


    /**
     * 接收到通知后的处理方法
     */
    courseChangeNotificationHandler: function () {
      if (this.data.isUserAuthorized) {
        console.log("接收到通知了，开始刷新数据")
        this.checkLoginProcess()
      }
    },

    /**
     * 根据用户登录是否过期来获取用户数据和课程信息
     * @param isPullDownRefresh 是否是下拉刷新
     */
    getUserCourse: function (isPullDownRefresh) {
      var that = this
      service.getLoginStatus(function (status) {
        // 如果当前登录有效，直接获取课程列表
        if (status) {
          console.log("getUserCourse ——> 登录有效，直接获取课程")
          service.getAuthorizedCourse(function (result, statusCode) {
            //此处判断下statusCode，如果为200表示服务器返回数据正常，其它异常情况先获取一遍3rd_session再获取课程数据
            if (statusCode != 200) {
              service.getThirdSession(function (res) {
                if (res == null) {
                  that.hideHUD(isPullDownRefresh)
                  that.setData({
                    hasClassInfo: false
                  })
                  return
                }
                service.getAuthorizedCourse(function (result, statusCode) {
                  let hasClass = (result.length > 0)
                  that.hideHUD(isPullDownRefresh)
                  that.setData({
                    classList: result,
                    hasClassInfo: hasClass
                  })
                })
              })
            } else {
              let hasClass = (result.length > 0)
              that.hideHUD(isPullDownRefresh)
              that.setData({
                classList: result,
                hasClassInfo: hasClass
              })
            }
          })
        } else {
          console.log("getUserCourse ——> 登录过期，先调用wx.login获取code，再获取3rd_session和课程")
          app.getUserInfo(function (userInfo) {
            // 如果登录之后的code字段没有得到，说明调用wx.login接口失败了，此时需要显示登录按钮
            if (store.loginCode == null) {
              that.setData({
                loginSuccess: false
              })
              return
            }
            //登录成功，UI正常显示
            that.setData({
              loginSuccess: true
            })
            // 如果登录成功之后用户信息没有获取到，说明此时用户没有进行授权，头像和昵称显示默认值
            if (userInfo == null) {
              that.setData({
                hasClassInfo: false,
                isUserAuthorized: false
              })
            } else {
              // 用户授权成功，更新数据
              that.setData({
                isUserAuthorized: true,
                userInfo: userInfo
              })
              // 成功获取授权之后再调用接口获取班级列表
              if (!isPullDownRefresh) {
                wx.showLoading({
                  title: '加载中...',
                })
              }
              service.getThirdSession(function (res) {
                if (res == null) {
                  that.hideHUD(isPullDownRefresh)
                  that.setData({
                    hasClassInfo: false
                  })
                  return
                }
                service.getAuthorizedCourse(function (result, statusCode) {
                  let hasClass = (result.length > 0)
                  that.hideHUD(isPullDownRefresh)
                  that.setData({
                    classList: result,
                    hasClassInfo: hasClass
                  })
                })
              })
            }
          })
        }
      })
    },

    /**
     * 隐藏loading或停止下拉刷新
     */
    hideHUD: function (isPullDownRefresh) {
      if (isPullDownRefresh) {
        wx.stopPullDownRefresh()
      } else {
        wx.hideLoading()
      }
    }
})