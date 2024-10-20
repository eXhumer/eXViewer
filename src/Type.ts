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
