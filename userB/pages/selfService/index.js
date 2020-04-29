// pages/user/selfService/index.js
var bg_berry = require('../../../source/image-base64/bg_self_service');

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		bg: bg_berry.bg
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {

	},

	navigateSelfService:function(e) {
		let service = e.currentTarget.dataset.urlinfo;
    let id = e.currentTarget.dataset.id;
    var eventAnalytics = ['vip_recordsofconsumption', 'vip_selfhelpincard','vip_selfhelpincard']
		if (service == 'contactCustService'){
				wx.reportAnalytics('content_service_click')  // 联系客服
				wx.makePhoneCall({
					phoneNumber: "4001811212",
				})
		}else{
      wx.reportAnalytics(eventAnalytics[id]);
			wx.navigateTo({
				url: '/userB/pages/'+service+'/index',
			})
		}
	}
})