export type F1TVLoginSessionData = {
  subscriptionToken: string;
};

export type F1TVLoginSession = {
  data: F1TVLoginSessionData;
};

export type AppConfig = {
  disableHardwareAcceleration?: boolean;
  enableSandbox?: boolean;
};

export enum IPCChannel {
  MAIN_WINDOW_NEW_PLAYER = 'MainWindow:New-Player',
  MAIN_WINDOW_READY_TO_SHOW = 'MainWindow:Ready-To-Show',
  PLAYER_CONTENT_PLAY = 'Player:Content-Play',
  PLAYER_CONTEXT_MENU = 'Player:Context-Menu',
  PLAYER_READY_TO_SHOW = 'Player:Ready-To-Show',
  F1TV_ASCENDON_UPDATED = 'F1TV:Ascendon',
  F1TV_CONFIG_UPDATED = 'F1TV:Config',
  F1TV_ENTITLEMENT_UPDATED = 'F1TV:Entitlement',
  F1TV_LOCATION_UPDATED = 'F1TV:Location',
  F1TV_LOGIN = 'F1TV:Login',
  F1TV_LOGOUT = 'F1TV:Logout',
  F1TV_READY = 'F1TV:Ready',
};
