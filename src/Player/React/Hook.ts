import { useDispatch, useSelector } from 'react-redux';
import store from './Store';

type PlayerState = ReturnType<typeof store.getState>;
type PlayerDispatch = typeof store.dispatch;

export const usePlayerDispatch = useDispatch.withTypes<PlayerDispatch>();
export const usePlayerSelector = useSelector.withTypes<PlayerState>();
