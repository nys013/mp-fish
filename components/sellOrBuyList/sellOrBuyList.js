// components/productList.js
const app = getApp()
const db = wx.cloud.database()
const _ = db.command

Component({
  // 取消样式隔离
  options: {
    styleIsolation: 'apply-shared'
  },
  /**
   * 组件的属性列表
   */
  properties: {
    type:String
  },

  /**
   * 组件的初始数据
   */
  data: {
    myId:'',
    productList:[],
    filterShow:false,
    areaType:'0',
    publishTime:'0',
    priceSection:[],
    maxPrice:"",
    minPrice:"",
    dbFilter:{deleted:false,status:'onSale'},
    screeningFilter:{},
    loveObj:{},
    searchValue:'',
    searchFilter:[],
    rankOptions:[
      {text:'最新发布',value:'time'},
      {text:'最多收藏',value:'love'},
      {text:'价格升序',value:'priceAsc'},
      {text:'价格降序',value:'priceDesc'},
    ],
    rankType:'time',
    areas:[],
    pageNum:0,
    pageCount:10,
    scrollViewHeight:'',
    firstOrder:['publishTime',"desc"],
    secondOrder:['loveUserLength','desc'],
    noMoreData:false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 页面跳转
    navigateToDetail(e){
      // 注意target和currentTarget区别，前者是触发事件的元素，后者是绑定事件的元素
      const url =  '/pages/productDetail/productDetail?id=' + e.currentTarget.dataset.productid
      wx.navigateTo({
        url,
      })
    },
    // 刷新
    handleReflesh(){
      wx.showLoading({
        title: '刷新中',
      })
      db.collection('products').where(this.data.dbFilter).orderBy('publishTime', 'desc')
      .limit(this.data.pageCount).get().then(res => {
        wx.hideLoading()
        wx.showToast({
          title: '刷新成功',
        })
        const productList = res.data

        this.setData({productList,areaType:'0',maxPrice:"",minPrice:"",
        searchValue:'',searchFilter:[],screeningFilter:{},rankType:'time',noMoreData:false,pageNum:0 })
      })
    },
    // 筛选关闭
    handleClose(){
      this.setData({filterShow:false})
    },
    // 筛选打开
    handleFilter(){
      this.setData({filterShow:true})
    },
    // 区域改变
    handleAreaTypeChange(e){
      this.setData({areaType:e.currentTarget.dataset.areatype})
    },
    // 发布时间改变
    handlePublishTimeChange(e){
      // 注意dataset后都是小写的，要么用斜杠连接，要么就都用小写，要么自己注意区别好（wxml大写，取得时候注意用小写）
      this.setData({publishTime:e.currentTarget.dataset.publishtime})
    },
    // 最低价改变
    handleMinPriceChange(e){
      this.setData({minPrice:e.detail.value})
    },
    // 最高价改变
    handleMaxPriceChange(e){
      this.setData({maxPrice:e.detail.value})
    },
    // 筛选取消
    handleCancel(){
      this.setData({filterShow:false})
    },
    // 筛选确定
    handleComfirm(){
      wx.showLoading({title: '筛选中'})
      let {areaType,maxPrice,minPrice,searchFilter,pageCount,firstOrder,secondOrder,publishTime} = this.data
      publishTime = publishTime==0 ? 0 : (Date.now() - (publishTime*3600*24*1000)) 
      console.log(new Date(publishTime));
      
      // 1.数据条件处理
      maxPrice = maxPrice*1 || 9999999
      minPrice = minPrice*1 || 0.00001
      if ((!(maxPrice*1) || !(minPrice*1))) {
        wx.showToast({title: '价格只能是数字',icon:'none'})
        return
      }else if(maxPrice<0 || minPrice<0){
        wx.showToast({title: '价格必须大于0',icon:'none'})
        return
      }
      const priceSection = [minPrice,maxPrice] 
      priceSection.sort(function(a, b){return a - b})
      console.log(priceSection);
  
      // 小程序中不能使用eval，但是云环境可以。与云环境区别在于，云函数时要
      if(areaType === '0') {
        // 查看文档，_.or传参即可以多个参数的形式传，也可以一个参数，参数为数组的形式传
        const areasFilter = this.data.areas.map(item => _.eq(item) )
        areaType = _.or(areasFilter)
      }
      const screeningFilter = {
        area:areaType,
        publishTime:_.gt(publishTime),
        price:_.and(_.gte(priceSection[0]) , _.lte(priceSection[1]))
      }
      let allFilter = []
      if (searchFilter.length) {
        allFilter = [
          {
            ...this.data.dbFilter,
            ...screeningFilter
          },
          _.or(...this.data.searchFilter)
        ]
      }else{
        allFilter = [{...this.data.dbFilter,...screeningFilter}]
      }
      this.setData({screeningFilter})
      // 2.数据库查找
        db.collection('products').orderBy(firstOrder[0],firstOrder[1]).orderBy(secondOrder[0],secondOrder[1])
        .where(
          _.and(allFilter)
        ).limit(pageCount).get().then(res => {
          wx.hideLoading()
          wx.showToast({title:'筛选成功'})
          const productList = res.data
          if (this.data.type === 'loveProduct') {
            const {myId} = this.data
            productList.sort((a,b) => -a.loveUserList[myId] + b.loveUserList[myId])
          }
          this.setData({productList,filterShow:false,noMoreData:false,pageNum:0})
        })
      
    },
    // 搜索
    handleSearch({detail}){
      const {value} = detail
      const searchFilter = [
        {productName:db.RegExp({  //使用数据库正则对象
          regexp:value,
          options:'i'
        })},
        {productDesc:db.RegExp({  //使用数据库正则对象
          regexp:value,
          options:'i'
        })},
      ]
      this.setData({searchValue:value , searchFilter , screeningFilter:[] ,areatype:'0' })
      
      db.collection('products').where(
        //因为有跨字段查询，所以需要用到_.and
        _.and([
          {...this.data.dbFilter},
          _.or(...searchFilter)
        ])
      ).orderBy('publishTime' , 'desc')
      .limit(this.data.pageCount).get().then(res => {
        const productList = res.data
        if (this.data.type === 'loveProduct') {
          const {myId} = this.data
          productList.sort((a,b) => -a.loveUserList[myId] + b.loveUserList[myId])
        }
        this.setData({productList,noMoreData:false,pageNum:0})
      } , err => console.log(err))
    },
    // 排序
    handleRankChange({detail}){
      this.setData({rankType:detail},()=>{
        let {dbFilter,screeningFilter,searchFilter,firstOrder,secondOrder,pageCount} = this.data
        let allFilter = []
        if (searchFilter.length) {
          allFilter = [  
            {...dbFilter,...screeningFilter},
            _.or(...searchFilter)
          ]
        }else{
          allFilter = [{...dbFilter,...screeningFilter}]
        }
        if (this.data.rankType === 'love') {
          firstOrder = ['loveUserLength','desc']
          secondOrder = ['publishTime','desc']
        }else if (this.data.rankType === 'priceAsc') {
          firstOrder = ['price','asc']
          secondOrder = ['publishTime','desc']
        }else if (this.data.rankType === 'priceDesc') {
          firstOrder = ['price','desc']
          secondOrder = ['publishTime','desc']
        }else{
          firstOrder = ['publishTime','desc']
          secondOrder = ['price','asc']
        }
        this.setData({firstOrder,secondOrder})
        db.collection('products').where(_.and(allFilter))
        .orderBy(firstOrder[0],firstOrder[1]).orderBy(secondOrder[0],secondOrder[1])
        .limit(pageCount).get().then(res => {
          const productList = res.data
          this.setData({productList,firstOrder,secondOrder,noMoreData:false,pageNum:0})
        })
      })
    },
    // 滑动到底部
    handleToBottom(){
      if (!this.data.noMoreData) {
        wx.showLoading({title: '加载中',mask:true})
        let {dbFilter,screeningFilter,searchFilter,firstOrder,secondOrder,pageNum,pageCount} = this.data
        pageNum++
        this.setData({pageNum},()=>{
          let allFilter = []
          if (searchFilter.length) {
            allFilter = [  
              {...dbFilter,...screeningFilter},
              _.or(...searchFilter)
            ]
          }else{
            allFilter = [{...dbFilter,...screeningFilter}]
          }
          db.collection('products').where(_.and(allFilter))
          .orderBy(firstOrder[0],firstOrder[1]).orderBy(secondOrder[0],secondOrder[1])
          .limit(pageCount).skip(pageNum*pageCount).get().then(res => {
            const newProductList = res.data
            if (!newProductList.length) {
              this.setData({noMoreData:true})
            }else{
              const productList = [...this.data.productList]
              productList.push(...newProductList)
              this.setData({productList})
            }
            wx.hideLoading()
          })
        })
      }
      
    },
    // 获取页面、不动组件高度，动态赋值scroll-view高度
    _setScrollViewHeight(){
      // windowHeight =屏幕高度（screenHeight） - 导航栏高度 - 状态栏高度(statusBarHeight)
      const {windowHeight} = wx.getSystemInfoSync()
      const query = this.createSelectorQuery()
      query.select('.headerWrap').boundingClientRect().exec(res => {
        this.setData({scrollViewHeight:windowHeight - res[0].height })
      })
    },
  },

  lifetimes:{
    attached(){
      // 获取页面、不动组件高度，动态赋值scroll-view高度
      this._setScrollViewHeight()
      
      // id要从userInfo拿，然后再setData
      let {_id,school} = app.userInfo
      
      if (_id) {
        this.setData({myId:_id})
      }
      if (school) {
        db.collection('schools').where({name:school}).field({areas:true})
        .limit(6).get().then(res => this.setData({areas:res.data[0].areas}))
      }else{
        school = app.initSchool.school
        const areas = app.initSchool.areas
        this.setData({areas})
      }
      if (this.data.type === 'sellProduct') {
        this.setData({dbFilter:{...this.data.dbFilter , school ,publishType:"sell"}} , () => {
          db.collection('products').where(this.data.dbFilter).orderBy('publishTime', 'desc')
          .limit(6).get().then(res => {
            this.setData({productList:res.data})
          })
        })
      } else {
        this.setData({dbFilter:{...this.data.dbFilter , school ,publishType:"buy"}} , () => {
          db.collection('products').where(this.data.dbFilter).orderBy('publishTime', 'desc')
          .limit(6).get().then(res => {
            this.setData({productList:res.data})
          })
        })
      }
    }
  },

  pageLifetimes:{
    show: function() {
      const {_id,school} = app.userInfo
      if (school) {
        this.setData({myId:_id,school})
      }
    },
  }
})
