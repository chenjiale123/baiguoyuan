// pages/confirmOrder/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    deliveryTime:[],
    multiArray: [['今天(04月23日)', '明天(04月24日)', '后天(04月25日)'], []],
    multiIndex: [0, 0]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let data = {
      deliveryTime : this.data.deliveryTime,
      multiArray : this.data.multiArray
    }
   
    data.deliveryTime = new Dater('9:00', '22:00')
    data.multiArray[1] = data.deliveryTime.todayHandler()
    this.setData(data);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
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


  bindMultiPickerChange(e) {
    // console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      multiIndex: e.detail.value 
    })
  },

  bindMultiPickerColumnChange(e){
    console.log('修改的列为', e.detail.column, '，值为', e.detail.value);
    let data = {
      deliveryTime: this.data.deliveryTime,
      multiArray: this.data.multiArray,
      multiIndex: this.data.multiIndex
    };
    data.multiIndex[e.detail.column] = e.detail.value;
    if (e.detail.column === 0) {
      if(e.detail.value === 0) {
        data.multiArray[1] = data.deliveryTime.todayHandler()
      } else {
        data.multiArray[1] = data.deliveryTime.tommorrowHandler()
      }
      data.multiIndex[1] = 0;
    }

    this.setData(data)
  }
})

class Dater {
  constructor(startTime, endTime, step) {
    this.startTime = this.hoursToMinte(startTime)
    this.endTime = this.hoursToMinte(endTime)
    this.step = step || 60
  }

  hoursToMinte(time) {
    let index = time.indexOf(':')
    let hours = Number(time.slice(0, index))
    let minute = Number(time.slice(index + 1))
    return hours*60 + minute
  }

  minuteToHours(minutes) {
    let hours = Math.floor(minutes / 60)
    let minute = minutes % 60 < 10 ? '0' + minutes % 60 : minutes % 60
    return hours + ':' + minute

  }

  dateHandler(startTime, endTime) {
    const step = this.step
    let prev ;    
    let next = startTime;
    let arr = []
    for (let i = 0; i < (endTime - startTime)/step ; i++) {
      prev = next
      next += step
      if (next > endTime) break;
      arr.push(`${this.minuteToHours(prev)}-${this.minuteToHours(next)}`)
    }
    return arr
  }

  todayHandler() {
    let nowDate = new Date()
    let hour = (nowDate.getHours() + 2) * 60
    let todatArray = this.dateHandler(hour, this.endTime)
    todatArray.unshift('60分钟内送达')
    return todatArray
  }

  tommorrowHandler() {
    return this.dateHandler(this.startTime, this.endTime)
  }
} 