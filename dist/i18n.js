// 多语言。键是页面上的简体原文，值是译文。
//
// applyLang() 遍历文本节点和 placeholder / title / aria-label / alt 做替换，
// 所以新增文案时不用给元素加 data 属性，只要把原文加进下面的表。
// 查不到译文就保留简体原文，绝不会出现空白。
//
// 注意：替换是按整段文本匹配的。改了 index.html 里的文案，
// 这里对应的键也要跟着改，否则那句话在其他语言下会退回简体。
const I18N = { 'zh-TW': {}, en: {}, ms: {} };

// 简体 -> 繁體 的逐字映射，只收录本站实际用到的字。
// 用逐字映射而不是整句翻译，是因为繁简差异基本在字形，整句维护成本高又容易漏。
const S2T = {
  '书':'書','买':'買','产':'產','们':'們','从':'從','会':'會','传':'傳','伤':'傷','优':'優','体':'體',
  '余':'餘','侧':'側','储':'儲','关':'關','兴':'興','内':'內','写':'寫','准':'準','凉':'涼','击':'擊',
  '别':'別','删':'刪','则':'則','创':'創','动':'動','务':'務','区':'區','单':'單','卖':'賣','历':'歷',
  '压':'壓','厂':'廠','发':'發','变':'變','只':'只','台':'臺','号':'號','同':'同','后':'後','向':'向',
  '启':'啟','听':'聽','员':'員','响':'響','团':'團','园':'園','图':'圖','圆':'圓','场':'場','块':'塊',
  '坏':'壞','备':'備','复':'複','够':'夠','头':'頭','夹':'夾','奖':'獎','妆':'妝','学':'學','宝':'寶',
  '实':'實','宽':'寬','对':'對','导':'導','将':'將','尔':'爾','尘':'塵','层':'層','属':'屬','岁':'歲',
  '师':'師','带':'帶','帮':'幫','广':'廣','应':'應','库':'庫','废':'廢','开':'開','异':'異','弃':'棄',
  '张':'張','强':'強','归':'歸','当':'當','录':'錄','态':'態','总':'總','怀':'懷','态':'態','恶':'惡',
  '悬':'懸','惊':'驚','愿':'願','户':'戶','执':'執','扫':'掃','扩':'擴','扬':'揚','择':'擇','担':'擔',
  '拟':'擬','拢':'攏','换':'換','据':'據','损':'損','换':'換','摄':'攝','击':'擊','数':'數','断':'斷',
  '无':'無','旧':'舊','时':'時','显':'顯','晕':'暈','术':'術','权':'權','条':'條','来':'來','杨':'楊',
  '极':'極','构':'構','标':'標','样':'樣','检':'檢','楼':'樓','欢':'歡','况':'況','浅':'淺','测':'測',
  '济':'濟','涂':'塗','润':'潤','渐':'漸','温':'溫','满':'滿','滤':'濾','点':'點','烦':'煩','热':'熱',
  '爱':'愛','版':'版','牵':'牽','状':'狀','独':'獨','现':'現','环':'環','画':'畫','疗':'療','监':'監',
  '盘':'盤','确':'確','种':'種','积':'積','称':'稱','稳':'穩','窗':'窗','竖':'豎','笔':'筆','简':'簡',
  '类':'類','粮':'糧','纪':'紀','纯':'純','纸':'紙','级':'級','线':'線','组':'組','细':'細','终':'終',
  '结':'結','给':'給','络':'絡','统':'統','继':'繼','维':'維','绿':'綠','缓':'緩','编':'編','缩':'縮',
  '网':'網','罗':'羅','职':'職','联':'聯','肤':'膚','胜':'勝','脑':'腦','舍':'捨','艺':'藝','苹':'蘋',
  '范':'範','荐':'薦','获':'獲','虑':'慮','补':'補','装':'裝','览':'覽','观':'觀','规':'規','视':'視',
  '览':'覽','订':'訂','认':'認','议':'議','记':'記','讲':'講','许':'許','论':'論','设':'設','访':'訪',
  '证':'證','评':'評','识':'識','诉':'訴','试':'試','话':'話','该':'該','详':'詳','语':'語','误':'誤',
  '说':'說','请':'請','诸':'諸','读':'讀','调':'調','课':'課','谁':'誰','谈':'談','谱':'譜','负':'負',
  '贝':'貝','质':'質','贴':'貼','费':'費','资':'資','赖':'賴','转':'轉','较':'較','边':'邊','达':'達',
  '过':'過','运':'運','还':'還','这':'這','进':'進','远':'遠','连':'連','选':'選','适':'適','递':'遞',
  '邮':'郵','采':'採','释':'釋','里':'裡','针':'針','钟':'鐘','铺':'鋪','错':'錯','键':'鍵','镜':'鏡',
  '长':'長','门':'門','闭':'閉','问':'問','间':'間','阅':'閱','队':'隊','阶':'階','际':'際','随':'隨',
  '难':'難','项':'項','顺':'順','预':'預','颗':'顆','题':'題','颜':'顏','风':'風','饰':'飾','验':'驗',
  '马':'馬','驱':'驅','验':'驗','体':'體','点':'點','为':'為','义':'義','乐':'樂','习':'習','乡':'鄉',
  '书':'書','产':'產','亲':'親','仅':'僅','价':'價','众':'眾','优':'優','伙':'夥','传':'傳','伦':'倫',
  '伪':'偽','佛':'佛','余':'餘','作':'作','您':'您','偿':'償','储':'儲','儿':'兒','党':'黨','兰':'蘭',
  '关':'關','兹':'茲','养':'養','兽':'獸','冲':'沖','决':'決','况':'況','减':'減','凑':'湊','凤':'鳳',
  '凭':'憑','凯':'凱','别':'別','刘':'劉','剂':'劑','剑':'劍','剧':'劇','劝':'勸','办':'辦','劳':'勞',
  '势':'勢','勋':'勛','动':'動','务':'務','胜':'勝','势':'勢','匀':'勻','医':'醫','华':'華','协':'協',
  '单':'單','卫':'衛','厅':'廳','压':'壓','厌':'厭','县':'縣','参':'參','双':'雙','变':'變','叙':'敘',
  '吗':'嗎','启':'啟','吧':'吧','呆':'呆','员':'員','呜':'嗚','咏':'詠','响':'響','哑':'啞','哔':'嗶',
  '唤':'喚','喷':'噴','嘱':'囑','团':'團','园':'園','困':'困','围':'圍','国':'國','图':'圖','圣':'聖',
  '坚':'堅','坛':'壇','坏':'壞','执':'執','报':'報','拥':'擁','担':'擔','拣':'揀','拨':'撥','择':'擇',
  '挂':'掛','挥':'揮','捡':'撿','损':'損','换':'換','据':'據','掷':'擲','扬':'揚','抢':'搶','护':'護',
  '拢':'攏','拼':'拼','挤':'擠','搂':'摟','摆':'擺','携':'攜','摇':'搖','击':'擊','敌':'敵','数':'數',
  '斋':'齋','斑':'斑','断':'斷','旷':'曠','昼':'晝','显':'顯','晓':'曉','暂':'暫','术':'術','机':'機',
  '杀':'殺','杂':'雜','权':'權','条':'條','来':'來','极':'極','构':'構','枢':'樞','枪':'槍','枫':'楓',
  '柜':'櫃','标':'標','栋':'棟','栏':'欄','树':'樹','样':'樣','档':'檔','桥':'橋','桨':'槳','梦':'夢',
  '检':'檢','棂':'欞','榄':'欖','榅':'榲','横':'橫','欢':'歡','欧':'歐','歼':'殲','残':'殘','殴':'毆',
  '毁':'毀','气':'氣','汇':'匯','汉':'漢','汤':'湯','沟':'溝','没':'沒','沥':'瀝','泪':'淚','泼':'潑',
  '泽':'澤','洁':'潔','测':'測','济':'濟','浏':'瀏','浑':'渾','浓':'濃','涂':'塗','润':'潤','涨':'漲',
  '渊':'淵','渐':'漸','渔':'漁','渗':'滲','温':'溫','测':'測','湾':'灣','溃':'潰','滚':'滾','满':'滿',
  '滤':'濾','滨':'濱','滩':'灘','漏':'漏','潜':'潛','灭':'滅','灯':'燈','灵':'靈','灾':'災','炉':'爐',
  '炼':'煉','烁':'爍','烂':'爛','烛':'燭','烟':'煙','热':'熱','焕':'煥','爷':'爺','爸':'爸','牦':'犛',
  '牵':'牽','特':'特','牺':'犧','犹':'猶','狈':'狽','狮':'獅','猎':'獵','猪':'豬','献':'獻','獭':'獺',
  '玛':'瑪','环':'環','现':'現','玻':'玻','珑':'瓏','琼':'瓊','瓮':'甕','电':'電','画':'畫','畅':'暢',
  '疮':'瘡','痒':'癢','瘫':'癱','皱':'皺','盏':'盞','监':'監','盖':'蓋','盘':'盤','眦':'眥','眼':'眼',
  '睁':'睜','着':'著','瞩':'矚','矫':'矯','矿':'礦','码':'碼','砖':'磚','础':'礎','硕':'碩','确':'確',
  '碍':'礙','磅':'磅','礼':'禮','祸':'禍','禅':'禪','离':'離','种':'種','积':'積','称':'稱','稣':'穌',
  '稳':'穩','穷':'窮','窃':'竊','窍':'竅','窑':'窯','竞':'競','笋':'筍','笔':'筆','笼':'籠','筑':'築',
  '筛':'篩','签':'簽','简':'簡','箩':'籮','篮':'籃','籁':'籟','类':'類','粤':'粵','糊':'糊','系':'系',
  '紧':'緊','累':'累','纤':'纖','纪':'紀','纫':'紉','纬':'緯','纱':'紗','纲':'綱','纳':'納','纵':'縱',
  '纷':'紛','纸':'紙','纹':'紋','纺':'紡','纽':'紐','线':'線','练':'練','组':'組','绅':'紳','细':'細',
  '织':'織','终':'終','绊':'絆','绍':'紹','经':'經','绑':'綁','绒':'絨','结':'結','绕':'繞','绘':'繪',
  '给':'給','绚':'絢','络':'絡','绝':'絕','绞':'絞','统':'統','绣':'繡','继':'繼','绩':'績','绪':'緒',
  '续':'續','维':'維','绵':'綿','综':'綜','绿':'綠','缀':'綴','缆':'纜','缇':'緹','缉':'緝','缓':'緩',
  '编':'編','缘':'緣','缚':'縛','缝':'縫','缠':'纏','缩':'縮','缴':'繳','网':'網','罚':'罰','罢':'罷',
  '罗':'羅','罚':'罰','羡':'羨','翘':'翹','耻':'恥','聂':'聶','聋':'聾','职':'職','联':'聯','聪':'聰',
  '肃':'肅','肠':'腸','肤':'膚','肾':'腎','肿':'腫','胀':'脹','胁':'脅','胶':'膠','脉':'脈','脍':'膾',
  '脏':'臟','脐':'臍','脑':'腦','脓':'膿','脚':'腳','脱':'脫','腊':'臘','腻':'膩','舆':'輿','舱':'艙',
  '艳':'艷','艺':'藝','节':'節','芦':'蘆','苍':'蒼','苏':'蘇','苹':'蘋','范':'範','茎':'莖','荐':'薦',
  '荞':'蕎','荡':'蕩','荣':'榮','药':'藥','莱':'萊','莲':'蓮','获':'獲','萝':'蘿','营':'營','萧':'蕭',
  '蓝':'藍','蓟':'薊','蔷':'薔','薯':'薯','虏':'虜','虑':'慮','虚':'虛','虫':'蟲','蚀':'蝕','蚁':'蟻',
  '蚕':'蠶','蜡':'蠟','蝇':'蠅','蝎':'蠍','蝼':'螻','融':'融','蟆':'蟆','补':'補','衬':'襯','袄':'襖',
  '装':'裝','裤':'褲','褛':'褸','见':'見','观':'觀','规':'規','觅':'覓','视':'視','览':'覽','觉':'覺',
  '觊':'覬','触':'觸','订':'訂','计':'計','讨':'討','让':'讓','训':'訓','议':'議','讯':'訊','记':'記',
  '讲':'講','讳':'諱','许':'許','论':'論','讼':'訟','设':'設','访':'訪','诀':'訣','证':'證','评':'評',
  '识':'識','诈':'詐','诉':'訴','诊':'診','词':'詞','译':'譯','试':'試','诗':'詩','诚':'誠','话':'話',
  '诞':'誕','询':'詢','该':'該','详':'詳','语':'語','误':'誤','说':'說','请':'請','诸':'諸','读':'讀',
  '课':'課','谁':'誰','调':'調','谈':'談','谊':'誼','谋':'謀','谎':'謊','谐':'諧','谓':'謂','谚':'諺',
  '谜':'謎','谢':'謝','谣':'謠','谨':'謹','谱':'譜','贈':'贈','贝':'貝','贞':'貞','负':'負','贡':'貢',
  '财':'財','责':'責','贤':'賢','败':'敗','货':'貨','质':'質','贩':'販','贪':'貪','贫':'貧','购':'購',
  '贮':'貯','贯':'貫','贱':'賤','贴':'貼','贵':'貴','贷':'貸','贸':'貿','费':'費','贺':'賀','贼':'賊',
  '资':'資','赋':'賦','赌':'賭','赏':'賞','赐':'賜','赔':'賠','赖':'賴','赚':'賺','赛':'賽','赠':'贈',
  '赢':'贏','赵':'趙','趋':'趨','趟':'趟','跃':'躍','践':'踐','跻':'躋','踊':'踴','蹒':'蹣','躯':'軀',
  '车':'車','轧':'軋','轨':'軌','转':'轉','轮':'輪','软':'軟','轰':'轟','轻':'輕','载':'載','较':'較',
  '辅':'輔','辆':'輛','辈':'輩','辉':'輝','辑':'輯','输':'輸','辞':'辭','辟':'闢','边':'邊','辽':'遼',
  '达':'達','迁':'遷','过':'過','运':'運','还':'還','这':'這','进':'進','远':'遠','违':'違','连':'連',
  '迟':'遲','适':'適','选':'選','逊':'遜','递':'遞','逻':'邏','遗':'遺','邓':'鄧','邮':'郵','郑':'鄭',
  '酝':'醞','酱':'醬','酿':'釀','释':'釋','里':'裡','针':'針','钉':'釘','钓':'釣','钟':'鐘','钢':'鋼',
  '钥':'鑰','钱':'錢','钻':'鑽','铁':'鐵','铃':'鈴','铅':'鉛','铜':'銅','铝':'鋁','铭':'銘','银':'銀',
  '铺':'鋪','链':'鏈','销':'銷','锁':'鎖','锅':'鍋','锈':'鏽','锋':'鋒','错':'錯','锡':'錫','锦':'錦',
  '键':'鍵','锯':'鋸','镇':'鎮','镜':'鏡','长':'長','门':'門','闪':'閃','闭':'閉','问':'問','闯':'闖',
  '闲':'閑','间':'間','闷':'悶','闸':'閘','闹':'鬧','阅':'閱','阔':'闊','队':'隊','阳':'陽','阴':'陰',
  '阵':'陣','阶':'階','际':'際','陆':'陸','陈':'陳','险':'險','随':'隨','隐':'隱','难':'難','雏':'雛',
  '雾':'霧','韦':'韋','韩':'韓','页':'頁','顶':'頂','顷':'頃','项':'項','顺':'順','须':'須','顽':'頑',
  '顾':'顧','顿':'頓','预':'預','领':'領','颇':'頗','频':'頻','颗':'顆','题':'題','颜':'顏','额':'額',
  '风':'風','飘':'飄','飞':'飛','饥':'飢','饭':'飯','饮':'飲','饰':'飾','饱':'飽','饼':'餅','馆':'館',
  '驳':'駁','驻':'駐','驾':'駕','验':'驗','骂':'罵','骄':'驕','骆':'駱','骗':'騙','骤':'驟','髅':'髏',
  '鱼':'魚','鲁':'魯','鲜':'鮮','鸟':'鳥','鸡':'雞','鸣':'鳴','鸭':'鴨','鹅':'鵝','鹰':'鷹','黄':'黃',
  '齐':'齊','齿':'齒','龄':'齡','龙':'龍','龟':'龜','乌':'烏','争':'爭','尽':'盡','亏':'虧','产':'產'
};

