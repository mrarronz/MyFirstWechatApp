// detail.js
var service = require("../../utils/service.js")
var util = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    options: {},
    description: "", //课件描述
    createdTime: "", // 创建时间
    items: [], // 课件列表

    hasVideo: false, // 课件内容是否有视频
    hasAudio: false, // 课件内容是否有音频（如音标练习，跟读）
    hasPicture: false, // 课件内容是否有图片
    hasDoc: false,  // 课件内容是否有文件(doc, ppt, xls)
    hasNote: false, // 课件内容是否有笔记(文字说明)

    isVideoPlaying: false, // 视频是否正在播放
    isAudioPlaying: false, // 音频是否正在播放

    audioPlayIndex: -1, // 当前播放的音频index
    videoPlayIndex: -1, // 当前播放的视频index

    videoList: [], // 视频列表
    audioList: [], // 音频列表,
    pictures: [], // 图片列表
    documents: [], // 文件列表
    noteList: [], // 笔记列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      options: options
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.audioCtx = wx.createAudioContext('myAudio')
    this.videoCtx = wx.createVideoContext('myVideo')

    var that = this
    wx.showLoading({
      title: '加载中...',
    })
    let coursewareId = that.options.id
    service.getItemListOfCourseware(coursewareId, function (result) {
      let formatTime = util.formatTime(result.created)
      // 筛选视频
      let videoList = service.getCoursewareData(102, result.items)
      // 筛选音频
      let audioList = service.getCoursewareData(101, result.items)
      // 筛选图片
      let pictures = service.getCoursewareData(103, result.items)

      // 筛选文件
      var documents = []
      let wordDocs = service.getCoursewareData(104, result.items)
      let pptDocs = service.getCoursewareData(105, result.items)
      let excelDocs = service.getCoursewareData(106, result.items)
      let pdfDocs = service.getCoursewareData(107, result.items)
      let rarDocs = service.getCoursewareData(108, result.items)
      documents = documents.concat(wordDocs)
      documents = documents.concat(pptDocs)
      documents = documents.concat(excelDocs)
      documents = documents.concat(pdfDocs)
      documents = documents.concat(rarDocs)

      let hasVideo = (videoList.length > 0)
      let hasAudio = (audioList.length > 0)
      let hasPicture = (pictures.length > 0)
      let hasDoc = (documents.length > 0)

      that.setData({
        description: result.description ? result.description: "",
        createdTime: formatTime,
        items: result.items,

        hasVideo: hasVideo,
        hasAudio: hasAudio,
        hasPicture: hasPicture,
        hasDoc: hasDoc,

        videoList: videoList,
        audioList: audioList,
        pictures: pictures,
        documents: documents
      })

      wx.hideLoading()
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

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

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

  /**
   * 点击播放音频
   */
  audioPlayTap: function (e) {
    var index = e.currentTarget.dataset.playindex
    if (this.data.isAudioPlaying && this.data.audioPlayIndex == index) {
      this.audioCtx.pause()
      return
    }
    wx.showLoading({
      title: '正在加载...',
    })
    var audioUrl = e.currentTarget.dataset.url
    this.audioCtx.setSrc(audioUrl)
    this.audioCtx.play()
    this.setData({
      audioPlayIndex: index,
      isAudioPlaying: true
    })
  },

  /**
   * 音频播放开始
   */
  audioPlayStart: function () {
    wx.hideLoading()
    if (this.data.isVideoPlaying) {
      this.videoCtx.pause()
    }
  },

  /**
   * 音频播放暂停
   */
  audioPlayPaused: function () {
    this.setData({
      audioPlayIndex: -1,
      isAudioPlaying: false
    })
  },

  /**点击播放视频 */
  switchPlayVideo: function (e) {
    var index = e.currentTarget.dataset.playindex
    var videoUrl = e.currentTarget.dataset.videourl
    this.videoCtx.setSrc(videoUrl)
    this.videoCtx.play()
    this.setData({
      videoPlayIndex: index,
      isVideoPlaying: true
    })
  },

  /**
   * 视频播放开始
   */
  videoPlayStart: function () {
    if (this.data.isAudioPlaying) {
      this.audioCtx.pause()
    }
    this.setData({
      isVideoPlaying: true,
    })
  },

  /**
   * 视频播放暂停
   */
  videoPlayPaused: function () {
    this.setData({
      isVideoPlaying: false
    })
  },

  /**
   * 点击图片进行查看
   */
  previewImageTap: function (e) {
    var currentUrl = e.currentTarget.dataset.url
    var urls = []
    for (var index in this.data.pictures) {
      var picItem = this.data.pictures[index]
      urls.push(picItem.attachment)
    }
    wx.previewImage({
      current: currentUrl,
      urls: urls,
    })
  },

  /**
   * 点击打开课堂笔记
   */
  openDocumentTap: function (e) {
    var fileType = e.currentTarget.dataset.filetype
    if (fileType == 108) {
      // 压缩包文件不支持直接打开，给出提示
      wx.showModal({
        title: '',
        content: '压缩文件不支持下载，请点击下载按钮将地址复制到剪贴板',
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            console.log("点击了确定")
          }
        }
      })
      return
    }
    var fileUrl = e.currentTarget.dataset.fileurl
    wx.showLoading({
      title: '正在加载...',
    })
    wx.downloadFile({
      url: fileUrl,
      success: function (res) {
        wx.hideLoading()
        var filePath = res.tempFilePath
        wx.openDocument({
          filePath: filePath,
          success: function (res) {
            console.log('打开文档成功')
          },
          fail: function (res) {
            console.log("打开文档失败")
          }
        })
      },
      fail: function(res) {
        wx.hideLoading()
        console.log("加载失败")
      }
    })
  },

  /**
   * 点击下载按钮，提示用户复制下载链接
   */
  downloadTap: function (e) {
    var fileUrl = e.currentTarget.dataset.fileurl
    // 复制内容到剪贴板
    wx.setClipboardData({
      data: fileUrl,
      success: function (res) {
        wx.getClipboardData({
          success: function (res) {
            console.log("剪贴板内容为：" + res.data)
          }
        })
        wx.showModal({
          title: '',
          content: '下载地址已复制，请使用QQ粘贴发送到电脑端下载',
          showCancel: false,
          success: function (res) {
            if (res.confirm) {
              console.log("点击了确定")
            }
          }
        })
      }
    })
  }
})