// 会员修改信息页 index.js
var commonObj = require('../../../source/js/common').commonObj;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: '',
    sex: 'F',
    show: true,
    date: '1985-01-01',
    closeShowFlag: false,
    isNameEdit: false,
    isSexEdit: false,
    isDateEdit: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    var that = this;
    var user = wx.getStorageSync('user');
    that.getMemberInfo(user.userID, user.phoneNumber);
    let userName = wx.getStorageSync('userNameAndImg').nickName;
    if (that.data.name != '') {
      console.log('111')
      that.setData({
        defaultName: userName,
      })
    }

  },
  onShow: function () {
    var defaultN = this.data.defaultName;
    if (defaultN != '') {
      this.setData({ disable: false })
    }
  },

  bindNameTap: function (e) {
    var name = e.detail.value;
    var isEdit = (name != '' ? true : false)
    this.setData({
      closeShowFlag: false,
      name: name,
      isNameEdit: isEdit
    });
  },
  bindBlurHandler: function () { //失去焦点,叉叉隐藏
    this.setData({
      closeShowFlag: false,
    });
  },
  bindFocusHandler: function () { //聚焦,叉叉显示
    this.setData({
      closeShowFlag: true
    })
  },
  bindCloseTap: function () { //叉叉按钮事件处理
    this.setData({
      name: '',
      getfocus: true
    });
  },
  choseSex: function (e) {
    var sex = e.currentTarget.dataset.sex;
    var isShow = (sex === 'F' ? true : false)
    this.setData({ show: isShow, sex: sex, isSexEdit: true })
  },
  bindDateChange: function (e) {
    this.setData({
      date: e.detail.value,
      isDateEdit: true
    })
  },

  // 获取会员信息
  getMemberInfo: function (userId, phone) {
    let params = {
      head: {
        "sender": "P",
        "senderValue": "",
        "operator": ""
      },
      memberId: userId,
      memberNum: phone
    };
    var that = this;
    let options = {
      url: '/member/queryMember',
      data: params,
      header: {
        'pagodaRequestKey': 'b0e3202f-0825-4a6d-9a60-b5a5e785d403'
      },
    }
    commonObj.requestData(options, function (res) {
      console.log(res)
      let data = res.data.memberInfo;
      data.birthday = data.birthday.substring(0, 4) + '-' + data.birthday.substring(4, 6) + '-' + data.birthday.substring(6, 8);

      that.setData({
        defaultName: data.name || '',
        date: (data.birthday == '----' || data.birthday == '') ? '1985-01-01' : data.birthday,
        show: data.sex == 'M' ? false : true,
        levelId: data.levelId
      })
    }, '', '')
  },

  // 修改会员信息， 姓名，生日，性别
  modifyUserInfo: function () {
    wx.showLoading({
      title: '加载中',
      mask: 'true'
    })
    var that = this;
    let membername = that.data.name || that.data.defaultName;
    let membersex = that.data.sex;
    let date = that.data.date.slice(0, 4) + that.data.date.slice(5, 7) + that.data.date.slice(8, 10);
    let level = that.data.levelId;
    console.log(membername + ' ' + membersex + ' ' + date)
    var user = wx.getStorageSync('user');
    var params = {
      "head": {
        "sender": "W",
        "senderValue": "",
        "operator": user.phoneNumber
      },
      memberInfo: {
        memberId: user.userID,
        memberNum: user.phoneNumber,
        phoneNum: user.phoneNumber,
        name: membername,
        sex: membersex,
        birthday: date,
        levelId: level
      }
    }
    var options = {
      url: '/member/modifyMemberInfo',
      header: {
        'pagodaRequestKey': 'b0e3202f-0825-4a6d-9a60-b5a5e785d403'
      },
      data: params
    }
    console.log(options);
    commonObj.requestData(options, function (res) {
      console.log(res);
      if (res.data.errorCode == -1002) {
        commonObj.loginExpired();
      } else if (res.data.errorCode == 0) {
        wx.showLoading({
          title: '修改成功',
        })
        setTimeout(function () {
          wx.navigateBack({
            delta: 1
          })
        }, 500)
      } else {
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: '修改失败，请联系客服',
          showCancel: false,
          success: function () {
            wx.navigateBack({
              delta: 1
            })
          }
        })
      }
    })
  }
})