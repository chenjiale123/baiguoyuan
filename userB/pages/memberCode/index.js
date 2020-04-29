// pages/user/memberCode/index.js
var commonObj = require('../../../source/js/common').commonObj;
var wxbarcode = require('../../../source/js/codeImg/index.js');

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		flag: false,  //设置退出时还在请求的条形码是否继续发起请求
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		let user = wx.getStorageSync('user');
		let token = wx.getStorageSync('token');
		let that = this;
		wx.showLoading({
			title: '加载中',
			mask: true
		})
		if (user && token) {
			let userId = user.userID;
			let userToken = user.userToken;
			that.getMemberCode(userId, userToken, token);
		} else {
			// 提示他要登陆
			commonObj.checkLoginStatus();
		}
	},
  onHide: function () {
    var that = this;
    that.setData({
      flag: true
    })
  },
  onUnload: function () {
    var that = this;
    that.setData({
      flag: true
    })
  },
	// 请求会员码
	getMemberCode: function (userId, userToken, token) {
		let params = { customerID: userId, userToken: userToken, "_appInfo": { "os": "wxApp" } };
		let that = this;
		let options = {
			encryptFlag: true,
			url: '/customerManager/getMemberCode',
			data: params
		}
		commonObj.requestData(options, function (res) {
			wx.hideLoading();
      console.log(res);
			if (res.data.errorCode == 0) {
				var member = JSON.parse(commonObj.Decrypt(res.data.data, token));       
				var code = /\S{5}/.test(member.code) && member.code.replace(/\s/g, '').replace(/(.{4})/g, "$1 ");
				that.setData({ code: code });
				console.log("code=" + member.code);
				wxbarcode.barcode('barcode', member.code, 600, 180);
			}
		}, '', function () {
			if (that.data.flag) return;
			that.data.memberTimer = setTimeout(function () {
				that.getMemberCode(userId, userToken, token)
			}, 30 * 1000);
		});
	}


})