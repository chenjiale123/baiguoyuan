var common = require('../../../source/js/common');
var commonObj = common.commonObj;
//获取应用实例
var app = getApp();
Page({
  data: {
    oPhoneNumText: '',//格式化号码
    oPhoneNum: '', //当前账户
    nPhoneNum: '', //保存当前手机
    vCode: '', //验证码
    vcodeBtnDisabled: true,
    cardBtnDisabled: true,
    vcodeText: '获取验证码'
  },
  onLoad: function (options) {
    var that = this;
    var user = wx.getStorageSync('user');
    if (user.phoneNumber) {
      that.setData({
        oPhoneNum: user.phoneNumber,
        oPhoneNumText: user.phoneNumber.substr(0, 3) + ' ' + user.phoneNumber.substr(3, 4) + ' ' + user.phoneNumber.substr(7)
      })
    }
  },
  bindPhoneTap: function (e) {
    var that = this, value;
    value = e.detail.value;
    if ((/^1[0-9]\d{9}$/).test(value) && value.length == 11) {
      that.setData({
        nPhoneNum: e.detail.value,
        vcodeBtnDisabled: false
      });
      if (that.data.vCode) { that.setData({ cardBtnDisabled: false }) }
    } else {
      that.setData({
        vcodeBtnDisabled: true,
        cardBtnDisabled: true
      });
    }
  },
  sendCode: function () {
    var num = 60, that = this, timer;
    if (that.data.vcodeBtnDisabled) return;
    wx.reportAnalytics('change_card_vcode');
    that.setData({
      vcodeBtnDisabled: true,
      vcodeText: num + 's后再次获取'
    });
    timer = setInterval(function () {
      num--;
      that.setData({
        vcodeBtnDisabled: true,
        vcodeText: num + 's后再次获取'
      });
      if (num == 0) {
        clearInterval(timer);
        that.setData({
          vcodeBtnDisabled: false,
          vcodeText: '获取验证码'
        });
      }
    }, 1000);
    var options = {
      encryptFlag: false,
      url: '/message/getAuthCode',
      header: {
        'pagodaRequestKey': 'b0e3202f-0825-4a6d-9a60-b5a5e785d403'
      },
      data: {
        head: {
          'sender': 'W',
          'senderValue': '',
          'operator': that.data.nPhoneNum
        },
        applyPurpose: 20,
        phoneNum: that.data.nPhoneNum
      }
    }
    commonObj.requestData(options, function (res) {
      console.log(res);
      if (res.data.resultCode == 0) {
        wx.showToast({
          title: '发送验证码成功',
          duration: 2000
        })
      } else {
        commonObj.showModal('提示', '发送验证码失败', false);
        clearInterval(timer);
        that.setData({
          vcodeBtnDisabled: false,
          vcodeText: '获取验证码'
        });
      }
    });
  },
  bindCodeTap: function (e) {
    var that = this;
    var value = e.detail.value;
    that.setData({ vCode: value });
    value && that.data.nPhoneNum ? this.setData({ cardBtnDisabled: false }) : this.setData({ cardBtnDisabled: true })
  },
  bindCardTap: function (e) {
    var that = this;
    var cardBtnDisabled = e.target.dataset.cardBtnDisabled;
    if (cardBtnDisabled) return;
    wx.reportAnalytics('change_card_btn');
    if (that.data.oPhoneNum == that.data.nPhoneNum) {
      commonObj.showModal('提示', '新手机号码和当前账号相同,请重新输入', false);
      return;
    }
    var options = {
      encryptFlag: false,
      url: '/member/changeMember',
      header: {
        'pagodaRequestKey': 'b0e3202f-0825-4a6d-9a60-b5a5e785d403'
      },
      data: {
        head: {
          'sender': 'W',
          'senderValue': '',
          'operator': that.data.nPhoneNum
        },
        outMemberNum: that.data.oPhoneNum,
        inMemberNum: that.data.nPhoneNum,
        code: that.data.vCode
      }
    }
    wx.showLoading({ title: '加载中' });
    //setTimeout(function(){wx.hideLoading();},2000);
    commonObj.requestData(options, function (res) {
      wx.hideLoading();
      if (res.data.errorCode == -1002) {
        commonObj.loginExpired();
      } else if (res.data.resultCode == 0) {
        wx.reportAnalytics('change_card_success');
        wx.setStorage({
          key: 'phoneNumber',
          data: that.data.nPhoneNum
        });
        wx.showToast({
          title: '换卡成功',
          icon: 'success',
          duration: 2000
        })
        setTimeout(function () {
          var pages = getCurrentPages();
          wx.setStorageSync('urlInfo', 'pages/index');
          //pages.length > 0 && pages[0].isBindCard();
          app.getUserInfo(function () { commonObj.isBindCard() });
        }, 2000)
      } else if (res.data.resultCode == 2004) {
        commonObj.showModal('提示', '验证码输入错误', false);
      } else if (res.data.resultCode == 2038) {
        commonObj.showModal('转号失败！', '处理方法请参考页面说明', false);
      } else if (res.data.resultCode == 2007) {
        commonObj.showModal('提示', '当前账号状态异常，请联系客服 400-181-1212', false);
      } else {
        commonObj.showModal('提示', '换卡失败', false);
      }
    })
  }


})