I18N.en = {
  '本我':'BENWO','拼豆图纸生成器':'Bead Pattern Generator','主导航':'Main navigation',
  '生成图纸':'Create','图纸展区':'Patterns','我的作品':'My Works','实用工具':'Tools','使用教程':'Guide',
  '使用答疑 ↗':'FAQ ↗','把喜欢，拼成自己的样子。':'Turn what you love into beads.',
  '从一张图片开始，让每一颗豆都有自己的位置。':'Start from one picture and give every bead its place.',
  '图片在你的设备处理':'Processed on your device','MARD 色号匹配':'MARD colour matching','高清图纸导出':'High-res export',
  '转换示意':'HOW IT WORKS','一张图片，生成真正能跟做的拼豆图纸':'One picture becomes a pattern you can actually follow',
  '保留主体轮廓和关键配色，自动转换成带网格、MARD 色号和用量统计的拼豆图纸。':'Keeps the outline and the key colours, and turns them into a sheet with a grid, MARD codes and bead counts.',
  '查看 MARD 色号 ↗':'View MARD colours ↗','转换前':'BEFORE','转换后':'AFTER','原图':'Source','图纸':'Pattern',
  '主体清晰、背景简单的图片，转换效果更稳定。':'A clear subject on a simple background converts most reliably.',
  '示例图纸用量统计':'Bead usage in this example','共 4 色':'4 colours total',
  '图片与设置':'Image & settings','＋ 上传图片 / 导入底稿':'+ Upload image / import CSV',
  '处理模式':'Sampling mode','卡通（主色）':'Cartoon (dominant)','真实（平均）':'Photo (average)','成品图纸还原':'Pixel art (exact)',
  '卡通：每格取出现最多的颜色，线条更利落。真实：取平均值，照片更自然。成品图纸还原：图片本身就是像素图时用，逐格直接取色不做混合。':'Cartoon takes each cell’s most common colour, keeping lines crisp. Photo averages the cell, which suits photographs. Pixel art samples each cell directly with no blending, for images that are already pixel art.',
  '横向格数':'Grid width','纵向格数':'Grid height','最多颜色':'Max colours','颜色合并阈值':'Colour merge',
  '把肉眼难分的相近色号并成一种。调高颜色更少、更好买豆；调低保留更多细节。':'Merges codes too close to tell apart. Higher means fewer colours and an easier shopping list; lower keeps more detail.',
  '拼豆色板 / 店家色号':'Bead palette / shop codes','管理色板':'Manage palette',
  '屏幕颜色为近似值，备料请核对实体色卡。不同品牌和批次可能有色差，大作品建议先用实体色卡确认。':'On-screen colours are approximate — check a physical colour card before buying. Brands and batches vary; confirm against real beads for a large piece.',
  '显示网格':'Show grid','显示逐格色号':'Show codes in cells','生成 / 重新转换':'Convert','新建空白图纸':'Blank sheet',
  '图纸工作台':'Workbench','等待选图':'No image yet','编辑方式':'Tool','画笔':'Brush','橡皮擦':'Eraser','替换同色':'Replace colour',
  '↶ 撤销':'↶ Undo','放大':'Zoom','显示坐标':'Show coordinates','显示方式':'View','网格图纸':'Grid sheet','熨烫效果':'Ironed beads',
  '将图片拖到这里':'Drop an image here','选择喜欢的照片，或从空白画布开始。':'Pick a photo you like, or start from a blank canvas.',
  '选择图片':'Choose image','先看看练习图纸 →':'Browse practice patterns →','拼豆编辑画布':'Bead editing canvas',
  '查看原图':'View source','作品名称':'Work name','♡ 保存到此设备':'♡ Save to this device','高清 PNG':'PNG','导出 CSV':'Export CSV',
  '备料与导出':'Materials & export','颗拼豆':'beads','种颜色':'colours',
  '点色号可在画布高亮；「排除」会把这个颜色从图纸里去掉并重新生成。':'Click a code to highlight it on the canvas. Exclude drops that colour from the palette and reconverts.',
  '搜索色号':'Search codes','已排除的颜色':'Excluded colours','添加画笔颜色':'Add brush colour','画笔色号':'Brush colour',
  '图片里的喜欢，图纸里看得见':'What you loved in the photo, visible in the sheet',
  '生成后对照原图检查轮廓和配色，再准备材料。':'Compare against the source before buying beads.',
  '原始图片':'Source image','拼豆预览':'Bead preview','上传后在这里对照原图':'Your upload appears here','生成后显示当前图纸':'Your pattern appears here',
  '从选图到开拼，分三步就好':'Three steps from photo to beads','挑选图片':'Pick an image','选择主体清晰的图片':'Choose a clear subject',
  '先裁掉无关背景，让想拼的部分占据画面中央，减少无关色块。':'Crop away the background so the subject fills the frame and fewer stray colours appear.',
  '设定尺寸':'Set the size','确定格数与颜色':'Choose grid and colours',
  '从 48 格、16 色试起，观察五官和文字，再按细节需要调整。':'Start at 48 wide and 16 colours, check the face and any text, then adjust.',
  '修整细节':'Refine','修整、备料、导出':'Refine, plan, export',
  '修整局部，清理零散颜色，依据用量表备料并下载图纸。':'Tidy stray colours, read off the bead counts, and download the sheet.',
  '从生成，到最后一格':'From conversion to the final bead','逐格精修':'Cell-by-cell editing',
  '支持画笔、擦除、同色替换与撤销，放大后检查每一个小细节。':'Brush, eraser, replace-colour and undo. Zoom in and check every detail.',
  '实时用量':'Live bead counts','每次编辑都会更新单色颗数；透明区域和擦除位置不计入总数。':'Counts update as you edit. Transparent and erased cells are not counted.',
  '高清图纸导出':'High-res export','坐标、色号、每十格辅助线和用量表一起导出，方便放大数格。':'Coordinates, codes, a heavier line every ten cells and the usage table all export together.',
  '先选一个适合自己的大小':'Pick a size that suits you',
  '以下是本我的试做建议，格数越大，需要的材料和时间通常越多。':'Suggested starting points. A larger grid means more beads and more time.',
  '人物头像':'Portrait','32–48 格':'32–48 wide','重点检查眼睛与发际线':'Watch the eyes and hairline',
  '宠物照片':'Pet photo','48–72 格':'48–72 wide','兼顾表情和毛色层次':'Keeps expression and fur tones',
  '简笔 / 平涂':'Line art / flat colour','32 格':'32 wide','贴近实际豆色':'Close to the real bead colours',
  '复杂画面':'Complex scene','64–96 格':'64–96 wide','先保留轮廓与大色块':'Outline and large blocks first',
  '每一种喜欢，都有自己的颜色':'Every taste has its own colours',
  '内置 MARD、COCO、漫漫、盼盼、咪小窝等常用店家色号，以及 Perler、Hama、Artkal 国际品牌，共 10 套色板。':'Ten palettes built in: MARD, COCO, Manman, Panpan and Mixiaowo shop codes, plus Perler, Hama and Artkal.',
  '打开色号查询 ↗':'Open colour lookup ↗','拼豆实用工具':'Bead tools','查查色号，算好成品尺寸。':'Look up codes and estimate finished size.',
  '成品尺寸估算':'Finished size','豆子间距':'Bead pitch','按间距估算，熨烫后尺寸可能变化。':'Estimated from pitch; ironing can change the result.',
  '备料数量估算':'Bead quantity','图纸豆数':'Beads in sheet','备用比例':'Spare','不加备用':'No spare',
  '可用图纸颜色清单核对单色用量，再考虑备用豆。':'Check per-colour counts against the list, then decide on spares.',
  'MARD 色号查询':'MARD colour lookup','色号为近似显示值，仅供排版参考，实物请以手中材料为准。':'Codes are approximate on screen. Go by the beads in your hand.',
  '搜索色号、色系或 HEX':'Search code, family or HEX','第一张拼豆图纸，怎么做？':'How do I make my first bead sheet?',
  '选图、配色、调整与导出，一次讲清楚。':'Choosing an image, colours, adjusting and exporting — all in one place.',
  '01 · 找到适合拼的图片':'01 · Find a picture that works',
  '02 · 用尺寸和颜色控制难度':'02 · Control difficulty with size and colours',
  '03 · 把重要的几格修准确':'03 · Get the important cells right',
  '04 · 看清用量再备料':'04 · Read the counts before buying',
  '05 · 让下次接得上':'05 · Pick it up again next time',
  '常见问题':'FAQ','使用答疑':'Help','图片留在你的设备，创作留给自己。':'Your image stays on your device. The work stays yours.',
  '▤ 拼豆教程 ↗':'▤ Guide ↗','关闭 ×':'Close ×','当前原图':'Current source','当前原始图片':'Current source image','当前拼豆预览':'Current bead preview',
  '裁剪图片':'Crop image','在图上拖一个框，只保留框里的部分。':'Drag a box on the image to keep only that part.',
  '裁剪并重新转换':'Crop and reconvert','整张图':'Whole image','取消':'Cancel',
  '全选':'Select all','全不选':'Select none','只留图纸用到的':'Only those used','应用并重新转换':'Apply and reconvert',
  '回到工作台开始制作':'Back to the workbench','＋ 制作一张新图纸':'+ Start a new sheet','下载高清图纸 ↓':'Download the sheet ↓',
  '阅读完整制作教程 ↗':'Read the full guide ↗','作品接着做':'Continue a work','手机也能开始':'Works on a phone',
  '颜色与用量':'Colours & usage','转换前的示例图片':'Example source image',
  '© 2026 本我 BENWO · 拼豆工作室 · 本站依':'© 2026 BENWO · Bead Studio · released under','开源，':', ','查看源码':'view source'
};

