
var common = require('../../../source/js/common');
var bg = require('../../../source/image-base64/colorline_bg');
var commonObj = common.commonObj;
Page({
	data: {
		colorline_bg: bg.bg,
		orderDetailFlag: 'B', //A默认为门店订单详情,B为app订单详情
		picUrl: commonObj.PAGODA_PIC_DOMAIN
	},
	onLoad: function (options) {
		var that = this;
		if (options.orderTicket) {
			that.setData({ orderDetailFlag: 'A' })
			that.getStoreOrderDetail(options.orderTicket);
		} else {
			that.setData({ orderDetailFlag: 'B' })
			that.getAppOrderDetail(options.goodsOrderID, options.payStatus);
		}
	},
	getStoreOrderDetail: function (orderTicket) {
		var that = this;
		var orderTicket = orderTicket,
			user = wx.getStorageSync('user');
		var options = {
			encryptFlag: true,
			url: '/olineStoreManager/detailStoreOrder',
			data: {
				orderTicket: orderTicket,
				phoneNumber: user.phoneNumber,
				customerID: user.userID,
				userToken: user.userToken,
				_appInfo: { "os": "wxApp", "verCode": '2.5.0', "verName": '2.5.0' }
			}
		}
		wx.showLoading({ title: '加载中' });
		commonObj.requestData(options, function (res) {
			wx.hideLoading();
			if (res.data.errorCode == -1002) {
				commonObj.loginExpired();
			} else if (res.data.errorCode == 0) {
				var data = JSON.parse(commonObj.Decrypt(res.data.data, wx.getStorageSync('token')));
				console.log(data);
				that.setData({
					storeDetailObj: data
				})
			} else {
				commonObj.showModal('提示', res.data.errorMsg, false);
			}
		});
	},
	getAppOrderDetail: function (goodsOrderID, payStatus) {
		var that = this;
		var goodsOrderID = goodsOrderID,
			user = wx.getStorageSync('user');
		if (payStatus !== 'SUCCESS') {   //success为已支付订单详情
			var options = {
				header: {
					'X-DEFINED-appinfo': JSON.stringify({
						"deviceID": "35EAAF0C-D590-4F40-8F73-73735FDC02E5",
						"os": "iOS 10.3.1",
						"model": "Simulator",
						"channel": "miniprogram",
						"verName": "2.5.1.0"
					}),
					"userToken": user.userToken
				},
				url: `/api/v1/payorder/detail/${user.userID}/${goodsOrderID}`      // 这个url是查询app未支付成功订单详情
			}
		} else {  //其他为商品订单详情
			var options = {
				header: {
					'X-DEFINED-appinfo': JSON.stringify({
						"deviceID": "35EAAF0C-D590-4F40-8F73-73735FDC02E5",
						"os": "iOS 10.3.1",
						"model": "Simulator",
						"channel": "miniprogram",
						"verName": "2.5.1.0"
					}),
					"userToken": user.userToken
				},
				// url: '/api/v1/order/detail/' + user.userID + '/' + goodsOrderID,
				url: `/api/v1/order/detail/${user.userID}/${goodsOrderID}`      // 这个url是查询app已支付订单详情
			}
		}

		wx.showLoading({ title: '加载中' });
		commonObj.requestNewData(options, function (res) {
			console.log(res);
			wx.hideLoading();
			if (res.data.errorCode == 0) {
				// var data = JSON.parse(commonObj.Decrypt(res.data.data, wx.getStorageSync('token')));
				var data = res.data.data;
				console.log("getAppOrderDetail");
				console.log(data);
				that.setData({
					appDetailObj: data
				})
			} else {
				commonObj.showModal('提示', res.data.errorMsg, false);
			}
		})
	}

})