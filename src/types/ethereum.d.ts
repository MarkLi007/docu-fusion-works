
declare global {
  interface Window {
    ethereum?: {
      request: (request: { method: string }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    }
  }
}

// Export an empty object to make this a module
export {};