// 长段落（FAQ、教程正文）单独一组，避免上面那张表太长不好读
Object.assign(I18N.en, {
  '我的图片会被传到网上吗？':'Is my image uploaded anywhere?',
  '图片和 CSV 由你正在使用的手机或电脑处理。点击“保存到此设备”后，图纸仅存入你当前浏览器，不会上传服务器，也不会发送到网站运营者的电脑。':'Images and CSV files are handled by the phone or computer you are using. Saving stores the sheet in this browser only — nothing is uploaded to a server or sent to the site owner.',
  '使用工具需要付费吗？':'Does it cost anything?',
  '当前图片转拼豆、编辑和导出均可免费使用，无需登录，也不消耗 AI 额度。所有转换在你的浏览器内完成；本站暂未接入文字生成图片的 AI 服务。':'Converting, editing and exporting are free and need no account. Everything runs in your browser. There is no text-to-image AI here.',
  '哪类图片更容易得到清晰的图纸？':'Which images convert best?',
  '选择轮廓分明、主体较大、背景简洁的图片。细碎纹理和远景容易在小格数下丢失，建议先裁到重点部分。':'A bold outline, a large subject and a plain background. Fine texture and distant detail disappear at small grid sizes, so crop to the important part first.',
  '零散的小色点怎么处理？':'How do I get rid of speckles?',
  '降低颜色上限后重新转换，或用画笔局部修整。同色替换会影响整张图中该颜色的格子，使用前请先确认选色。':'Raise the merge threshold or lower the colour limit and reconvert, or tidy them with the brush. Replace-colour affects every cell of that colour, so check your selection first.',
  '支持哪些品牌的店家色号？':'Which brands are supported?',
  '目前支持 10 套色板：MARD 基础 221 色、MARD 完整 291 色，COCO、漫漫、盼盼、咪小窝四家常用店家色号，以及 Perler、Hama、Artkal、Artkal Mini 四套国际品牌。在左侧「拼豆色板 / 店家色号」直接点按钮切换，图纸会立刻按该品牌的色号重新生成。':'Ten palettes: MARD 221, MARD 291, the COCO, Manman, Panpan and Mixiaowo shop codes, and Perler, Hama, Artkal and Artkal Mini. Pick one under Bead palette on the left and the sheet is rebuilt in that brand’s codes.',
  '在手机上可以完成吗？':'Can I do this on a phone?',
  '可以从相册选图、转换、编辑并下载。画布区域支持滚动；精修时放大单格，或在电脑上导入 CSV 继续。':'Yes — pick from your gallery, convert, edit and download. The canvas scrolls; zoom in to edit single cells, or carry on later on a computer via CSV.',
  '换设备后作品在哪里？':'Where are my works on another device?',
  '保存在当前浏览器中的作品不会自动同步。请在原设备导出 CSV，在新设备上传该文件继续创作。':'Saved works live in this browser and do not sync. Export a CSV on the old device and import it on the new one.',
  '大图纸怎样打印？':'How do I print a large sheet?',
  '打印大图时，可在支持海报平铺的软件中分幅打印。下载图片的像素大小不等于成品厘米数，实物尺寸可在工具页估算。':'Export the PNG and use poster or tiled printing to spread it over several sheets. Pixel size is not physical size — estimate that on the tools page.',
  '这里只展示你保存在当前浏览器中的作品，不上传网站服务器，也不会保存到网站运营者的电脑。清理浏览器数据会清除作品，请导出 CSV 备份。':'Only works saved in this browser are shown. Nothing is uploaded. Clearing browser data deletes them, so export a CSV backup.',
  '从本站几何练习底稿开始，打开后可以继续改色。这里不展示其他网站的用户作品。':'Start from a practice sheet and recolour it. No works from other sites are shown here.',
  '输入作品名并保存，下次从“我的作品”继续。作品只在你当前使用的浏览器存储，清理浏览器数据会清除作品；跨设备使用请传递 CSV 文件。':'Name the work and save it, then pick it up from My Works. It lives in this browser only; move a CSV to use another device.',
  '点击保存后，作品存入你当前使用的浏览器；CSV 可另行下载备份。':'Saving stores the work in this browser. Download a CSV as a backup.',
  '在颜色清单选色，再用画笔点击或拖动画布。橡皮擦会移除豆子；同色替换会改变整张图中与点击位置相同的颜色。做错可撤销。':'Pick a colour from the list, then click or drag on the canvas. The eraser removes beads; replace-colour changes every cell matching the one you click. Undo is available.',
  '先修轮廓和五官，再检查散点。重新转换会覆盖手工修改，建议先保存作品或导出 CSV。':'Fix the outline and face first, then the speckles. Reconverting overwrites hand edits, so save or export first.',
  'PNG 包含行列坐标、逐格色号、每十格辅助线和单色用量。CSV 保留网格数据，可重新导入继续编辑。':'The PNG carries row and column numbers, a code in every cell, a heavier line every ten cells and the usage table. The CSV keeps the grid data for re-importing.',
  '导出高清 PNG，再用支持分幅打印的软件平铺到多张纸上。保留行列坐标以便核对；本站没有直接生成 PDF。':'Export the PNG and tile it across sheets in software that supports poster printing. Keep the coordinates for checking. There is no direct PDF export.',
  '先试局部，再决定大小':'Try a crop before committing to a size',
  '把图片缩小看一次，如果主体仍然清楚，通常更适合做底稿。平涂插画和简单轮廓容易保留；阴影复杂的照片需要更多格子表达。':'Shrink the picture and look again — if the subject still reads clearly it will convert well. Flat illustration survives; heavily shaded photographs need more cells.',
  '先试 48 格，再观察五官是否能辨认。增加格数可以表达更多细节，但豆数也会增加。减少颜色能让配色更集中，过少则可能丢失层次。':'Start at 48 wide and see whether the face reads. More cells mean more detail and more beads. Fewer colours look cleaner, but too few loses depth.',
  '工具保留图片的长宽比例。要改变构图，可先在相册里裁剪。透明区域保留为空格；白色不会自动删除，以免误伤主体。':'The aspect ratio is kept. Crop first to change the framing. Transparent areas stay empty; white is never removed automatically, in case it is part of the subject.',
  '基础色板适合常规材料，完整色板包含扩展色。切换到 COCO、漫漫、盼盼或咪小窝后，同一个颜色会显示成对应店家的色号，照着买豆更方便。备料前请核对实体豆色。':'The 221-colour palette suits ordinary stock; the 291 one adds extended colours. Switch to COCO, Manman, Panpan or Mixiaowo and the same colour is shown as that shop’s code, which makes ordering easier. Check real beads before buying.',
  'MARD 291 色显示对照，可搜索色号、色系与 HEX。工作台还可切换 COCO、漫漫、盼盼、咪小窝等店家色号。':'All 291 MARD colours, searchable by code, family or HEX. The workbench can also switch to COCO, Manman, Panpan and Mixiaowo codes.',
  '从相册选图、设置参数和下载，大网格可以在画布内滚动查看。':'Pick from your gallery, set the options and download. Large grids scroll inside the canvas.',
  '重新转换会覆盖编辑，长宽按原图比例。':'Reconverting overwrites edits. Height follows the source aspect ratio.',
  'MARD 色号为本站整理；COCO、Perler、Hama、Artkal 色号数据来自':'MARD data is our own. COCO, Perler, Hama and Artkal data comes from',
  '开放数据集，依 CC BY 4.0 使用；漫漫、盼盼、咪小窝色号对照来自':'under CC BY 4.0. The Manman, Panpan and Mixiaowo cross-reference comes from',
  '，依 AGPL-3.0 使用。品牌名称归各自商标持有人所有，本站与任何拼豆厂商无从属或背书关系。':', under AGPL-3.0. Brand names belong to their owners; this site is not affiliated with or endorsed by any bead manufacturer.',
  '示例图纸：80 × 60 格 · 2967 颗豆 · 4 种颜色，带行列坐标。用「卡通（主色）」模式自动转换，未做手工修改。':'Example: 80 × 60 cells · 2,967 beads · 4 colours, with coordinates. Converted automatically in Cartoon mode, untouched by hand.',
  '转换后的示例拼豆图纸，80 乘 60 格，共 4 种颜色，带行列坐标，右侧放大显示每一格的 MARD 色号':'Example bead sheet, 80 by 60 cells in 4 colours, with row and column numbers, and a magnified block on the right showing the MARD code in every cell'
});

