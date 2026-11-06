/// <reference types="vite/client" />
interface Window {
  ktDesktop?: { platform: string; openAudience(id: string): Promise<void> };
}
