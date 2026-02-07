const en = {
  // Welcome
  'welcome': 'How can I help you today?',

  // Analyzing states
  'analyzing.0': 'Analyzing image',
  'analyzing.1': 'Examining details',
  'analyzing.2': 'Looking closely',
  'analyzing.3': 'Processing visuals',
  'analyzing.4': 'Studying the photo',

  // ChatInput
  'input.placeholder': 'Ask about your pet...',
  'input.removeImage': 'Remove image',
  'input.uploadImage': 'Upload image',
  'input.loading': 'Loading',
  'input.send': 'Send message',

  // ProductCard
  'product.helpsWith': 'Helps with',
  'product.addToCart': 'Add to Cart',
  'product.buyNow': 'Buy Now',
  'product.addToCartDemo': 'Add to Cart - Demo placeholder',
  'product.buyNowDemo': 'Purchase Now - Demo placeholder',

  // ChatMessage
  'message.uploadedImage': 'Uploaded image',

  // Header
  'header.returnHome': 'Return to home',

  // Quick Prompts
  'prompt.newPet.label': 'New Pet Parent',
  'prompt.newPet.message': "I just got a new pet and I'm not sure where to start. What should I know?",
  'prompt.feeding.label': 'Feeding Tips',
  'prompt.feeding.message': 'What should I feed my pet and how much? Any tips for a healthy diet?',
  'prompt.normal.label': 'Is This Normal?',
  'prompt.normal.message': "My pet is doing something and I'm not sure if it's normal behavior.",
  'prompt.vetVisit.label': 'When to See Vet',
  'prompt.vetVisit.message': 'How do I know when I should take my pet to the vet versus handling it at home?',

  // useChat
  'chat.sharedImage': '[Shared an image]',
  'chat.requestFailed': 'Chat request failed',
  'chat.sendFailed': 'Failed to send message',
} as const;

export default en;
export type TranslationKeys = keyof typeof en;