I18N.ms = {
  '本我':'BENWO','拼豆图纸生成器':'Penjana Corak Manik','主导航':'Navigasi utama',
  '生成图纸':'Jana','图纸展区':'Corak','我的作品':'Karya Saya','实用工具':'Alat','使用教程':'Panduan',
  '使用答疑 ↗':'Soal Jawab ↗','把喜欢，拼成自己的样子。':'Jadikan apa yang anda suka sebagai manik.',
  '从一张图片开始，让每一颗豆都有自己的位置。':'Bermula daripada satu gambar, setiap manik dapat tempatnya.',
  '图片在你的设备处理':'Diproses pada peranti anda','MARD 色号匹配':'Padanan kod MARD','高清图纸导出':'Eksport resolusi tinggi',
  '转换示意':'CARA IA BERFUNGSI','一张图片，生成真正能跟做的拼豆图纸':'Satu gambar menjadi corak yang benar-benar boleh diikut',
  '保留主体轮廓和关键配色，自动转换成带网格、MARD 色号和用量统计的拼豆图纸。':'Mengekalkan garis luar dan warna utama, lalu menjadikannya helaian bergrid dengan kod MARD dan kiraan manik.',
  '查看 MARD 色号 ↗':'Lihat kod MARD ↗','转换前':'SEBELUM','转换后':'SELEPAS','原图':'Gambar asal','图纸':'Corak',
  '主体清晰、背景简单的图片，转换效果更稳定。':'Subjek jelas dengan latar ringkas memberi hasil paling stabil.',
  '示例图纸用量统计':'Kiraan manik contoh','共 4 色':'4 warna semuanya',
  '图片与设置':'Gambar & tetapan','＋ 上传图片 / 导入底稿':'+ Muat naik gambar / import CSV',
  '处理模式':'Mod pensampelan','卡通（主色）':'Kartun (warna dominan)','真实（平均）':'Foto (purata)','成品图纸还原':'Seni piksel (tepat)',
  '卡通：每格取出现最多的颜色，线条更利落。真实：取平均值，照片更自然。成品图纸还原：图片本身就是像素图时用，逐格直接取色不做混合。':'Kartun mengambil warna paling kerap dalam setiap petak supaya garisan kekal tajam. Foto mengambil purata, sesuai untuk gambar sebenar. Seni piksel mengambil warna terus tanpa campuran, untuk gambar yang memang sudah piksel.',
  '横向格数':'Lebar grid','纵向格数':'Tinggi grid','最多颜色':'Warna maksimum','颜色合并阈值':'Gabungan warna',
  '把肉眼难分的相近色号并成一种。调高颜色更少、更好买豆；调低保留更多细节。':'Menggabungkan kod yang terlalu hampir untuk dibezakan. Lebih tinggi bermakna kurang warna dan senarai belian lebih mudah; lebih rendah mengekalkan perincian.',
  '拼豆色板 / 店家色号':'Palet manik / kod kedai','管理色板':'Urus palet',
  '屏幕颜色为近似值，备料请核对实体色卡。不同品牌和批次可能有色差，大作品建议先用实体色卡确认。':'Warna di skrin hanyalah anggaran — semak kad warna sebenar sebelum membeli. Jenama dan kelompok berbeza; sahkan dengan manik sebenar untuk karya besar.',
  '显示网格':'Tunjuk grid','显示逐格色号':'Tunjuk kod dalam petak','生成 / 重新转换':'Tukar','新建空白图纸':'Helaian kosong',
  '图纸工作台':'Meja kerja','等待选图':'Belum ada gambar','编辑方式':'Alat','画笔':'Berus','橡皮擦':'Pemadam','替换同色':'Ganti warna',
  '↶ 撤销':'↶ Buat asal','放大':'Zum','显示坐标':'Tunjuk koordinat','显示方式':'Paparan','网格图纸':'Helaian grid','熨烫效果':'Manik disetrika',
  '将图片拖到这里':'Lepaskan gambar di sini','选择喜欢的照片，或从空白画布开始。':'Pilih gambar kegemaran anda, atau mula dari kanvas kosong.',
  '选择图片':'Pilih gambar','先看看练习图纸 →':'Lihat corak latihan →','拼豆编辑画布':'Kanvas suntingan manik',
  '查看原图':'Lihat asal','作品名称':'Nama karya','♡ 保存到此设备':'♡ Simpan ke peranti ini','高清 PNG':'PNG','导出 CSV':'Eksport CSV',
  '备料与导出':'Bahan & eksport','颗拼豆':'manik','种颜色':'warna',
  '点色号可在画布高亮；「排除」会把这个颜色从图纸里去掉并重新生成。':'Klik kod untuk menyerlahkannya pada kanvas. Kecualikan membuang warna itu daripada palet dan menjana semula.',
  '搜索色号':'Cari kod','已排除的颜色':'Warna dikecualikan','添加画笔颜色':'Tambah warna berus','画笔色号':'Warna berus',
  '图片里的喜欢，图纸里看得见':'Apa yang anda suka, kelihatan dalam corak',
  '生成后对照原图检查轮廓和配色，再准备材料。':'Banding dengan gambar asal sebelum membeli manik.',
  '原始图片':'Gambar asal','拼豆预览':'Pratonton manik','上传后在这里对照原图':'Muat naik anda muncul di sini','生成后显示当前图纸':'Corak anda muncul di sini',
  '从选图到开拼，分三步就好':'Tiga langkah dari gambar ke manik','挑选图片':'Pilih gambar','选择主体清晰的图片':'Pilih subjek yang jelas',
  '先裁掉无关背景，让想拼的部分占据画面中央，减少无关色块。':'Potong latar belakang supaya subjek memenuhi bingkai dan warna terpencil berkurang.',
  '设定尺寸':'Tetapkan saiz','确定格数与颜色':'Pilih grid dan warna',
  '从 48 格、16 色试起，观察五官和文字，再按细节需要调整。':'Mula pada 48 lebar dan 16 warna, periksa wajah dan teks, kemudian laraskan.',
  '修整细节':'Perhalus','修整、备料、导出':'Perhalus, rancang, eksport',
  '修整局部，清理零散颜色，依据用量表备料并下载图纸。':'Kemaskan warna terpencil, baca kiraan manik, dan muat turun helaian.',
  '从生成，到最后一格':'Dari penukaran hingga manik terakhir','逐格精修':'Suntingan setiap petak',
  '支持画笔、擦除、同色替换与撤销，放大后检查每一个小细节。':'Berus, pemadam, ganti warna dan buat asal. Zum masuk dan periksa setiap perincian.',
  '实时用量':'Kiraan langsung','每次编辑都会更新单色颗数；透明区域和擦除位置不计入总数。':'Kiraan dikemas kini semasa anda menyunting. Petak lutsinar dan yang dipadam tidak dikira.',
  '坐标、色号、每十格辅助线和用量表一起导出，方便放大数格。':'Koordinat, kod, garis tebal setiap sepuluh petak dan jadual penggunaan dieksport bersama.',
  '先选一个适合自己的大小':'Pilih saiz yang sesuai',
  '以下是本我的试做建议，格数越大，需要的材料和时间通常越多。':'Cadangan permulaan. Grid lebih besar bermakna lebih banyak manik dan masa.',
  '人物头像':'Potret','32–48 格':'32–48 lebar','重点检查眼睛与发际线':'Perhatikan mata dan garis rambut',
  '宠物照片':'Gambar haiwan','48–72 格':'48–72 lebar','兼顾表情和毛色层次':'Mengekalkan riak dan warna bulu',
  '简笔 / 平涂':'Lakaran / warna rata','32 格':'32 lebar','贴近实际豆色':'Hampir dengan warna manik sebenar',
  '复杂画面':'Adegan kompleks','64–96 格':'64–96 lebar','先保留轮廓与大色块':'Garis luar dan blok besar dahulu',
  '每一种喜欢，都有自己的颜色':'Setiap citarasa ada warnanya',
  '内置 MARD、COCO、漫漫、盼盼、咪小窝等常用店家色号，以及 Perler、Hama、Artkal 国际品牌，共 10 套色板。':'Sepuluh palet terbina dalam: kod kedai MARD, COCO, Manman, Panpan dan Mixiaowo, serta Perler, Hama dan Artkal.',
  '打开色号查询 ↗':'Buka carian warna ↗','拼豆实用工具':'Alat manik','查查色号，算好成品尺寸。':'Cari kod dan anggarkan saiz siap.',
  '成品尺寸估算':'Saiz siap','豆子间距':'Jarak manik','按间距估算，熨烫后尺寸可能变化。':'Anggaran daripada jarak; menyetrika boleh mengubah hasilnya.',
  '备料数量估算':'Kuantiti manik','图纸豆数':'Manik dalam helaian','备用比例':'Simpanan','不加备用':'Tiada simpanan',
  '可用图纸颜色清单核对单色用量，再考虑备用豆。':'Semak kiraan setiap warna dengan senarai, kemudian tentukan simpanan.',
  'MARD 色号查询':'Carian warna MARD','色号为近似显示值，仅供排版参考，实物请以手中材料为准。':'Kod adalah anggaran di skrin. Ikut manik di tangan anda.',
  '搜索色号、色系或 HEX':'Cari kod, keluarga atau HEX','第一张拼豆图纸，怎么做？':'Bagaimana membuat helaian pertama?',
  '选图、配色、调整与导出，一次讲清楚。':'Memilih gambar, warna, pelarasan dan eksport — semuanya di sini.',
  '01 · 找到适合拼的图片':'01 · Cari gambar yang sesuai',
  '02 · 用尺寸和颜色控制难度':'02 · Kawal kesukaran dengan saiz dan warna',
  '03 · 把重要的几格修准确':'03 · Betulkan petak yang penting',
  '04 · 看清用量再备料':'04 · Baca kiraan sebelum membeli',
  '05 · 让下次接得上':'05 · Sambung semula lain kali',
  '常见问题':'Soalan Lazim','使用答疑':'Bantuan','图片留在你的设备，创作留给自己。':'Gambar kekal pada peranti anda. Karya kekal milik anda.',
  '▤ 拼豆教程 ↗':'▤ Panduan ↗','关闭 ×':'Tutup ×','当前原图':'Gambar asal semasa','当前原始图片':'Gambar asal semasa','当前拼豆预览':'Pratonton manik semasa',
  '裁剪图片':'Potong gambar','在图上拖一个框，只保留框里的部分。':'Seret kotak pada gambar untuk mengekalkan bahagian itu sahaja.',
  '裁剪并重新转换':'Potong dan tukar semula','整张图':'Seluruh gambar','取消':'Batal',
  '全选':'Pilih semua','全不选':'Kosongkan','只留图纸用到的':'Hanya yang digunakan','应用并重新转换':'Guna dan tukar semula',
  '回到工作台开始制作':'Kembali ke meja kerja','＋ 制作一张新图纸':'+ Mulakan helaian baharu','下载高清图纸 ↓':'Muat turun helaian ↓',
  '阅读完整制作教程 ↗':'Baca panduan penuh ↗','作品接着做':'Sambung karya','手机也能开始':'Boleh guna telefon',
  '颜色与用量':'Warna & penggunaan','转换前的示例图片':'Gambar contoh asal',
  '我的图片会被传到网上吗？':'Adakah gambar saya dimuat naik?',
  '图片和 CSV 由你正在使用的手机或电脑处理。点击“保存到此设备”后，图纸仅存入你当前浏览器，不会上传服务器，也不会发送到网站运营者的电脑。':'Gambar dan fail CSV dikendalikan oleh telefon atau komputer anda. Menyimpan hanya menyimpan helaian dalam pelayar ini — tiada apa dimuat naik ke pelayan atau dihantar kepada pemilik laman.',
  '使用工具需要付费吗？':'Adakah ia berbayar?',
  '当前图片转拼豆、编辑和导出均可免费使用，无需登录，也不消耗 AI 额度。所有转换在你的浏览器内完成；本站暂未接入文字生成图片的 AI 服务。':'Penukaran, suntingan dan eksport adalah percuma dan tidak perlu akaun. Semuanya berjalan dalam pelayar anda. Tiada AI teks-ke-gambar di sini.',
  '哪类图片更容易得到清晰的图纸？':'Gambar jenis apa paling sesuai?',
  '选择轮廓分明、主体较大、背景简洁的图片。细碎纹理和远景容易在小格数下丢失，建议先裁到重点部分。':'Garis luar yang tegas, subjek besar dan latar ringkas. Tekstur halus hilang pada grid kecil, jadi potong ke bahagian penting dahulu.',
  '零散的小色点怎么处理？':'Bagaimana menghapus bintik warna?',
  '降低颜色上限后重新转换，或用画笔局部修整。同色替换会影响整张图中该颜色的格子，使用前请先确认选色。':'Naikkan ambang gabungan atau turunkan had warna dan tukar semula, atau kemaskan dengan berus. Ganti warna memberi kesan kepada setiap petak warna itu, jadi semak pilihan anda dahulu.',
  '支持哪些品牌的店家色号？':'Jenama mana yang disokong?',
  '目前支持 10 套色板：MARD 基础 221 色、MARD 完整 291 色，COCO、漫漫、盼盼、咪小窝四家常用店家色号，以及 Perler、Hama、Artkal、Artkal Mini 四套国际品牌。在左侧「拼豆色板 / 店家色号」直接点按钮切换，图纸会立刻按该品牌的色号重新生成。':'Sepuluh palet: MARD 221, MARD 291, kod kedai COCO, Manman, Panpan dan Mixiaowo, serta Perler, Hama, Artkal dan Artkal Mini. Pilih satu di bawah Palet manik dan helaian dijana semula dalam kod jenama itu.',
  '在手机上可以完成吗？':'Boleh guna telefon?',
  '可以从相册选图、转换、编辑并下载。画布区域支持滚动；精修时放大单格，或在电脑上导入 CSV 继续。':'Boleh — pilih dari galeri, tukar, sunting dan muat turun. Kanvas boleh ditatal; zum masuk untuk menyunting petak, atau sambung di komputer melalui CSV.',
  '换设备后作品在哪里？':'Di mana karya saya pada peranti lain?',
  '保存在当前浏览器中的作品不会自动同步。请在原设备导出 CSV，在新设备上传该文件继续创作。':'Karya tersimpan berada dalam pelayar ini dan tidak disegerakkan. Eksport CSV pada peranti lama dan importnya pada yang baharu.',
  '大图纸怎样打印？':'Bagaimana mencetak helaian besar?',
  '打印大图时，可在支持海报平铺的软件中分幅打印。下载图片的像素大小不等于成品厘米数，实物尺寸可在工具页估算。':'Eksport PNG dan gunakan cetakan poster untuk membahagikannya kepada beberapa helai. Saiz piksel bukan saiz fizikal — anggarkannya di halaman alat.',
  '这里只展示你保存在当前浏览器中的作品，不上传网站服务器，也不会保存到网站运营者的电脑。清理浏览器数据会清除作品，请导出 CSV 备份。':'Hanya karya yang disimpan dalam pelayar ini dipaparkan. Tiada apa dimuat naik. Membersihkan data pelayar akan memadamnya, jadi eksport salinan CSV.',
  '从本站几何练习底稿开始，打开后可以继续改色。这里不展示其他网站的用户作品。':'Mula daripada helaian latihan dan ubah warnanya. Tiada karya dari laman lain dipaparkan di sini.',
  '输入作品名并保存，下次从“我的作品”继续。作品只在你当前使用的浏览器存储，清理浏览器数据会清除作品；跨设备使用请传递 CSV 文件。':'Namakan karya dan simpannya, kemudian sambung dari Karya Saya. Ia berada dalam pelayar ini sahaja; pindahkan CSV untuk peranti lain.',
  '点击保存后，作品存入你当前使用的浏览器；CSV 可另行下载备份。':'Menyimpan meletakkan karya dalam pelayar ini. Muat turun CSV sebagai salinan.',
  '在颜色清单选色，再用画笔点击或拖动画布。橡皮擦会移除豆子；同色替换会改变整张图中与点击位置相同的颜色。做错可撤销。':'Pilih warna dari senarai, kemudian klik atau seret pada kanvas. Pemadam membuang manik; ganti warna menukar setiap petak yang sama dengan yang diklik. Buat asal tersedia.',
  '先修轮廓和五官，再检查散点。重新转换会覆盖手工修改，建议先保存作品或导出 CSV。':'Betulkan garis luar dan wajah dahulu, kemudian bintik. Menukar semula memadam suntingan tangan, jadi simpan atau eksport dahulu.',
  'PNG 包含行列坐标、逐格色号、每十格辅助线和单色用量。CSV 保留网格数据，可重新导入继续编辑。':'PNG membawa nombor baris dan lajur, kod dalam setiap petak, garis tebal setiap sepuluh petak dan jadual penggunaan. CSV menyimpan data grid untuk diimport semula.',
  '导出高清 PNG，再用支持分幅打印的软件平铺到多张纸上。保留行列坐标以便核对；本站没有直接生成 PDF。':'Eksport PNG dan cetaknya merentas beberapa helai dengan perisian cetakan poster. Kekalkan koordinat untuk semakan. Tiada eksport PDF terus.',
  '先试局部，再决定大小':'Cuba potongan sebelum menetapkan saiz',
  '把图片缩小看一次，如果主体仍然清楚，通常更适合做底稿。平涂插画和简单轮廓容易保留；阴影复杂的照片需要更多格子表达。':'Kecilkan gambar dan lihat semula — jika subjek masih jelas, ia akan bertukar dengan baik. Ilustrasi warna rata kekal; gambar berbayang rumit perlukan lebih banyak petak.',
  '先试 48 格，再观察五官是否能辨认。增加格数可以表达更多细节，但豆数也会增加。减少颜色能让配色更集中，过少则可能丢失层次。':'Mula pada 48 lebar dan lihat sama ada wajah jelas. Lebih banyak petak bermakna lebih perincian dan lebih banyak manik. Kurang warna kelihatan lebih kemas, tetapi terlalu sedikit menghilangkan kedalaman.',
  '工具保留图片的长宽比例。要改变构图，可先在相册里裁剪。透明区域保留为空格；白色不会自动删除，以免误伤主体。':'Nisbah bidang dikekalkan. Potong dahulu untuk mengubah gubahan. Kawasan lutsinar kekal kosong; putih tidak pernah dibuang secara automatik.',
  '基础色板适合常规材料，完整色板包含扩展色。切换到 COCO、漫漫、盼盼或咪小窝后，同一个颜色会显示成对应店家的色号，照着买豆更方便。备料前请核对实体豆色。':'Palet 221 warna sesuai untuk stok biasa; yang 291 menambah warna lanjutan. Tukar ke COCO, Manman, Panpan atau Mixiaowo dan warna yang sama dipaparkan sebagai kod kedai itu. Semak manik sebenar sebelum membeli.',
  'MARD 291 色显示对照，可搜索色号、色系与 HEX。工作台还可切换 COCO、漫漫、盼盼、咪小窝等店家色号。':'Kesemua 291 warna MARD, boleh dicari mengikut kod, keluarga atau HEX. Meja kerja juga boleh bertukar ke kod COCO, Manman, Panpan dan Mixiaowo.',
  '从相册选图、设置参数和下载，大网格可以在画布内滚动查看。':'Pilih dari galeri, tetapkan pilihan dan muat turun. Grid besar boleh ditatal dalam kanvas.',
  '重新转换会覆盖编辑，长宽按原图比例。':'Menukar semula memadam suntingan. Tinggi mengikut nisbah gambar asal.',
  'MARD 色号为本站整理；COCO、Perler、Hama、Artkal 色号数据来自':'Data MARD adalah milik kami. Data COCO, Perler, Hama dan Artkal daripada',
  '开放数据集，依 CC BY 4.0 使用；漫漫、盼盼、咪小窝色号对照来自':'di bawah CC BY 4.0. Rujukan silang Manman, Panpan dan Mixiaowo daripada',
  '，依 AGPL-3.0 使用。品牌名称归各自商标持有人所有，本站与任何拼豆厂商无从属或背书关系。':', di bawah AGPL-3.0. Nama jenama milik pemiliknya; laman ini tidak bergabung dengan mana-mana pengeluar manik.',
  '示例图纸：80 × 60 格 · 2967 颗豆 · 4 种颜色，带行列坐标。用「卡通（主色）」模式自动转换，未做手工修改。':'Contoh: 80 × 60 petak · 2,967 manik · 4 warna, dengan koordinat. Ditukar automatik dalam mod Kartun, tanpa suntingan tangan.',
  '转换后的示例拼豆图纸，80 乘 60 格，共 4 种颜色，带行列坐标，右侧放大显示每一格的 MARD 色号':'Contoh helaian manik, 80 kali 60 petak dalam 4 warna, dengan nombor baris dan lajur, serta blok besar di kanan menunjukkan kod MARD setiap petak',
  '© 2026 本我 BENWO · 拼豆工作室 · 本站依':'© 2026 BENWO · Studio Manik · dikeluarkan di bawah','开源，':', ','查看源码':'lihat kod sumber'
};

