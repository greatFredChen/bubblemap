//index.js
const app = getApp()

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    longitude: 113.0,
    latitude: 22.0,
    scale: 15,
    markers: [],
    circles: '',
    polygons: '',
    setting: {
      subkey: 'EEGBZ-6NYWW-6YNR5-OMCQX-H3MJH-ATFFG',
    },
    region: {
      sw: '',
      ne: '',
    },
    sdk_version: '',
    modified: false,
    addtellHidden: true,
    input: undefined,
  },

  // 点击marker触发事件 TODO: 如何设置label？
  markertap: function(e) {
    var that = this
    if(that.data.modified == true) {
      // 显示输入框
      that.setData({
        addtellHidden: false
      })
      let markid = e.detail.markerId
      let markers = that.data.markers
      let marker_len = markers.length
      for(let i = 0; i < marker_len; i++) {
        if(markers[i].id == markid) {
          // TODO：如何设置label？？
          break
        }
      }
    }
  },

  // 取消输入
  modalCancel: function() {
    this.setData({
      addtellHidden: true,
      modified: false
    })
  },

  // 确认输入
  modalConfirm: function() {
    var that = this
    that.setData({
      addtellHidden: true,
      modified: false
    })
  },

  // bindinput 每次修改输入框都会激活
  saveUsertell: function(e) {
    this.setData({
      input: e.detail.value,
      addtellHidden: false
    })
  },

  // 修改模式按钮
  pressbutton: function() {
    this.setData({
      modified: true
    })
  },

  // 放置marker label
  place_marker: function(e) {
    let that = this
    let markers = that.data.markers
    let mlen = markers.length
    console.log(e)
    if(that.compareVersion(that.data.sdk_version, "2.9.0")) {
        let latitude = e.detail.latitude
        let longitude = e.detail.longitude
        let marker = {
          latitude: latitude,
          longitude: longitude,
          id: mlen,
          callout: {
            content: "What do you think?",
            color: "#ffffff",
            fontSize: 16,
            bgColor: "#000000",
          }
        }
        markers.push(marker)
        that.setData({
          markers: markers
        })
        console.log("success! A marker is set.")
    }
    else {
      wx.chooseLocation({
      success: function(res) {
        let marker = {
          latitude: res.latitude,
          longitude: res.longitude,
          id: mlen,
          callout: {
            content: "What do you think?",
            color: "#ffffff",
            fontSize: 16,
            bgColor: "#000000",
          }
        }
        markers.push(marker)
        that.setData({
          markers: markers
        })
        console.log("success! A marker is set.")
      },
      fail: function(res) {
        console.log("fail to set a marker!")
      }
    })
    }
  },

  // 点击地图触发
  clickmap: function(e) {
    let that = this
    // 放置marker label
    that.place_marker(e)
  },

  // 比较版本号 version1 >= version2时返回true
  compareVersion: function(version1, version2) {
    let v1 = version1.split('.') // array
    let v2 = version2.split('.') // array
    let len = Math.max(v1.length, v2.length)
    while(v1.length < len) {
      v1.push('0')
    }
    while(v2.length < len) {
      v2.push('0')
    }
    // 比较每一位
    for(let i = 0; i < len; i++) {
      let num1 = parseInt(v1[i])
      let num2 = parseInt(v2[i])
      if(num1 < num2) {
        return false // version1 < version2
      }
      else if(num1 > num2){
        return true // version1 > version2
      }
    }
    return true // version1 == version2
  },

  // 移动地图触发
  regionchange: function(e) {
    let that = this
    // console.log(e)
    // 获取地图中心坐标
    let mapInstance = wx.createMapContext('testmap')
    // console.log(mapInstance)
    mapInstance.getCenterLocation({
      success: function(res) {
        let latitude = res.latitude
        let longitude = res.longitude
        if (that.data.latitude != latitude || that.data.longitude != longitude) {
          console.log(latitude, longitude)
          that.setData({
            latitude: latitude,
            longitude: longitude
          })
      }
    }
    })
  },

  // 加载
  onLoad: function() {
    let that = this
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })

    // 获取用户坐标
    wx.getLocation({
      type:'gcj02',
      success(res) {
        that.setData({
          longitude: res.longitude,
          latitude: res.latitude
        })
      }
    })

    // 获取视野范围
    let mapInstance = wx.createMapContext("testmap")
    mapInstance.getRegion({
      success: function(res) {
        // console.log("sw coordinate:", res.southwest)
        // console.log("ne coordinate:", res.northeast)
        that.setData({
          region: {
            sw: res.southwest,
            ne: res.northeast,
          }
        })
      }
    })

    // 获取微信用户当前版本号
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          sdk_version: res.SDKVersion
        })
      }
    })
  },

  onGetUserInfo: function(e) {
    if (!this.data.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },

  onGetOpenid: function() {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        wx.navigateTo({
          url: '../userConsole/userConsole',
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  },

  // 上传图片
  doUpload: function () {
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]
        
        // 上传图片
        const cloudPath = 'my-image' + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)

            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
            
            wx.navigateTo({
              url: '../storageConsole/storageConsole'
            })
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })

      },
      fail: e => {
        console.error(e)
      }
    })
  },

})
