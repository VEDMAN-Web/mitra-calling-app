export interface Gift {
  id: string;
  label: string;
  emoji: string;
  diamonds: number;
}

export const GIFTS: Gift[] = [
  { id: "rose", label: "Rose Gift", emoji: "🌹", diamonds: 100 },
  { id: "sticker", label: "Sticker Gift", emoji: "🎀", diamonds: 100 },
  { id: "umbrella", label: "Umbrella Gift", emoji: "☂️", diamonds: 200 },
  { id: "gift_box", label: "Gift Box", emoji: "🎁", diamonds: 400 },
];

export const PARTNER_GIFT_SHARE = 0.5;
export const PARTNER_FIXED_DAILY_PAY = 500;
