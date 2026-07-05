/**
 * DECLARACIONES AMBIENTE para los módulos de Firebase servidos por el CDN de
 * gstatic. Cargamos el SDK por URL (sin npm ni bundler, compatible con
 * GitHub Pages + tsc), pero TypeScript no sabe resolver esas URLs. Aquí les
 * damos una firma MÍNIMA: solo lo que usamos, tipado a mano. No es el typing
 * oficial completo de Firebase (eso exigiría instalar @types por npm); es
 * suficiente y honesto para nuestra superficie de uso.
 *
 * Si algún día subes la versión del SDK en firebase-config.ts, revisa que las
 * firmas de abajo sigan encajando (la API de estos módulos es muy estable).
 */

declare module "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js" {
  export interface FirebaseApp {
    readonly name: string;
  }
  export function initializeApp(config: Record<string, string>): FirebaseApp;
}

declare module "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js" {
  import type { FirebaseApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

  export interface User {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }
  export interface Auth {
    currentUser: User | null;
  }
  export interface UserCredential {
    user: User;
  }
  export class GoogleAuthProvider {
    setCustomParameters(params: Record<string, string>): void;
  }
  export function getAuth(app: FirebaseApp): Auth;
  export function onAuthStateChanged(auth: Auth, cb: (user: User | null) => void): () => void;
  export function signInWithPopup(auth: Auth, provider: GoogleAuthProvider): Promise<UserCredential>;
  export function signInWithRedirect(auth: Auth, provider: GoogleAuthProvider): Promise<never>;
  export function getRedirectResult(auth: Auth): Promise<UserCredential | null>;
  export function signOut(auth: Auth): Promise<void>;
}

declare module "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js" {
  import type { FirebaseApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

  export interface Firestore {
    readonly type: "firestore";
  }
  export interface DocumentReference {
    readonly id: string;
  }
  export interface CollectionReference {
    readonly id: string;
  }
  export interface DocumentSnapshot {
    exists(): boolean;
    data(): Record<string, unknown> | undefined;
    readonly id: string;
  }
  export interface QueryDocumentSnapshot {
    data(): Record<string, unknown>;
    readonly id: string;
  }
  export interface QuerySnapshot {
    readonly docs: QueryDocumentSnapshot[];
    readonly empty: boolean;
  }
  export interface WriteBatch {
    set(ref: DocumentReference, data: Record<string, unknown>): WriteBatch;
    delete(ref: DocumentReference): WriteBatch;
    commit(): Promise<void>;
  }

  export function getFirestore(app: FirebaseApp): Firestore;
  export function doc(db: Firestore, path: string, ...segments: string[]): DocumentReference;
  export function collection(db: Firestore, path: string, ...segments: string[]): CollectionReference;
  export function getDoc(ref: DocumentReference): Promise<DocumentSnapshot>;
  export function getDocs(ref: CollectionReference): Promise<QuerySnapshot>;
  export function setDoc(ref: DocumentReference, data: Record<string, unknown>): Promise<void>;
  export function deleteDoc(ref: DocumentReference): Promise<void>;
  export function writeBatch(db: Firestore): WriteBatch;
  export function serverTimestamp(): unknown;
}
