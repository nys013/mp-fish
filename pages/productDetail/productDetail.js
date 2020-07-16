// miniprogram/pages/productDetail/productDetail.js
const db = wx.cloud.database()
const _ = db.command
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 测试用的，要删除
    // myId:'00dc18cf5f0553c900053aff0b8aa113',
    bigPicShow:false,
    productId:'',
    userId:'',
    area:'',
    avatarUrl:'',
    nickName:'',
    price:'',
    productDesc:'',
    productPicList:'',
    publishType:'',
    school:'',
    isMyLove:false,
    isMyProduct:false
  },
  handleBigPicShow(e){
    const current = e.currentTarget.dataset.index
    wx.previewImage({
      urls:this.data.productPicList,
      // current不是要写下标，而是点击的图片链接
      current:this.data.productPicList[current]
    })
  },
  handleBigPicHide(){
    this.setData({bigPicShow:false})
  },
  // 收藏
  handleSetLove(){
    const {isMyLove,productId,myId} = this.data
    if (!this.data.myId) {
      wx.showToast({title:'请先登录',mask:true,icon:'none',duration: 2000 , complete(){
        wx.switchTab({
          url: '/pages/personal/personal',
        })
      }})
      return
    }
    // 更新数据库,因为是修改别人的数据库，所以需要调用云函数
    if (isMyLove) {
      this.setData({isMyLove:!isMyLove},() => {
        wx.cloud.callFunction({
          name:'update',
          data:{
            collection:'products',
            doc:productId,
            data:`{ "loveUserList.${myId}":0  , loveUserLength:_.inc(-1)}`
          }
        })
      })
    } else {
        const filterName = `loveUserList.${myId}`
        this.setData({isMyLove:!isMyLove},() => {
          wx.cloud.callFunction({
            name:'update',
            data:{
              collection:'products',
              doc:productId,
              data:`{ "loveUserList.${myId}":${Date.now()}  , loveUserLength:_.inc(1)}`
            }
          })
        })
    }
  },
  // 去个人主页
  toPersonalDetail(){
    // navigateTo在小程序栈只有10层，多了就不会点击了，用户也应该知道用后退，而不是一味的前进，用navigateTo只能算是差强人意吧
    wx.navigateTo({
      url: '/pages/personalIndex/personalIndex?id=' + this.data.userId,
      fail:()=>{
        // 可在栈满，调用失败后，用redirectTo的方式，可跳转，不过会一直在第十层。当然也可用reLauchTo，不过那样就会把所有的都关了
        // 所以在取舍之下，还是选择redirectTo。除此之外，personalIndex页面也要捕获失败处理
        wx.redirectTo({
          url: '/pages/personalIndex/personalIndex?id=' + this.data.userId
        })
      }
    })
  },
  // 去编辑页
  toProductEdit(e){
    const productId = e.currentTarget.dataset.productid
    wx.navigateTo({
      url: '/pages/productEdit/productEdit?id=' + productId,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const {id} = options
    const myId = app.userInfo._id    
    db.collection('products').doc(id).get().then(res=>{
      const {area,loveUserList,price,productDesc,productName,productPicList,publishType,school,_id,userId,status} = res.data
      const isMyLove = !!loveUserList[myId]
      const isMyProduct = myId === userId
      db.collection('users').doc(userId).get().then(res => {
        const {avatarUrl,nickName} = res.data
        this.setData({avatarUrl,nickName,area,isMyLove,price,productName,productDesc,productPicList,publishType,school,
          productId:_id ,userId,myId,isMyProduct,status})
      })
    })
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: this.data.nickName + '发布了'+this.data.productName,
    }
  }
})