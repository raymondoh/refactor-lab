// types/auth/firebase-auth.ts
import { ActionResponse } from "../common/response";

export interface SignInWithFirebaseInput {
  idToken: string;
}

export type SignInWithFirebaseResponse = ActionResponse;
