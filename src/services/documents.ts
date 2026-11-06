export interface StoredDocument {
  name: string;
  blob: Blob;
}
let database: Promise<IDBDatabase> | undefined;
function openDatabase() {
  return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("kt-presenter-files", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("documents");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      database = undefined;
      reject(request.error);
    };
    request.onblocked = () => {
      database = undefined;
      reject(new Error("El almacenamiento está bloqueado por otra pestaña."));
    };
  }));
}
export async function readDocument(
  id: string,
): Promise<StoredDocument | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("documents")
      .objectStore("documents")
      .get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function saveDocument(
  id: string,
  document: StoredDocument,
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("documents", "readwrite");
    transaction.objectStore("documents").put(document, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
