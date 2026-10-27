/**
 * 아이콘 이름 → 이모지 글자. 이미지 대신 글자로 그려서 기기의 이모지 글꼴을 쓴다:
 * 아이폰·맥에서는 애플 이모지, 안드로이드에서는 구글 이모지, 윈도우에서는 MS 이모지.
 * (애플 이모지는 저작권 때문에 이미지로 넣을 수 없어서 이 방식이다)
 */
export const EMOJI: Record<string, string> = {
  // 옷
  tshirt: '👕', jeans: '👖', socks: '🧦', coat: '🧥', dress: '👗', cap: '🧢', shoe: '👟', scarf: '🧣',
  // 소품
  teddy: '🧸', frame: '🖼️', candle: '🕯️', package: '📦', plant: '🪴', books: '📚', clock: '⏰', puzzle: '🧩',
  // 화장품
  lipstick: '💄', lotion: '🧴', nailpolish: '💅', mirror: '🪞', soap: '🧼', toothbrush: '🪥', bubbles: '🫧', sponge: '🧽',
  // 쓰레기
  cup: '🥤', newspaper: '📰', banana: '🍌', tissue: '🧻', can: '🥫', bottle: '🍾', juicebox: '🧃', paper: '🗞️',
  // 종이와 책
  notebook: '📓', envelope: '✉️', openbook: '📖', memo: '📝', ledger: '📒',
  // 주방
  teapot: '🫖', forkknife: '🍴', bowl: '🥣', hotdrink: '☕', chopsticks: '🥢', pan: '🍳', milk: '🥛',
  // 전자기기
  phone: '📱', battery: '🔋', plug: '🔌', headphone: '🎧', mouse: '🖱️', keyboard: '⌨️', joystick: '🕹️', bulb: '💡',
  // 장난감
  kite: '🪁', ball: '⚽', yoyo: '🪀', die: '🎲', balloon: '🎈', dolls: '🪆',
  // 신발과 가방
  heels: '👠', boot: '🥾', flatshoe: '🥿', handbag: '👜', backpack: '🎒', purse: '👛', clutch: '👝',
  // 문구
  pencil: '✏️', pen: '🖊️', crayon: '🖍️', scissors: '✂️', paperclip: '📎', ruler: '📏', pushpin: '📌', paintbrush: '🖌️',
  // 액세서리
  glasses: '👓', sunglasses: '🕶️', watch: '⌚', ring: '💍', gem: '💎', necktie: '👔',
  // 화면 장식
  wastebasket: '🗑️', party: '🎉', broom: '🧹', sparkles: '✨', collision: '💥', chat: '💬', gear: '⚙️',
}
