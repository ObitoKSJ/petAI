import type { TranslationKeys } from './en';

const zh: Record<TranslationKeys, string> = {
  // Welcome
  'welcome': '有什么我可以帮你的吗？',

  // Analyzing states
  'analyzing.0': '正在分析图片',
  'analyzing.1': '正在检查细节',
  'analyzing.2': '仔细观察中',
  'analyzing.3': '处理图像中',
  'analyzing.4': '研究照片中',

  // ChatInput
  'input.placeholder': '有什么尽管问...',
  'input.removeImage': '移除图片',
  'input.uploadImage': '上传图片',
  'input.loading': '加载中',
  'input.send': '发送消息',

  // ProductCard
  'product.helpsWith': '适用于',
  'product.addToCart': '加入购物车',
  'product.buyNow': '立即购买',
  'product.addToCartDemo': '加入购物车 - 演示功能',
  'product.buyNowDemo': '立即购买 - 演示功能',

  // ChatMessage
  'message.uploadedImage': '已上传图片',

  // Header
  'header.returnHome': '返回首页',

  // Quick Prompts
  'prompt.newPet.label': '新手养宠',
  'prompt.newPet.message': '我刚养了一只新宠物，不太确定从哪里开始。有什么需要注意的吗？',
  'prompt.feeding.label': '喂养建议',
  'prompt.feeding.message': '我应该给宠物吃什么？喂多少合适？有什么健康饮食的建议吗？',
  'prompt.normal.label': '这正常吗？',
  'prompt.normal.message': '我的宠物有一些行为，我不确定是不是正常的。',
  'prompt.vetVisit.label': '何时看医生',
  'prompt.vetVisit.message': '怎么判断应该带宠物去看医生，还是在家自己处理就行？',

  // useChat
  'chat.sharedImage': '[分享了一张图片]',
  'chat.requestFailed': '聊天请求失败',
  'chat.sendFailed': '消息发送失败',
};

export default zh;
