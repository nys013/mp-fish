// miniprogram/pages/personalIndex/personalIndex.js
const db = wx.cloud.database()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo:{},
    sellList:[],
    buyList:[]
  },
  navigateToDetail(e){
    // 注意target和currentTarget区别，前者是触发事件的元素，后者是绑定事件的元素
    const url =  '/pages/productDetail/productDetail?id=' + e.currentTarget.dataset.productid
    wx.navigateTo({
      url,
      fail:()=>{
        wx.redirectTo({url})
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    
    const {id} = options
    db.collection('users').doc(id).get().then(res => {
      this.setData({userInfo:res.data})
    })
    db.collection('products').where({userId:id,deleted:false,status:'onSale'}).orderBy('publishTime', 'desc')
    .get().then(res => {
      const sellList = res.data.filter(item => item.publishType=='sell')
      const buyList = res.data.filter(item => item.publishType=='buy')
      this.setData({sellList,buyList})
    })
  },

   /* 用户点击右上角分享*/
  onShareAppMessage: function () {
    return {
      title:`这是${this.data.userInfo.nickName}的个人主页`,
    }
  }
})