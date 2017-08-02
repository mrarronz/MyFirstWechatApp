// lesson.js
var service = require("../../utils/service.js")
var wxNotificationCenter = require("../../utils/WxNotificationCenter.js") 

Page({

  /**
   * 页面的初始数据
   */
  data: {
    options: {},
    lessonList:[],
    hasLesson: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      options: options
    })
    wxNotificationCenter.addNotification("lessonChangeNotification", this.lessonChangeNotificationHandler, this)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.setNavigationBarTitle({
      title: this.data.options.title,
    })
    var courseId = this.data.options.id
    wx.showLoading({
      title: '加载中...',
    })

    var that = this
    service.getCourseware(courseId, function (res) {
      wx.hideLoading()
      var hasLesson = false
      if (res != null && res.length > 0) {
        hasLesson = true
      }
      that.setData({
        lessonList: res,
        hasLesson: hasLesson
      })
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    wxNotificationCenter.removeNotification("lessonChangeNotification", this)
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var that = this
    service.getCourseware(that.data.options.id, function (res) {
      wx.stopPullDownRefresh()
      that.setData({
        lessonList: res
      })
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },

  // 点击课时列表
  bindViewTap: function(e) {
    var title = e.currentTarget.dataset.title
    var coursewareId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../detail/detail?title=' + title + "&id=" + coursewareId,
    })
  },

  // 接收通知刷新课件列表
  lessonChangeNotificationHandler: function () {
    var that = this
    service.getCourseware(that.data.options.id, function (res) {
      wx.stopPullDownRefresh()
      that.setData({
        lessonList: res
      })
    })
  }
})