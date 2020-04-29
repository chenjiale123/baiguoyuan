// 果粒值明细 index.js
var bg_berry = require('../../../source/image-base64/bg_berry');
var commonObj = require('../../../source/js/common').commonObj;
var page = 1;
var obtainType = { 'C': '消费获赠', 'A': '活动获赠', 'H': '手工调整', 'R': '退款扣减', 'L': '注销重置', 'I': '历史记录' };
var app = getApp()
Page({
	data: {
		bg: bg_berry.bg,
		allberry: 0,
		hasKeep: true,
		hasUp: true,
		isReady: false,
		hasBerry: false,
		keepLevel: '',
		keepNum: 0,
		upLev: '',
		upNum: 0,
		berryValueI: []
	},
	onLoad: function (options) {
		let that = this;
		let user = wx.getStorageSync('user');
		let token = wx.getStorageSync('token');
    if (!commonObj.checkLoginStatus('berryValue')) {
      commonObj.showModal('提示', '您还未登陆哦，请先登陆~', true, '立即登陆', '', function (res) {
        // wx.showLoading({
        //   title: '加载中',
        //   mask: 'true'
        // })
        if (res.confirm) {
          wx.setStorageSync('urlInfo', 'userA/pages/berryValue'); //记录要跳转的页面
          app.globalData.activeFlag = false;
          app.getUserInfo(function () { commonObj.isBindCard() });
        } else if (res.cancel) {
          wx.switchTab({
            url: '/pages/index/index',
          })
        }
      })
    } else {
      wx.showLoading({
        title: '加载中',
        mask: true
      })
			var userId = user.userID;
			var phoneNum = user.phoneNumber;
			page = 1;
			that.getBerryValue(page);
			that.getUserInfo(userId, phoneNum);
		}
  },
  onReachBottom: function () {
    let that = this;
    if (that.data.hasBerry) {
      ++page;
      // console.log(page);
      that.getBerryValue(page);
    }
  },
  //******************功能函数*******************/
	// 获取果粒值明细
	getBerryValue: function (page) {
		let that = this;
		let phoneNumber = wx.getStorageSync('user').phoneNumber;
		let params = {
			phoneNum: phoneNumber,
			pageNum: page,
			pageSize: 10
		}
		let options = {
			data: params,
			url: '/record/queryGrowthDetails'
		}
		commonObj.requestData(options, function (res) {
			console.log(res);
			if (res.data.resultCode == -1002) {
				commonObj.loginExpired();
			} else if (res.data.resultCode == 0) {
				if (res.data.data) {
					var berryValue = res.data.data;
					var hash = {};
					berryValue = berryValue.reduce(function (item, next) { //去重
						hash[next.createTime] ? '' : hash[next.createTime] = true && item.push(next);
						return item;
					}, []);
					var berryV = that.data.berryValueI;
					for (let item in berryValue) {
						if (berryValue[item].growthValue > 0) {
							berryValue[item].symbol = true;
							berryValue[item].growthValue = '+' + berryValue[item].growthValue
						} else {
							berryValue[item].symbol = false;
						}
						berryValue[item].obtainType = obtainType[berryValue[item].obtainType];
            berryValue[item].createTime = commonObj.formatTime(berryValue[item].createTime);
						berryV.push(berryValue[item]);
					}
					that.setData({ berryValueI: berryV, hasBerry: true, isReady: true });
				} else { that.setData({ isReady: true }); }
			}
		}, '', function () {
			wx.hideLoading();
		})
	},
	// 获取会员等级信息，成长值
	getUserInfo: function (userId, phoneNum) {
		var that = this;
		let options = {
			url: '/member/queryMemberLevelSchedule',
			data: {
				"head": {
					"sender": "W",
					"senderValue": "",
					"operator": phoneNum
				},
				"memberId": userId,
				"memberNum": phoneNum
			}
		}
		commonObj.requestData(options, function (res) {
			if (res.data.resultCode == -1002) {
				commonObj.loginExpired();
			} else if (res.data.resultCode == 0) {
				let memberInfo = res.data.levelScheduleEntities;
        that.setData({
          allberry: parseInt(memberInfo.currentGetIntegral),
        })
			}
		}, '', function () {
			that.setData({ getUser: true })
		})
	},
//******************End*******************/

  /*********跳转链接***********/
  navigateInfo: function () {
    wx.navigateTo({
      url: '/h5/pages/berryRuleInfo/index'
    })
  }
})