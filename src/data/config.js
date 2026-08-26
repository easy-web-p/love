// ==========================================
// App Configuration & Constants
// ==========================================

// Countdown Target Timestamp: 26 Feb 2026 09:38 AM GMT+7
export const ANNIVERSARY_TARGET_TIMESTAMP = new Date('2026-02-26T09:38:00+07:00').getTime();

// TrueMoney Gift Default URL & Configuration
export const DEFAULT_TM_GIFT_URL = "https://gift.truemoney.com/campaign/?v=01a0396b59c3718f9061a743d30d4c79b4L";

export let trueMoneyGiftConfig = {
  giftUrl: (localStorage.getItem('tm_gift_url') && !localStorage.getItem('tm_gift_url').includes('sampleGiftCode'))
    ? localStorage.getItem('tm_gift_url')
    : DEFAULT_TM_GIFT_URL,
  giftAmount: localStorage.getItem('tm_gift_amount') || "520",
  senderName: localStorage.getItem('tm_sender_name') || "เค้าเองคนดี",
  note: (localStorage.getItem('tm_note') && !localStorage.getItem('tm_note').includes('ของขวัช'))
    ? localStorage.getItem('tm_note')
    : "ของขวัญคนเก่ง เล่นเกมชนะรับเงินไปช้อปปิ้งนะคนดี 💕"
};

// Ensure valid URL is stored
localStorage.setItem('tm_gift_url', trueMoneyGiftConfig.giftUrl);
