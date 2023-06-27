import { Dispatch, SetStateAction } from "react";

export enum AppPage {
  CURRENT_SEASON,
  INFO,
  SETTINGS,
  DEFAULT = CURRENT_SEASON,
}

export type SetAppPageFn = Dispatch<SetStateAction<AppPage>>;
