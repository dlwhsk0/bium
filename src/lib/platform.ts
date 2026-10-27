/** 홈 화면 모양을 기기에 맞춘다. 안드로이드가 아니면(아이폰, 컴퓨터) 아이폰 모양. */
export type Platform = 'ios' | 'android'

export const platform: Platform = /android/i.test(navigator.userAgent) ? 'android' : 'ios'
