/** 홈 화면 모양. 설정에서 고를 수 있고, 처음에는 기기에 맞춘다(안드로이드가 아니면 아이폰 모양). */
export type Platform = 'ios' | 'android'

export const detectedPlatform: Platform = /android/i.test(navigator.userAgent) ? 'android' : 'ios'
