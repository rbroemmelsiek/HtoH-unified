import { configureStore } from '@reduxjs/toolkit';
import planAppReducer from './planAppSlice';

export const store = configureStore({
  reducer: {
    planApp: planAppReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['planApp/setUnsubscribe'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.unsubscribe'],
        // Ignore these paths in the state
        ignoredPaths: ['planApp.unsubscribe'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