// ---------- 切换逻辑 ----------
// 页面原文是简体。切到其他语言时，遍历文本节点做整段替换；
// 切回简体时用第一次遍历时记下的原文还原，不需要重新加载页面。
const LANG_KEY = 'benwo-lang';
let langNodes = null;

function collectNodes(){
  if (langNodes) return langNodes;
  langNodes = { text: [], attr: [] };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n){
      const tag = n.parentNode && n.parentNode.nodeName;
      if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
      return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  let n;
  while ((n = walker.nextNode())) langNodes.text.push({ node: n, zh: n.nodeValue });
  for (const el of document.querySelectorAll('[placeholder],[title],[aria-label],[alt]')) {
    for (const a of ['placeholder','title','aria-label','alt']) {
      const v = el.getAttribute(a);
      if (v && v.trim()) langNodes.attr.push({ el, a, zh: v });
    }
  }
  return langNodes;
}

function toTraditional(s){
  let out = '';
  for (const ch of s) out += (S2T[ch] || ch);
  return out;
}

function translate(zh, lang){
  const trimmed = zh.trim();
  if (!trimmed) return zh;
  if (lang === 'zh-CN') return zh;
  if (lang === 'zh-TW') return zh.replace(trimmed, toTraditional(trimmed));
  const dict = I18N[lang];
  const hit = dict && dict[trimmed];
  // 查不到就保留简体，宁可露出原文也不要留空白
  return hit ? zh.replace(trimmed, hit) : zh;
}

function applyLang(lang){
  const nodes = collectNodes();
  for (const it of nodes.text) it.node.nodeValue = translate(it.zh, lang);
  for (const it of nodes.attr) it.el.setAttribute(it.a, translate(it.zh, lang));
  document.documentElement.lang = lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
}

function initLang(){
  const sel = document.getElementById('lang');
  if (!sel) return;
  let saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch {}
  if (!saved) {
    const nav = (navigator.language || 'zh-CN').toLowerCase();
    saved = nav.startsWith('en') ? 'en'
      : nav.startsWith('ms') ? 'ms'
      : (nav.includes('tw') || nav.includes('hk') || nav.includes('hant')) ? 'zh-TW'
      : 'zh-CN';
  }
  sel.value = [...sel.options].some(o => o.value === saved) ? saved : 'zh-CN';
  sel.addEventListener('change', () => applyLang(sel.value));
  if (sel.value !== 'zh-CN') applyLang(sel.value);
}
